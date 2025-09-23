import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StarRating({ maxStars = 5, onRatingChange }: any) {
  const [rating, setRating] = useState(0);

  const handlePress = (value: number) => {
    setRating(value);
    onRatingChange && onRatingChange(value);
  };

  return (
    <View className="flex-row justify-center mt-4">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <TouchableOpacity key={index} onPress={() => handlePress(starValue)}>
            <Ionicons
              name={starValue <= rating ? "star" : "star-outline"}
              size={56}
              color="#FFD700"
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
