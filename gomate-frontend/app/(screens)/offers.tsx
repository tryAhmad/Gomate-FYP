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
} from "react-native";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
    console.log("Accepted driver:", driverId);
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
    <View className="flex-1 bg-white pt-10">
      <Text className="text-3xl font-JakartaExtraBold text-gray-700 mb-4 mt-4 text-center">
        Available Drivers
      </Text>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {mockDrivers.map((driver, index) => (
          <Animated.View
            key={driver.id}
            style={{ transform: [{ translateX: slideAnims[index] }] }}
            className="bg-primary-200 rounded-xl p-4 mb-4 shadow-md mx-4"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Image
                  source={{ uri: driver.profile_image_url }}
                  className="w-16 h-16 rounded-full mr-4"
                />
                <View>
                  <Text className="text-2xl font-JakartaBold">
                    {driver.first_name} {driver.last_name}
                  </Text>
                  <Text className="text-gray-800 font-JakartaSemiBold">
                    {driver.distance} ~ {driver.time}
                  </Text>
                  <Text className="text-gray-800 font-JakartaExtraBold text-2xl">
                    Fare: Rs {driver.fare}
                  </Text>
                </View>
              </View>

              <View className="flex flex-col items-center justify-center">
                <Text className="text-lg font-JakartaBold">
                  {driver.carMake}
                </Text>
                <Text className="text-base font-JakartaSemiBold">
                  {driver.carModel}
                </Text>
              </View>
            </View>

            <View className="mt-4">
              <CustomButton
                title="Accept"
                className="py-2 rounded-xl text-2xl h-14"
                onPress={() => acceptDriver(driver.id)}
              />
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <View className="bg-white mx-4 mb-6 p-6 rounded-xl shadow-sm border border-gray-100">
        <Text className="text-center font-semibold text-gray-800 mb-4">
          Raise your fare
        </Text>

        <View className="flex-row items-center justify-center mb-6">
          <TouchableOpacity
            className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
            onPress={() => adjustFare(false)}
          >
            <Ionicons name="remove" size={20} color="#666" />
          </TouchableOpacity>

          <View className="mx-8 items-center">
            <Text className="text-2xl font-bold text-gray-800">
              PKR {fareOffer}
            </Text>
          </View>

          <TouchableOpacity
            className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200"
            onPress={() => adjustFare(true)}
          >
            <Ionicons name="add" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {fareOffer > 0 && (
          <CustomButton
            title="Confirm Fare"
            className="bg-green-600 py-3 rounded-full h-16"
          />
        )}
        <CustomButton
          title="Cancel Ride"
          className="bg-red-600 py-3 rounded-full h-16 mt-2"
          onPress={cancelRide}
        />
      </View>
    </View>
  );
};

export default Offers;
