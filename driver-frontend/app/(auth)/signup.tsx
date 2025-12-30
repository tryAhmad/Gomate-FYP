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

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export default function SignupScreen() {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    firstname: "",
    lastname: "",
    email: "",
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
      // Initial signup payload - ONLY for authentication
      // Vehicle and location will be added during driver registration
      const payload = {
        fullname: {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
        },
        email: form.email.trim().toLowerCase(),
        password: form.password,
        // Default vehicle (will be updated during registration)
        vehicle: {
          color: "N/A",
          plate: "N/A",
          capacity: 1,
          vehicleType: "car",
        },
      };

      const response = await fetch(`${API_URL}/auth/driver/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
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
