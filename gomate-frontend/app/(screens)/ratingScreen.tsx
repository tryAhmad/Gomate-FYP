import CustomButton from "@/components/CustomButton";
import StarRating from "@/components/StartRating";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

export default function RatingScreen() {
  const {
    rideId,
    driverName,
    driverProfilePic,
    driverCarColor,
    driverCarCompany,
    driverCarModel,
    pickup,
    dropoff,
    fare,
  } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { token: authToken } = useAuth();

  // Debug logging
  console.log("Rating Screen - Received params:", {
    rideId,
    driverName,
    driverProfilePic,
    driverCarColor,
    driverCarCompany,
    driverCarModel,
    pickup,
    dropoff,
    fare,
  });
  console.log("Rating Screen - authToken:", authToken ? "Present" : "Missing");

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Please select a rating",
        "Please rate your driver before submitting."
      );
      return;
    }

    if (!rideId) {
      console.error("❌ rideId is missing!");
      Alert.alert("Error", "Ride ID is missing. Cannot submit rating.");
      return;
    }

    if (!authToken) {
      console.error("❌ authToken is missing!");
      Alert.alert(
        "Error",
        "You must be logged in to rate. Please log in and try again."
      );
      return;
    }

    setSubmitting(true);
    console.log("Submitting rating:", rating, "for ride:", rideId);
    console.log("Using authToken:", authToken?.substring(0, 20) + "...");

    try {
      const response = await fetch(
        "http://192.168.100.5:3000/ride-request/rate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            rideId: rideId,
            rating: rating,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Rating submitted successfully:", data);
        router.replace("/(screens)/newHome");
      } else {
        console.error("Failed to submit rating:", data);
        Alert.alert(
          "Error",
          data.message || "Failed to submit rating. Please try again."
        );
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
          source={{
            uri:
              (driverProfilePic as string) || "https://i.pravatar.cc/150?img=3",
          }}
          className="w-48 h-48 rounded-full"
        />
        <Text className="mt-3 text-3xl font-JakartaBold">
          {driverName || "Driver"}
        </Text>
        <Text className="text-gray-500 text-2xl font-JakartaBold mt-1">
          {driverCarColor && `${driverCarColor} `}
          {driverCarCompany} {driverCarModel}
        </Text>
      </View>

      {/* Trip Info */}
      <View className="mx-6 mt-6 p-4 bg-white rounded-2xl shadow border border-gray-200">
        {/* Pickup */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-sharp" size={36} color="red" />
          <Text
            className="ml-2 text-xl font-JakartaBold text-gray-800 flex-1 flex-shrink"
            numberOfLines={2}
          >
            {pickup || "Pickup Location"}
          </Text>
        </View>

        {/* Dropoff */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="location-sharp" size={36} color="#00CD87" />
          <Text
            className="ml-2 text-xl font-JakartaBold text-gray-800 flex-1 flex-shrink"
            numberOfLines={2}
          >
            {dropoff || "Dropoff Location"}
          </Text>
        </View>

        {/* Fare */}
        <View className="flex-row items-center">
          <Ionicons name="receipt-outline" size={36} color="#0486FE" />
          <Text className="ml-2 text-4xl font-JakartaExtraBold text-gray-900">
            PKR {fare || "0"}
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
          title={submitting ? "Submitting..." : "Submit Review"}
          className="mt-6"
          onPress={handleSubmit}
          disabled={submitting}
        />
        <CustomButton
          className="bg-gray-400 mt-6"
          title="Skip"
          onPress={handleSkip}
          disabled={submitting}
        />
      </View>
    </SafeAreaView>
  );
}
