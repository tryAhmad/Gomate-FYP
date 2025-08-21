import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  NativeSyntheticEvent,
  TouchableOpacity,
  Image,
} from "react-native";

const ForgetPassword = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.charAt(text.length - 1); // keep last digit
    }
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus(); // go next
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus(); // go back
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="absolute top-20 left-12">
        <TouchableOpacity onPress={() => router.back()}>
          <Image
            source={icons.backArrow}
            className="w-10 h-10 tint-black"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
        <Text className="text-4xl font-JakartaExtraBold text-gray-800 mb-6 py-2">
          OTP sent to your email
        </Text>
        <Text className="text-2xl text-center font-JakartaMedium text-gray-500 mb-6 py-2">
          Please enter the OTP we have sent to your email.{" "}
        </Text>

        <View className="flex-row justify-between w-4/5">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                if (el) inputs.current[index] = el;
              }}
              className="border border-gray-400 rounded-lg text-3xl font-JakartaBold text-center w-20 h-20"
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
            />
          ))}
        </View>

        <Text
          className="mt-6 text-lg text-gray-500"
          style={{ textDecorationLine: "underline" }}
        >
          Resend OTP
        </Text>

        <CustomButton
          title="Verify OTP"
          onPress={() => {}}
          className="mt-20 bg-gray-700"
        />
      </View>
  );
};

export default ForgetPassword;
