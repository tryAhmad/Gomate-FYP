import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const { width } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const DocumentVerificationScreen: React.FC = () => {
  const { driver, authToken, updateDriver, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check status every 10 seconds
    const checkStatus = async () => {
      if (!driver || !authToken) return;

      try {
        const response = await fetch(`${API_URL}/drivers/${driver._id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.driver) {
          const updatedDriver = data.driver;
          await updateDriver(updatedDriver);

          // Check if status changed
          if (updatedDriver.verificationStatus === "approved") {
            // Redirect to home
            router.replace("/");
          } else if (updatedDriver.verificationStatus === "rejected") {
            // Show rejection and redirect
            router.replace("/driver-registration");
          }
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    };

    // Check immediately on mount
    checkStatus();

    // Set up polling every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [driver, authToken]);

  const handleCheckNow = async () => {
    if (!driver || !authToken) return;

    setChecking(true);
    try {
      const response = await fetch(`${API_URL}/drivers/${driver._id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.driver) {
        const updatedDriver = data.driver;
        await updateDriver(updatedDriver);

        if (updatedDriver.verificationStatus === "approved") {
          router.replace("/");
        } else if (updatedDriver.verificationStatus === "rejected") {
          router.replace("/driver-registration");
        } else {
          // Still pending - show feedback
          alert(
            "Your application is still under review. Please check back later."
          );
        }
      }
    } catch (error) {
      console.error("Manual check error:", error);
      alert("Unable to check status. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // progress bar animation
    const progressLoop = () => {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(progressLoop, 300);
      });
    };

    // Pulsing document icon
    const pulseLoop = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseLoop());
    };

    progressLoop();
    pulseLoop();

    return () => {
      progressAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, []);

  // progress animation
  const progressLeft = progressAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: ["0%", "30%", "70%", "85%"],
    extrapolate: "clamp",
  });

  const progressOpacity = progressAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.content}>
        {/* Document Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="document-text-outline" size={120} color="#007AFF" />
        </Animated.View>

        <Text style={styles.mainTitle}>Verification in Progress</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressSnake,
                {
                  left: progressLeft,
                  opacity: progressOpacity,
                },
              ]}
            />
          </View>
        </View>

        {/* Description Text */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            We are carefully reviewing your submitted documents to ensure
            everything meets our requirements.
          </Text>
          <Text style={styles.descriptionText}>
            You will be notified about the completion of the verification
            process.
          </Text>
          <Text style={styles.estimateText}>
            This usually takes 24-48 hours
          </Text>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={styles.statusIconCompleted}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text style={styles.statusTextCompleted}>Documents Submitted</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusIconActive}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={styles.statusTextActive}>Under Review</Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.statusIconPending}>
              <Ionicons name="time-outline" size={16} color="#ccc" />
            </View>
            <Text style={styles.statusTextPending}>Approval Pending</Text>
          </View>
        </View>

        {/* Manual Check Button */}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckNow}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.checkButtonText}>Check Status Now</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 32,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  progressBar: {
    width: width * 0.7,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressSnake: {
    position: "absolute",
    height: "100%",
    width: "15%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
  },
  descriptionContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  estimateText: {
    fontSize: 14,
    color: "#0286FF",
    fontWeight: "600",
    marginTop: 8,
  },
  statusContainer: {
    width: "100%",
    alignItems: "center",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "80%",
  },
  statusIconCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusIconActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0286FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusIconPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusTextCompleted: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  statusTextActive: {
    fontSize: 14,
    color: "#0286FF",
    fontWeight: "600",
  },
  statusTextPending: {
    fontSize: 14,
    color: "#ccc",
    fontWeight: "500",
  },
  checkButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  logoutButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default DocumentVerificationScreen;
