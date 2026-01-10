import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
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
    const newErrors = { email: "", password: "" };
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
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await checkDriverStatus(data.access_token);
      } else {
        Alert.alert(
          "Login Failed",
          data.message || "Invalid credentials. Please try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const checkDriverStatus = async (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const driverId = payload.sub;

      const response = await fetch(`${API_URL}/drivers/${driverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok && data.driver) {
        const driver = data.driver;
        await login(token, driverId, driver);

        const status = driver.verificationStatus || "pending";
        const hasDocuments =
          driver.documents?.cnic || driver.documents?.drivingLicense;

        if (!hasDocuments) {
          router.replace("/driver-registration");
        } else if (status === "pending") {
          router.replace("/docs-pending");
        } else if (status === "approved") {
          router.replace("/");
        } else if (status === "rejected") {
          Alert.alert(
            "Application Rejected",
            driver.rejectionReason || "Your application was not approved.",
            [
              {
                text: "Re-submit Documents",
                onPress: () => router.replace("/driver-registration"),
              },
            ]
          );
        } else {
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
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header Image */}
      <View
        style={{
          position: "relative",
          width: "100%",
          height: "35%",
          backgroundColor: "#0286ff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="car-sport" size={100} color="white" />
        <Text
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            fontSize: 28,
            color: "white",
            fontWeight: "600",
          }}
        >
          Driver Login
        </Text>
      </View>

      <ScrollView style={{ padding: 28 }} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Email
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F5F5",
              borderRadius: 25,
              borderWidth: 1,
              borderColor: errors.email ? "#EF4444" : "#F5F5F5",
            }}
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color="#666"
              style={{ marginLeft: 16 }}
            />
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="grey"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ flex: 1, padding: 16, fontSize: 15, fontWeight: "600" }}
            />
          </View>
          {errors.email && (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 14,
                marginTop: 4,
                marginLeft: 16,
              }}
            >
              {errors.email}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
            Password
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F5F5F5",
              borderRadius: 25,
              borderWidth: 1,
              borderColor: errors.password ? "#EF4444" : "#F5F5F5",
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color="#666"
              style={{ marginLeft: 16 }}
            />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="grey"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              editable={!loading}
              secureTextEntry={!showPassword}
              style={{ flex: 1, padding: 16, fontSize: 15, fontWeight: "600" }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ marginRight: 16 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text
              style={{
                color: "#EF4444",
                fontSize: 14,
                marginTop: 4,
                marginLeft: 16,
              }}
            >
              {errors.password}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: "#0286ff",
            borderRadius: 25,
            padding: 16,
            marginTop: 32,
            opacity: loading ? 0.6 : 1,
            shadowColor: "#0286ff",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 40,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 16, color: "#666" }}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            disabled={loading}
          >
            <Text
              style={{ fontSize: 16, color: "#0286ff", fontWeight: "bold" }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
