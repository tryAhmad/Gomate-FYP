import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  Linking,
  Image,
} from "react-native"
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps"
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute"
import BurgerMenu from "@/components/burger-menu"
import * as Location from "expo-location"

const { width, height } = Dimensions.get("window")

type PickupParams = {
  rideId?: string
  pickup?: string
  destination?: string
  fare?: string
  distance?: string
  passengerName?: string
  profilePhoto?: string
  timeAway?: string
  passengerPhone?: string
}

const PickupPage: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams() as PickupParams
  const mapRef = useRef<MapView>(null)

  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [driverRouteCoords, setDriverRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-width * 0.7))

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  useEffect(() => {
    requestLocationPermission()
    loadRouteData()
  }, [])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        getCurrentLocation()
        const locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 10,
          },
          (location) => {
            setDriverLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            })
          },
        )

        return () => {
          locationSubscription.remove()
        }
      } else {
        Alert.alert("Permission Denied", "Location permission is required to show your current location.")
        setDriverLocation({
          latitude: 31.5304,
          longitude: 74.3487,
        })
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
      setDriverLocation({
        latitude: 31.5304,
        longitude: 74.3487,
      })
    }
  }

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
    } catch (error) {
      console.error("Error getting current location:", error)
    }
  }

  const loadRouteData = async () => {
    try {
      setIsLoading(true)

      if (!params.pickup || !params.destination) {
        Alert.alert("Error", "Pickup or destination missing.")
        return
      }

      const pickupCoords = await getCoordinatesFromAddress(params.pickup)
      const destinationCoords = await getCoordinatesFromAddress(params.destination)

      if (pickupCoords && destinationCoords) {
        setPickupCoord(pickupCoords)
        setDestinationCoord(destinationCoords)

        if (driverLocation) {
          const driverRoute = await getRouteCoordinates(driverLocation, pickupCoords)
          setDriverRouteCoords(driverRoute)
        }

        setTimeout(() => {
          const coordsToFit = driverLocation
            ? [driverLocation, pickupCoords, destinationCoords]
            : [pickupCoords, destinationCoords]

          mapRef.current?.fitToCoordinates(coordsToFit, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          })
        }, 1000)
      } else {
        Alert.alert("Error", "Could not fetch coordinates for the given locations.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load route information.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (driverLocation && pickupCoord) {
      updateDriverRoute()
    }
  }, [driverLocation, pickupCoord])

  const updateDriverRoute = async () => {
    if (driverLocation && pickupCoord) {
      try {
        const driverRoute = await getRouteCoordinates(driverLocation, pickupCoord)
        setDriverRouteCoords(driverRoute)
      } catch (error) {
        console.error("Error updating driver route:", error)
      }
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

  const handleImHere = () => {
    Alert.alert(
      "Passenger Notified",
      "The passenger has been notified that you have arrived at the pickup location.",
      [
        {
          text: "OK",
          onPress: () => {
            console.log("Driver marked as arrived")
          },
        },
      ],
      { cancelable: false },
    )
  }

  const handleCancel = () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride? The passenger will be notified.", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          router.replace("/landing_page")
        },
      },
    ])
  }

  const handleCall = () => {
    if (params.passengerPhone) {
      Linking.openURL(`tel:${params.passengerPhone}`)
    } else {
      Alert.alert("Error", "Passenger phone number not available")
    }
  }

  const handleWhatsApp = async () => {
    if (params.passengerPhone) {
        const phone = params.passengerPhone.replace(/\D/g, ""); 
        const message = `Hi ${params.passengerName || "there"}, I'm your driver and I'm on my way to pick you up.`;

        try {
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        const canOpen = await Linking.canOpenURL(whatsappUrl);

        if (canOpen) {
            await Linking.openURL(whatsappUrl);
        } else {
            // Fallback: open in browser
            const webWhatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            await Linking.openURL(webWhatsappUrl);
        }
        } catch (error) {
        Alert.alert("Error", "Could not open WhatsApp. Please make sure WhatsApp is installed.");
        }
    } else {
        Alert.alert("Error", "Passenger phone number not available");
    }
    };


  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P"

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View style={styles.menuButtonContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

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
          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Your Location"
              description="Driver current location"
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              rotation={0}
            >
              <View style={styles.driverMarker}>
                <Image source={require("@/assets/car-marker.png")} style={styles.carIcon} resizeMode="contain" />
              </View>
            </Marker>
          )}

          {pickupCoord && (
            <Marker
              coordinate={pickupCoord}
              title="Pickup Location"
              description={params.pickup}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons name="map-marker" size={40} color="#FF4444" />
            </Marker>
          )}

          {destinationCoord && (
            <Marker
              coordinate={destinationCoord}
              title="Destination"
              description={params.destination}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons name="map-marker" size={40} color="#4CAF50" />
            </Marker>
          )}

          {driverRouteCoords.length > 0 && (
            <Polyline
              coordinates={driverRouteCoords}
              strokeWidth={5}
              strokeColor="#808080"
              lineCap="round"
              lineJoin="round"
              zIndex={2}
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

      <View style={styles.bottomCard}>
        <View style={styles.passengerRow}>
          {params.profilePhoto ? (
            <Image source={{ uri: params.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{getInitial(params.passengerName)}</Text>
            </View>
          )}
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{params.passengerName || "Passenger"}</Text>
          </View>

          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={22} color="red" />
            <Text style={styles.locationText}>{params.pickup || "Pickup Location"}</Text>
          </View>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={22} color="green" />
            <Text style={styles.locationText}>{params.destination || "Destination"}</Text>
          </View>

          {params.distance && <Text style={styles.distanceText}>Distance: {params.distance}</Text>}
        </View>

        <View style={styles.fareSection}>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Fare</Text>
            <View style={styles.fareAmountContainer}>
              <Text style={styles.currencySymbol}>Rs</Text>
              <Text style={styles.fareAmount}>{params.fare || "250"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.imHereButton} onPress={handleImHere}>
            <Text style={styles.imHereButtonText}>I&apos;m here</Text>
          </TouchableOpacity>
        </View>
      </View>

      <BurgerMenu isVisible={sidebarVisible} onClose={closeSidebar} slideAnim={slideAnim} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  menuButtonContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 1000,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
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
  bottomCard: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: height * 0.6,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#007AFF",
    fontSize: 20,
    fontWeight: "600",
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  contactButtons: {
    flexDirection: "row",
    gap: 16,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
  locationSection: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
    color: "#333",
    marginLeft: 12,
  },
  distanceText: {
    fontSize: 12,
    color: "grey",
    marginLeft: 16,
    marginBottom: 8,
  },
  fareSection: {
    marginBottom: 20,
  },
  fareContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fareAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginRight: 4,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#FF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  imHereButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  imHereButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  driverMarker: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  carIcon: {
    width: 32,
    height: 32,
    tintColor: "#007AFF",
  },
})

export default PickupPage
