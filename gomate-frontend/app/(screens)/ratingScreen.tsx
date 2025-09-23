import CustomButton from "@/components/CustomButton";
import StarRating from "@/components/StartRating";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View, Text, Image, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RatingScreen() {
    const {
      driverName,
      driverCarCompany,
      driverCarModel,
      pickup,
      dropoff,
      fare,
    } = useLocalSearchParams();
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    console.log("Submitted rating:", rating);
    router.replace("/(screens)/newHome");
    // send rating + trip details to backend
  };

  const handleSkip = () => {
    router.replace("/(screens)/newHome");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3">
        <Text className="text-4xl font-JakartaExtraBold text-blue-600 mx-auto leading-[1.5]">
          Rating
        </Text>
      </View>

      {/* Driver Info */}
      <View className="items-center mt-12">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?img=3" }}
          className="w-48 h-48 rounded-full"
        />
        <Text className="mt-3 text-3xl font-JakartaBold">Muhammad Ahmad</Text>
        <Text className="text-gray-500 text-2xl font-JakartaBold mt-1">
          Suzuki Alto
        </Text>
      </View>

      {/* Trip Info */}
      <View className="mx-6 mt-6 p-4 bg-white rounded-2xl shadow border border-gray-200">
        {/* Pickup */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-sharp" size={36} color="red" />
          <Text className="ml-2 text-xl font-JakartaBold text-gray-800">
            COMSATS University
          </Text>
        </View>

        {/* Dropoff */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-sharp" size={36} color="#00CD87" />
          <Text className="ml-2 text-xl font-JakartaBold text-gray-800">
            Lake City
          </Text>
        </View>

        {/* Fare */}
        <View className="flex-row items-center">
          <Ionicons name="receipt-outline" size={36} color="#0486FE" />
          <Text className="ml-2 text-4xl font-JakartaExtraBold text-gray-900">
            PKR 250
          </Text>
        </View>
      </View>

      {/* Rating Card */}
      <View className="mx-6 mt-6 p-6 bg-gray-100 rounded-2xl shadow border border-gray-200">
        <Text className="text-3xl font-JakartaBold text-center leading-[1.5]">
          How was your trip?
        </Text>
        <Text className="text-gray-600 mt-3 text-center text-lg font-JakartaSemiBold">
          Your feedback will help improve driving experience
        </Text>
        {/* Star Rating */}
        <StarRating onRatingChange={(val: number) => setRating(val)} />
        {/* Buttons */}
        <CustomButton
          title="Submit Review"
          className="mt-6"
          onPress={handleSubmit}
        />
        <CustomButton
          className="bg-gray-400 mt-6"
          title="Skip"
          onPress={handleSkip}
        />
      </View>
    </SafeAreaView>
  );
}
