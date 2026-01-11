import React, { useEffect, useState, useRef, useMemo } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import InputField from "@/components/InputField";
import { icons } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const rideTypes = [
  {
    id: "bike",
    name: "Bike",
    icon: <MaterialCommunityIcons name="motorbike" size={24} color="black" />,
  },
  {
    id: "car",
    name: "Car",
    icon: <MaterialCommunityIcons name="car" size={24} color="black" />,
  },
  {
    id: "auto",
    name: "Auto",
    icon: <MaterialCommunityIcons name="rickshaw" size={24} color="black" />,
  },
  {
    id: "shared",
    name: "Shared",
    icon: (
      <MaterialCommunityIcons name="account-multiple" size={24} color="black" />
    ),
  },
];

const Home = () => {
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const [selectedRideType, setSelectedRideType] = useState<string | null>(
    "bike"
  );
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [fare, setFare] = useState("");

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["16%", "62%"], []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Permission Denied ❌",
            body: "Location permission is required to use this feature.",
          },
          trigger: null,
        });
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({});
      const region: Region = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setInitialRegion(region);
    })();
  }, []);

  const handleFindRide = () => {
    if (!selectedRideType || !pickup || !dropoff || !fare) {
      alert("Please fill in all fields");
      return;
    }
    alert(
      `Finding ride for ${selectedRideType} from ${pickup} to ${dropoff} with fare ${fare}`
    );
    router.push("/(screens)/newHome");
  };

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 mb-2 mt-[10%] bg-white z-10 shadow-md">
        <Text className="text-3xl font-JakartaExtraBold text-center">
          Book Ride
        </Text>
      </View>
      {initialRegion ? (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          showsUserLocation
        >
          <Marker
            coordinate={{
              latitude: initialRegion.latitude,
              longitude: initialRegion.longitude,
            }}
            title="You are here"
          />
        </MapView>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="blue" />
          <Text>Loading map...</Text>
        </View>
      )}

      <BottomSheet ref={sheetRef} index={0} snapPoints={snapPoints}>
        <BottomSheetView className="px-4">
          <Text className="text-2xl font-JakartaExtraBold mb-4">
            Choose Ride Type.
          </Text>
          <View className="flex-row justify-around mb-4">
            {rideTypes.map((ride) => (
              <TouchableOpacity
                key={ride.id}
                onPress={() => setSelectedRideType(ride.id)}
                className={`w-[24%] p-4 rounded-lg mb-3 border-2 items-center ${
                  selectedRideType === ride.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Text className="text-sm text-gray-50">{ride.icon}</Text>

                <Text
                  className={`font-JakartaBold text-xl ${
                    selectedRideType === ride.id
                      ? "text-blue-600"
                      : "text-gray-800"
                  }`}
                >
                  {ride.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Pickup Location"
            placeholder="Enter Pickup Location"
            placeholderTextColor="grey"
            icon={icons.map}
            //value={initialRegion?.latitude.toString()}
            value={pickup}
            onChangeText={setPickup}
            //editable={false}
          />
          <InputField
            label="Drop-off Location"
            placeholder="Enter Destination"
            placeholderTextColor="grey"
            icon={icons.marker}
            value={dropoff}
            //value={initialRegion?.longitude.toString()}
            onChangeText={setDropoff}
            //editable={false}
          />
          <InputField
            label="Fare Offer"
            placeholder="Enter Fare"
            placeholderTextColor="grey"
            keyboardType="numeric"
            icon={icons.map}
            value={fare}
            onChangeText={setFare}
          />
          <CustomButton
            title="Find Ride"
            className="mt-8 font-JakartaBold"
            onPress={handleFindRide}
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default Home;
