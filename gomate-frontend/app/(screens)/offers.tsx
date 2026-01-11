import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const mockDrivers = [
  {
    id: "1",
    first_name: "James",
    last_name: "Wilson",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/",
    fare: 400,
    time: "5 mins",
    distance: "2.5 km",
    carMake: "Suzuki",
    carModel: "Mehran",
  },
  {
    id: "2",
    first_name: "David",
    last_name: "Brown",
    profile_image_url:
      "https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x932/",
    fare: 450,
    time: "10 mins",
    distance: "3.0 km",
    carMake: "Toyota",
    carModel: "Corolla",
  },
  {
    id: "3",
    first_name: "Michael",
    last_name: "Johnson",
    profile_image_url:
      "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/",
    fare: 480,
    time: "15 mins",
    distance: "4.0 km",
    carMake: "Honda",
    carModel: "Civic",
  },
  {
    id: "4",
    first_name: "Robert",
    last_name: "Green",
    profile_image_url:
      "https://ucarecdn.com/fdfc54df-9d24-40f7-b7d3-6f391561c0db/-/preview/626x417/",
    car_image_url:
      "https://ucarecdn.com/b6fb3b55-7676-4ff3-8484-fb115e268d32/-/preview/930x932/",
    fare: 400,
    time: "5 mins",
    distance: "2.5 km",
    carMake: "Suzuki",
    carModel: "Mehran",
  },
  {
    id: "5",
    first_name: "Robert",
    last_name: "Green",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/",
    fare: 500,
    time: "5 mins",
    distance: "2.5 km",
    carMake: "Suzuki",
    carModel: "Mehran",
  },
  {
    id: "6",
    first_name: "Robert",
    last_name: "Green",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/",
    fare: 500,
    time: "5 mins",
    distance: "2.5 km",
    carMake: "Suzuki",
    carModel: "Mehran",
  },
];

// const handleCall = () => {
//   const phoneNumber = "+923001234567"; // Replace with actual driver phone
//   Linking.openURL(`tel:${phoneNumber}`).catch(() => {
//     Alert.alert("Error", "Unable to make phone call");
//   });
// };

const { width } = Dimensions.get("window");

const Offers = () => {
  const [loading, setLoading] = useState(true);
  const [fareOffer, setFareOffer] = useState<number>(0);
  const slideAnims = useRef(
    mockDrivers.map(() => new Animated.Value(-width))
  ).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      // animate each driver in sequence
      mockDrivers.forEach((_, index) => {
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: 500,
          delay: index * 300,
          useNativeDriver: true,
        }).start();
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const cancelRide = () => {
    router.back();
  };

  const adjustFare = (increase: boolean) => {
    setFareOffer((prev) => {
      const step = 10;
      const next = increase ? prev + step : prev - step;
      return Math.max(0, next);
    });
  };

  const acceptDriver = (driverId: string) => {
    // Navigate to next screen or update state
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text className="mt-4 text-lg text-gray-700">Finding Drivers...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="absolute bottom-[1px] w-full bg-blue-100 rounded-t-[40px] shadow-lg border-t-2 border-l-2 border-r-2 border-blue-300"
    >
      <View className="p-5">
        <View className="flex-row justify-between items-center p-1 mb-4">
          <Text className="text-3xl font-JakartaExtraBold p-2">
            Driver Arriving
          </Text>
          <View className="flex-row">
            <TouchableOpacity className="p-2 rounded-full bg-blue-500 shadow-sm border-[1px] border-white">
              <MaterialCommunityIcons name={"phone"} size={44} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2 ml-6 rounded-full bg-green-500 shadow-sm border-[1px] border-white">
              <MaterialCommunityIcons
                name={"whatsapp"}
                size={44}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Driver Info */}
        <View className="flex-row items-center  mb-4">
          <Image
            source={{
              uri: "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
            }}
            className="w-16 h-16 rounded-full"
          />
          <View className="ml-4">
            <Text className="text-xl font-JakartaBold">Muhammad Ahmad</Text>
            <Text className="text-gray-600 text-xl font-JakartaMedium">
              White Toyota Corolla
            </Text>
            <Text className="text-primary-500 text-2xl font-JakartaExtraBold">
              LEN 1234
            </Text>
          </View>
        </View>

        {/* Pickup & Dropoff */}
        <View className="mb-3">
          <Text className="text-lg text-gray-500 font-JakartaSemiBold">
            Pickup
          </Text>
          <Text className="text-xl font-JakartaBold">
            Harbanspura, Lahore, Pakistan
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-lg text-gray-500 font-JakartaSemiBold">
            Drop-off
          </Text>
          <Text className="text-xl font-JakartaBold">
            Gulberg, Lahore, Pakistan
          </Text>
        </View>
        <View className="mb-5">
          <Text className="text-lg text-gray-500 font-JakartaSemiBold">
            Fare
          </Text>
          <Text className="text-2xl font-JakartaBold">PKR 1500</Text>
        </View>

        {/* Cancel Ride Button */}
        <CustomButton title="Cancel Ride" className="bg-red-500" />
      </View>
    </KeyboardAvoidingView>
  );
};

export default Offers;
