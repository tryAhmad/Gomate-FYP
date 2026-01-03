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
import { Input } from "@/components/ui/Input";
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="car-sport" size={60} color="#10B981" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Sign up to become a GoMate driver
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={form.firstname}
              onChangeText={(text) => setForm({ ...form, firstname: text })}
              error={errors.firstname}
              icon="person-outline"
              autoCapitalize="words"
              editable={!loading}
            />

            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={form.lastname}
              onChangeText={(text) => setForm({ ...form, lastname: text })}
              error={errors.lastname}
              icon="person-outline"
              autoCapitalize="words"
              editable={!loading}
            />

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
              label="Phone Number"
              placeholder="Enter your phone number"
              value={form.phoneNumber}
              onChangeText={(text) => setForm({ ...form, phoneNumber: text })}
              error={errors.phoneNumber}
              icon="call-outline"
              keyboardType="phone-pad"
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

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChangeText={(text) =>
                setForm({ ...form, confirmPassword: text })
              }
              error={errors.confirmPassword}
              icon="lock-closed-outline"
              secureTextEntry={!showConfirmPassword}
              rightIcon={
                showConfirmPassword ? "eye-off-outline" : "eye-outline"
              }
              onRightIconPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Login</Text>
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
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  signupButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
});
