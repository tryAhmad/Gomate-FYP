import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  Linking,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import type MapView from "react-native-maps"
import * as Location from "expo-location"

import { RideRequestMap } from "@/components/RideRequestMap"
import { SoloRideBottomCard } from "@/components/SoloRideBottomCard"
import { SharedRideBottomCard } from "@/components/SharedRideBottomCard"
import BurgerMenu from "@/components/BurgerMenu"
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute"

const { width } = Dimensions.get("window")

interface Coordinate {
  latitude: number
  longitude: number
}

interface Stop {
  type: "pickup" | "destination"
  address: string
  passengerName: string
  fare: string
  stopNumber: number
  completed?: boolean
  coordinate: Coordinate
  passengerPhone?: string
}

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
  rideType?: "solo" | "shared"
  optimizedStops?: string
}

const PickupPage: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams() as PickupParams
  const mapRef = useRef<MapView>(null)

  const isSharedRide = params.rideType === "shared"

  // Parse arrays for shared rides safely
  const pickups =
    isSharedRide && params.pickup
      ? typeof params.pickup === "string"
        ? JSON.parse(params.pickup)
        : [params.pickup]
      : [params.pickup || "Pickup Location"]

  const destinations =
    isSharedRide && params.destination
      ? typeof params.destination === "string"
        ? JSON.parse(params.destination)
        : [params.destination]
      : [params.destination || "Destination Location"]

  const passengerNames =
    isSharedRide && params.passengerName
      ? typeof params.passengerName === "string"
        ? JSON.parse(params.passengerName)
        : [params.passengerName]
      : [params.passengerName || "Passenger"]

  const fares =
    isSharedRide && params.fare
      ? typeof params.fare === "string"
        ? JSON.parse(params.fare)
        : [params.fare]
      : [params.fare || "250"]

  const passengerPhones =
    isSharedRide && params.passengerPhone
      ? typeof params.passengerPhone === "string"
        ? JSON.parse(params.passengerPhone)
        : [params.passengerPhone]
      : [params.passengerPhone || ""]

  // Parse optimized stops from ride request page
  const parsedOptimizedStops = params.optimizedStops ? JSON.parse(params.optimizedStops) : []

  // State
  const [pickupCoords, setPickupCoords] = useState<Coordinate[]>([])
  const [destinationCoords, setDestinationCoords] = useState<Coordinate[]>([])
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([])
  const [remainingRouteCoords, setRemainingRouteCoords] = useState<Coordinate[]>([])
  const [driverLocation, setDriverLocation] = useState<Coordinate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [slideAnim] = useState(new Animated.Value(-width * 0.7))
  const [hasArrived, setHasArrived] = useState(false)
  const [rideStarted, setRideStarted] = useState(false)
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null)
  const [carRotation, setCarRotation] = useState(0)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [sharedRideStops, setSharedRideStops] = useState<Stop[]>([])
  const [initialRouteLoaded, setInitialRouteLoaded] = useState(false)

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  // Initialize driver location first
  useEffect(() => {
    initializeDriverLocation()
  }, [])

  // Load route data once driver location is ready
  useEffect(() => {
    if (driverLocation && !initialRouteLoaded) {
      console.log("[PICKUP] Driver location ready, loading initial route data...")
      ;(async () => {
        await loadRouteData()
        setInitialRouteLoaded(true)
      })()
    }
  }, [driverLocation, initialRouteLoaded])

  const initializeDriverLocation = async () => {
    try {
      console.log("[PICKUP] Initializing driver location...")

      if (params.driverLat && params.driverLng) {
        const initialLocation = {
          latitude: Number.parseFloat(params.driverLat),
          longitude: Number.parseFloat(params.driverLng),
        }
        console.log("[PICKUP] Setting driver location from params:", initialLocation)
        setDriverLocation(initialLocation)
        await startRealTimeTracking()
      } else {
        await requestLocationPermission()
      }
    } catch (error) {
      console.error("Error initializing driver location:", error)
      setDriverLocation(DEFAULT_REGION)
    }
  }

  const loadRouteData = async () => {
    try {
      setIsLoading(true)
      console.log("[PICKUP] Loading route data, isSharedRide:", isSharedRide)

      if (isSharedRide) {
        await loadSharedRideData()
      } else {
        await loadSoloRideData()
      }
    } catch (error) {
      console.error("Error loading route:", error)
      Alert.alert("Error", "Failed to load route information.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadSharedRideData = async () => {
    try {
      console.log("[SHARED_RIDE] Loading shared ride data...")

      if (!driverLocation) {
        console.error("[SHARED_RIDE] No driver location available")
        return
      }

      if (parsedOptimizedStops && parsedOptimizedStops.length > 0) {
        console.log("[SHARED_RIDE] Using optimized stops:", parsedOptimizedStops)

        // Get coordinates for all stops with proper typing
        const stopsWithCoords = await Promise.all(
          parsedOptimizedStops.map(async (stop: any) => {
            console.log(`[SHARED_RIDE] Getting coordinates for: ${stop.address}`)
            try {
              const coordinate = await getCoordinatesFromAddress(stop.address)

              if (!coordinate) {
                console.error(`[SHARED_RIDE] Failed to get coordinates for: ${stop.address}`)
                return null
              }

              const passengerIndex = passengerNames.indexOf(stop.passengerName)
              const passengerPhone = passengerIndex >= 0 ? passengerPhones[passengerIndex] : ""

              // Ensure proper Stop type with explicit type casting
              const typedStop: Stop = {
                type: stop.type as "pickup" | "destination", 
                address: stop.address,
                passengerName: stop.passengerName,
                fare: stop.fare,
                stopNumber: stop.stopNumber,
                coordinate: coordinate,
                passengerPhone: passengerPhone,
                completed: false,
              }

              return typedStop
            } catch (error) {
              console.error(`[SHARED_RIDE] Error getting coordinates for ${stop.address}:`, error)
              return null
            }
          }),
        )

        // Filter out any null stops
        const validStops = stopsWithCoords.filter((stop) => stop !== null) as Stop[]

        if (validStops.length === 0) {
          console.error("[SHARED_RIDE] No valid stops with coordinates")
          Alert.alert("Error", "Could not load ride locations. Please try again.")
          return
        }

        setSharedRideStops(validStops)
        console.log("[SHARED_RIDE] Final stops with coordinates:", validStops)

        // Get optimized route from driver to first stop (stop 1)
        const firstStop = validStops[0]
        console.log("[SHARED_RIDE] Getting route from driver to first stop:", firstStop)

        try {
          const route = await getRouteCoordinates(driverLocation, firstStop.coordinate)
          console.log("[SHARED_RIDE] Driver to first stop route result:", route ? `${route.length} points` : "No route")

          if (route && route.length > 0) {
            setRemainingRouteCoords(route)
            setRouteCoords([])
            console.log("[SHARED_RIDE] Driver to first pickup route loaded:", route.length, "points")

            // Fit map to show the entire route, not just the two points
            setTimeout(() => {
              if (route.length > 0) {
                mapRef.current?.fitToCoordinates(route, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                })
              }
            }, 1000)
          } else {
            console.error("[SHARED_RIDE] Failed to get route from driver to first stop")
            Alert.alert("Route Error", "Could not calculate route to first pickup location.")
          }
        } catch (routeError) {
          console.error("[SHARED_RIDE] Error getting route:", routeError)
          Alert.alert("Route Error", "Failed to calculate route. Please try again.")
        }
      } else {
        console.error("[SHARED_RIDE] No optimized stops found in params")
        Alert.alert("Error", "Could not load ride information. Please try again.")
      }
    } catch (error) {
      console.error("Error loading shared ride data:", error)
      Alert.alert("Error", "Failed to load shared ride data.")
    }
  }

  const loadSoloRideData = async () => {
    try {
      console.log("[SOLO_RIDE] Loading solo ride data...")

      if (!driverLocation) {
        console.error("[SOLO_RIDE] No driver location available")
        return
      }

      const pickupCoord = await getCoordinatesFromAddress(pickups[0])
      const destinationCoord = await getCoordinatesFromAddress(destinations[0])

      console.log("[SOLO_RIDE] Pickup coordinates:", pickupCoord)
      console.log("[SOLO_RIDE] Destination coordinates:", destinationCoord)

      if (pickupCoord && destinationCoord) {
        setPickupCoords([pickupCoord])
        setDestinationCoords([destinationCoord])

        console.log("[SOLO_RIDE] Getting route from driver to pickup...")
        try {
          const driverRoute = await getRouteCoordinates(driverLocation, pickupCoord)
          console.log(
            "[SOLO_RIDE] Driver to pickup route result:",
            driverRoute ? `${driverRoute.length} points` : "No route",
          )

          if (driverRoute && driverRoute.length > 0) {
            setRemainingRouteCoords(driverRoute) // Show only driver to pickup initially
            setRouteCoords([]) // Don't show pickup to destination yet
            console.log("Driver to pickup route loaded:", driverRoute.length, "points")
          } else {
            console.error("[SOLO_RIDE] Failed to get driver to pickup route")
            Alert.alert("Route Error", "Could not calculate route to pickup location.")
          }

          // Fit map to show driver and pickup
          setTimeout(() => {
            const coordsToFit = driverLocation ? [driverLocation, pickupCoord] : [pickupCoord]

            mapRef.current?.fitToCoordinates(coordsToFit, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
          }, 1000)
        } catch (routeError) {
          console.error("[SOLO_RIDE] Error getting routes:", routeError)
          Alert.alert("Route Error", "Failed to calculate routes. Please try again.")
        }
      } else {
        console.error("[SOLO_RIDE] Failed to get coordinates for pickup or destination")
        Alert.alert("Error", "Could not fetch coordinates for the given locations.")
      }
    } catch (error) {
      console.error("Error loading solo ride data:", error)
    }
  }

  const startRealTimeTracking = async () => {
    try {
      console.log("[TRACKING] Starting real-time tracking...")
      const { status } = await Location.getForegroundPermissionsAsync()

      if (status === "granted") {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }

            console.log("[TRACKING] Location updated:", newLocation)
            setDriverLocation(newLocation)

            if (location.coords.heading !== null) {
              setCarRotation(location.coords.heading)
            }

            focusMapOnDriver(newLocation)
          },
        )

        setLocationSubscription(subscription)
        console.log("[TRACKING] Real-time tracking started")
      } else {
        console.error("[TRACKING] Location permission not granted")
      }
    } catch (error) {
      console.error("Error starting tracking:", error)
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
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
        console.log("[PERMISSION] Current location obtained:", newLocation)
        setDriverLocation(newLocation)
        focusMapOnDriver(newLocation)
        await startRealTimeTracking()
      } else {
        console.log("[PERMISSION] Location permission denied")
        setDriverLocation(DEFAULT_REGION)
      }
    } catch (error) {
      console.error("Error requesting permission:", error)
      setDriverLocation(DEFAULT_REGION)
    }
  }

  const focusMapOnDriver = (location: Coordinate) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      )
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

  // for solo ride
  const handleImHere = async () => {
    console.log("[SOLO_RIDE] Driver marked as arrived")
    setHasArrived(true)

    Alert.alert("Passenger Notified", "The passenger has been notified that you have arrived.", [{ text: "OK" }])

    // Move car marker to pickup on arrival without triggering a re-load (guarded by initialRouteLoaded)
    if (pickupCoords[0]) {
      setDriverLocation(pickupCoords[0])
    }

    if (pickupCoords[0] && destinationCoords[0]) {
      // Get route from pickup to destination
      console.log("[SOLO_RIDE] Getting route from pickup to destination...")
      try {
        const mainRoute = await getRouteCoordinates(pickupCoords[0], destinationCoords[0])
        if (mainRoute && mainRoute.length > 0) {
          setRouteCoords(mainRoute) // Show pickup to destination route
          setRemainingRouteCoords([]) // Clear the driver to pickup route

          // Fit map to show the entire route with proper bounds
          setTimeout(() => {
            const allCoords = [...mainRoute]
            if (allCoords.length > 0) {
              mapRef.current?.fitToCoordinates(allCoords, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              })
            }
          }, 500)

          console.log("Pickup to destination route loaded:", mainRoute.length, "points")
        }
      } catch (error) {
        console.error("[SOLO_RIDE] Error getting pickup to destination route:", error)
      }
    }
  }

  const handleStartRide = () => {
    console.log("[SOLO_RIDE] Ride started")
    setRideStarted(true)
    Alert.alert("Ride Started", "Navigate to the destination location.", [{ text: "OK" }])
  }

  const handleEndRide = () => {
    console.log("[RIDE] Ending ride")
    if (locationSubscription) {
      locationSubscription.remove()
    }
    router.replace({
      pathname: "/ride-completed",
      params: {
        pickup: isSharedRide ? JSON.stringify(pickups) : pickups[0],
        destination: isSharedRide ? JSON.stringify(destinations) : destinations[0],
        fare: isSharedRide ? JSON.stringify(fares) : fares[0],
        passengerName: isSharedRide ? JSON.stringify(passengerNames) : passengerNames[0],
        profilePhoto: params.profilePhoto,
        rideType: params.rideType,
        optimizedStops: isSharedRide ? params.optimizedStops : undefined,
      },
    } as any)
  }

  const handleCancel = () => {
    Alert.alert("Cancel Ride", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          console.log("[RIDE] Ride cancelled")
          if (locationSubscription) {
            locationSubscription.remove()
          }
          router.replace("/" as any)
        },
      },
    ])
  }

  const handleCall = (phoneNumber?: string) => {
    const phoneToCall = phoneNumber || params.passengerPhone
    if (phoneToCall) {
      Linking.openURL(`tel:${phoneToCall}`)
    } else {
      Alert.alert("Error", "Passenger phone number not available")
    }
  }

  const handleWhatsApp = async (phoneNumber?: string, passengerName?: string) => {
    const phoneToUse = phoneNumber || params.passengerPhone
    const nameToUse = passengerName || passengerNames[0]

    if (phoneToUse) {
      const phone = phoneToUse.replace(/\D/g, "")
      const message = `Hi ${nameToUse || "there"}, I'm your driver and I'm on my way.`

      try {
        const whatsappUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
        const canOpen = await Linking.canOpenURL(whatsappUrl)

        if (canOpen) {
          await Linking.openURL(whatsappUrl)
        } else {
          const webWhatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
          await Linking.openURL(webWhatsappUrl)
        }
      } catch (error) {
        Alert.alert("Error", "Could not open WhatsApp.")
      }
    } else {
      Alert.alert("Error", "Passenger phone number not available")
    }
  }

  const handleNextStop = async () => {
    const currentStop = sharedRideStops[currentStopIndex]
    if (!currentStop) {
      console.error("[SHARED_RIDE] Current stop not found")
      return
    }

    console.log("[SHARED_RIDE] Handling stop:", currentStop)
    console.log("[SHARED_RIDE] Current stop index:", currentStopIndex)

    if (currentStop.type === "pickup" && !currentStop.completed) {
      Alert.alert("Passenger Notified", `${currentStop.passengerName} has been notified that you have arrived.`)

      // Mark this stop as completed but DON'T move to next stop
      const updatedStops = sharedRideStops.map((stop, index) =>
        index === currentStopIndex ? { ...stop, completed: true } : stop,
      )
      setSharedRideStops(updatedStops)

      // Move car-marker to starting stop (guarded so it won't trigger a route reload)
      setDriverLocation(currentStop.coordinate)

      // Immediately map route from current stop -> next stop (timing fix)
      const nextStopIndex = currentStopIndex + 1
      if (nextStopIndex < sharedRideStops.length) {
        const nextStop = sharedRideStops[nextStopIndex]
        try {
          const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)
          setRemainingRouteCoords([]) // Clear any previous driver-to-stop route
          setRouteCoords(route) // Show route to next stop

          // Fit map to entire route
          setTimeout(() => {
            if (route && route.length > 0) {
              mapRef.current?.fitToCoordinates(route, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              })
            }
          }, 500)
        } catch (error) {
          console.error("[SHARED_RIDE] Error mapping route to next stop on arrival:", error)
        }
      }

      console.log("[SHARED_RIDE] Stop marked as arrived, route shown; waiting for Start Ride")
    } else if (currentStop.type === "pickup" && currentStop.completed) {

      const nextStopIndex = currentStopIndex + 1
      if (nextStopIndex < sharedRideStops.length) {
        const nextStop = sharedRideStops[nextStopIndex]

        // Calculate optimized route from current stop to next stop
        const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)

        setRemainingRouteCoords([]) // Clear any remaining route
        setRouteCoords(route) // Show route to next stop

        setCurrentStopIndex(nextStopIndex)

        // Fit map to show the entire route
        setTimeout(() => {
          if (route && route.length > 0) {
            mapRef.current?.fitToCoordinates(route, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
          }
        }, 500)
      }
    } else if (currentStop.type === "destination") {

      // Mark this stop as completed
      const updatedStops = sharedRideStops.map((stop, index) =>
        index === currentStopIndex ? { ...stop, completed: true } : stop,
      )
      setSharedRideStops(updatedStops)

      // Move car-marker to starting point of next leg
      setDriverLocation(currentStop.coordinate)

      // Check if this is the last stop
      if (currentStopIndex === sharedRideStops.length - 1) {
        // Last stop - end ride
        console.log("[SHARED_RIDE] Last stop completed, ending ride")
        handleEndRide()
      } else {
        // Move to next stop and update route
        const nextIdx = currentStopIndex + 1
        const nextStop = sharedRideStops[nextIdx]

        // Calculate route from current stop to next stop
        const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)

        setRouteCoords(route)
        setRemainingRouteCoords([])
        setCurrentStopIndex(nextIdx)

        // Fit map to show the entire route
        setTimeout(() => {
          if (route && route.length > 0) {
            mapRef.current?.fitToCoordinates(route, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
          }
        }, 500)
      }
    }
  }

  const getPinColor = (stopNumber: number, type: "pickup" | "destination") => {
    return type === "pickup" ? "#FF4444" : "#4CAF50"
  }

  const getPinIcon = (stopNumber: number, type: "pickup" | "destination"): "map-marker" | "map-marker-outline" => {
    if (!isSharedRide) {
      return type === "pickup" ? "map-marker-outline" : "map-marker"
    }
    if (type === "pickup") {
      return stopNumber === 1 ? "map-marker-outline" : "map-marker"
    }
    return stopNumber === 3 ? "map-marker-outline" : "map-marker"
  }

  // Get visible stops for the map - only show current and next stop
  const getVisibleStopsForMap = (): Stop[] => {
    if (!isSharedRide) {
      // For solo ride, show pickup and destination only when appropriate
      if (hasArrived && !rideStarted) {
        return [] // Show no pins when arrived but not started
      } else if (rideStarted) {
        // Show destination pin when ride started
        if (destinationCoords.length > 0) {
          return [
            {
              type: "destination" as const,
              address: destinations[0],
              passengerName: passengerNames[0],
              fare: fares[0],
              stopNumber: 1,
              coordinate: destinationCoords[0],
              passengerPhone: passengerPhones[0],
            },
          ]
        }
      }
      return []
    }

    // For shared rides, show only current and next stop
    const currentStop = sharedRideStops[currentStopIndex]
    const nextStop = currentStopIndex < sharedRideStops.length - 1 ? sharedRideStops[currentStopIndex + 1] : null

    const visibleStops: Stop[] = []

    // Always show current stop
    if (currentStop) {
      visibleStops.push(currentStop)
    }

    // Show next stop only if we're moving to it
    if (nextStop && currentStop?.completed) {
      visibleStops.push(nextStop)
    }

    return visibleStops
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View style={styles.menuButtonContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <RideRequestMap
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
          routeCoords={routeCoords}
          isLoading={isLoading}
          mapRef={mapRef}
          getPinColor={getPinColor}
          getPinIcon={getPinIcon}
          isSharedRide={isSharedRide}
          optimizedStops={getVisibleStopsForMap()}
          driverLocation={driverLocation}
          carRotation={carRotation}
          remainingRouteCoords={remainingRouteCoords}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{isSharedRide ? "Loading shared route..." : "Loading route..."}</Text>
          </View>
        )}
      </View>

      {isSharedRide ? (
        <SharedRideBottomCard
          stops={sharedRideStops}
          currentStopIndex={currentStopIndex}
          onNextStop={handleNextStop}
          onEndRide={handleEndRide}
          onCancel={handleCancel}
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
        />
      ) : (
        <SoloRideBottomCard
          passengerName={passengerNames[0]}
          profilePhoto={params.profilePhoto}
          pickup={pickups[0]}
          destination={destinations[0]}
          distance={params.distance}
          fare={fares[0]}
          hasArrived={hasArrived}
          rideStarted={rideStarted}
          onCall={() => handleCall()}
          onWhatsApp={() => handleWhatsApp()}
          onCancel={handleCancel}
          onImHere={handleImHere}
          onStartRide={handleStartRide}
          onEndRide={handleEndRide}
        />
      )}

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
  mapContainer: {
    flex: 1,
    position: "relative",
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
})

export default PickupPage
