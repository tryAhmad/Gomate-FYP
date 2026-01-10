import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import axios from "axios";
import CustomButton from "./CustomButton";
import AlertModal from "./AlertModal";

const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.MAPS_API_KEY;
const userip = Constants.expoConfig?.extra?.USER_IP?.trim();

interface Props {
  visible: boolean;
  onClose: () => void;
  ride: any;
  usertoken?: string | null;
}

export default function RideDetailModal({
  visible,
  onClose,
  ride,
  usertoken,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [deletingRide, setDeletingRide] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const pickupCoords = ride
    ? {
        latitude: ride.pickupLocation.coordinates[1],
        longitude: ride.pickupLocation.coordinates[0],
      }
    : null;

  const dropoffCoords = ride
    ? {
        latitude: ride.dropoffLocation.coordinates[1],
        longitude: ride.dropoffLocation.coordinates[0],
      }
    : null;

  // Zoom map to fit pickup + dropoff with pickup on right, dropoff on left
  useEffect(() => {
    if (mapRef.current && visible && pickupCoords && dropoffCoords) {
      // Calculate center point between pickup and dropoff
      const centerLat = (pickupCoords.latitude + dropoffCoords.latitude) / 2;
      const centerLng = (pickupCoords.longitude + dropoffCoords.longitude) / 2;

      // Calculate distance between points to determine zoom level
      const latDelta = Math.abs(pickupCoords.latitude - dropoffCoords.latitude);
      const lngDelta = Math.abs(
        pickupCoords.longitude - dropoffCoords.longitude
      );

      // Add padding to ensure both points are visible
      const paddedLatDelta = latDelta * 1.7;
      const paddedLngDelta = lngDelta * 1.7;

      // Set minimum zoom level
      const minDelta = 0.01;

      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: Math.max(paddedLatDelta, minDelta),
            longitudeDelta: Math.max(paddedLngDelta, minDelta),
          },
          1000
        );
      }, 500);
    }
  }, [visible, pickupCoords, dropoffCoords]);

  // Fetch driver details
  useEffect(() => {
    const fetchDriver = async () => {
      if (!ride?.driverID) return;
      try {
        setLoadingDriver(true);
        const res = await axios.get(
          `http://${userip}:3000/drivers/${ride.driverID}`,
          {
            headers: {
              Authorization: `Bearer ${usertoken}`, // adjust if JWT needed
            },
          }
        );
        setDriver(res.data.driver);
      } catch (err) {
        console.error("Error fetching driver:", err);
      } finally {
        setLoadingDriver(false);
      }
    };

    if (visible) {
      fetchDriver();
    }
  }, [visible, ride]);

  const onDelete = async () => {
    if (!ride?._id) return;

    try {
      setDeletingRide(true);
      await axios.delete(`http://${userip}:3000/ride-request/${ride._id}`, {
        headers: {
          Authorization: `Bearer ${usertoken}`,
        },
      });

      // Close the modal after successful deletion
      onClose();

      // You might want to show a success message or refresh the parent component
      console.log("Ride deleted successfully");
    } catch (err) {
      console.error("Error deleting ride:", err);
      // You might want to show an error message to the user
    } finally {
      setDeletingRide(false);
    }
  };

  if (!ride) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-gray-100 pt-[9%]">
        <TouchableOpacity
          onPress={onClose}
          className="absolute mt-[13%] left-6 z-10 bg-gray-400 p-2 rounded-full border-[1px] border-gray-500 shadow-md"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        {/* Date */}
        <Text className="text-black text-3xl font-JakartaExtraBold mt-6 pt-1 text-center">
          {new Date(ride.createdAt).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Text>
        {/* Map */}
        <View
          className="w-[90%] mx-auto mt-6 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg"
          style={{ height: 250 }}
        >
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            zoomEnabled={false}
            scrollEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            initialRegion={{
              latitude: pickupCoords?.latitude || 0,
              longitude: pickupCoords?.longitude || 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {pickupCoords && (
              <Marker coordinate={pickupCoords} pinColor="red" />
            )}
            {dropoffCoords && (
              <Marker coordinate={dropoffCoords} pinColor="green" />
            )}

            {pickupCoords && dropoffCoords && (
              <MapViewDirections
                origin={pickupCoords}
                destination={dropoffCoords}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#0486FE"
              />
            )}
          </MapView>
        </View>
        {/* Ride + Driver details */}
        <View className="flex-1 px-6 py-6 mt-2 bg-gray-100">
          <View className="flex-row items-center mb-3">
            <Ionicons
              name="radio-button-on"
              size={20}
              color="#3b82f6"
              style={{ marginRight: 8 }}
            />
            <Text className="text-black text-xl font-JakartaSemiBold flex-1">
              {ride.pickupLocation.address}
            </Text>
          </View>

          <View className="flex-row items-center mb-6">
            <Ionicons
              name="radio-button-on"
              size={20}
              color="#22c55e"
              style={{ marginRight: 8 }}
            />
            <Text className="text-black text-xl font-JakartaSemiBold flex-1">
              {ride.dropoffLocation.address}
            </Text>
          </View>

          <Text className="text-3xl text-black font-JakartaExtraBold mb-4">
            Fare: <Text className="text-blue-600">PKR {ride.fare}</Text>
          </Text>

          {/* Driver info */}
          {loadingDriver ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : driver ? (
            <View className="space-y-2">
              <Text className="text-3xl text-center text-black font-JakartaExtraBold mb-2 mt-6">
                Driver Details
              </Text>
              <Text className="text-black text-2xl font-JakartaMedium mb-3">
                <Text className="font-JakartaExtraBold text-2xl text-black">
                  Name:{" "}
                </Text>
                {driver.fullname.firstname} {driver.fullname.lastname}
              </Text>
              <Text className="text-black text-2xl font-JakartaMedium mb-3 ">
                <Text className="font-JakartaExtraBold text-black">
                  Vehicle:{" "}
                </Text>
                {driver.vehicle.color} {driver.vehicle.company}{" "}
                {driver.vehicle.model} (
                {driver.vehicle.vehicleType.charAt(0).toUpperCase() +
                  driver.vehicle.vehicleType.slice(1)}
                )
              </Text>

              <Text className="text-black text-2xl font-JakartaMedium">
                <Text className="font-JakartaExtraBold text-black">
                  Plate:{" "}
                </Text>
                {driver.vehicle.plate}
              </Text>
            </View>
          ) : (
            <Text className="text-red-400 text-3xl font-JakartaExtraBold text-center">
              No driver info available
            </Text>
          )}
          {/* Ride Status */}
          <View className="mb-4 flex-row items-center mt-6">
            <Text className="text-3xl text-black font-JakartaExtraBold mr-4">
              Status:
            </Text>
            <View
              className={`px-4 py-2 rounded-full ${
                ride.status === "pending"
                  ? "bg-yellow-500"
                  : ride.status === "accepted"
                    ? "bg-green-600"
                    : ride.status === "started"
                      ? "bg-blue-600"
                      : ride.status === "completed"
                        ? "bg-purple-600"
                        : ride.status === "cancelled"
                          ? "bg-gray-700"
                          : "bg-gray-500"
              }`}
            >
              <Text className="text-white text-xl font-JakartaBold capitalize">
                {ride.status}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowDeleteAlert(true)}
          className="mb-[10%] mx-[10%] p-4 bg-red-500 rounded-full shadow-md shadow-neutral-400"
          disabled={deletingRide}
        >
          {deletingRide ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-2xl text-center text-white font-JakartaBold">
              Delete
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <AlertModal
        visible={showDeleteAlert}
        onClose={() => {
          setShowDeleteAlert(false);
          onDelete();
        }}
        iconName="trash-bin"
        iconColor="red"
        title="Delete record"
        message={
          "Are you sure you want to delete this ride record? This action cannot be undone."
        }
        button1text="Delete"
        button2visible
        button2text="Cancel"
        onButton2Press={() => setShowDeleteAlert(false)}
      />
    </Modal>
  );
}
