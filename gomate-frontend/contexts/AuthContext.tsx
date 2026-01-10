import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { disconnectSocket } from "@/utils/socket";

interface User {
  _id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  signup: (
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    gender: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);

      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuth = async (newToken: string, newUser: User) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error("Error storing auth:", error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      // Get backend URL from environment
      const userip =
        process.env.EXPO_PUBLIC_USER_IP ||
        process.env.USER_IP ||
        "192.168.100.5";

      console.log(
        "Attempting login to:",
        `http://${userip}:3000/auth/passenger/login`
      );

      const response = await fetch(
        `http://${userip}:3000/auth/passenger/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();
      console.log("Login response:", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (response.ok && data.access_token) {
        // Store token and user data - note: backend returns 'access_token' not 'accessToken'
        const userData: User = {
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber || data.user.phone,
          profilePicture: data.user.profilePicture,
        };

        console.log("Storing auth with user data:", userData);
        await storeAuth(data.access_token, userData);

        return { success: true };
      } else {
        return {
          success: false,
          message:
            data.message || "Login failed. Please check your credentials.",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection and try again.",
      };
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    phoneNumber: string,
    gender: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const userip =
        process.env.EXPO_PUBLIC_USER_IP ||
        process.env.USER_IP ||
        "192.168.100.5";

      const response = await fetch(
        `http://${userip}:3000/auth/passenger/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            phoneNumber,
            gender,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        // NestJS ValidationPipe returns message as array or string
        let errorMessage = "Signup failed. Please try again.";

        if (data.message) {
          if (Array.isArray(data.message)) {
            // Join multiple validation errors
            errorMessage = data.message.join(". ");
          } else {
            errorMessage = data.message;
          }
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message: "Network error. Please check your connection and try again.",
      };
    }
  };

  const logout = async () => {
    // Disconnect socket first
    disconnectSocket();
    // Clear auth data
    await clearAuth();
    // Navigate to welcome screen
    router.replace("/(screens)/(auth)/welcome");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
