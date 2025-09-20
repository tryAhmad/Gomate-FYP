import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Animated,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { router } from "expo-router"
import BurgerMenu from "@/components/burger-menu"
import { calculateRideDistance, calculateTimeToPickup } from "@/utils/distanceCalculation"

const { width } = Dimensions.get("window")

interface RideRequest {
  id: string
  pickup: string
  destination: string
  fare: number
  distance: string
  timeAway: string
  passengerName: string
  passengerPhone: string
  isCalculating?: boolean
}

const mockRides: Omit<RideRequest, "distance" | "timeAway">[] = [
  {
    id: "1",
    pickup: "Garhi Shahu, Lahore",
    destination: "Faiz Road 12 (Muslim Town)",
    fare: 250,
    passengerName: "Adil",
    passengerPhone: "923164037719",
  },
  {
    id: "2",
    pickup: "Eden Villas",
    destination: "Roundabout, Block M 1 Lake City, Lahore",
    fare: 540,
    passengerName: "Ahmad",
    passengerPhone: "923164037719",
  },
  {
    id: "3",
    pickup: "Wapda Town",
    destination: "G1, Johar Town",
    fare: 400,
    passengerName: "Ali",
    passengerPhone: "923164037719",
  },
  {
    id: "4",
    pickup: "Nargis Block, Allama Iqbal Town",
    destination: "Kareem Block",
    fare: 750,
    passengerName: "Umer",
    passengerPhone: "923164037719",
  },
  {
    id: "5",
    pickup: "Nargis Block, Allama Iqbal Town",
    destination: "Overseas Enclave Sector B Bahria Town, Lahore",
    fare: 1120,
    passengerName: "Adil",
    passengerPhone: "923164037719",
  },
]

const DriverLandingPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([])
  const [currentLocation, setCurrentLocation] = useState<string>("Getting location...")
  const [driverCoordinates, setDriverCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [slideAnim] = useState(new Animated.Value(-width * 0.7))
  const [isLocationLoaded, setIsLocationLoaded] = useState(false)

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

        const ridesWithDetails = await Promise.all(
          mockRides.map(async (ride) => {
            try {
              const rideDistance = await calculateRideDistance(ride.pickup, ride.destination)
              const timeToPickup = await calculateTimeToPickup(driverCoordinates, ride.pickup)

              return {
                ...ride,
                distance: rideDistance.distance,
                timeAway: timeToPickup.timeAway,
                isCalculating: false,
              } as RideRequest
            } catch (error) {
              console.error(`Error calculating details for ride ${ride.id}:`, error)
              return {
                ...ride,
                distance: "1 KM",
                timeAway: "5 min away",
                isCalculating: false,
              } as RideRequest
            }
          }),
        )

        setAvailableRides(ridesWithDetails)
      } else if (isOnline && !driverCoordinates) {
        const ridesWithLoading = mockRides.map((ride) => ({
          ...ride,
          distance: "Calculating...",
          timeAway: "Calculating...",
          isCalculating: true,
        })) as RideRequest[]

        setAvailableRides(ridesWithLoading)
      } else {
        setAvailableRides([])
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
    console.log("Opening profile...")
    // router.push('/profile'); // TODO
  }

  const handleViewRide = (rideId: string) => {
    const selectedRide = availableRides.find((ride) => ride.id === rideId)
    if (selectedRide) {
      router.push({
        pathname: "/ride-request",
        params: {
          rideId: selectedRide.id,
          pickup: selectedRide.pickup,
          destination: selectedRide.destination,
          fare: selectedRide.fare.toString(),
          distance: selectedRide.distance,
          timeAway: selectedRide.timeAway,
          passengerName: selectedRide.passengerName,
          passengerPhone: selectedRide.passengerPhone,
          driverLat: driverCoordinates?.latitude.toString(),
          driverLng: driverCoordinates?.longitude.toString(),
        },
      })
    }
  }

  const renderSidebar = () => <BurgerMenu isVisible={sidebarVisible} onClose={closeSidebar} slideAnim={slideAnim} />

  const renderRideCard = (ride: RideRequest) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.passengerInfo}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerInitial}>{ride.passengerName.charAt(0)}</Text>
          </View>
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{ride.passengerName}</Text>
            <Text style={styles.rideDistance}>{ride.distance}</Text>
            <Text style={styles.timeAway}>{ride.timeAway}</Text>
          </View>
        </View>
        <Text style={styles.fareAmount}>PKR {ride.fare}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.dotLineContainer}>
            <View style={styles.greenDot} />
            <View style={styles.verticalLine} />
          </View>
          <Text style={styles.locationText}>{ride.pickup}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={styles.dotLineContainer}>
            <View style={styles.redDot} />
          </View>
          <Text style={styles.locationText}>{ride.destination}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.viewRideButton, ride.isCalculating && styles.viewRideButtonDisabled]}
        onPress={() => handleViewRide(ride.id)}
        disabled={ride.isCalculating}
      >
        <Text style={styles.viewRideText}>{ride.isCalculating ? "Calculating..." : "View Ride"}</Text>
      </TouchableOpacity>
    </View>
  )

  const renderOfflineContent = () => (
    <View style={styles.offlineContainer}>
      <Ionicons name="car-outline" size={80} color="#ccc" />
      <Text style={styles.offlineTitle}>You&apos;re Offline</Text>
      <Text style={styles.offlineSubtitle}>Turn online to start receiving ride requests</Text>
    </View>
  )

  const renderNoRidesContent = () => (
    <View style={styles.noRidesContainer}>
      <Ionicons name="car-outline" size={60} color="#ccc" />
      <Text style={styles.noRidesText}>No rides available</Text>
      <Text style={styles.noRidesSubtext}>Stay online and we&apos;ll notify you when rides are available</Text>
    </View>
  )

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
          <View style={styles.headerProfileImage}>
            <Text style={styles.headerProfileInitial}>A</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isOnline ? (
          <>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>Available Rides</Text>
              <View style={styles.currentLocationContainer}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.currentLocationText} numberOfLines={1}>
                  {currentLocation}
                </Text>
              </View>
            </View>
            <View style={styles.spacer} />
            {availableRides.length > 0 ? availableRides.map(renderRideCard) : renderNoRidesContent()}
          </>
        ) : (
          renderOfflineContent()
        )}
      </ScrollView>

      {renderSidebar()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  currentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "45%",
  },
  currentLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    textAlign: "right",
  },
  spacer: {
    height: 16,
  },
  rideCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  passengerInitial: {
    fontWeight: "600",
    fontSize: 16,
    color: "#0286FF",
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  rideDistance: {
    fontSize: 12,
    color: "#666",
  },
  timeAway: {
    fontSize: 12,
    color: "#666",
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dotLineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F44336",
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: "#ccc",
    marginTop: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginTop: -2,
  },
  viewRideButton: {
    backgroundColor: "#0286FF",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
  },
  viewRideButtonDisabled: {
    backgroundColor: "#ccc",
  },
  viewRideText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
  noRidesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noRidesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  noRidesSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
})

export default DriverLandingPage
