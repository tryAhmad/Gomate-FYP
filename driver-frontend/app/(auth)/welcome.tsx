import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#10B981", "#059669", "#047857"]}
        style={styles.gradient}
      >
        {/* Logo and App Name */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="car-sport" size={80} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>GoMate Driver</Text>
          <Text style={styles.tagline}>Drive. Earn. Grow.</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="cash-outline" size={32} color="#FFFFFF" />
            <Text style={styles.featureText}>Earn Extra Income</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="time-outline" size={32} color="#FFFFFF" />
            <Text style={styles.featureText}>Flexible Schedule</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.featureText}>Safe & Secure</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#10B981" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.secondaryButtonText}>
              Already a Driver? Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#10B981",
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  featureText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 16,
  },
  buttonContainer: {
    marginTop: "auto",
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 16,
  },
});
