import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { reverseGeocode } from "../../utils/mapsApi";
import BurgerMenu from "@/components/BurgerMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RideDetailModal from "@/components/RideDetailModal";
import Constants from "expo-constants";

const userip = Constants.expoConfig?.extra?.USER_IP?.trim();
const usertoken = Constants.expoConfig?.extra?.USER_TOKEN?.trim();

interface Location {
  coordinates: [number, number];
  address?: string;
}

interface Ride {
  _id: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  rideMode: string;
  rideType: string;
  status: string;
  fare: number;
  createdAt: string;
}

// ✅ Memoized RideItem component
const RideItem = React.memo(
  ({ ride, onPress }: { ride: Ride; onPress: () => void }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        className="border-b border-gray-700 p-4 mb-4"
      >
        {/* Date + Fare */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-black text-2xl font-JakartaSemiBold">
            {new Date(ride.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
          <Text className="text-black font-JakartaBold text-2xl">
            PKR {ride.fare ?? 0}
          </Text>
        </View>

        {/* Pickup + Dropoff */}
        <View className="ml-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="radio-button-on" size={20} color="#3b82f6" />
            <Text className="ml-2 text-black text-base font-JakartaMedium">
              {ride.pickupLocation?.address ?? "Unknown"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="radio-button-on" size={20} color="#22c55e" />
            <Text className="ml-2 text-black text-base font-JakartaMedium">
              {ride.dropoffLocation?.address ?? "Unknown"}
            </Text>
          </View>
        </View>

        <View className="mt-2">
          {ride.status && (
            <Text
              className={`px-3 py-1 rounded-md text-base font-Jakarta self-start ${
                ride.status === "pending"
                  ? "bg-yellow-500 text-white"
                  : ride.status === "accepted"
                    ? "bg-green-600 text-white"
                    : ride.status === "started"
                      ? "bg-blue-600 text-white"
                      : ride.status === "completed"
                        ? "bg-purple-600 text-white"
                        : ride.status === "cancelled"
                          ? "bg-gray-700 text-gray-100"
                          : "bg-gray-500 text-white"
              }`}
            >
              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load cached rides first
  useEffect(() => {
    const loadCachedRides = async () => {
      try {
        const cached = await AsyncStorage.getItem("rideHistory");
        if (cached) {
          setRides(JSON.parse(cached));
          setLoading(false);
        }
      } catch (err) {
        console.log("Error loading cached rides:", err);
      }
    };
    loadCachedRides();
  }, []);

  // Fetch from API and update cache
  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `http://${userip}:3000/ride-request/history`,
        {
          headers: {
            Authorization: `Bearer ${usertoken}`,
          },
        }
      );

      let fetchedRides: Ride[] = res.data.rides || [];

      // Reverse geocode pickup/dropoff
      const ridesWithAddresses = await Promise.all(
        fetchedRides.map(async (ride) => {
          let pickupAddr = "Unknown";
          let dropoffAddr = "Unknown";

          if (ride.pickupLocation?.coordinates) {
            pickupAddr = await reverseGeocode(
              ride.pickupLocation.coordinates[1],
              ride.pickupLocation.coordinates[0]
            ).catch(() => "Unknown");
          }

          if (ride.dropoffLocation?.coordinates) {
            dropoffAddr = await reverseGeocode(
              ride.dropoffLocation.coordinates[1],
              ride.dropoffLocation.coordinates[0]
            ).catch(() => "Unknown");
          }

          return {
            ...ride,
            pickupLocation: { ...ride.pickupLocation, address: pickupAddr },
            dropoffLocation: {
              ...ride.dropoffLocation,
              address: dropoffAddr,
            },
          };
        })
      );

      setRides(ridesWithAddresses);

      // Save in AsyncStorage
      await AsyncStorage.setItem(
        "rideHistory",
        JSON.stringify(ridesWithAddresses)
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch ride history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const renderRideItem = useCallback(
    ({ item }: { item: Ride }) => (
      <RideItem
        ride={item}
        onPress={() => {
          setSelectedRide(item);
          setModalVisible(true);
        }}
      />
    ),
    []
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="black" />
        <Text className="mt-2 text-black">Loading ride history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-400 text-3xl font-JakartaExtraBold">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View className="flex-row items-center justify-center mb-6 mt-[10%]">
        <BurgerMenu
          passengerName="Ahmad"
          profilePic="https://i.pravatar.cc/150?img=3"
          style="left-2"
          onLogout={() => console.log("Logged out")}
          currentScreen="rideHistory"
        />
        <Text className="text-black text-3xl font-JakartaBold">My rides</Text>
      </View>

      {rides.length === 0 ? (
        <Text className="text-gray-400 text-center">No rides found.</Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          renderItem={renderRideItem}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <RideDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ride={selectedRide}
      />
    </View>
  );
}
