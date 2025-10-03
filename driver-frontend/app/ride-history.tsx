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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DriverRideDetailModal from "@/components/DriverRideDetailModal";
import BurgerMenu from "@/components/BurgerMenu";

const { width } = Dimensions.get("window");

interface Ride {
  _id: string;
  pickupLocation: { address: string };
  dropoffLocation: { address: string };
  fare: number;
  passengerName: string;
  profilePhoto?: string;
  createdAt: string;
  status: string;
}

export default function DriverRideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    const loadRides = async () => {
      try {
        const cached = await AsyncStorage.getItem("driverRideHistory");
        if (cached) {
          setRides(JSON.parse(cached));
        }
      } catch (err) {
        console.log("Error loading driver rides:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRides();
  }, []);

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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                setSelectedRide(item);
                setModalVisible(true);
              }}
            >
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
          )}
        />
      )}

      <DriverRideDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ride={selectedRide}
      />

      {/* Burger Menu */}
      <BurgerMenu isVisible={sidebarVisible} onClose={closeSidebar} slideAnim={slideAnim} />
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
    paddingHorizontal: 16 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#fff" 
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
    borderRadius: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#0286FF", 
    textAlign: "center" 
  },

  // Empty state
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: "#333" 
  },
  emptyText: { 
    textAlign: "center", 
    fontSize: 16, 
    color: "gray" 
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
    marginBottom: 8 
  },
  rowBetween: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 8 
  },
  fare: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#0286FF" 
  },

  // Passenger Section
  passengerSection: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
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
  avatarInitial: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#0286FF" 
  },
  passengerName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },

  // Locations
  locationRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginTop: 2 
  },
  locationText: { 
    marginLeft: 6, 
    fontSize: 14, 
    color: "#444" 
  },

  // Status
  statusContainer: { 
    marginTop: 10 
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
});
