import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as Notifications from "expo-notifications";

 Notifications.setNotificationHandler({
   handleNotification: async () => ({
     shouldShowBanner: true,
     shouldShowList: true,
     shouldPlaySound: true,
     shouldSetBadge: true,
   }),
 });

const Login = () => {
  const [form, setform] = useState({
    email: "",
    password: "",
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

 

  const onSignInPress = async () => {
    const reqBody = {
      email: form.email,
      password: form.password,
    };

    try {
      const response = await fetch(
        "http://192.168.1.22:3000/auth/passenger/login",
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
        // Handle successful login
        console.log("Login successful:", data);
        // ✅ Show notification on success
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Login Successful 🚀",
            body: `Welcome back, ${form.email}!`,
          },
          trigger: null,
        });
        // Navigate to home or dashboard screen
        router.replace("/home");
      } else {
        // Handle login error
        console.error("Login failed:", data);
        // ✅ Show notification on success
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Login Failed ❌",
            body: `Please check your credentials and try again.`,
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    
    <View className="flex-1 bg-white">
      <View className="relative w-full h-[35%]">
        <Image source={images.signUpCar} className="z-0 w-full h-[100%]" />
        <Text className="text-3xl text-black font-JakartaSemiBold absolute mt-[65%] left-5">
          Sign In to Your Account
        </Text>
      </View>
      <View className="p-7">
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

        <CustomButton
          title="Sign In"
          className="mt-8 font-JakartaBold"
          onPress={onSignInPress}
        />

        <OAuth />

        <Link
          href="/(screens)/(auth)/signup"
          className="text-lg text-center text-general-200 mt-10"
        >
          <Text>Don't have an account? </Text>
          <Text className="text-primary-500">Sign Up</Text>
        </Link>
      </View>
    </View>
  );
};

export default Login;
