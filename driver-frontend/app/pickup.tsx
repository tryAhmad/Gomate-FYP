"use client"

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
import { calculateDistanceAndTime } from "@/utils/distanceCalculation"
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
  driverLat?: string
  driverLng?: string
}

const PickupPage: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams() as PickupParams
  const mapRef = useRef<MapView>(null)

  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [driverRouteCoords, setDriverRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [remainingRouteCoords, setRemainingRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-width * 0.7))
  const [hasArrived, setHasArrived] = useState(false)
  const [rideStarted, setRideStarted] = useState(false)

  const [isOffRoute, setIsOffRoute] = useState(false)
  const [alternateRouteCoords, setAlternateRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [lastRouteCheckLocation, setLastRouteCheckLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  )
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null)
  const [carRotation, setCarRotation] = useState(0)

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  const LOCATION_UPDATE_INTERVAL = 5000 // 5 seconds
  const ROUTE_DEVIATION_THRESHOLD = 100 // meters - distance from route to consider off-route
  const ROUTE_CONSUMPTION_THRESHOLD = 50 // meters - how close to consume route segments
  const MAP_FOLLOW_ZOOM_LEVEL = 0.01 // zoom level for following driver

  useEffect(() => {
    console.log("[TRACKING] Component mounted, initializing...")
    if (params.driverLat && params.driverLng) {
      const initialLocation = {
        latitude: Number.parseFloat(params.driverLat),
        longitude: Number.parseFloat(params.driverLng),
      }
      setDriverLocation(initialLocation)
      console.log("[TRACKING] Initial driver location set:", initialLocation)
      startRealTimeTracking()
    } else {
      requestLocationPermission()
    }
    loadRouteData()

    // Cleanup on unmount
    return () => {
      console.log("[TRACKING] Component unmounting, cleaning up location subscription")
      if (locationSubscription) {
        locationSubscription.remove()
      }
    }
  }, [])

  const startRealTimeTracking = async () => {
    try {
      console.log("[TRACKING] Starting real-time tracking...")
      const { status } = await Location.getForegroundPermissionsAsync()

      if (status === "granted") {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_UPDATE_INTERVAL, // 5 seconds
            distanceInterval: 10, // 10 meters minimum movement
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }

            console.log("[TRACKING] Location updated:", newLocation)
            console.log("[TRACKING] Speed:", location.coords.speed, "m/s")
            console.log("[TRACKING] Heading:", location.coords.heading, "degrees")

            // Feature 1: Update car icon position
            setDriverLocation(newLocation)

            // Update car rotation based on heading
            if (location.coords.heading !== null && location.coords.heading !== undefined) {
              setCarRotation(location.coords.heading)
              console.log("[TRACKING] Car rotation updated:", location.coords.heading)
            }

            // Feature 3: Focus map on driver's location
            focusMapOnDriver(newLocation)

            // Feature 2: Dynamic route consumption
            if (!hasArrived || rideStarted) {
              consumeRouteSegments(newLocation)
            }

            // Feature 4: Check for route deviation and alternate routes
            checkRouteDeviation(newLocation)
          },
        )

        setLocationSubscription(subscription)
        console.log("[TRACKING] Real-time tracking started successfully")
      } else {
        console.error("[TRACKING] Location permission not granted")
      }
    } catch (error) {
      console.error("[TRACKING] Error starting real-time tracking:", error)
    }
  }

  const focusMapOnDriver = (location: { latitude: number; longitude: number }) => {
    console.log("[MAP_FOCUS] Focusing map on driver location:", location)

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: MAP_FOLLOW_ZOOM_LEVEL,
          longitudeDelta: MAP_FOLLOW_ZOOM_LEVEL,
        },
        1000,
      ) // 1 second animation
    }
  }

  const checkRouteDeviation = async (currentLocation: { latitude: number; longitude: number }) => {
    try {
      const currentRoute = rideStarted ? routeCoords : remainingRouteCoords
      const targetDestination = rideStarted ? destinationCoord : pickupCoord

      if (currentRoute.length === 0 || !targetDestination) {
        return
      }

      let minDistance = Number.MAX_VALUE
      let closestPointIndex = 0

      for (let i = 0; i < currentRoute.length; i++) {
        try {
          // Calculate distance from current location to each route point using Google Maps API
          const routePointResult = await calculateDistanceAndTime(
            "", // origin address not needed
            "", // destination address not needed
            currentLocation, // use current location as origin
          )

          // Use the distance value from Google Maps API
          const distance = routePointResult.distanceValue

          if (distance < minDistance) {
            minDistance = distance
            closestPointIndex = i
          }
        } catch (error) {
          console.error(`[ROUTE_DEVIATION] Error calculating distance to route point ${i}:`, error)
          // Skip this point if calculation fails
          continue
        }
      }

      console.log("[ROUTE_DEVIATION] Distance to closest route point:", minDistance, "meters")
      console.log("[ROUTE_DEVIATION] Closest point index:", closestPointIndex)

      // Check if driver is off route
      if (minDistance > ROUTE_DEVIATION_THRESHOLD) {
        console.log("[ROUTE_DEVIATION] Driver is off route! Distance:", minDistance)

        if (!isOffRoute) {
          setIsOffRoute(true)

          // Show popup warning
          Alert.alert(
            "Route Deviation",
            "You must follow the route marked on the map. Calculating alternate route...",
            [{ text: "OK" }],
            { cancelable: false },
          )

          // Calculate alternate route from current location to destination
          await calculateAlternateRoute(currentLocation, targetDestination)
        }
      } else {
        // Driver is back on route
        if (isOffRoute) {
          console.log("[ROUTE_DEVIATION] Driver is back on route")
          setIsOffRoute(false)
          setAlternateRouteCoords([])
        }
      }
    } catch (error) {
      console.error("[ROUTE_DEVIATION] Error checking route deviation:", error)
    }
  }

  const calculateAlternateRoute = async (
    currentLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) => {
    try {
      console.log("[ALTERNATE_ROUTE] Calculating alternate route from:", currentLocation, "to:", destination)

      const alternateRoute = await getRouteCoordinates(currentLocation, destination)
      setAlternateRouteCoords(alternateRoute)

      console.log("[ALTERNATE_ROUTE] Alternate route calculated with", alternateRoute.length, "points")

      // Update the remaining route to the alternate route
      if (rideStarted) {
        setRouteCoords(alternateRoute)
      } else {
        setRemainingRouteCoords(alternateRoute)
        setDriverRouteCoords(alternateRoute)
      }
    } catch (error) {
      console.error("[ALTERNATE_ROUTE] Error calculating alternate route:", error)
    }
  }

  const requestLocationPermission = async () => {
    try {
      console.log("[PERMISSION] Requesting location permission...")
      let { status } = await Location.getForegroundPermissionsAsync()

      if (status !== "granted") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync()
        status = newStatus
      }

      if (status === "granted") {
        console.log("[PERMISSION] Location permission granted")
        getCurrentLocation()
        startRealTimeTracking()
      } else {
        console.log("[PERMISSION] Location permission denied")
        Alert.alert("Permission Denied", "Location permission is required to show your current location.")
        setDriverLocation({
          latitude: 31.5304,
          longitude: 74.3487,
        })
      }
    } catch (error) {
      console.error("[PERMISSION] Error requesting location permission:", error)
      setDriverLocation({
        latitude: 31.5304,
        longitude: 74.3487,
      })
    }
  }

  const getCurrentLocation = async () => {
    try {
      console.log("[LOCATION] Getting current location...")
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      setDriverLocation(currentLocation)
      console.log("[LOCATION] Current location obtained:", currentLocation)
    } catch (error) {
      console.error("[LOCATION] Error getting current location:", error)
    }
  }

  const loadRouteData = async () => {
    try {
      console.log("[ROUTE_LOAD] Loading route data...")
      setIsLoading(true)

      if (!params.pickup || !params.destination) {
        Alert.alert("Error", "Pickup or destination missing.")
        return
      }

      console.log("[ROUTE_LOAD] Pickup:", params.pickup)
      console.log("[ROUTE_LOAD] Destination:", params.destination)

      const pickupCoords = await getCoordinatesFromAddress(params.pickup)
      const destinationCoords = await getCoordinatesFromAddress(params.destination)

      if (pickupCoords && destinationCoords) {
        setPickupCoord(pickupCoords)
        setDestinationCoord(destinationCoords)
        console.log("[ROUTE_LOAD] Pickup coordinates:", pickupCoords)
        console.log("[ROUTE_LOAD] Destination coordinates:", destinationCoords)

        if (driverLocation) {
          console.log("[ROUTE_LOAD] Calculating driver to pickup route...")
          const driverRoute = await getRouteCoordinates(driverLocation, pickupCoords)
          setDriverRouteCoords(driverRoute)
          setRemainingRouteCoords(driverRoute)
          console.log("[ROUTE_LOAD] Driver route calculated with", driverRoute.length, "points")
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
      console.error("[ROUTE_LOAD] Error loading route data:", error)
      Alert.alert("Error", "Failed to load route information.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (driverLocation && pickupCoord && !hasArrived) {
      updateDriverRoute()
    }
  }, [driverLocation, pickupCoord])

  const updateDriverRoute = async () => {
    if (driverLocation && pickupCoord && !hasArrived) {
      try {
        console.log("[ROUTE_UPDATE] Updating driver route...")
        const driverRoute = await getRouteCoordinates(driverLocation, pickupCoord)
        setDriverRouteCoords(driverRoute)
        setRemainingRouteCoords(driverRoute)
        console.log("[ROUTE_UPDATE] Driver route updated with", driverRoute.length, "points")
      } catch (error) {
        console.error("[ROUTE_UPDATE] Error updating driver route:", error)
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

  const handleImHere = async () => {
    console.log("[RIDE_STATE] Driver marked as arrived")
    setHasArrived(true)

    Alert.alert(
      "Passenger Notified",
      "The passenger has been notified that you have arrived at the pickup location.",
      [{ text: "OK" }],
      { cancelable: false },
    )

    // Handle route updates
    if (pickupCoord && destinationCoord) {
      try {
        console.log("[RIDE_STATE] Loading pickup to destination route...")
        // Get route coordinates from pickup to destination
        const pickupToDestinationRoute = await getRouteCoordinates(pickupCoord, destinationCoord)
        setRouteCoords(pickupToDestinationRoute)

        // Move car marker to pickup location
        setDriverLocation(pickupCoord)

        setDriverRouteCoords([])
        setRemainingRouteCoords([])

        // Fit map to show pickup to destination route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates([pickupCoord, destinationCoord], {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          })
        }, 500)

        console.log("[RIDE_STATE] Pickup to destination route loaded with", pickupToDestinationRoute.length, "points")
      } catch (error) {
        console.error("[RIDE_STATE] Error loading pickup to destination route:", error)
      }
    }
  }

  const handleStartRide = () => {
    console.log("[RIDE_STATE] Setting ride started to true")
    setRideStarted(true)

    Alert.alert("Ride Started", "Navigate to the destination location.", [{ text: "OK" }])
  }

  const handleEndRide = () => {
    Alert.alert("End Ride", "Are you sure you want to end this ride?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "End Ride",
        style: "destructive",
        onPress: () => {
          console.log("[RIDE_STATE] Ride ended, cleaning up...")
          // Cleanup location subscription
          if (locationSubscription) {
            locationSubscription.remove()
          }
          router.replace("/" as any)
        },
      },
    ])
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
          console.log("[RIDE_STATE] Ride cancelled, cleaning up...")
          // Cleanup location subscription
          if (locationSubscription) {
            locationSubscription.remove()
          }
          router.replace("/landing-page" as any)
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
      const phone = params.passengerPhone.replace(/\D/g, "")
      const message = `Hi ${params.passengerName || "there"}, I'm your driver and I'm on my way to pick you up.`

      try {
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
        const canOpen = await Linking.canOpenURL(whatsappUrl)

        if (canOpen) {
          await Linking.openURL(whatsappUrl)
        } else {
          // Fallback: open in browser
          const webWhatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
          await Linking.openURL(webWhatsappUrl)
        }
      } catch (error) {
        Alert.alert("Error", "Could not open WhatsApp. Please make sure WhatsApp is installed.")
      }
    } else {
      Alert.alert("Error", "Passenger phone number not available")
    }
  }

  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P"

  const consumeRouteSegments = async (currentLocation: { latitude: number; longitude: number }) => {
    const currentRoute = rideStarted ? routeCoords : remainingRouteCoords
    const targetDestination = rideStarted ? destinationCoord : pickupCoord

    if (currentRoute.length === 0 || !targetDestination) {
      console.log("[ROUTE_CONSUMPTION] No route or destination available")
      return
    }

    console.log("[ROUTE_CONSUMPTION] Current route has", currentRoute.length, "points")
    console.log("[ROUTE_CONSUMPTION] Driver location:", currentLocation)

    try {
      const distanceResult = await calculateDistanceAndTime(
        "", // origin address not needed since we're using driver location
        rideStarted ? params.destination || "" : params.pickup || "",
        currentLocation,
      )

      console.log("[ROUTE_CONSUMPTION] Distance to target:", distanceResult.distanceValue, "meters")
      console.log("[ROUTE_CONSUMPTION] Time to target:", distanceResult.timeAway)

      // Enhanced consumption logic
      if (distanceResult.distanceValue <= ROUTE_CONSUMPTION_THRESHOLD) {
        // Very close to destination - consume more aggressively
        const segmentsToRemove = Math.min(8, currentRoute.length)
        console.log("[ROUTE_CONSUMPTION] Very close! Consuming", segmentsToRemove, "segments")

        const newRemainingCoords = currentRoute.slice(segmentsToRemove)

        if (rideStarted) {
          setRouteCoords(newRemainingCoords)
        } else {
          setRemainingRouteCoords(newRemainingCoords)
          setDriverRouteCoords(newRemainingCoords)
        }
      } else {
        // Progressive consumption based on distance and speed
        let consumptionRate = Math.max(1, Math.floor(currentRoute.length / 25))

        // Increase consumption rate when closer
        if (distanceResult.distanceValue < 500) {
          consumptionRate *= 3
        } else if (distanceResult.distanceValue < 1000) {
          consumptionRate *= 2
        }

        console.log("[ROUTE_CONSUMPTION] Consuming", consumptionRate, "segments")

        if (currentRoute.length > consumptionRate) {
          const newRemainingCoords = currentRoute.slice(consumptionRate)

          if (rideStarted) {
            setRouteCoords(newRemainingCoords)
          } else {
            setRemainingRouteCoords(newRemainingCoords)
            setDriverRouteCoords(newRemainingCoords)
          }

          console.log("[ROUTE_CONSUMPTION] Route consumed, remaining points:", newRemainingCoords.length)
        }
      }
    } catch (error) {
      console.error("[ROUTE_CONSUMPTION] Error in route consumption:", error)
      // Fallback consumption
      if (currentRoute.length > 1) {
        const newRemainingCoords = currentRoute.slice(1)
        if (rideStarted) {
          setRouteCoords(newRemainingCoords)
        } else {
          setRemainingRouteCoords(newRemainingCoords)
          setDriverRouteCoords(newRemainingCoords)
        }
        console.log("[ROUTE_CONSUMPTION] Fallback consumption applied")
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View style={styles.menuButtonContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {isOffRoute && (
        <View style={styles.deviationWarning}>
          <MaterialCommunityIcons name="alert" size={20} color="#FF4444" />
          <Text style={styles.deviationText}>Off Route - Follow the marked path</Text>
        </View>
      )}

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
              rotation={carRotation}
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

          {remainingRouteCoords.length > 0 && !hasArrived && (
            <Polyline
              coordinates={remainingRouteCoords}
              strokeWidth={5}
              strokeColor={isOffRoute ? "#FF8800" : "#808080"}
              lineCap="round"
              lineJoin="round"
              zIndex={2}
            />
          )}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor={isOffRoute ? "#FF8800" : "#4CAF50"}
              lineCap="round"
              lineJoin="round"
              zIndex={3}
            />
          )}

          {alternateRouteCoords.length > 0 && isOffRoute && (
            <Polyline
              coordinates={alternateRouteCoords}
              strokeWidth={4}
              strokeColor="#FF4444"
              // strokePattern={[10, 5]}
              lineCap="round"
              lineJoin="round"
              zIndex={4}
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

          {/* Hide contact buttons when ride has started */}
          {!rideStarted && (
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
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

        {/* Conditional rendering of action buttons based on ride state */}
        {rideStarted ? (
          // Show only End Ride button when ride has started
          <View style={styles.singleButtonContainer}>
            <TouchableOpacity style={styles.endRideButton} onPress={handleEndRide}>
              <Text style={styles.endRideButtonText}>End Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Show original action buttons before ride starts
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            {hasArrived ? (
              <TouchableOpacity style={styles.imHereButton} onPress={handleStartRide}>
                <Text style={styles.imHereButtonText}>Start Ride</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.imHereButton} onPress={handleImHere}>
                <Text style={styles.imHereButtonText}>I&apos;m here</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    borderRadius: 30,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 4,
    borderRadius: 20,
  },
  deviationWarning: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 1000,
    backgroundColor: "#FFF3CD",
    borderRadius: 20,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#FF4444",
  },
  deviationText: {
    color: "#FF4444",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
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
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
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
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#0286FF",
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
    borderRadius: 30,
    backgroundColor: "#0286FF",
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappButton: {
    width: 48,
    height: 48,
    borderRadius: 30,
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
    borderRadius: 24,
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
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#0286FF",
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
    color: "#0286FF",
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
    borderRadius: 24,
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
    backgroundColor: "#0286FF",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  imHereButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // New styles for the End Ride button
  singleButtonContainer: {
    alignItems: "center",
  },
  endRideButton: {
    backgroundColor: "#f8f8f8",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: 200,
  },
  endRideButtonText: {
    color: "#FF4444",
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
    tintColor: "#000000ff",
  },
})

export default PickupPage
