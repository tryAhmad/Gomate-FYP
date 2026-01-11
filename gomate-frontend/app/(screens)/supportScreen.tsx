import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
    const url = `mailto:${email}?subject=Support&body=Hello,%20I%20need%20Support.`;
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
    const phoneNumber = "923390484822";
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make a call.");
    }
  };

  // Emergency - Police
  const handlePolice = async () => {
    const url = "tel:15";
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make emergency call.");
    }
  };

  // Emergency - Ambulance
  const handleAmbulance = async () => {
    const url = "tel:1122";
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make emergency call.");
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View className="p-4 border-b border-gray-200 items-center mt-[10%] pb-4 bg-white">
        <BurgerMenu
          passengerName="Ahmad"
          profilePic="https://i.pravatar.cc/150?img=3"
          style="left-2 ml-3 mt-2"
          onLogout={() => {}}
          currentScreen="supportScreen"
        />
        <Text className="text-3xl font-JakartaExtraBold text-blue-500">
          Support
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Intro */}
        <Text className="text-center text-gray-600 text-lg font-JakartaSemiBold mt-4 mb-2">
          Need help with your rides or have a question?{"\n"}
          Our support team is here for you.
        </Text>
        <Text className="text-center text-gray-800 text-xl font-JakartaExtraBold mt-2 mb-6">
          Choose an option below:
        </Text>

        {/* Call Card */}
        <View className="bg-white shadow-md rounded-2xl p-5 mb-5">
          <TouchableOpacity
            onPress={handleCall}
            className="flex-row items-center justify-center bg-emerald-600 p-4 rounded-2xl"
          >
            <Ionicons name="call" size={26} color="white" />
            <Text className="text-white text-xl font-JakartaSemiBold ml-2">
              Call
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons name="time-outline" size={18} color="gray" />
            <Text className="text-gray-500 text-base font-JakartaBold ml-2">
              Available 9am – 9pm
            </Text>
          </View>
        </View>

        {/* Email Card */}
        <View className="bg-white shadow-md rounded-2xl p-5 mb-5">
          <TouchableOpacity
            onPress={handleEmail}
            className="flex-row items-center justify-center bg-blue-500 p-4 rounded-2xl"
          >
            <Ionicons name="mail" size={26} color="white" />
            <Text className="text-white text-xl font-JakartaSemiBold ml-2">
              Email
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons name="mail-outline" size={18} color="gray" />
            <Text className="text-gray-500 text-base font-JakartaBold ml-2">
              We usually reply within 24 hours
            </Text>
          </View>
        </View>

        {/* WhatsApp Card */}
        <View className="bg-white shadow-md rounded-2xl p-5 mb-5">
          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-row items-center justify-center bg-green-500 p-4 rounded-2xl"
          >
            <Ionicons name="logo-whatsapp" size={26} color="white" />
            <Text className="text-white text-xl font-JakartaSemiBold ml-2">
              WhatsApp
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color="gray"
            />
            <Text className="text-gray-500 text-base font-JakartaBold ml-2">
              Quick replies (9am – 9pm)
            </Text>
          </View>
        </View>

        {/* Emergency Section */}
        <Text className="text-center text-red-600 text-2xl font-JakartaExtraBold mt-6 mb-4">
          🚨 Emergency Services
        </Text>

        {/* Police Card */}
        <View className="bg-white shadow-md rounded-2xl p-5 mb-5 border-2 border-red-500">
          <TouchableOpacity
            onPress={handlePolice}
            className="flex-row items-center justify-center bg-red-600 p-4 rounded-2xl"
          >
            <MaterialCommunityIcons
              name="police-badge"
              size={26}
              color="white"
            />
            <Text className="text-white text-xl font-JakartaSemiBold ml-2">
              Call Police
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons name="call" size={18} color="#dc2626" />
            <Text className="text-red-600 text-base font-JakartaBold ml-2">
              Emergency Hotline: 15
            </Text>
          </View>
        </View>

        {/* Ambulance Card */}
        <View className="bg-white shadow-md rounded-2xl p-5 mb-5 border-2 border-red-500">
          <TouchableOpacity
            onPress={handleAmbulance}
            className="flex-row items-center justify-center bg-red-600 p-4 rounded-2xl"
          >
            <MaterialCommunityIcons name="ambulance" size={26} color="white" />
            <Text className="text-white text-xl font-JakartaSemiBold ml-2">
              Call Ambulance
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center justify-center mt-3">
            <Ionicons name="call" size={18} color="#dc2626" />
            <Text className="text-red-600 text-base font-JakartaBold ml-2">
              Emergency Hotline: 1122
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SupportScreen;
