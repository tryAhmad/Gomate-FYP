import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DriverRideDetailModal from "@/components/DriverRideDetailModal";
import BurgerMenu from "@/components/BurgerMenu";
import { useAuth } from "@/contexts/AuthContext";
import { reverseGeocode } from "@/utils/mapsApi";

const { width } = Dimensions.get("window");

interface Passenger {
  name: string;
  fare: string;
  pickup?: string;
  destination?: string;
  profilePicture?: string;
}

interface OptimizedStop {
  type: "pickup" | "destination";
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
}

interface Ride {
  _id: string;
  pickupLocation: { address: string; coordinates?: [number, number] };
  dropoffLocation: { address: string; coordinates?: [number, number] };
  fare: number;
  passengerName: string;
  profilePhoto?: string;
  createdAt: string;
  status: string;
  type?: "solo" | "shared";
  passengers?: Passenger[];
  optimizedStops?: OptimizedStop[];
  passengerCount?: number;
}

export default function DriverRideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { authToken } = useAuth();

  // burgermenu states
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-width * 0.7))[0];

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);

      if (!authToken) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const response = await fetch(
        "http://192.168.100.5:3000/ride-request/driver/history",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ride history: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched driver ride history:", data);

      // Map backend rides to frontend format and reverse geocode coordinates
      const mappedRides: Ride[] = await Promise.all(
        data.rides.map(async (ride: any) => {
          // Shared ride: build per-passenger legs
          if (ride.rideMode === "shared" && Array.isArray(ride.passengers)) {
            const mappedPassengers: Passenger[] = await Promise.all(
              ride.passengers.map(async (p: any) => {
                let pickupAddress = "Pickup Location";
                let dropoffAddress = "Dropoff Location";

                try {
                  if (p.pickupLocation?.coordinates?.length === 2) {
                    const [lng, lat] = p.pickupLocation.coordinates;
                    pickupAddress = await reverseGeocode(lat, lng);
                  }
                } catch (error) {
                  console.error(
                    "Error reverse geocoding shared pickup:",
                    error
                  );
                }

                try {
                  if (p.dropoffLocation?.coordinates?.length === 2) {
                    const [lng, lat] = p.dropoffLocation.coordinates;
                    dropoffAddress = await reverseGeocode(lat, lng);
                  }
                } catch (error) {
                  console.error(
                    "Error reverse geocoding shared dropoff:",
                    error
                  );
                }

                return {
                  name: p.passengerID?.username || "Unknown Passenger",
                  fare: p.fare?.toString() || "0",
                  pickup: pickupAddress,
                  destination: dropoffAddress,
                  profilePicture: p.passengerID?.profilePicture,
                } as Passenger;
              })
            );

            // Use first passenger's pickup for the overall pickup location
            const firstPassenger = ride.passengers[0];
            const firstPickupCoords =
              firstPassenger?.pickupLocation?.coordinates;

            return {
              _id: ride._id,
              pickupLocation: {
                address: mappedPassengers[0]?.pickup || "Shared Ride Start",
                coordinates: firstPickupCoords || null,
              },
              dropoffLocation: {
                address: "Multiple Destinations",
                coordinates: null,
              },
              fare: ride.fare,
              passengerName: "Shared Ride",
              profilePhoto: undefined,
              createdAt: ride.createdAt,
              status: ride.status,
              type: "shared",
              passengerCount: mappedPassengers.length,
              passengers: mappedPassengers,
              optimizedStops: ride.optimizedStops,
            } as Ride;
          }

          // Solo ride fallback
          let pickupAddress = "Pickup Location";
          let dropoffAddress = "Dropoff Location";

          try {
            // Backend stores coordinates as [lng, lat]
            if (
              ride.pickupLocation?.coordinates &&
              ride.pickupLocation.coordinates.length === 2
            ) {
              const [lng, lat] = ride.pickupLocation.coordinates;
              pickupAddress = await reverseGeocode(lat, lng);
            }
          } catch (error) {
            console.error("Error reverse geocoding pickup:", error);
          }

          try {
            if (
              ride.dropoffLocation?.coordinates &&
              ride.dropoffLocation.coordinates.length === 2
            ) {
              const [lng, lat] = ride.dropoffLocation.coordinates;
              dropoffAddress = await reverseGeocode(lat, lng);
            }
          } catch (error) {
            console.error("Error reverse geocoding dropoff:", error);
          }

          return {
            _id: ride._id,
            pickupLocation: {
              address: pickupAddress,
              coordinates: ride.pickupLocation?.coordinates,
            },
            dropoffLocation: {
              address: dropoffAddress,
              coordinates: ride.dropoffLocation?.coordinates,
            },
            fare: ride.fare,
            passengerName: ride.passengerID?.username || "Unknown Passenger",
            profilePhoto: ride.passengerID?.profilePicture,
            createdAt: ride.createdAt,
            status: ride.status,
            rating: ride.rating,
            type: ride.rideMode === "shared" ? "shared" : "solo",
            passengerCount: ride.passengerCount,
            passengers: ride.passengers,
            optimizedStops: ride.optimizedStops,
          };
        })
      );

      // Sort by date (newest first)
      mappedRides.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setRides(mappedRides);
    } catch (err) {
      console.error("Error loading driver rides:", err);
      Alert.alert(
        "Error",
        "Failed to load ride history. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const renderSoloRideCard = (item: Ride) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedRide(item);
        setModalVisible(true);
      }}
    >
      {/* Ride Type Tag */}
      <View style={styles.rideTypeTag}>
        <Text style={styles.rideTypeText}>{item.type?.toUpperCase()}</Text>
      </View>

      {/* Date & Time */}
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </Text>

      <View style={styles.rowBetween}>
        {/* Passenger Section */}
        <View style={styles.passengerSection}>
          {item.profilePhoto ? (
            <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.passengerName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.passengerName}>{item.passengerName}</Text>
        </View>

        {/* Fare */}
        <Text style={styles.fare}>Rs {item.fare}</Text>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="radio-button-on" size={18} color="#FF4444" />
        <Text style={styles.locationText}>
          {item.pickupLocation?.address || "Unknown"}
        </Text>
      </View>
      <View style={styles.locationRow}>
        <Ionicons name="radio-button-on" size={18} color="#22c55e" />
        <Text style={styles.locationText}>
          {item.dropoffLocation?.address || "Unknown"}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.status, statusStyles[item.status] || {}]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSharedRideCard = (item: Ride) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedRide(item);
        setModalVisible(true);
      }}
    >
      {/* Ride Type Tag */}
      <View style={[styles.rideTypeTag, styles.sharedRideTag]}>
        <Text style={styles.rideTypeText}>{item.type?.toUpperCase()}</Text>
      </View>

      {/* Date & Time */}
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </Text>

      {/* Passengers */}
      {item.passengers?.map((passenger, index) => (
        <View key={index}>
          <View style={styles.rowBetween}>
            {/* Passenger Section */}
            <View style={styles.passengerSection}>
              {passenger.profilePicture ? (
                <Image
                  source={{ uri: passenger.profilePicture }}
                  style={styles.smallAvatar}
                />
              ) : (
                <View style={styles.smallAvatarPlaceholder}>
                  <Text style={styles.smallAvatarInitial}>
                    {passenger.name?.charAt(0).toUpperCase() || "P"}
                  </Text>
                </View>
              )}
              <Text style={styles.passengerName}>{passenger.name}</Text>
            </View>

            {/* Individual Fare */}
            <Text style={styles.individualFare}>Rs {passenger.fare}</Text>
          </View>

          {/* Locations */}
          <View style={styles.locationRow}>
            <Ionicons name="radio-button-on" size={18} color="#FF4444" />
            <Text style={styles.locationText}>
              {passenger.pickup || "Unknown Pickup"}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="radio-button-on" size={18} color="#22c55e" />
            <Text style={styles.locationText}>
              {passenger.destination || "Unknown Destination"}
            </Text>
          </View>

          {/* Divider between passengers (except last one) */}
          {index < (item.passengers?.length || 0) - 1 && (
            <View style={styles.passengerDivider} />
          )}
        </View>
      ))}

      {/* Total Fare */}
      <View style={styles.totalFareContainer}>
        <Text style={styles.totalFareLabel}>Total Fare:</Text>
        <Text style={styles.totalFare}>Rs {item.fare}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={[styles.status, statusStyles[item.status] || {}]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0286FF" />
        <Text style={styles.loadingText}>Loading ride history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />

      {/* Header with burger + centered title */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Rides</Text>
        <View style={{ width: 34 }} />
        {/* filler for symmetry so title stays centered */}
      </View>

      {rides.length === 0 ? (
        <Text style={styles.emptyText}>No rides found.</Text>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) =>
            item.type === "shared"
              ? renderSharedRideCard(item)
              : renderSoloRideCard(item)
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <DriverRideDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ride={selectedRide}
      />

      {/* Burger Menu */}
      <BurgerMenu
        isVisible={sidebarVisible}
        onClose={closeSidebar}
        slideAnim={slideAnim}
      />
    </View>
  );
}

const statusStyles: Record<string, any> = {
  pending: { backgroundColor: "#facc15" },
  accepted: { backgroundColor: "#dbadc8ff" },
  started: { backgroundColor: "#3bf683ff" },
  completed: { backgroundColor: "#0286FF" },
  cancelled: { backgroundColor: "#cb0e0eff" },
};

const styles = StyleSheet.create({
  // Layout Containers
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 12,
    marginBottom: 10,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0286FF",
    textAlign: "center",
  },

  // Empty state
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
  },

  // Ride Card
  card: {
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 25,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  date: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fare: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0286FF",
  },

  // Ride Type Tag
  rideTypeTag: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFB347",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharedRideTag: {
    backgroundColor: "#FF6B35",
  },
  rideTypeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },

  // Passenger Section
  passengerSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  smallAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0286FF",
  },
  smallAvatarInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0286FF",
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Locations
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#444",
    flex: 1,
  },

  // Status
  statusContainer: {
    marginTop: 10,
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
    alignSelf: "flex-start",
  },

  // Shared Ride Specific Styles
  individualFare: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  passengerDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 12,
    marginHorizontal: 8,
  },
  totalFareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalFareLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalFare: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0286FF",
  },
});
