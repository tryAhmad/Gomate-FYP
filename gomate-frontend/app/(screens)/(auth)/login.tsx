import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import * as Notifications from "expo-notifications";
import { ScrollView } from "react-native-gesture-handler";
import { useAuth } from "@/contexts/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Login = () => {
  const { login } = useAuth();
  const [form, setform] = useState({
    email: "",
    password: "",
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

  const onSignInPress = async () => {
    if (!form.email || !form.password) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Missing Information ⚠️",
          body: "Please enter both email and password.",
        },
        trigger: null,
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(form.email, form.password);

      if (result.success) {
        // Show success notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Login Successful 🚀",
            body: `Welcome back!`,
          },
          trigger: null,
        });
        // Navigation will be handled by the index screen based on auth state
        router.replace("/(screens)/newHome");
      } else {
        // Show error notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Login Failed ❌",
            body:
              result.message || "Please check your credentials and try again.",
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Error ❌",
          body: "An unexpected error occurred. Please try again.",
        },
        trigger: null,
      });
    } finally {
      setIsLoading(false);
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
      <ScrollView className="p-7">
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
          title={isLoading ? "Signing In..." : "Sign In"}
          className="mt-8 font-JakartaBold"
          onPress={onSignInPress}
          disabled={isLoading}
          IconLeft={() =>
            isLoading ? (
              <ActivityIndicator color="#fff" className="mr-2" />
            ) : null
          }
        />

        {/* <OAuth /> */}

        <Link
          href="/(screens)/(auth)/signup"
          className="text-lg text-center text-general-200 mt-10"
        >
          <Text>Don't have an account? </Text>
          <Text className="text-primary-500">Sign Up</Text>
        </Link>
      </ScrollView>
    </View>
  );
};

export default Login;
