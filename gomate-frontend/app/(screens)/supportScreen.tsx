import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BurgerMenu from "@/components/BurgerMenu";

const SupportScreen = () => {
  // WhatsApp
  const handleWhatsApp = async () => {
    const phoneNumber = "923106350941";
    const url = `https://wa.me/${phoneNumber}?text=Hello,%20I%20need%20Support.`;
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
    const url = `mailto:${email}?subject=Support&body=Hello,%20I%20need%20help.`;
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
    const phoneNumber = "923106350941";
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make a call.");
    }
  };

  return (
    <View className="flex-1 bg-white px-2">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View className="p-4 border-b border-gray-200 items-center mt-[10%] pb-4">
        <BurgerMenu
          passengerName="Ahmad"
          profilePic="https://i.pravatar.cc/150?img=3"
          style="left-2 ml-3"
          onLogout={() => console.log("Logged out")}
        />
        <Text className="text-3xl font-JakartaExtraBold text-blue-500">
          Support
        </Text>
      </View>

      {/* Intro text */}
      <Text className="text-center text-gray-600 text-lg font-JakartaSemiBold mt-6 mb-6 px-4">
        Need help with your rides or have a question?{"\n"}
        Our support team is here for you.
      </Text>
      <Text className="text-center text-gray-600 text-lg font-JakartaExtraBold mt-6 mb-6 px-4">
        Choose an option below:
      </Text>

      <TouchableOpacity
        onPress={handleCall}
        className="flex-row items-center justify-center bg-emerald-600 p-4 rounded-2xl mt-4 mb-2"
      >
        <Ionicons name="call" size={26} color="white" />
        <Text className="text-white text-2xl font-JakartaSemiBold ml-2">
          Call Us
        </Text>
      </TouchableOpacity>
      <Text className="text-center text-gray-500 text-lg font-JakartaBold mb-6">
        Available 9am – 9pm
      </Text>

      <TouchableOpacity
        onPress={handleEmail}
        className="flex-row items-center justify-center bg-blue-500 p-4 rounded-2xl mb-2"
      >
        <Ionicons name="mail" size={26} color="white" />
        <Text className="text-white text-2xl font-JakartaSemiBold ml-2">
          Email Us
        </Text>
      </TouchableOpacity>
      <Text className="text-center text-gray-500 text-lg font-JakartaBold mb-6">
        We usually reply within 24 hours
      </Text>

      <TouchableOpacity
        onPress={handleWhatsApp}
        className="flex-row items-center justify-center bg-green-600 p-4 rounded-2xl mb-2"
      >
        <Ionicons name="logo-whatsapp" size={26} color="white" />
        <Text className="text-white text-2xl font-JakartaSemiBold ml-2">
          Whatsapp Us
        </Text>
      </TouchableOpacity>
      <Text className="text-center text-gray-500 text-lg font-JakartaBold mb-6">
        Quickest way to reach us
      </Text>
    </View>
  );
};

export default SupportScreen;
