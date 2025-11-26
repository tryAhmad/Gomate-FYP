import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Animated,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BurgerMenu from "@/components/BurgerMenu";
import RideList from "@/components/RideList";
import {
  calculateRideDistance,
  calculateTimeToPickup,
  calculateSharedRideDistance,
  calculateTimeToNearestPickup,
} from "@/utils/distanceCalculation";
// eslint-disable-next-line import/no-unresolved
import { RideRequest } from "@/components/RideCard";
import { getDriverSocket, connectDriverSocket } from "@/utils/socket";
import {
  convertBackendRideToFrontend,
  extractCoordinates,
} from "@/utils/rideConverter";
import * as mapsApi from "@/utils/mapsApi";

const { width } = Dimensions.get("window");

interface DriverProfile {
  profilePhoto?: string;
  username: string;
  email: string;
  phone: string;
  vehicle: {
    company: string;
    model: string;
    registrationNumber: string;
    color: string;
  };
}

type TabType = "solo" | "shared";

const DriverLandingPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("solo");
  const [soloRides, setSoloRides] = useState<RideRequest[]>([]);
  const [sharedRides, setSharedRides] = useState<RideRequest[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>(
    "Getting location..."
  );
  const [driverCoordinates, setDriverCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [slideAnim] = useState(new Animated.Value(-width * 0.7));
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  // Socket connection states
  const [isConnecting, setIsConnecting] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Driver ID for testing (same as driver.html)
  const driverId = "68908c87f5bd1d56dcc631b8";

  // Load profile from AsyncStorage
  useEffect(() => {
    loadProfile();
  }, []);

  // Socket connection effect - runs on app load
  useEffect(() => {
    const socket = getDriverSocket();

    // Check if socket is already connected
    if (socket.connected) {
      console.log("✅ Socket already connected:", socket.id);
      setIsConnecting(false);
      setIsSocketConnected(true);
      setConnectionError(null);
    }

    const handleConnect = () => {
      console.log("✅ Driver connected:", socket.id);
      setIsConnecting(false);
      setIsSocketConnected(true);
      setConnectionError(null);

      // Register driver immediately after connection (like driver.html)
      const driverData = {
        driverId: driverId,
        location: [74.42812, 31.576079], // [lng, lat] format
        rideType: "car",
      };

      console.log("📡 Emitting driver data:", driverData);
      socket.emit("registerDriver", driverData);

      // Show success alert
      Alert.alert(
        "✅ Connected Successfully",
        "Driver registered and ready to receive ride requests!",
        [{ text: "OK" }]
      );
    };

    const handleConnectError = (error: Error) => {
      console.error("🔴 Connection error:", error.message);
      setIsConnecting(false);
      setIsSocketConnected(false);
      const backendUrl = socket.io.opts.hostname + ":" + socket.io.opts.port;
      setConnectionError(
        `Failed to connect to server.\n\nPossible reasons:\n• Backend server not running\n• Wrong IP address\n• Not on same network\n\nError: ${error.message}`
      );
    };

    const handleDisconnect = (reason: string) => {
      console.log("⚠️ Disconnected:", reason);
      setIsSocketConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    };

    const handleNewRideRequest = async (data: any) => {
      console.log("🚗 New ride request received:", data);

      try {
        const { ride, passenger } = data;

        // Extract coordinates
        const pickupCoords = extractCoordinates(ride).pickup;
        const dropoffCoords = extractCoordinates(ride).dropoff;

        console.log("📍 Pickup coords:", pickupCoords);
        console.log("📍 Dropoff coords:", dropoffCoords);

        // Try to get readable addresses, fallback to coordinates
        let pickupAddress = `${pickupCoords.latitude}, ${pickupCoords.longitude}`;
        let dropoffAddress = `${dropoffCoords.latitude}, ${dropoffCoords.longitude}`;

        try {
          const geocodedPickup = await mapsApi.reverseGeocode(
            pickupCoords.latitude,
            pickupCoords.longitude
          );
          if (geocodedPickup) {
            pickupAddress = geocodedPickup;
            console.log("✅ Pickup address:", pickupAddress);
          }
        } catch (error) {
          console.warn(
            "⚠️ Failed to reverse geocode pickup, using coordinates"
          );
        }

        try {
          const geocodedDropoff = await mapsApi.reverseGeocode(
            dropoffCoords.latitude,
            dropoffCoords.longitude
          );
          if (geocodedDropoff) {
            dropoffAddress = geocodedDropoff;
            console.log("✅ Dropoff address:", dropoffAddress);
          }
        } catch (error) {
          console.warn(
            "⚠️ Failed to reverse geocode dropoff, using coordinates"
          );
        }

        // First, add the ride with "Calculating..." status immediately
        const initialRide = convertBackendRideToFrontend(
          data,
          pickupAddress,
          dropoffAddress,
          "Calculating...",
          "Calculating..."
        );

        // Add ride to appropriate list based on type
        if (initialRide.type === "solo") {
          setSoloRides((prev) => [...prev, initialRide]);
        } else {
          setSharedRides((prev) => [...prev, initialRide]);
        }

        console.log("✅ Ride added to list, now calculating distance...");

        // Calculate distance and time in background
        let distance = "Unknown";
        let timeAway = "Unknown";

        console.log("🔍 Checking driver coordinates availability...");
        console.log("Driver coordinates state:", driverCoordinates);

        if (driverCoordinates) {
          console.log(
            "✅ Driver coordinates available, calculating distances..."
          );
          try {
            // Calculate ride distance (pickup to dropoff)
            const rideDistance = await calculateRideDistance(
              pickupAddress,
              dropoffAddress
            );
            distance = rideDistance.distance;
            console.log("📏 Ride distance:", distance);

            // Calculate time to pickup
            const timeToPickup = await calculateTimeToPickup(
              driverCoordinates,
              pickupAddress
            );
            timeAway = timeToPickup.timeAway;
            console.log("⏱️ Time to pickup:", timeAway);

            // Update the ride with calculated values
            const updatedRide = {
              ...initialRide,
              distance,
              timeAway,
              isCalculating: false,
            };

            // Update the ride in the list
            if (initialRide.type === "solo") {
              setSoloRides((prev) =>
                prev.map((r) => (r.id === initialRide.id ? updatedRide : r))
              );
            } else {
              setSharedRides((prev) =>
                prev.map((r) => (r.id === initialRide.id ? updatedRide : r))
              );
            }

            console.log("✅ Ride updated with distance and time");
          } catch (error: any) {
            console.error("❌ Error calculating ride details:", error);
            console.error("Calculation error details:", {
              message: error.message,
              pickupAddress,
              dropoffAddress,
              driverCoordinates,
            });

            // Update with unknown values
            const updatedRide = {
              ...initialRide,
              distance: "Unknown",
              timeAway: "Unknown",
              isCalculating: false,
            };

            if (initialRide.type === "solo") {
              setSoloRides((prev) =>
                prev.map((r) => (r.id === initialRide.id ? updatedRide : r))
              );
            } else {
              setSharedRides((prev) =>
                prev.map((r) => (r.id === initialRide.id ? updatedRide : r))
              );
            }
          }
        } else {
          console.warn("⚠️ ======================================");
          console.warn("⚠️ DRIVER LOCATION NOT AVAILABLE!");
          console.warn("⚠️ Location state:", driverCoordinates);
          console.warn("⚠️ Location loaded flag:", isLocationLoaded);
          console.warn("⚠️ Current location string:", currentLocation);
          console.warn("⚠️ ======================================");
          console.warn(
            "⚠️ Ride will show 'Calculating...' until location is available"
          );
          console.warn(
            "⚠️ Distance calculation will be triggered automatically when GPS loads"
          );
        }

        // Show notification
        // Alert.alert(
        //   "🚗 New Ride Request",
        //   `New ${ride.rideMode} ride from ${passenger.username}`,
        //   [{ text: "View", onPress: () => setActiveTab(ride.rideMode) }, { text: "Later" }]
        // )
      } catch (error) {
        console.error("Error processing new ride request:", error);
      }
    };

    // Remove old listeners
    socket.off("connect", handleConnect);
    socket.off("connect_error", handleConnectError);
    socket.off("disconnect", handleDisconnect);
    socket.off("newRideRequest", handleNewRideRequest);

    // Add fresh listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("newRideRequest", handleNewRideRequest);

    // Connect the socket
    console.log("🔌 Initiating socket connection...");
    connectDriverSocket();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("newRideRequest", handleNewRideRequest);
    };
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        // Set default profile
        const defaultProfile: DriverProfile = {
          username: "Ahmad",
          email: "ahmad@example.com",
          phone: "+92 300 1234567",
          vehicle: {
            company: "Toyota",
            model: "Corolla",
            registrationNumber: "ABC-123",
            color: "White",
          },
        };
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  // Reload profile when sidebar is opened to get latest photo
  useEffect(() => {
    if (sidebarVisible) {
      loadProfile();
    }
  }, [sidebarVisible]);

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log("📍 Requesting location permissions...");
        let { status } = await Location.getForegroundPermissionsAsync();
        console.log("📍 Current permission status:", status);

        if (status !== "granted") {
          console.log("📍 Requesting location permission...");
          const { status: newStatus } =
            await Location.requestForegroundPermissionsAsync();
          status = newStatus;
          console.log("📍 New permission status:", status);
        }

        if (status !== "granted") {
          console.error("❌ CRITICAL: Location permission denied by user");
          Alert.alert(
            "Location Required",
            "Location permission is required to receive ride requests and calculate distances. Please enable location in settings.",
            [{ text: "OK" }]
          );
          setCurrentLocation("Location permission denied");
          setIsLocationLoaded(true);
          return;
        }

        console.log("📍 Getting current location...");
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        console.log("✅ GPS coordinates obtained successfully:", coords);

        setDriverCoordinates(coords);
        console.log("✅ Driver coordinates STATE UPDATED:", coords);

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const locationString = `${address.street || ""} ${
            address.city || ""
          }, ${address.region || ""}`.trim();
          setCurrentLocation(locationString || "Unknown location");
          console.log("✅ Driver location address set:", locationString);
        }

        setIsLocationLoaded(true);
        setIsOnline(true);
        console.log("✅ Location loading complete - ready for ride requests!");
      } catch (error: any) {
        console.error("❌ CRITICAL ERROR getting location:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });

        Alert.alert(
          "Location Error",
          `Failed to get your location: ${error.message}\n\nPlease ensure GPS is enabled and try restarting the app.`,
          [{ text: "OK" }]
        );

        setCurrentLocation("Unable to get location");
        setIsLocationLoaded(true);
      }
    };

    getLocation();
  }, []);

  // No mock ride loading - rides will come from real-time WebSocket events
  // Initialize empty ride lists
  useEffect(() => {
    if (!isOnline) {
      setSoloRides([]);
      setSharedRides([]);
    }
  }, [isOnline]);

  // Recalculate distances when driver location becomes available OR when rides with "Calculating..." are added
  useEffect(() => {
    const updateRidesWithDistance = async () => {
      if (!driverCoordinates) {
        console.log(
          "⏳ Driver location not yet available for distance calculation"
        );
        console.log("   Waiting for GPS to load...");
        return;
      }

      const calculatingSoloRides = soloRides.filter((r) => r.isCalculating);
      const calculatingSharedRides = sharedRides.filter((r) => r.isCalculating);

      console.log("📍 Driver location available!", driverCoordinates);
      console.log(
        "📊 Solo rides needing calculation:",
        calculatingSoloRides.length
      );
      console.log(
        "📊 Shared rides needing calculation:",
        calculatingSharedRides.length
      );

      // Update solo rides
      if (calculatingSoloRides.length > 0) {
        console.log("🔄 Updating solo rides with distance...");
        const updatedSoloRides = await Promise.all(
          soloRides.map(async (ride) => {
            if (ride.isCalculating) {
              try {
                console.log(`🔄 Calculating for ride ${ride.id}...`);
                const rideDistance = await calculateRideDistance(
                  ride.pickup as string,
                  ride.destination as string
                );
                const timeToPickup = await calculateTimeToPickup(
                  driverCoordinates,
                  ride.pickup as string
                );
                console.log(
                  `✅ Updated ride ${ride.id}: ${rideDistance.distance}, ${timeToPickup.timeAway}`
                );
                return {
                  ...ride,
                  distance: rideDistance.distance,
                  timeAway: timeToPickup.timeAway,
                  isCalculating: false,
                };
              } catch (error: any) {
                console.error(`❌ Error updating ride ${ride.id}:`, error);
                console.error("Error details:", error.message);
                return {
                  ...ride,
                  distance: "Unknown",
                  timeAway: "Unknown",
                  isCalculating: false,
                };
              }
            }
            return ride;
          })
        );
        setSoloRides(updatedSoloRides);
        console.log("✅ All solo rides updated!");
      }

      // Update shared rides
      if (calculatingSharedRides.length > 0) {
        console.log("🔄 Updating shared rides with distance...");
        const updatedSharedRides = await Promise.all(
          sharedRides.map(async (ride) => {
            if (ride.isCalculating) {
              try {
                console.log(`🔄 Calculating for shared ride ${ride.id}...`);
                // For shared rides, calculate to first pickup
                const pickups = Array.isArray(ride.pickup)
                  ? ride.pickup
                  : [ride.pickup];
                const destinations = Array.isArray(ride.destination)
                  ? ride.destination
                  : [ride.destination];

                const rideDistance = await calculateSharedRideDistance(
                  pickups,
                  destinations
                );
                const timeToPickup = await calculateTimeToNearestPickup(
                  driverCoordinates,
                  pickups
                );

                console.log(
                  `✅ Updated shared ride ${ride.id}: ${rideDistance.distance}, ${timeToPickup.timeAway}`
                );

                return {
                  ...ride,
                  distance: rideDistance.distance,
                  timeAway: timeToPickup.timeAway,
                  isCalculating: false,
                };
              } catch (error: any) {
                console.error(
                  `❌ Error updating shared ride ${ride.id}:`,
                  error
                );
                console.error("Error details:", error.message);
                return {
                  ...ride,
                  distance: "Unknown",
                  timeAway: "Unknown",
                  isCalculating: false,
                };
              }
            }
            return ride;
          })
        );
        setSharedRides(updatedSharedRides);
        console.log("✅ All shared rides updated!");
      }
    };

    updateRidesWithDistance();
  }, [driverCoordinates, soloRides.length, sharedRides.length]);

  const handleToggleOnline = () => {
    if (isLocationLoaded && isSocketConnected) {
      setIsOnline(!isOnline);
    } else if (!isSocketConnected) {
      Alert.alert(
        "Not Connected",
        "Please wait for socket connection before going online.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRetryConnection = () => {
    console.log("🔄 Retrying connection...");
    setConnectionError(null);
    setIsConnecting(true);
    connectDriverSocket();
  };

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

  const handleProfileClick = () => {
    router.push("/profile");
  };

  const handleViewRide = (rideId: string) => {
    const allRides = [...soloRides, ...sharedRides];
    const selectedRide = allRides.find((ride) => ride.id === rideId);

    if (selectedRide) {
      // Navigate based on ride type
      if (selectedRide.type === "solo") {
        router.push({
          pathname: "/ride-request",
          params: {
            rideId: selectedRide.id,
            pickup: selectedRide.pickup as string,
            destination: selectedRide.destination as string,
            fare: selectedRide.fare.toString(),
            distance: selectedRide.distance,
            timeAway: selectedRide.timeAway,
            passengerName: selectedRide.passengerName as string,
            passengerPhone: selectedRide.passengerPhone as string,
            passengerId: selectedRide.passengerId as string,
            driverLat: driverCoordinates?.latitude.toString(),
            driverLng: driverCoordinates?.longitude.toString(),
            rideType: "solo",
          },
        });
      } else {
        // For shared ride
        router.push({
          pathname: "/ride-request" as any,
          params: {
            rideId: selectedRide.id,
            pickup: JSON.stringify(selectedRide.pickup),
            destination: JSON.stringify(selectedRide.destination),
            fare: JSON.stringify(selectedRide.fare),
            distance: selectedRide.distance,
            timeAway: selectedRide.timeAway,
            passengerName: JSON.stringify(selectedRide.passengerName),
            passengerPhone: JSON.stringify(selectedRide.passengerPhone),
            passengerId: JSON.stringify(selectedRide.passengerId),
            driverLat: driverCoordinates?.latitude.toString(),
            driverLng: driverCoordinates?.longitude.toString(),
            rideType: "shared",
          },
        });
      }
    }
  };

  const renderSidebar = () => (
    <BurgerMenu
      isVisible={sidebarVisible}
      onClose={closeSidebar}
      slideAnim={slideAnim}
    />
  );

  const renderOfflineContent = () => (
    <View style={styles.offlineContainer}>
      <Ionicons name="car-outline" size={80} color="#ccc" />
      <Text style={styles.offlineTitle}>You&apos;re Offline</Text>
      <Text style={styles.offlineSubtitle}>
        Turn online to start receiving ride requests
      </Text>
    </View>
  );

  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || "A";

  const currentRides = activeTab === "solo" ? soloRides : sharedRides;

  // Show loading screen while connecting
  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0286FF" />
          <Text style={styles.loadingText}>Connecting to server...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error screen if connection failed
  if (connectionError) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF3B30" />
          <Text style={styles.errorTitle}>Connection Failed</Text>
          <Text style={styles.errorMessage}>{connectionError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryConnection}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <View>
            <Text style={styles.statusText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
            {!isLocationLoaded && (
              <Text style={styles.statusSubtext}>Loading GPS...</Text>
            )}
            {isLocationLoaded && !driverCoordinates && (
              <Text style={[styles.statusSubtext, { color: "#FF3B30" }]}>
                No GPS
              </Text>
            )}
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={!isLocationLoaded}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={isOnline ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={handleProfileClick}
        >
          {profile?.profilePhoto ? (
            <Image
              source={{ uri: profile.profilePhoto }}
              style={styles.headerProfileImage}
              onError={(e) => {
                console.log("Image load error:", e.nativeEvent.error);
                // Fallback to initial if image fails to load
              }}
            />
          ) : (
            <View style={styles.headerProfileImage}>
              <Text style={styles.headerProfileInitial}>
                {getInitial(profile?.username || "Driver")}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs with proper spacing */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "solo" && styles.activeTab]}
          onPress={() => setActiveTab("solo")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "solo" && styles.activeTabText,
            ]}
          >
            Solo Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "shared" && styles.activeTab]}
          onPress={() => setActiveTab("shared")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "shared" && styles.activeTabText,
            ]}
          >
            Shared Rides
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {isOnline ? (
          <RideList
            rides={currentRides}
            onViewRide={handleViewRide}
            currentLocation={currentLocation}
          />
        ) : (
          renderOfflineContent()
        )}
      </View>

      {renderSidebar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusSubtext: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
    borderRadius: 20,
  },
  headerProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 24,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerProfileInitial: {
    color: "#0286FF",
    fontWeight: "600",
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#0286FF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#0286FF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  offlineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 16,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0286FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DriverLandingPage;
