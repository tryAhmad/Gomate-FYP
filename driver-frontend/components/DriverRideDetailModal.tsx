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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import Constants from "expo-constants";
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute";

const GOOGLE_MAPS_APIKEY = Constants.expoConfig?.extra?.MAPS_API_KEY;

interface Passenger {
  name: string;
  fare: string;
  pickup?: string;
  destination?: string;
}

interface OptimizedStop {
  type: "pickup" | "destination";
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  ride: any;
}

interface StopWithCoords extends OptimizedStop {
  coordinate: { latitude: number; longitude: number };
}

export default function DriverRideDetailModal({ visible, onClose, ride }: Props) {
  const mapRef = useRef<MapView>(null);
  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizedStopsWithCoords, setOptimizedStopsWithCoords] = useState<StopWithCoords[]>([]);

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
    } else {
      // Reset states when modal closes
      setOptimizedStopsWithCoords([]);
      setRouteCoords([]);
    }
  }, [visible, ride]);

  const loadRouteData = async () => {
    try {
      setIsLoading(true);
      
      if (ride.type === "shared" && ride.optimizedStops && ride.optimizedStops.length > 0) {
        await loadSharedRideData();
      } else {
        await loadSoloRideData();
      }
    } catch (error) {
      console.error("Error loading route data:", error);
      Alert.alert("Error", "Failed to load route information.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedRideData = async () => {
    try {
      console.log("Loading shared ride data with optimized stops:", ride.optimizedStops);

      // Get coordinates for all optimized stops
      const stopsWithCoords = await Promise.all(
        ride.optimizedStops.map(async (stop: OptimizedStop) => {
          const coordinate = await getCoordinatesFromAddress(stop.address);
          return {
            ...stop,
            coordinate: coordinate || DEFAULT_REGION
          };
        })
      );

      setOptimizedStopsWithCoords(stopsWithCoords);

      // Get complete route by connecting all stops in sequence
      if (stopsWithCoords.length >= 2) {
        let completeRoute: { latitude: number; longitude: number }[] = [];
        
        // Get routes between consecutive stops
        for (let i = 0; i < stopsWithCoords.length - 1; i++) {
          const currentStop = stopsWithCoords[i];
          const nextStop = stopsWithCoords[i + 1];
          
          const segmentRoute = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate);
          if (segmentRoute && segmentRoute.length > 0) {
            // Add this segment to the complete route
            completeRoute = [...completeRoute, ...segmentRoute];
          }
        }

        setRouteCoords(completeRoute);

        // Fit map to show all stops and the complete route
        setTimeout(() => {
          if (mapRef.current && stopsWithCoords.length > 0) {
            const allCoordinates = [
              ...stopsWithCoords.map(stop => stop.coordinate),
              ...completeRoute
            ];
            mapRef.current.fitToCoordinates(allCoordinates, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error loading shared ride data:", error);
      Alert.alert("Error", "Failed to load shared ride route.");
    }
  };

  const loadSoloRideData = async () => {
    try {
      // Get pickup and destination addresses from ride object
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
      console.error("Error loading solo ride data:", error);
    }
  };

  const getPinColor = (stopNumber: number, type: "pickup" | "destination") => {
    return type === "pickup" ? "#FF4444" : "#4CAF50";
  };

  const getPinIcon = (stopNumber: number, type: "pickup" | "destination"): "location" | "location-outline" => {
    if (type === "pickup") {
      return stopNumber === 1 ? "location-outline" : "location";
    }
    return stopNumber === 3 ? "location-outline" : "location";
  };

  const renderSoloRideDetails = () => (
    <>
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
          <Text style={styles.routeText}>{ride.pickupLocation?.address || ride.pickup}</Text>
        </View>
        <View style={styles.routeRow}>
          <Ionicons name="radio-button-on" size={20} color="#22c55e" />
          <Text style={styles.routeText}>{ride.dropoffLocation?.address || ride.destination}</Text>
        </View>
      </View>

      <Text style={styles.fare}>
        Fare Earned: <Text style={styles.fareHighlight}>Rs {ride.fare}</Text>
      </Text>
    </>
  );

  const renderSharedRideDetails = () => (
    <ScrollView style={styles.sharedDetailsContainer}>
      {ride.passengers?.map((passenger: Passenger, index: number) => (
        <View key={index} style={styles.passengerDetailSection}>
          <View style={styles.passengerHeader}>
            <View style={styles.passengerInfoLeft}>
              <View style={styles.smallAvatarPlaceholder}>
                <Text style={styles.smallAvatarInitial}>
                  {passenger.name?.charAt(0).toUpperCase() || "P"}
                </Text>
              </View>
              <View style={styles.passengerDetails}>
                <Text style={styles.passengerName}>{passenger.name}</Text>
              </View>
            </View>
            <Text style={styles.individualFare}>Rs {passenger.fare}</Text>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#FF4444" />
                </View>
                <View style={styles.verticalLine} />
              </View>
              <Text style={styles.locationText}>{passenger.pickup}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.locationText}>{passenger.destination}</Text>
            </View>
          </View>

          {index < (ride.passengers?.length || 0) - 1 && (
            <View style={styles.passengerDivider} />
          )}
        </View>
      ))}

      <View style={styles.totalFareContainer}>
        <Text style={styles.totalFareLabel}>Total Fare Earned:</Text>
        <Text style={styles.totalFare}>Rs {ride.fare}</Text>
      </View>
    </ScrollView>
  );

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

      {/* Header with date left and tag right */}
      <View style={styles.modalHeader}>
        <Text style={styles.date}>
          {new Date(ride.createdAt).toDateString()}
        </Text>
        
        {/* Ride Type Tag */}
        {ride.type && (
          <View style={[styles.rideTypeTag, ride.type === "shared" && styles.sharedRideTag]}>
            <Text style={styles.rideTypeText}>{ride.type.toUpperCase()} RIDE</Text>
          </View>
        )}
      </View>

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
          {ride.type === "shared" ? (
            // Shared ride markers
            optimizedStopsWithCoords.map((stop, index) => (
              <Marker
                key={index}
                coordinate={stop.coordinate}
                title={`${stop.passengerName} - ${stop.type === "pickup" ? "Pickup" : "Drop-off"}`}
                description={stop.address}
                anchor={{ x: 0.5, y: 1 }}
              >
                <Ionicons 
                  name={getPinIcon(stop.stopNumber, stop.type)} 
                  size={30} 
                  color={getPinColor(stop.stopNumber, stop.type)} 
                />
              </Marker>
            ))
          ) : (
            // Solo ride markers
            <>
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
            </>
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

      {/* Ride Details */}
      {ride.type === "shared" ? renderSharedRideDetails() : renderSoloRideDetails()}

      {/* Status */}
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
    top: 50, 
    left: 20,
    backgroundColor: "#6b7280", 
    padding: 8, 
    borderRadius: 20, 
    zIndex: 10,
  },
  date: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#0286FF",
    flex: 1, 
  },
  rideTypeTag: {
    backgroundColor: "#FFB347",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10, 
  },
  sharedRideTag: {
    backgroundColor: "#FF6B35",
  },
   modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 80, 
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  rideTypeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  mapContainer: {
    width: "90%",
    height: 250,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
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
    marginBottom: 18 
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

  // Shared Ride Specific Styles
  sharedDetailsContainer: {
    flex: 1,
    marginBottom: 10,
  },
  passengerDetailSection: {
    marginBottom: 5,
  },
  passengerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  passengerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  smallAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  smallAvatarInitial: {
    color: "#0286FF",
    fontSize: 16,
    fontWeight: "600",
  },
  passengerDetails: {
    flex: 1,
  },
  individualFare: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  passengerDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  locationContainer: {
    marginBottom: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dotLineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: 12,
  },
  pinIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: "#ddd",
    marginTop: 6,
    marginBottom: 1,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginTop: 0,
    lineHeight: 18,
  },
  totalFareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalFareLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  totalFare: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0286FF",
  },
});