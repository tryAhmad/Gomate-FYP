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
import { useAuth } from "@/contexts/AuthContext";

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
  const { driver, authToken } = useAuth();
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
  const locationUpdateIntervalRef = useRef<ReturnType<
    typeof setInterval
  > | null>(null);

  // Use driver ID from auth context
  const driverId = driver?._id || "68908c87f5bd1d56dcc631b8";

  // Load persisted online state and location on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const savedOnlineState = await AsyncStorage.getItem(
          "driverOnlineState"
        );
        const savedLocation = await AsyncStorage.getItem(
          "driverCurrentLocation"
        );
        const savedCoordinates = await AsyncStorage.getItem(
          "driverCoordinates"
        );

        if (savedOnlineState === "true" && savedLocation && savedCoordinates) {
          setIsOnline(true);
          setCurrentLocation(savedLocation);
          setDriverCoordinates(JSON.parse(savedCoordinates));
          setIsLocationLoaded(true);
        }
      } catch (error) {
        console.error("Error loading persisted state:", error);
      }
    };

    loadPersistedState();
  }, []);

  // Load profile from driver context
  useEffect(() => {
    if (driver) {
      const driverProfile: DriverProfile = {
        username: `${driver.fullname.firstname} ${
          driver.fullname.lastname || ""
        }`.trim(),
        email: driver.email,
        phone: driver.phoneNumber || "",
        profilePhoto:
          typeof driver.profilePhoto === "string"
            ? driver.profilePhoto
            : driver.profilePhoto?.url,
        vehicle: {
          company: driver.vehicle?.company || "",
          model: driver.vehicle?.model || "",
          registrationNumber: driver.vehicle?.plate || "",
          color: driver.vehicle?.color || "",
        },
      };
      setProfile(driverProfile);
    }
  }, [driver]);

  // Socket connection effect - runs on app load
  useEffect(() => {
    // Don't connect socket if account is suspended
    if (driver?.accountStatus === "suspended") {
      setIsConnecting(false);
      setIsSocketConnected(false);
      return;
    }

    const socket = getDriverSocket();

    // Check if socket is already connected
    if (socket.connected) {
      setIsConnecting(false);
      setIsSocketConnected(true);
      setConnectionError(null);
    }

    const handleConnect = () => {
      setIsConnecting(false);
      setIsSocketConnected(true);
      setConnectionError(null);

      // Register driver with real-time location
      registerDriverWithLocation();
    };

    const registerDriverWithLocation = async () => {
      try {
        // Get current location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const driverData = {
          driverId: driverId,
          location: [location.coords.longitude, location.coords.latitude], // [lng, lat] format - use real location
          rideType: "car",
        };

        socket.emit("registerDriver", driverData);
      } catch (error) {
        console.error("❌ Error getting location for registration:", error);
        // Fallback to registering without location
        const driverData = {
          driverId: driverId,
          location: [74.42812, 31.576079], // fallback coordinates
          rideType: "car",
        };
        socket.emit("registerDriver", driverData);
      }
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
      setIsSocketConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    };

    const handleNewRideRequest = async (data: any) => {
      try {
        const { ride, passenger } = data;

        // Extract coordinates
        const pickupCoords = extractCoordinates(ride).pickup;
        const dropoffCoords = extractCoordinates(ride).dropoff;

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

        // Calculate distance and time in background
        let distance = "Unknown";
        let timeAway = "Unknown";

        if (driverCoordinates) {
          try {
            // Calculate ride distance (pickup to dropoff)
            const rideDistance = await calculateRideDistance(
              pickupAddress,
              dropoffAddress
            );
            distance = rideDistance.distance;

            // Calculate time to pickup
            const timeToPickup = await calculateTimeToPickup(
              driverCoordinates,
              pickupAddress
            );
            timeAway = timeToPickup.timeAway;

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
        }
      } catch (error) {
        console.error("Error processing new ride request:", error);
      }
    };

    const handleNewSharedRideRequest = async (data: any) => {
      try {
        const { passengers } = data;

        // Arrays to hold all passenger data
        const pickupAddresses: string[] = [];
        const dropoffAddresses: string[] = [];
        const fares: number[] = [];
        const passengerNames: string[] = [];
        const passengerPhones: string[] = [];
        const passengerIds: string[] = [];
        const profilePhotos: string[] = [];

        // Process each passenger
        for (const passenger of passengers) {
          // Extract coordinates
          const pickupCoords = {
            latitude: passenger.pickupLocation.coordinates[1],
            longitude: passenger.pickupLocation.coordinates[0],
          };
          const dropoffCoords = {
            latitude: passenger.dropoffLocation.coordinates[1],
            longitude: passenger.dropoffLocation.coordinates[0],
          };

          // Get addresses
          let pickupAddress = `${pickupCoords.latitude}, ${pickupCoords.longitude}`;
          let dropoffAddress = `${dropoffCoords.latitude}, ${dropoffCoords.longitude}`;

          try {
            const geocodedPickup = await mapsApi.reverseGeocode(
              pickupCoords.latitude,
              pickupCoords.longitude
            );
            if (geocodedPickup) pickupAddress = geocodedPickup;
          } catch (error) {
            console.warn("⚠️ Failed to reverse geocode pickup");
          }

          try {
            const geocodedDropoff = await mapsApi.reverseGeocode(
              dropoffCoords.latitude,
              dropoffCoords.longitude
            );
            if (geocodedDropoff) dropoffAddress = geocodedDropoff;
          } catch (error) {
            console.warn("⚠️ Failed to reverse geocode dropoff");
          }

          pickupAddresses.push(pickupAddress);
          dropoffAddresses.push(dropoffAddress);
          fares.push(passenger.fare);

          // Handle passengerID - could be object or string
          const passengerInfo =
            typeof passenger.passengerID === "object"
              ? passenger.passengerID
              : {
                  username: "Passenger",
                  _id: passenger.passengerID,
                  phoneNumber: "N/A",
                };

          const extractedPhone =
            passengerInfo.phoneNumber || passengerInfo.phone || "N/A";

          passengerNames.push(passengerInfo.username || "Passenger");
          passengerPhones.push(extractedPhone);
          passengerIds.push(passengerInfo._id || passenger.passengerID);
          profilePhotos.push(passengerInfo.profilePicture || "");
        }

        // Create shared ride object
        const initialSharedRide: RideRequest = {
          id: data._id,
          pickup: pickupAddresses,
          destination: dropoffAddresses,
          fare: fares,
          distance: "Calculating...",
          timeAway: "Calculating...",
          passengerName: passengerNames,
          passengerPhone: passengerPhones,
          passengerId: passengerIds,
          profilePhoto: profilePhotos,
          isCalculating: true,
          type: "shared",
        };

        // Add to shared rides list
        setSharedRides((prev) => [...prev, initialSharedRide]);

        // Calculate distance in background
        if (driverCoordinates) {
          try {
            // Calculate to first pickup
            const timeToPickup = await calculateTimeToPickup(
              driverCoordinates,
              pickupAddresses[0]
            );

            // Calculate total ride distance (simplified - could be more complex)
            const rideDistance = await calculateRideDistance(
              pickupAddresses[0],
              dropoffAddresses[dropoffAddresses.length - 1]
            );

            const updatedRide = {
              ...initialSharedRide,
              distance: rideDistance.distance,
              timeAway: timeToPickup.timeAway,
              isCalculating: false,
            };

            setSharedRides((prev) =>
              prev.map((r) => (r.id === initialSharedRide.id ? updatedRide : r))
            );
          } catch (error: any) {
            console.error("❌ Error calculating shared ride details:", error);
            const updatedRide = {
              ...initialSharedRide,
              distance: "Unknown",
              timeAway: "Unknown",
              isCalculating: false,
            };
            setSharedRides((prev) =>
              prev.map((r) => (r.id === initialSharedRide.id ? updatedRide : r))
            );
          }
        }
      } catch (error) {
        console.error("Error processing shared ride request:", error);
      }
    };

    const handleRideCancelled = (data: any) => {
      const { rideId, cancelledBy, reason } = data;

      // Remove the ride from both solo and shared ride lists
      setSoloRides((prev) => {
        const filtered = prev.filter((ride) => ride.id !== rideId);
        return filtered;
      });
      setSharedRides((prev) => {
        const filtered = prev.filter((ride) => ride.id !== rideId);
        return filtered;
      });

      // Show a notification to the driver
      Alert.alert(
        "Ride Cancelled",
        `This ride has been cancelled by the ${cancelledBy}.\n${reason || ""}`,
        [{ text: "OK" }]
      );
    };

    // Remove old listeners
    socket.off("connect", handleConnect);
    socket.off("connect_error", handleConnectError);
    socket.off("disconnect", handleDisconnect);
    socket.off("newRideRequest", handleNewRideRequest);
    socket.off("newSharedRideRequest", handleNewSharedRideRequest);
    socket.off("rideCancelled", handleRideCancelled);

    // Add fresh listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("newRideRequest", handleNewRideRequest);
    socket.on("newSharedRideRequest", handleNewSharedRideRequest);
    socket.on("rideCancelled", handleRideCancelled);

    // Connect the socket
    connectDriverSocket();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("newRideRequest", handleNewRideRequest);
      socket.off("newSharedRideRequest", handleNewSharedRideRequest);
      socket.off("rideCancelled", handleRideCancelled);
    };
  }, []);

  useEffect(() => {
    const getLocation = async () => {
      // Skip if location already loaded from persisted state
      if (isLocationLoaded && driverCoordinates) {
        // Still start periodic updates if online
        if (isOnline) {
          startPeriodicLocationUpdates();
        }
        return;
      }

      try {
        let { status } = await Location.getForegroundPermissionsAsync();

        if (status !== "granted") {
          const { status: newStatus } =
            await Location.requestForegroundPermissionsAsync();
          status = newStatus;
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

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setDriverCoordinates(coords);

        // Save coordinates to AsyncStorage
        await AsyncStorage.setItem("driverCoordinates", JSON.stringify(coords));

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

          // Save location to AsyncStorage
          await AsyncStorage.setItem("driverCurrentLocation", locationString);
        }

        setIsLocationLoaded(true);
        setIsOnline(true);

        // Save online state to AsyncStorage
        await AsyncStorage.setItem("driverOnlineState", "true");

        // Start periodic location updates to backend
        startPeriodicLocationUpdates();
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
        return;
      }

      const calculatingSoloRides = soloRides.filter((r) => r.isCalculating);
      const calculatingSharedRides = sharedRides.filter((r) => r.isCalculating);

      // Update solo rides
      if (calculatingSoloRides.length > 0) {
        const updatedSoloRides = await Promise.all(
          soloRides.map(async (ride) => {
            if (ride.isCalculating) {
              try {
                const rideDistance = await calculateRideDistance(
                  ride.pickup as string,
                  ride.destination as string
                );
                const timeToPickup = await calculateTimeToPickup(
                  driverCoordinates,
                  ride.pickup as string
                );
                return {
                  ...ride,
                  distance: rideDistance.distance,
                  timeAway: timeToPickup.timeAway,
                  isCalculating: false,
                };
              } catch (error: any) {
                console.error(`❌ Error updating ride ${ride.id}:`, error);
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
      }

      // Update shared rides
      if (calculatingSharedRides.length > 0) {
        const updatedSharedRides = await Promise.all(
          sharedRides.map(async (ride) => {
            if (ride.isCalculating) {
              try {
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
      }
    };

    updateRidesWithDistance();
  }, [driverCoordinates, soloRides.length, sharedRides.length]);

  // Periodic location updates to backend (every 30 seconds when online)
  const startPeriodicLocationUpdates = () => {
    // Clear any existing interval
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
    }

    // Send location update every 30 seconds
    locationUpdateIntervalRef.current = setInterval(async () => {
      try {
        // Only send updates if driver is online and socket is connected
        if (!isOnline || !isSocketConnected) {
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const socket = getDriverSocket();
        if (socket && socket.connected && driverId) {
          const locationData = {
            driverId: driverId,
            location: [location.coords.longitude, location.coords.latitude], // [lng, lat] format
          };

          socket.emit("updateDriverLocation", locationData);

          // Update local state
          setDriverCoordinates({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error("❌ Error in periodic location update:", error);
      }
    }, 30000); // 30 seconds
  };

  // Cleanup location updates on unmount
  useEffect(() => {
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  const handleToggleOnline = async () => {
    // Prevent toggle if account is suspended
    if (driver?.accountStatus === "suspended") {
      Alert.alert(
        "Account Suspended",
        "Your account has been suspended. Please clear your dues to reactivate your account.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isLocationLoaded && isSocketConnected) {
      const newOnlineState = !isOnline;
      setIsOnline(newOnlineState);

      // Save online state to AsyncStorage
      try {
        await AsyncStorage.setItem(
          "driverOnlineState",
          newOnlineState.toString()
        );
      } catch (error) {
        console.error("Error saving online state:", error);
      }
    }
  };

  const handleRetryConnection = () => {
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
            profilePhoto: selectedRide.profilePhoto as string,
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
            profilePhoto: JSON.stringify(selectedRide.profilePhoto),
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

  // Show suspended account screen if account is suspended
  if (driver?.accountStatus === "suspended") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <View style={styles.suspendedContainer}>
          <Ionicons name="lock-closed-outline" size={100} color="#FF3B30" />
          <Text style={styles.suspendedTitle}>Account Suspended</Text>
          <Text style={styles.suspendedMessage}>
            Your account has been temporarily suspended due to overdue payments.
          </Text>
          <Text style={styles.suspendedSubmessage}>
            Please clear your dues to reactivate your account and continue
            accepting rides.
          </Text>
          <TouchableOpacity
            style={styles.contactSupportButton}
            onPress={() => router.push("/support")}
          >
            <Ionicons name="help-circle-outline" size={20} color="#fff" />
            <Text style={styles.contactSupportButtonText}>Contact Support</Text>
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

      {/* Temporary Registration Button
      <TouchableOpacity
        style={styles.registrationButton}
        onPress={() => router.push("/driver-registration")}
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" />
        <Text style={styles.registrationButtonText}>Register as Driver</Text>
      </TouchableOpacity> */}

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
  suspendedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f5f5f5",
  },
  suspendedTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF3B30",
    marginTop: 24,
    marginBottom: 16,
  },
  suspendedMessage: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: "500",
  },
  suspendedSubmessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  contactSupportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0286FF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactSupportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registrationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#34C759",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registrationButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default DriverLandingPage;
