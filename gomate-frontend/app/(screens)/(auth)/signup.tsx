import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/contexts/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Signup = () => {
  const { signup } = useAuth();
  const [form, setform] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    gender: "male",
  });
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission for notifications not granted");
      }
    };

    requestPermissions();
  }, []);

  const getErrorMessage = (message: string | undefined): string => {
    // Parse backend validation errors and return user-friendly messages
    if (!message) {
      return "Something went wrong. Please try again.";
    }

    const lowerMessage = message.toLowerCase();

    // Handle validation errors
    if (lowerMessage.includes("password")) {
      if (
        lowerMessage.includes("strong") ||
        lowerMessage.includes("strength")
      ) {
        return "Password must be at least 8 characters with uppercase, lowercase, number, and special character.";
      }
      return "Invalid password format. Please use a stronger password.";
    }

    if (lowerMessage.includes("email")) {
      if (lowerMessage.includes("valid") || lowerMessage.includes("format")) {
        return "Please enter a valid email address.";
      }
      return "Invalid email format.";
    }

    if (lowerMessage.includes("phone")) {
      return "Phone number must be exactly 11 digits.";
    }

    if (lowerMessage.includes("username")) {
      return "Username is required and cannot be empty.";
    }

    if (lowerMessage.includes("gender")) {
      return "Please select a valid gender.";
    }

    if (
      lowerMessage.includes("already exists") ||
      lowerMessage.includes("passenger already exists")
    ) {
      return "This email is already registered. Please log in or use a different email.";
    }

    if (lowerMessage.includes("missing required fields")) {
      return "Please fill in all required fields.";
    }

    // Return original message if no specific case matches
    return message;
  };

  const onSignUpPress = async () => {
    if (
      !form.username ||
      !form.email ||
      !form.password ||
      !form.phoneNumber ||
      !form.gender
    ) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Missing Information ⚠️",
          body: "Please fill in all fields.",
        },
        trigger: null,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(
        form.username,
        form.email,
        form.password,
        form.phoneNumber,
        form.gender
      );

      if (result.success) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Registered Successfully 🚀",
            body: `Welcome, ${form.username}! Please log in to continue.`,
          },
          trigger: null,
        });
        router.push("/(screens)/(auth)/login");
      } else {
        const errorMessage = getErrorMessage(result.message);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Signup Failed ❌",
            body: errorMessage,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("Error signing up:", error);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Error ❌",
          body: "Network error. Please check your connection and try again.",
        },
        trigger: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-white flex-1">
        <View className="relative w-full h-[35%]">
          <Image source={images.signUpCar} className="z-0 w-full h-[100%]" />
          <Text className="text-3xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
            Create Your Account
          </Text>
        </View>

        <View className="p-7">
          <InputField
            label="Username"
            placeholder="Enter your Username"
            placeholderTextColor="grey"
            icon={icons.person}
            value={form.username}
            onChangeText={(text) => setform({ ...form, username: text })}
          />
          <InputField
            label="Email"
            placeholder="Enter your Email"
            placeholderTextColor="grey"
            icon={icons.email}
            value={form.email}
            onChangeText={(text) => setform({ ...form, email: text })}
          />
          <InputField
            label="Password"
            placeholder="Enter your Password"
            placeholderTextColor="grey"
            icon={icons.lock}
            secureTextEntry={true}
            inputStyle="color-black"
            value={form.password}
            onChangeText={(text) => setform({ ...form, password: text })}
          />

          <InputField
            label="Phone No."
            placeholder="Enter your Phone No."
            placeholderTextColor="grey"
            icon={icons.phonecall}
            keyboardType="phone-pad"
            value={form.phoneNumber}
            onChangeText={(text) => setform({ ...form, phoneNumber: text })}
          />

          {/* Gender Selection */}
          <View className="mb-4">
            <Text className="text-lg font-JakartaSemiBold mb-3">Gender</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setform({ ...form, gender: "male" })}
                className={`flex-1 mr-2 p-4 rounded-lg border-2 ${
                  form.gender === "male"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-center font-JakartaSemiBold ${
                    form.gender === "male"
                      ? "text-primary-500"
                      : "text-gray-700"
                  }`}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setform({ ...form, gender: "female" })}
                className={`flex-1 mr-2 p-4 rounded-lg border-2 ${
                  form.gender === "female"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-center font-JakartaSemiBold ${
                    form.gender === "female"
                      ? "text-primary-500"
                      : "text-gray-700"
                  }`}
                >
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setform({ ...form, gender: "other" })}
                className={`flex-1 p-4 rounded-lg border-2 ${
                  form.gender === "other"
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-center font-JakartaSemiBold ${
                    form.gender === "other"
                      ? "text-primary-500"
                      : "text-gray-700"
                  }`}
                >
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title={isLoading ? "Signing Up..." : "Sign Up"}
            className="mt-8 font-JakartaBold"
            onPress={onSignUpPress}
            disabled={isLoading}
            IconLeft={() =>
              isLoading ? (
                <ActivityIndicator color="#fff" className="mr-2" />
              ) : null
            }
          />

          {/* <OAuth /> */}

          <Link
            href="/(screens)/(auth)/login"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>Already have an account? </Text>
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default Signup;
