import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input } from "@/components/ui/Input";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginScreen() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: "",
      password: "",
    };

    let isValid = true;

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/driver/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Fetch driver data to get status
        await checkDriverStatus(data.access_token);
      } else {
        Alert.alert(
          "Login Failed",
          data.message || "Invalid credentials. Please try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const checkDriverStatus = async (token: string) => {
    try {
      // Decode JWT to get driver ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const driverId = payload.sub;

      // Fetch driver data
      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.driver) {
        const driver = data.driver;

        // Update AuthContext with login data
        await login(token, driverId, driver);

        // Route based on verification status
        const status = driver.verificationStatus || "pending";

        // Check if driver has completed registration (has documents)
        const hasDocuments =
          driver.documents?.cnic || driver.documents?.drivingLicense;

        if (!hasDocuments) {
          // No documents uploaded - go to driver registration
          router.replace("/driver-registration");
        } else if (status === "pending") {
          // Documents uploaded, waiting for admin approval
          router.replace("/docs-pending");
        } else if (status === "approved") {
          // Approved - go to driver home
          router.replace("/");
        } else if (status === "rejected") {
          // Rejected - show rejection screen with reason
          Alert.alert(
            "Application Rejected",
            driver.rejectionReason ||
              "Your application was not approved. Please contact support.",
            [
              {
                text: "Re-submit Documents",
                onPress: () => router.replace("/driver-registration"),
              },
            ]
          );
        } else {
          // Default to registration
          router.replace("/driver-registration");
        }
      } else {
        Alert.alert("Error", "Unable to fetch driver information.");
      }
    } catch (error) {
      console.error("Status check error:", error);
      Alert.alert("Error", "Unable to verify driver status.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="car-sport" size={80} color="#10B981" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login to your GoMate driver account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              error={errors.password}
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword(!showPassword)}
              editable={!loading}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() =>
                Alert.alert(
                  "Info",
                  "Please contact support to reset your password."
                )
              }
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Signup Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
});
