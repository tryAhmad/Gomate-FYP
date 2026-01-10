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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function SignupScreen() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstname: "",
      lastname: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

    // First name validation
    if (!form.firstname.trim()) {
      newErrors.firstname = "First name is required";
      isValid = false;
    } else if (form.firstname.trim().length < 2) {
      newErrors.firstname = "First name must be at least 2 characters";
      isValid = false;
    }

    // Last name validation
    if (!form.lastname.trim()) {
      newErrors.lastname = "Last name is required";
      isValid = false;
    } else if (form.lastname.trim().length < 2) {
      newErrors.lastname = "Last name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Phone number validation
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (form.phoneNumber.trim().length < 10) {
      newErrors.phoneNumber = "Please enter a valid phone number";
      isValid = false;
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Request location permission
      let coordinates = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coordinates = [location.coords.longitude, location.coords.latitude];
          console.log("Got location coordinates:", coordinates);
        } else {
          console.log(
            "Location permission denied, signup will continue without location"
          );
          Alert.alert(
            "Location Permission",
            "Location access was denied. You can add your location later in your profile.",
            [{ text: "OK" }]
          );
        }
      } catch (locationError) {
        console.error("Error getting location:", locationError);
        Alert.alert(
          "Location Error",
          "Could not get your location. You can add it later in your profile.",
          [{ text: "OK" }]
        );
      }

      // Initial signup payload (vehicle details will be added during document upload)
      const payload: any = {
        fullname: {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
        },
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
      };

      // Only add location if we have coordinates
      if (coordinates) {
        payload.location = {
          type: "Point",
          coordinates: coordinates,
        };
      }

      const response = await fetch(`${API_URL}/auth/driver/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after successful signup
        const { token, driver } = data;

        if (token && driver) {
          // Store auth data
          await AsyncStorage.setItem("authToken", token);
          await AsyncStorage.setItem("driverId", driver._id);
          await AsyncStorage.setItem("driverData", JSON.stringify(driver));

          Alert.alert(
            "Success",
            "Account created successfully! Please complete your driver registration.",
            [
              {
                text: "Continue",
                onPress: () => router.replace("/driver-registration"),
              },
            ]
          );
        } else {
          // Fallback to login if no token returned
          Alert.alert(
            "Success",
            "Account created successfully! Please login to continue.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/login"),
              },
            ]
          );
        }
      } else {
        // Handle message that might be a string or array
        let errorMessage = "Unable to create account. Please try again.";

        if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join("\n");
          } else if (typeof data.message === "string") {
            errorMessage = data.message;
          }
        }

        Alert.alert("Signup Failed", errorMessage);
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert(
        "Error",
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* Header Image */}
        <View
          style={{
            position: "relative",
            width: "100%",
            height: 280,
            backgroundColor: "#0286ff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="car-sport" size={90} color="white" />
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
            Create Driver Account
          </Text>
        </View>

        <View style={{ padding: 28 }}>
          {/* First Name */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              First Name
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5F5F5",
                borderRadius: 25,
                borderWidth: 1,
                borderColor: errors.firstname ? "#EF4444" : "#F5F5F5",
              }}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color="#666"
                style={{ marginLeft: 16 }}
              />
              <TextInput
                placeholder="Enter your first name"
                placeholderTextColor="grey"
                value={form.firstname}
                onChangeText={(text) => setForm({ ...form, firstname: text })}
                editable={!loading}
                autoCapitalize="words"
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              />
            </View>
            {errors.firstname && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  marginTop: 4,
                  marginLeft: 16,
                }}
              >
                {errors.firstname}
              </Text>
            )}
          </View>

          {/* Last Name */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Last Name
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5F5F5",
                borderRadius: 25,
                borderWidth: 1,
                borderColor: errors.lastname ? "#EF4444" : "#F5F5F5",
              }}
            >
              <Ionicons
                name="person-outline"
                size={24}
                color="#666"
                style={{ marginLeft: 16 }}
              />
              <TextInput
                placeholder="Enter your last name"
                placeholderTextColor="grey"
                value={form.lastname}
                onChangeText={(text) => setForm({ ...form, lastname: text })}
                editable={!loading}
                autoCapitalize="words"
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              />
            </View>
            {errors.lastname && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  marginTop: 4,
                  marginLeft: 16,
                }}
              >
                {errors.lastname}
              </Text>
            )}
          </View>

          {/* Email */}
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
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
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

          {/* Phone Number */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Phone Number
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5F5F5",
                borderRadius: 25,
                borderWidth: 1,
                borderColor: errors.phoneNumber ? "#EF4444" : "#F5F5F5",
              }}
            >
              <Ionicons
                name="call-outline"
                size={24}
                color="#666"
                style={{ marginLeft: 16 }}
              />
              <TextInput
                placeholder="Enter your phone number"
                placeholderTextColor="grey"
                value={form.phoneNumber}
                onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
                editable={!loading}
                keyboardType="phone-pad"
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              />
            </View>
            {errors.phoneNumber && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  marginTop: 4,
                  marginLeft: 16,
                }}
              >
                {errors.phoneNumber}
              </Text>
            )}
          </View>

          {/* Password */}
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
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
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

          {/* Confirm Password */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
              Confirm Password
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F5F5F5",
                borderRadius: 25,
                borderWidth: 1,
                borderColor: errors.confirmPassword ? "#EF4444" : "#F5F5F5",
              }}
            >
              <Ionicons
                name="lock-closed-outline"
                size={24}
                color="#666"
                style={{ marginLeft: 16 }}
              />
              <TextInput
                placeholder="Re-enter your password"
                placeholderTextColor="grey"
                value={form.confirmPassword}
                onChangeText={(text) =>
                  setForm({ ...form, confirmPassword: text })
                }
                editable={!loading}
                secureTextEntry={!showConfirmPassword}
                style={{
                  flex: 1,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: "600",
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ marginRight: 16 }}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 14,
                  marginTop: 4,
                  marginLeft: 16,
                }}
              >
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSignup}
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
                Sign Up
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
              Already have an account?{" "}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={loading}
            >
              <Text
                style={{ fontSize: 16, color: "#0286ff", fontWeight: "bold" }}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
