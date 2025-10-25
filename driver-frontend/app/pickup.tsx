import type React from "react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import type MapView from "react-native-maps"
import * as Location from "expo-location"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet"

import { RideRequestMap } from "@/components/RideRequestMap"
import { SoloRideBottomCard } from "@/components/SoloRideBottomCard"
import { SharedRideBottomCard } from "@/components/SharedRideBottomCard"
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute"

const { width, height } = Dimensions.get("window")

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
  const bottomSheetRef = useRef<BottomSheet>(null)

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
  const [hasArrived, setHasArrived] = useState(false)
  const [rideStarted, setRideStarted] = useState(false)
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null)
  const [carRotation, setCarRotation] = useState(0)
  const [currentStopIndex, setCurrentStopIndex] = useState(0)
  const [sharedRideStops, setSharedRideStops] = useState<Stop[]>([])
  const [initialRouteLoaded, setInitialRouteLoaded] = useState(false)
  const [endingRide, setEndingRide] = useState(false)
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1)
  const [currentBottomSheetPosition, setCurrentBottomSheetPosition] = useState(0)
  const [currentBottomSheetHeight, setCurrentBottomSheetHeight] = useState(isSharedRide ? height * 0.65 : height * 0.6)

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  const snapPoints = useMemo(
    () => (isSharedRide ? [height * 0.3, height * 0.65] : [height * 0.25, height * 0.6]),
    [isSharedRide],
  )

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
                type: stop.type as "pickup" | "destination", // Explicit type casting
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
          const safeRoute = sanitizeCoords(route) // sanitize
          console.log("[SHARED_RIDE] Driver to first stop route result:", safeRoute.length, "points")

          if (safeRoute.length > 0) {
            setRemainingRouteCoords(safeRoute)
            setRouteCoords([])
            console.log("[SHARED_RIDE] Driver to first pickup route loaded:", safeRoute.length, "points")

            // Fit map to show the entire route, not just the two points
            setTimeout(() => {
              if (safeRoute.length > 0) {
                mapRef.current?.fitToCoordinates(safeRoute, {
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
          const safeDriverRoute = sanitizeCoords(driverRoute) // sanitize

          console.log("[SOLO_RIDE] Driver to pickup route result:", safeDriverRoute.length, "points")

          if (safeDriverRoute.length > 0) {
            setRemainingRouteCoords(safeDriverRoute) // Show only driver to pickup initially
            setRouteCoords([]) // Don't show pickup to destination yet
            console.log("Driver to pickup route loaded:", safeDriverRoute.length, "points")
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

  const handleSheetChanges = useCallback(
    (index: number) => {
      const safeIndex = Math.max(0, Math.min(index, snapPoints.length - 1))
      setBottomSheetIndex(safeIndex)
      setCurrentBottomSheetHeight(snapPoints[safeIndex])
      setCurrentBottomSheetPosition(snapPoints[safeIndex])
    },
    [snapPoints],
  )

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
        const safeMainRoute = sanitizeCoords(mainRoute) // sanitize

        if (safeMainRoute.length > 0) {
          setRemainingRouteCoords([])
          setRouteCoords(safeMainRoute)

          // Fit map to show the entire route with proper bounds
          setTimeout(() => {
            if (safeMainRoute.length > 0) {
              mapRef.current?.fitToCoordinates(safeMainRoute, {
                edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                animated: true,
              })
            }
          }, 500)

          console.log("Pickup to destination route loaded:", safeMainRoute.length, "points")
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
    setEndingRide(true)
    if (locationSubscription) {
      locationSubscription.remove()
    }
    // Clear map state synchronously to avoid a brief route/button flash
    setRouteCoords([])
    setRemainingRouteCoords([])
    setPickupCoords([])
    setDestinationCoords([])
    router.replace({
      pathname: "/ride-completed",
      params: {
        pickup: isSharedRide ? JSON.stringify(pickups) : pickups[0],
        destination: isSharedRide ? JSON.stringify(destinations) : destinations[0],
        fare: isSharedRide ? JSON.stringify(fares) : fares[0],
        passengerName: isSharedRide ? JSON.stringify(passengerNames) : passengerNames[0],
        profilePhoto: params.profilePhoto,
        rideType: params.rideType,
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
  try {
    // Basic guards:
    if (!sharedRideStops || sharedRideStops.length === 0) {
      console.warn("[SHARED_RIDE] handleNextStop called but stops not ready")
      Alert.alert("Error", "Ride stops are not ready yet.")
      return
    }

    if (currentStopIndex < 0 || currentStopIndex >= sharedRideStops.length) {
      console.warn("[SHARED_RIDE] Invalid currentStopIndex:", currentStopIndex)
      return
    }

    const currentStop = sharedRideStops[currentStopIndex]
    if (!currentStop) {
      console.warn("[SHARED_RIDE] Current stop missing")
      return
    }

    console.log("[SHARED_RIDE] Handling stop:", currentStop)
    console.log("[SHARED_RIDE] Current stop index:", currentStopIndex)

    // PICKUP (first tap marks arrived unless already completed)
    if (currentStop.type === "pickup" && !currentStop.completed) {
      Alert.alert("Passenger Notified", `${currentStop.passengerName} has been notified that you have arrived.`)

      const updatedStops = sharedRideStops.map((stop, index) =>
        index === currentStopIndex ? { ...stop, completed: true } : stop,
      )
      setSharedRideStops(updatedStops)

      // Move car marker
      if (isValidCoord(currentStop.coordinate)) {
        setDriverLocation(currentStop.coordinate)
      }

      const nextStopIndex = currentStopIndex + 1
      if (nextStopIndex < updatedStops.length) {
        const nextStop = updatedStops[nextStopIndex]
        if (!isValidCoord(nextStop.coordinate) || !isValidCoord(currentStop.coordinate)) {
          console.warn("[SHARED_RIDE] invalid coords for routing; advancing index")
          setCurrentStopIndex(nextStopIndex)
          return
        }

        try {
          const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)
          const safeRoute = sanitizeCoords(route)
          setRemainingRouteCoords([])
          setRouteCoords(safeRoute)

          setTimeout(() => {
            try {
              if (safeRoute.length > 0) {
                mapRef.current?.fitToCoordinates(safeRoute, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                })
              }
            } catch (e) {}
          }, 500)
        } catch (routeErr) {
          console.error("[SHARED_RIDE] Error mapping route to next stop on arrival:", routeErr)
          Alert.alert("Route Error", "Failed to calculate next segment. You can still continue the ride.")
        }
      }

      return
    }

    // If pickup already completed -> Move to next stop
    if (currentStop.type === "pickup" && currentStop.completed) {
      Alert.alert("Ride Started", `Continuing to next stop.`)
      const nextStopIndex = currentStopIndex + 1
      if (nextStopIndex < sharedRideStops.length) {
        const nextStop = sharedRideStops[nextStopIndex]
        if (!isValidCoord(currentStop.coordinate) || !isValidCoord(nextStop.coordinate)) {
          console.warn("[SHARED_RIDE] invalid coords when starting next leg")
          setCurrentStopIndex(nextStopIndex)
          return
        }

        try {
          const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)
          const safeRoute = sanitizeCoords(route)
          setRemainingRouteCoords([])
          setRouteCoords(safeRoute)
          setCurrentStopIndex(nextStopIndex)

          setTimeout(() => {
            try {
              if (safeRoute.length > 0) {
                mapRef.current?.fitToCoordinates(safeRoute, {
                  edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
                  animated: true,
                })
              }
            } catch (e) {}
          }, 500)
        } catch (err) {
          console.error("[SHARED_RIDE] Error mapping route after Start Ride:", err)
          setCurrentStopIndex(nextStopIndex)
          Alert.alert("Route Error", "Failed to calculate next segment. Proceed using the address.")
        }
      }
      return
    }

    // DESTINATION: collect fare and move on OR finish ride
    if (currentStop.type === "destination") {
      console.log("[SHARED_RIDE] Processing destination stop:", currentStop)
      await processDestinationStop(currentStop)
    }

  } catch (e) {
    console.error("[SHARED_RIDE] Unexpected error in handleNextStop:", e)
    Alert.alert("Error", "Something went wrong. Please try again.")
  }
}

// ✅ Moved outside try — separate helper function
const processDestinationStop = async (currentStop: any) => {
  try {
    console.log("[SHARED_RIDE] Processing destination stop")

    // Mark stop as completed
    const updatedStops = sharedRideStops.map((stop, idx) =>
      idx === currentStopIndex ? { ...stop, completed: true } : stop,
    )
    setSharedRideStops(updatedStops)

    // Move car to destination
    if (isValidCoord(currentStop.coordinate)) {
      setDriverLocation(currentStop.coordinate)
    }

    // Check if this is the last stop
    if (currentStopIndex === updatedStops.length - 1) {
      console.log("[SHARED_RIDE] Last destination reached, ending ride")
      setTimeout(() => handleEndRide(), 300)
      return
    }

    // Move to next stop
    const nextIdx = currentStopIndex + 1
    console.log("[SHARED_RIDE] Moving to next stop index:", nextIdx)
    const nextStop = updatedStops[nextIdx]

    if (!nextStop) {
      console.error("[SHARED_RIDE] Next stop not found at index:", nextIdx)
      setCurrentStopIndex(nextIdx)
      return
    }

    if (!isValidCoord(currentStop.coordinate) || !isValidCoord(nextStop.coordinate)) {
      console.warn("[SHARED_RIDE] Invalid coordinates for routing")
      setRemainingRouteCoords([])
      setRouteCoords([])
      setCurrentStopIndex(nextIdx)
      return
    }

    // Calculate route to next stop
    console.log("[SHARED_RIDE] Calculating route to next stop:", nextStop)
    try {
      const route = await getRouteCoordinates(currentStop.coordinate, nextStop.coordinate)
      const safeRoute = sanitizeCoords(route)
      console.log("[SHARED_RIDE] Route calculated with points:", safeRoute.length)

      setRemainingRouteCoords([])
      setRouteCoords(safeRoute)
      setCurrentStopIndex(nextIdx)

      setTimeout(() => {
        try {
          if (safeRoute.length > 0) {
            mapRef.current?.fitToCoordinates(safeRoute, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
            console.log("[SHARED_RIDE] Map fitted to new route")
          }
        } catch (e) {
          console.error("[SHARED_RIDE] Error fitting map:", e)
        }
      }, 500)
    } catch (routeError) {
      console.error("[SHARED_RIDE] Error calculating route:", routeError)
      setRemainingRouteCoords([])
      setRouteCoords([])
      setCurrentStopIndex(nextIdx)
      Alert.alert("Route Error", "Failed to calculate route. Please proceed using the address.")
    }
  } catch (error) {
    console.error("[SHARED_RIDE] Error in processDestinationStop:", error)
    Alert.alert("Error", "Something went wrong while processing the destination stop.")
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

  const computedRemainingRoute = useMemo(() => {
    if (isSharedRide) {
      const curr = sharedRideStops[currentStopIndex]
      // Only show the initial driver → first stop polyline if we're still on the first stop and it isn't completed yet
      if (currentStopIndex === 0 && curr && curr.type === "pickup" && !curr.completed) {
        return remainingRouteCoords
      }
      return []
    }
    // Solo: show driver → pickup only until driver has arrived
    return hasArrived ? [] : remainingRouteCoords
  }, [isSharedRide, sharedRideStops, currentStopIndex, remainingRouteCoords, hasArrived])

  const isValidCoord = (c?: { latitude: number; longitude: number }) =>
    !!c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)

  const sanitizeCoords = (coords?: Coordinate[]) => {
    if (!Array.isArray(coords)) return [] as Coordinate[]
    return coords.filter((p) => isValidCoord(p)) as Coordinate[]
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        {/* Map container with dynamic margin based on bottom sheet height */}
        <View style={[styles.mapContainer, { marginBottom: currentBottomSheetPosition }]}>
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
            remainingRouteCoords={computedRemainingRoute}
          />

          {isLoading && !initialRouteLoaded && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>{isSharedRide ? "Loading shared route..." : "Loading route..."}</Text>
            </View>
          )}
        </View>

        {/* BottomSheet with previous visuals; hide content when endingRide */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={bottomSheetIndex}
          onChange={handleSheetChanges}
          backgroundStyle={styles.bottomSheetBackground}
          handleStyle={styles.handleStyle}
          handleIndicatorStyle={styles.handleIndicator}
        >
          <BottomSheetScrollView
            style={styles.bottomSheetContent}
            contentContainerStyle={styles.bottomSheetContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {!endingRide &&
              (isSharedRide ? (
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
              ))}
          </BottomSheetScrollView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  bottomSheetBackground: {
    backgroundColor: "#E3F2FD",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  handleStyle: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  handleIndicator: {
    backgroundColor: "#ccc",
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetContentContainer: {
    flexGrow: 1,
  },
})

export default PickupPage
