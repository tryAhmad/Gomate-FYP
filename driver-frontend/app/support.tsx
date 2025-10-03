import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StatusBar,
  Alert,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BurgerMenu from "@/components/BurgerMenu";

const { width } = Dimensions.get("window");

const DriverSupportScreen = () => {
 
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  // WhatsApp
  const handleWhatsApp = async () => {
    const phoneNumber = "923164037719";
    const url = `https://wa.me/${phoneNumber}?text=Hello,%20I%20need%20Support%20for%20Driver%20App.`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on your device.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  // Email
  const handleEmail = async () => {
    const email = "support@gomate.com";
    const url = `mailto:${email}?subject=Driver%20Support&body=Hello,%20I%20need%20Support%20for%20Driver%20App.`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No email app is installed on your device.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open email app.");
    }
  };

  // Call
  const handleCall = async () => {
    const phoneNumber = "923164037719";
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make a call.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.introText}>
          Need help with your rides or have a question?{"\n"}
          Our support team is here for you.
        </Text>
        <Text style={styles.chooseOptionText}>
          Choose an option below:
        </Text>

        {/* Call Card */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleCall}
            style={[styles.optionButton, styles.callButton]}
          >
            <Ionicons name="call" size={26} color="white" />
            <Text style={styles.optionButtonText}>Call Us</Text>
          </TouchableOpacity>
          <View style={styles.optionDetails}>
            <Ionicons name="time-outline" size={18} color="#6b7280" />
            <Text style={styles.optionDetailText}>
              Available 9am – 9pm
            </Text>
          </View>
        </View>

        {/* Email Card */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleEmail}
            style={[styles.optionButton, styles.emailButton]}
          >
            <Ionicons name="mail" size={26} color="white" />
            <Text style={styles.optionButtonText}>Email Us</Text>
          </TouchableOpacity>
          <View style={styles.optionDetails}>
            <Ionicons name="mail-outline" size={18} color="#6b7280" />
            <Text style={styles.optionDetailText}>
              We usually reply within 24 hours
            </Text>
          </View>
        </View>

        {/* WhatsApp Card */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={[styles.optionButton, styles.whatsappButton]}
          >
            <Ionicons name="logo-whatsapp" size={26} color="white" />
            <Text style={styles.optionButtonText}>WhatsApp Us</Text>
          </TouchableOpacity>
          <View style={styles.optionDetails}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#6b7280" />
            <Text style={styles.optionDetailText}>
              Quickest way to reach us
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu 
        isVisible={sidebarVisible} 
        onClose={closeSidebar} 
        slideAnim={slideAnim} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === 'ios' ? 40 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40),
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0286FF",
    textAlign: "center",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  introText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  chooseOptionText: {
    textAlign: "center",
    color: "#374151",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 24,
  },
  callButton: {
    backgroundColor: "#10b981", // Emerald
  },
  emailButton: {
    backgroundColor: "#0286FF", // Blue
  },
  whatsappButton: {
    backgroundColor: "#22c55e", // Green
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 8,
  },
  optionDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  optionDetailText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default DriverSupportScreen;