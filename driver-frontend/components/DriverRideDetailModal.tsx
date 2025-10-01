import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import Constants from "expo-constants";
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute";

const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.MAPS_API_KEY;

interface Props {
  visible: boolean;
  onClose: () => void;
  ride: any;
}

export default function DriverRideDetailModal({ visible, onClose, ride }: Props) {
  const mapRef = useRef<MapView>(null);
  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // Load route data using the same pattern as RideRequestPage
  useEffect(() => {
    if (visible && ride) {
      loadRouteData();
    }
  }, [visible, ride]);

  const loadRouteData = async () => {
    try {
      setIsLoading(true);
      
      // Get pickup and destination addresses from ride object
      // Adjust these property names based on your actual mock data structure
      const pickupAddress = ride.pickupLocation?.address || ride.pickup || "Pickup Location";
      const destinationAddress = ride.dropoffLocation?.address || ride.destination || "Destination";

      console.log("Loading route for:", { pickupAddress, destinationAddress });

      if (!pickupAddress || !destinationAddress) {
        Alert.alert("Error", "Pickup or destination address missing.");
        return;
      }

      // Use the same geocoding functions as RideRequestPage
      const pickupCoords = await getCoordinatesFromAddress(pickupAddress);
      const destinationCoords = await getCoordinatesFromAddress(destinationAddress);

      if (pickupCoords && destinationCoords) {
        console.log("Geocoded coordinates:", { pickupCoords, destinationCoords });
        
        const route = await getRouteCoordinates(pickupCoords, destinationCoords);
        setRouteCoords(route);

        if (route.length > 0) {
          const exactPickupCoord = route[0];
          const exactDestinationCoord = route[route.length - 1];

          setPickupCoord(exactPickupCoord);
          setDestinationCoord(exactDestinationCoord);

          // Fit map to show both markers with padding
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates([exactPickupCoord, exactDestinationCoord], {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              });
            }
          }, 1000);
        } else {
          // Fallback if no route coordinates
          setPickupCoord(pickupCoords);
          setDestinationCoord(destinationCoords);

          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.fitToCoordinates([pickupCoords, destinationCoords], {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              });
            }
          }, 1000);
        }
      } else {
        Alert.alert("Error", "Could not fetch coordinates for the given locations.");
      }
    } catch (error) {
      console.error("Error loading route data:", error);
      Alert.alert("Error", "Failed to load route information.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ride) return null;

  // Get addresses for display
  const pickupAddress = ride.pickupLocation?.address || ride.pickup || "Pickup Location";
  const destinationAddress = ride.dropoffLocation?.address || ride.destination || "Destination";

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Date */}
        <Text style={styles.date}>
          {new Date(ride.createdAt).toDateString()}
        </Text>

        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={DEFAULT_REGION}
            showsUserLocation={false}
            showsMyLocationButton={false}
            mapType="standard"
          >
            {pickupCoord && (
              <Marker
                coordinate={pickupCoord}
                title="Pickup Location"
                description={pickupAddress}
                anchor={{ x: 0.5, y: 1 }}
              >
                <Ionicons name="location" size={30} color="#FF4444" />
              </Marker>
            )}

            {destinationCoord && (
              <Marker
                coordinate={destinationCoord}
                title="Destination"
                description={destinationAddress}
                anchor={{ x: 0.5, y: 1 }}
              >
                <Ionicons name="location" size={30} color="#22c55e" />
              </Marker>
            )}

            {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords} 
                strokeWidth={4} 
                strokeColor="#007AFF" 
              />
            )}
          </MapView>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading route...</Text>
            </View>
          )}
        </View>

        {/* Rest of your existing UI */}
        <View style={styles.passengerSection}>
          {ride.profilePhoto ? (
            <Image source={{ uri: ride.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {ride.passengerName?.charAt(0)?.toUpperCase() || "P"}
              </Text>
            </View>
          )}
          <Text style={styles.passengerName}>{ride.passengerName}</Text>
        </View>

        <View style={styles.routeSection}>
          <View style={styles.routeRow}>
            <Ionicons name="radio-button-on" size={20} color="#FF4444" />
            <Text style={styles.routeText}>{pickupAddress}</Text>
          </View>
          <View style={styles.routeRow}>
            <Ionicons name="radio-button-on" size={20} color="#22c55e" />
            <Text style={styles.routeText}>{destinationAddress}</Text>
          </View>
        </View>

        <Text style={styles.fare}>
          Fare Earned: <Text style={styles.fareHighlight}>Rs {ride.fare}</Text>
        </Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.status, styles[ride.status as keyof typeof styles]]}>
            {ride.status}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f9fafb", 
    padding: 20 
  },
  closeButton: {
    position: "absolute", 
    top: 40, 
    left: 20,
    backgroundColor: "#6b7280", 
    padding: 8, 
    borderRadius: 20, 
    zIndex: 10,
  },
  date: { 
    textAlign: "center", 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#0286FF", 
    marginTop: 80 
  },
  mapContainer: {
    width: "90%",
    height: 250,
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  passengerSection: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 20, 
    marginBottom: 20 
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 12 
  },
  avatarPlaceholder: {
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: "#E0E0E0",
    justifyContent: "center", 
    alignItems: "center", 
    marginRight: 12,
  },
  avatarInitial: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#0286FF" 
  },
  passengerName: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#333" 
  },
  routeSection: { 
    marginVertical: 20 
  },
  routeRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 8 
  },
  routeText: { 
    marginLeft: 10, 
    fontSize: 16, 
    color: "#333",
    flex: 1 
  },
  fare: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#333", 
    marginTop: 10 
  },
  fareHighlight: { 
    color: "#0286FF" 
  },
  statusContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 20 
  },
  statusLabel: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginRight: 8, 
    color: "#333" 
  },
  status: {
    fontSize: 16, 
    fontWeight: "600", 
    color: "#fff", 
    paddingHorizontal: 10,
    paddingVertical: 4, 
    borderRadius: 8, 
    textTransform: "capitalize",
  },
  pending: { backgroundColor: "#facc15" },
  accepted: { backgroundColor: "#dbadc8ff" },
  started: { backgroundColor: "#3b82f6" },
  completed: { backgroundColor: "#22c55e" },
  cancelled: { backgroundColor: "#cb0e0eff" },
});