import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Text, View, Image, ScrollView } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Signup = () => {
  const [form, setform] = useState({
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  React.useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Permission for notifications not granted");
      }
    };

    requestPermissions();
  }, []);

  const onSignUpPress = async () => {
    const reqBody = {
      username: form.username,
      email: form.email,
      password: form.password,
      phoneNumber: form.phoneNumber,
    };

    try {
      const response = await fetch(
        "http://192.168.1.22/auth/passenger/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reqBody),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Handle successful signup
        console.log("Signup successful:", data);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Registered Successfully 🚀",
            body: `Welcome, ${form.username}!`,
          },
          trigger: null,
        });
        // Navigate to login or home screen
        router.push("/(screens)/(auth)/login");
      } else {
        // Handle signup error
        console.error("Signup failed:", data);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Signup Failed ❌",
            body: data.message || "Something went wrong. Please try again.",
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-white flex-1">
        <View className="relative w-full h-[35%]">
          <Image source={images.signUpCar} className="z-0 w-full h-[100%]" />
          <Text className="text-3xl text-black font-JakartaSemiBold absolute mt-[50%] left-5">
            Create Your Account
          </Text>
        </View>

        <ScrollView className="p-7">
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

          <CustomButton
            title="Sign Up"
            className="mt-8 font-JakartaBold"
            onPress={onSignUpPress}
          />

          {/* <OAuth /> */}

          <Link
            href="/(screens)/(auth)/login"
            className="text-lg text-center text-general-200 mt-10"
          >
            <Text>Already have an account? </Text>
            <Text className="text-primary-500">Log In</Text>
          </Link>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export default Signup;
