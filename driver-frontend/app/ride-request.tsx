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
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps"
import { getCoordinatesFromAddress, getRouteCoordinates } from "@/utils/getRoute"

const { width, height } = Dimensions.get("window")

type RideParams = {
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

const RideRequestPage: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams() as RideParams
  const mapRef = useRef<MapView>(null)
  const scrollViewRef = useRef<ScrollView>(null)
  const inputRef = useRef<TextInput>(null)

  const [counterFare, setCounterFare] = useState("")
  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [destinationCoord, setDestinationCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  const DEFAULT_REGION = {
    latitude: 31.5204,
    longitude: 74.3587,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  }

  useEffect(() => {
    loadRouteData()

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (e) => {
      setIsKeyboardVisible(true)

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    })

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false)
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

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
        const route = await getRouteCoordinates(pickupCoords, destinationCoords)
        setRouteCoords(route)

        if (route.length > 0) {
          const exactPickupCoord = route[0]
          const exactDestinationCoord = route[route.length - 1]

          console.log("Route start point:", exactPickupCoord)
          console.log("Route end point:", exactDestinationCoord)
          console.log("Original geocoded pickup:", pickupCoords)
          console.log("Original geocoded destination:", destinationCoords)

          setPickupCoord(exactPickupCoord)
          setDestinationCoord(exactDestinationCoord)

          setTimeout(() => {
            mapRef.current?.fitToCoordinates([exactPickupCoord, exactDestinationCoord], {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
          }, 1000)
        } else {
          setPickupCoord(pickupCoords)
          setDestinationCoord(destinationCoords)

          setTimeout(() => {
            mapRef.current?.fitToCoordinates([pickupCoords, destinationCoords], {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            })
          }, 1000)
        }
      } else {
        Alert.alert("Error", "Could not fetch coordinates for the given locations.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load route information.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptRide = () => {
    router.push({
              pathname: "/pickup",
              params: {
                rideId: params.rideId,
                pickup: params.pickup,
                destination: params.destination,
                fare: params.fare,
                distance: params.distance,
                passengerName: params.passengerName,
                profilePhoto: params.profilePhoto,
                timeAway: params.timeAway,
                passengerPhone: params.passengerPhone, 
              },
            })
    Alert.alert(
      "Ride Accepted",
      "Navigate to pickup location",
      [
        {
          text: "OK",
        },
      ],
      { cancelable: false },
    )
  }

  const handleOfferFare = () => {
    const offeredFare = params.fare ? Number(params.fare) : 0
    const fareValue = counterFare ? Number(counterFare) : 0

    if (!counterFare || fareValue <= 0) {
      Alert.alert("Invalid Fare", "Please enter a valid fare amount")
      return
    }

    if (fareValue < offeredFare) {
      Alert.alert("Invalid Fare", `Your fare must be at least Rs ${offeredFare}`)
      return
    }

    Alert.alert("Counter Offer Sent", `Your offer of Rs ${fareValue} has been sent to the passenger.`)
    router.back()
  }

  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P"

  const focusOnInput = () => {
    inputRef.current?.focus()

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 300)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }, 100)
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      {/* Map Container */}
      <View style={[styles.mapContainer, isKeyboardVisible && styles.mapContainerKeyboard]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          mapType="standard"
        >
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

          {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />}
        </MapView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading route...</Text>
          </View>
        )}
      </View>

      {/* Ride Details Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardAvoidingView, isKeyboardVisible && styles.keyboardAvoidingViewExpanded]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.card, isKeyboardVisible && styles.cardExpanded]}
          contentContainerStyle={[styles.scrollContent, isKeyboardVisible && styles.scrollContentExpanded]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
        >
          {/* Passenger Info */}
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
              {params.timeAway && <Text style={styles.timeAwayText}>{params.timeAway}</Text>}
            </View>
            <Text style={styles.fareText}>Rs {params.fare || "250"}</Text>
          </View>

          {/* Location Details */}
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

          {/* Accept Button */}
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRide}>
            <Text style={styles.acceptText}>Accept for Rs {params.fare || "250"}</Text>
          </TouchableOpacity>

          {/* Offer Your Fare Section */}
          <Text style={styles.offerText}>Offer your Fare</Text>
          <View style={styles.counterRow}>
            <Text style={styles.currencyText}>Rs</Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={counterFare}
              onChangeText={setCounterFare}
              onFocus={focusOnInput}
              onBlur={handleInputBlur}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#999"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (counterFare) {
                  handleOfferFare()
                }
              }}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleOfferFare}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  mapContainerKeyboard: {
    flex: 0.05,
  },

  map: {
    flex: 1,
  },

  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
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

  keyboardAvoidingView: {
    flex: 0,
  },

  keyboardAvoidingViewExpanded: {
    flex: 0.95,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  scrollContentExpanded: {
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: height * 0.5,
    minHeight: height * 0.3,
  },

  cardExpanded: {
    maxHeight: height * 0.95,
    minHeight: height * 0.85,
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

  timeAwayText: {
    fontSize: 12,
    color: "grey",
    marginTop: 2,
  },

  fareText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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

  acceptButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  acceptText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  sendButton: {
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    height: "100%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },

  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  offerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 20,
    height: 50,
    overflow: "hidden",
  },

  rupeeIcon: {
    marginRight: 8,
  },

  currencyText: {
    fontSize: 16,
    color: "#333",
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
    paddingHorizontal: 8,
  },
})

export default RideRequestPage
