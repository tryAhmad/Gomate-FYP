import React, { useState, useEffect } from "react"
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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import BurgerMenu from "@/components/BurgerMenu"
import RideList from "@/components/RideList"
import { 
  calculateRideDistance, 
  calculateTimeToPickup,
  calculateSharedRideDistance,
  calculateTimeToNearestPickup 
} from "@/utils/distanceCalculation"
import { mockSoloRides, mockSharedRides } from "@/utils/mockRides"
// eslint-disable-next-line import/no-unresolved
import { RideRequest } from "@/components/RideCard"

const { width } = Dimensions.get("window")

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

type TabType = "solo" | "shared"

const DriverLandingPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("solo")
  const [soloRides, setSoloRides] = useState<RideRequest[]>([])
  const [sharedRides, setSharedRides] = useState<RideRequest[]>([])
  const [currentLocation, setCurrentLocation] = useState<string>("Getting location...")
  const [driverCoordinates, setDriverCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [slideAnim] = useState(new Animated.Value(-width * 0.7))
  const [isLocationLoaded, setIsLocationLoaded] = useState(false)
  const [profile, setProfile] = useState<DriverProfile | null>(null)

  // Load profile from AsyncStorage
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile")
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile))
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
            color: "White"
          }
        }
        setProfile(defaultProfile)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  // Reload profile when sidebar is opened to get latest photo
  useEffect(() => {
    if (sidebarVisible) {
      loadProfile()
    }
  }, [sidebarVisible])

  useEffect(() => {
    const getLocation = async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync()

        if (status !== "granted") {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync()
          status = newStatus
        }

        if (status !== "granted") {
          setCurrentLocation("Location permission denied")
          setIsLocationLoaded(true)
          return
        }

        const location = await Location.getCurrentPositionAsync({})
        setDriverCoordinates({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })

        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0]
          const locationString = `${address.street || ""} ${address.city || ""}, ${address.region || ""}`.trim()
          setCurrentLocation(locationString || "Unknown location")
        }

        setIsLocationLoaded(true)
        setIsOnline(true)
      } catch (error) {
        setCurrentLocation("Unable to get location")
        setIsLocationLoaded(true)
      }
    }

    getLocation()
  }, [])

  useEffect(() => {
    const calculateRideDetails = async () => {
      if (isOnline && driverCoordinates) {
        console.log("Calculating ride details with driver location:", driverCoordinates)

        // Calculate solo rides
        const soloRidesWithDetails = await Promise.all(
          mockSoloRides.map(async (ride) => {
            try {
              const rideDistance = await calculateRideDistance(
                ride.pickup as string, 
                ride.destination as string
              )
              const timeToPickup = await calculateTimeToPickup(
                driverCoordinates, 
                ride.pickup as string
              )

              return {
                ...ride,
                distance: rideDistance.distance,
                timeAway: timeToPickup.timeAway,
                isCalculating: false,
              } as RideRequest
            } catch (error) {
              console.error(`Error calculating details for solo ride ${ride.id}:`, error)
              return {
                ...ride,
                distance: "1 KM",
                timeAway: "5 min away",
                isCalculating: false,
              } as RideRequest
            }
          })
        )

        // Calculate shared rides with proper distance and time calculations
        const sharedRidesWithDetails = await Promise.all(
          mockSharedRides.map(async (ride) => {
            try {
              const pickups = Array.isArray(ride.pickup) ? ride.pickup : [ride.pickup]
              const destinations = Array.isArray(ride.destination) ? ride.destination : [ride.destination]
              
              // Calculate total optimized route distance
              const rideDistance = await calculateSharedRideDistance(pickups, destinations)
              
              // Calculate time to nearest pickup
              const timeToPickup = await calculateTimeToNearestPickup(driverCoordinates, pickups)

              return {
                ...ride,
                distance: rideDistance.distance,
                timeAway: timeToPickup.timeAway,
                isCalculating: false,
              } as RideRequest
            } catch (error) {
              console.error(`Error calculating details for shared ride ${ride.id}:`, error)
              return {
                ...ride,
                distance: "1 KM",
                timeAway: "5 min away",
                isCalculating: false,
              } as RideRequest
            }
          })
        )

        setSoloRides(soloRidesWithDetails)
        setSharedRides(sharedRidesWithDetails)
      } else if (isOnline && !driverCoordinates) {
        const soloRidesWithLoading = mockSoloRides.map((ride) => ({
          ...ride,
          distance: "Calculating...",
          timeAway: "Calculating...",
          isCalculating: true,
        })) as RideRequest[]

        const sharedRidesWithLoading = mockSharedRides.map((ride) => ({
          ...ride,
          distance: "Calculating...",
          timeAway: "Calculating...",
          isCalculating: true,
        })) as RideRequest[]

        setSoloRides(soloRidesWithLoading)
        setSharedRides(sharedRidesWithLoading)
      } else {
        setSoloRides([])
        setSharedRides([])
      }
    }

    calculateRideDetails()
  }, [isOnline, driverCoordinates])

  const handleToggleOnline = () => {
    if (isLocationLoaded) {
      setIsOnline(!isOnline)
    }
  }

  const openSidebar = () => {
    setSidebarVisible(true)
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false)
    })
  }

  const handleProfileClick = () => {
    router.push('/profile')
  }

  const handleViewRide = (rideId: string) => {
    const allRides = [...soloRides, ...sharedRides]
    const selectedRide = allRides.find((ride) => ride.id === rideId)
    
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
            driverLat: driverCoordinates?.latitude.toString(),
            driverLng: driverCoordinates?.longitude.toString(),
            rideType: "solo",
          },
        })
      } else {
        // For shared rides, you might want to create a different page or handle differently
        /* router.push({
          pathname: "/shared-ride-request",
          params: {
            rideId: selectedRide.id,
            pickup: JSON.stringify(selectedRide.pickup),
            destination: JSON.stringify(selectedRide.destination),
            fare: JSON.stringify(selectedRide.fare),
            distance: selectedRide.distance,
            timeAway: selectedRide.timeAway,
            passengerName: JSON.stringify(selectedRide.passengerName),
            passengerPhone: JSON.stringify(selectedRide.passengerPhone),
            driverLat: driverCoordinates?.latitude.toString(),
            driverLng: driverCoordinates?.longitude.toString(),
            rideType: "shared",
          },
        })*/
      }
    }
  }

  const renderSidebar = () => (
    <BurgerMenu 
      isVisible={sidebarVisible} 
      onClose={closeSidebar} 
      slideAnim={slideAnim} 
      profile={profile}
    />
  )

  const renderOfflineContent = () => (
    <View style={styles.offlineContainer}>
      <Ionicons name="car-outline" size={80} color="#ccc" />
      <Text style={styles.offlineTitle}>You&apos;re Offline</Text>
      <Text style={styles.offlineSubtitle}>
        Turn online to start receiving ride requests
      </Text>
    </View>
  )

  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || "A"

  const currentRides = activeTab === "solo" ? soloRides : sharedRides

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{isOnline ? "Online" : "Offline"}</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={!isLocationLoaded}
            trackColor={{ false: "#767577", true: "#007AFF" }}
            thumbColor={isOnline ? "#ffffff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={handleProfileClick}>
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
          <Text style={[styles.tabText, activeTab === "solo" && styles.activeTabText]}>
            Solo Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "shared" && styles.activeTab]}
          onPress={() => setActiveTab("shared")}
        >
          <Text style={[styles.tabText, activeTab === "shared" && styles.activeTabText]}>
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
  )
}

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
})

export default DriverLandingPage