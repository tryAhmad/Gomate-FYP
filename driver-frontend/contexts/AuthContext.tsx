import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Driver {
  _id: string;
  fullname: {
    firstname: string;
    lastname?: string;
  };
  email: string;
  verificationStatus: "incomplete" | "pending" | "approved" | "rejected";
  documents?: any;
  vehicle?: any;
  profilePhoto?:
    | {
        url?: string;
        public_id?: string;
      }
    | string;
  phoneNumber?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  authToken: string | null;
  driverId: string | null;
  driver: Driver | null;
  loading: boolean;
  login: (token: string, driverId: string, driver: Driver) => Promise<void>;
  logout: () => Promise<void>;
  updateDriver: (driver: Driver) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const id = await AsyncStorage.getItem("driverId");
      const driverData = await AsyncStorage.getItem("driverData");

      if (token && id && driverData) {
        // Verify driver still exists in database
        try {
          const API_BASE_URL =
            process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
          const response = await fetch(`${API_BASE_URL}/drivers/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const { driver: serverDriver } = await response.json();

            // Update local data with latest from server
            if (serverDriver) {
              await AsyncStorage.setItem(
                "driverData",
                JSON.stringify(serverDriver)
              );
              setAuthToken(token);
              setDriverId(id);
              setDriver(serverDriver);
              setIsAuthenticated(true);
            } else {
              // Driver doesn't exist on server, clear local data
              await logout();
            }
          } else if (response.status === 404) {
            // Driver not found, clear cached auth data
            console.log("Driver not found in database, clearing local cache");
            await logout();
          } else {
            // Use cached data if server error
            setAuthToken(token);
            setDriverId(id);
            setDriver(JSON.parse(driverData));
            setIsAuthenticated(true);
          }
        } catch (fetchError) {
          console.log("Unable to verify driver with server, using cached data");
          // Network error, use cached data
          setAuthToken(token);
          setDriverId(id);
          setDriver(JSON.parse(driverData));
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, id: string, driverData: Driver) => {
    try {
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("driverId", id);
      await AsyncStorage.setItem("driverData", JSON.stringify(driverData));

      setAuthToken(token);
      setDriverId(id);
      setDriver(driverData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("driverId");
      await AsyncStorage.removeItem("driverData");

      setAuthToken(null);
      setDriverId(null);
      setDriver(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
      throw error;
    }
  };

  const updateDriver = async (updatedDriver: Driver) => {
    try {
      await AsyncStorage.setItem("driverData", JSON.stringify(updatedDriver));
      setDriver(updatedDriver);
    } catch (error) {
      console.error("Error updating driver:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authToken,
        driverId,
        driver,
        loading,
        login,
        logout,
        updateDriver,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
