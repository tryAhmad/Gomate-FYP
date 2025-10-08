import CustomButton from "@/components/CustomButton";
import DriverOffersModal from "@/components/DriverOffersModal";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StatusBar,
  GestureResponderEvent,
  ActivityIndicator,
  Image,
  Vibration,
  Linking,
  Modal,
} from "react-native";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  Polyline,
} from "react-native-maps";
import * as Notifications from "expo-notifications";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import * as Location from "expo-location";
import {
  getAutoCompleteSuggestions,
  getAddressCoordinate,
  getDistanceTime,
} from "@/utils/mapsApi";
import {getSocket} from "@/utils/socket";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import BurgerMenu from "@/components/BurgerMenu";
import AlertModal from "@/components/AlertModal";

const userip = Constants.expoConfig?.extra?.USER_IP?.trim();
const usertoken = Constants.expoConfig?.extra?.USER_TOKEN?.trim();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const rideTypes = [
  {
    id: "bike",
    name: "Bike",
    icon: <MaterialCommunityIcons name="motorbike" size={24} color="black" />,
  },
  {
    id: "car",
    name: "Car",
    icon: <MaterialCommunityIcons name="car" size={24} color="black" />,
  },
  {
    id: "auto",
    name: "Auto",
    icon: <MaterialCommunityIcons name="rickshaw" size={24} color="black" />,
  },
  {
    id: "shared",
    name: "Shared",
    icon: (
      <MaterialCommunityIcons name="account-multiple" size={24} color="black" />
    ),
  },
];

const newHome = () => {
  const mapsApiKey = Constants.expoConfig?.extra?.MAPS_API_KEY;
  const [selectedRideType, setSelectedRideType] = useState<string | null>(
    "car"
  );
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [fare, setFare] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isChoosingOnMap, setIsChoosingOnMap] = useState(false);
  const [choosingType, setChoosingType] = useState<"pickup" | "dropoff" | null>(
    null
  );
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [minFare, setMinFare] = useState<number | null>(null);
  const [driverOffers, setDriverOffers] = useState<any[]>([]);
  const [acceptedDriver, setAcceptedDriver] = useState<any>(null);
  const [rideId, setRideId] = useState<string | null>(null);

  // Autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
  const [driverArrived, setDriverArrived] = useState(false);
  const [rideStatus, setRideStatus] = useState<
    "idle" | "driver_arrived" | "started" | "completed" | "cancelled"
  >("idle");

  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  const mapRef = React.useRef<MapView | null>(null);

  const [pickupCoord, setPickupCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [dropoffCoord, setDropoffCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Add state for ride distance and duration
  const [rideDistance, setRideDistance] = useState<string>("");
  const [rideDuration, setRideDuration] = useState<string>("");
  const [loadingDistanceTime, setLoadingDistanceTime] = useState(false);

  const [showFareModal, setShowFareModal] = useState(false);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const DEFAULT_REGION: Region = {
    latitude: 31.5204, // Lahore fallback
    longitude: 74.3587,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const passengerId = "688c69f20653ec0f43df6e2c";
  const socket = getSocket();


  useEffect(() => {
    const handleCounterOffer = (data: any) => {
      console.log("Counter fare received:", data);
      setDriverOffers((prev) => [...prev, data]);
    };

    const handleDriverArrived = (data: any) => {
      console.log("Driver arrived:", data.message);
      setDriverArrived(true);
      setRideStatus("driver_arrived");
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Driver Arrived 🚗",
          body: "Your driver has arrived at your pickup location.",
        },
        trigger: null,
      });
    };

    const handleRideStarted = (data: any) => {
      console.log("Ride started:", data.message);
      setRideStatus("started");
    };

    const handleRideCompleted = (data: any) => {
      console.log("Ride completed:", data.message);
      setRideStatus("completed");

      Notifications.scheduleNotificationAsync({
        content: {
          title: "Ride Completed ✅",
          body: "Your ride has been completed successfully.",
        },
        trigger: null,
      });

      const rideData = {
        driverName: `${acceptedDriver?.firstname ?? ""} ${
          acceptedDriver?.lastname ?? ""
        }`.trim(),
        driverCarCompany: acceptedDriver?.car?.company ?? "",
        driverCarModel: acceptedDriver?.car?.model ?? "",
        pickup: pickup ?? "",
        dropoff: dropoff ?? "",
        fare: fare?.toString() ?? "0",
      };

      router.push({
        pathname: "/(screens)/ratingScreen",
        params: rideData,
      });
    };

    // 🔄 Remove old listeners first
    socket.off("receiveCounterOffer");
    socket.off("driverArrived");
    socket.off("rideStarted");
    socket.off("rideCompleted");

    // ✅ Add fresh listeners
    socket.on("receiveCounterOffer", handleCounterOffer);
    socket.on("driverArrived", handleDriverArrived);
    socket.on("rideStarted", handleRideStarted);
    socket.on("rideCompleted", handleRideCompleted);

    return () => {
      socket.off("receiveCounterOffer", handleCounterOffer);
      socket.off("driverArrived", handleDriverArrived);
      socket.off("rideStarted", handleRideStarted);
      socket.off("rideCompleted", handleRideCompleted);
    };
  }, []);

  // 🔹 DriverBanner for pulsing animation
  const DriverBanner = ({
    driverArrived,
    children,
  }: {
    driverArrived: boolean;
    children: React.ReactNode;
  }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
      if (driverArrived) {
        // Start pulsing
        scale.value = withRepeat(
          withSequence(
            withTiming(1.05, { duration: 400 }),
            withTiming(1, { duration: 400 })
          ),
          -1,
          true
        );

        // Vibrate once
        Vibration.vibrate(800);
      }
    }, [driverArrived]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return <Animated.View style={animatedStyle}>{children}</Animated.View>;
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoadingLocation(true);

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission denied",
            "Location permission is required to get your current location"
          );
          return;
        }

        // Try last known first (faster)
        let location = await Location.getLastKnownPositionAsync();
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (!location?.coords) {
          Alert.alert("Error", "Unable to fetch current location");
          return;
        }

        const { coords } = location;

        // Set state
        setCurrentLocation(location);
        setPickupCoord({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        // Animate map
        const region: Region = {
          latitude: coords.latitude - 0.002,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setTimeout(() => {
          mapRef.current?.animateToRegion(region, 1000);
        }, 100);

        // Reverse geocode
        try {
          const [place] = await Location.reverseGeocodeAsync(coords);
          if (place) {
            const formattedAddress = [place.name, place.street, place.city]
              .filter(Boolean)
              .join(", ");
            setPickup(formattedAddress);
          }
        } catch (geocodeError) {
          console.error("Error reverse geocoding:", geocodeError);
          setPickup(
            `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
          );
        }
      } catch (error) {
        console.error("Error getting current location:", error);
        Alert.alert("Error", "Unable to get current location");
      } finally {
        // 👈 always run this
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchDistanceTime = async () => {
        if (pickupCoord && dropoffCoord) {
          try {
            setLoadingDistanceTime(true);
            const result = await getDistanceTime(
              { lat: pickupCoord?.latitude, lng: pickupCoord?.longitude },
              { lat: dropoffCoord?.latitude, lng: dropoffCoord?.longitude },
              selectedRideType || ""
            );

            if (result) {
              setRideDistance(result.distance.text);
              setRideDuration(result.duration.text);
              //console.log("Distance:", result.distance.value / 1000, "km");
              //console.log("Duration:", result.duration.value / 60, "mins");
              try {
                const res = await fetch(
                  `http://${userip}:3000/ride-request/fare`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      distance: result.distance.value, // in meters
                      duration: result.duration.value, // in seconds
                      rideType: selectedRideType,
                    }),
                  }
                );
                const data = await res.json();
                if (res.ok) {
                  console.log(
                    "Ride fare fetched successfully:",
                    data,
                    typeof data.fare
                  );
                  setCalculatedFare(data.fare);
                  setMinFare(Math.round(Number(data.fare) * 0.85));
                } else {
                  console.error("Error fetching ride fare:", data);
                  setCalculatedFare(null);
                  setMinFare(null);
                }
              } catch (error) {
                console.error("Error fetching ride fare:", error);
                setCalculatedFare(null);
                setMinFare(null);
              }
            }
          } catch (error) {
            console.error("Error fetching distance/time:", error);
            setRideDistance("");
            setRideDuration("");
          } finally {
            setLoadingDistanceTime(false);
          }
        } else {
          setRideDistance("");
          setRideDuration("");
          setLoadingDistanceTime(false);
          setCalculatedFare(null);
          setMinFare(null);
        }
      };

      fetchDistanceTime();
    }, 1000); // debounce delay

    return () => clearTimeout(timeout);
  }, [pickupCoord, dropoffCoord, selectedRideType]);

  // Handle pickup text change with autocomplete
  const handlePickupChange = async (text: string) => {
    setPickup(text);

    if (text.length >= 2) {
      try {
        const suggestions = await getAutoCompleteSuggestions(text);
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      } catch (error) {
        console.error("Error fetching pickup suggestions:", error);
      }
    } else {
      setShowPickupSuggestions(false);
      setPickupSuggestions([]);
    }
  };

  // Handle dropoff text change with autocomplete
  const handleDropoffChange = async (text: string) => {
    setDropoff(text);

    if (text.length >= 2) {
      try {
        const suggestions = await getAutoCompleteSuggestions(text);
        setDropoffSuggestions(suggestions);
        setShowDropoffSuggestions(true);
      } catch (error) {
        console.error("Error fetching dropoff suggestions:", error);
      }
    } else {
      setShowDropoffSuggestions(false);
      setDropoffSuggestions([]);
    }
  };

  // Handle suggestion selection for pickup
  const handlePickupSuggestionSelect = async (suggestion: string) => {
    setPickup(suggestion);
    setShowPickupSuggestions(false);
    setPickupSuggestions([]);
    try {
      const coords = await getAddressCoordinate(suggestion);
      setPickupCoord(coords);

      // Apply latitude offset so marker is centered better
      const region: Region = {
        latitude: coords.latitude - 0.002, // 👈 shift upward
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 100);
    } catch (e) {
      console.warn("Failed to geocode pickup", e);
    }
  };

  // Handle suggestion selection for dropOff
  const handleDropoffSuggestionSelect = async (suggestion: string) => {
    setDropoff(suggestion);
    setShowDropoffSuggestions(false);
    setDropoffSuggestions([]);
    try {
      const coords = await getAddressCoordinate(suggestion);
      setDropoffCoord(coords);

      const region: Region = {
        latitude: coords.latitude - 0.002, // 👈 same offset
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 100);
    } catch (e) {
      console.warn("Failed to geocode dropoff", e);
    }
  };

  // Handle marker drag for pickup location
  const handlePickupMarkerDrag = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    setPickupCoord(coordinate);
    try {
      const [place] = await Location.reverseGeocodeAsync(coordinate);
      if (place) {
        const formattedAddress = [place.name, place.street, place.city]
          .filter(Boolean)
          .join(", ");
        setPickup(formattedAddress);
      } else {
        setPickup(
          `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error("Error reverse geocoding pickup:", error);
      setPickup(
        `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
      );
    }
  };

  // Handle marker drag for dropoff location
  const handleDropoffMarkerDrag = async (coordinate: {
    latitude: number;
    longitude: number;
  }) => {
    setDropoffCoord(coordinate);
    try {
      const [place] = await Location.reverseGeocodeAsync(coordinate);
      if (place) {
        const formattedAddress = [place.name, place.street, place.city]
          .filter(Boolean)
          .join(", ");
        setDropoff(formattedAddress);
      } else {
        setDropoff(
          `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
        );
      }
    } catch (error) {
      console.error("Error reverse geocoding dropoff:", error);
      setDropoff(
        `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
      );
    }
  };

  // Handle map press when in choosing mode
  const handleMapPress = async (event: any) => {
    if (!isChoosingOnMap) return;

    const coordinate = event.nativeEvent.coordinate;

    if (choosingType === "pickup") {
      await handlePickupMarkerDrag(coordinate);
    } else if (choosingType === "dropoff") {
      await handleDropoffMarkerDrag(coordinate);
    }

    // Exit choosing mode
    setIsChoosingOnMap(false);
    setChoosingType(null);
  };

  // Return to current location function
  const returnToCurrentLocation = async () => {
    if (currentLocation) {
      const region = {
        latitude: currentLocation.coords.latitude - 0.002,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 800);

      // Reset pickup to current location
      const currentCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      //setPickupCoord(currentCoords);

      // try {
      //   const [place] = await Location.reverseGeocodeAsync(currentCoords);
      //   if (place) {
      //     const formattedAddress = [place.name, place.street, place.city]
      //       .filter(Boolean)
      //       .join(", ");
      //     setPickup(formattedAddress);
      //   } else {
      //     // fallback if reverse geocode returns nothing
      //     setPickup(
      //       `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`
      //     );
      //   }
      // } catch (error) {
      //   console.error("Error reverse geocoding pickup:", error);
      //   // fallback if geocoding fails
      //   setPickup(
      //     `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`
      //   );
      // }
    }
  };

  const handleUseCurrentPickup = async () => {
    if (currentLocation) {
      const region = {
        latitude: currentLocation.coords.latitude - 0.002,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 800);
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setPickupCoord(coords);
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        if (place) {
          const formattedAddress = [place.name, place.street, place.city]
            .filter(Boolean)
            .join(", ");
          setPickup(formattedAddress);
          console.log("Set pickup to current location:", formattedAddress);
        } else {
          console.log("Reverse geocode returned no results");
        }
      } catch (error) {
        console.error("Error reverse geocoding pickup:", error);
      }
    }
  };

  const handleUseCurrentDropoff = async () => {
    if (currentLocation) {
      const region = {
        latitude: currentLocation.coords.latitude - 0.002,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(region, 800);
      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setDropoffCoord(coords);
      try {
        const [place] = await Location.reverseGeocodeAsync(coords);
        if (place) {
          const formattedAddress = [place.name, place.street, place.city]
            .filter(Boolean)
            .join(", ");
          setDropoff(formattedAddress);
          console.log("Set dropoff to current location:", formattedAddress);
        } else {
          console.log("Reverse geocode returned no results");
        }
      } catch (error) {
        console.error("Error reverse geocoding dropoff:", error);
        setDropoff(
          `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
        );
      }
    }
  };

  const handleFindRide = async () => {
    if (!selectedRideType || !pickupCoord || !dropoffCoord || !fare) {
      setAlertMessage("Please fill in pickup, dropoff, and fare");
      setShowAlertModal(true);
      return;
    }

    // Check if fare < minFare
    if (Number(fare) < minFare!) {
      setShowFareModal(true); // show modal
      return; // stop execution
    }

    console.log(pickupCoord.latitude, pickupCoord.longitude);
    console.log(dropoffCoord.latitude, dropoffCoord.longitude);

    try {
      const response = await fetch(`http://${userip}:3000/ride-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${usertoken}`,
        },
        body: JSON.stringify({
          pickupLocation: {
            coordinates: [pickupCoord.longitude, pickupCoord.latitude], // [lng, lat]
          },
          dropoffLocation: {
            coordinates: [dropoffCoord.longitude, dropoffCoord.latitude],
          },
          rideMode: "solo", // or shared
          fare: Number(fare),
          rideType: selectedRideType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Ride request failed:", errorData);
        Alert.alert("Error", errorData.message || "Something went wrong");
        return;
      }
      const data = await response.json();
      console.log("Ride request created:", data);
      const rideId = data.ride._id;
      console.log("Ride ID:", rideId);

      // Store the ride ID for later use
      setRideId(rideId);

      // show modal with offers
      setShowOffersModal(true);
      setShowOffersModal(true);
    } catch (err) {
      console.error("Network error creating ride:", err);
      Alert.alert("Network Error", "Could not connect to server");
    }
  };

  const closeOffersModal = () => {
    setShowOffersModal(false);
  };

  useEffect(() => {
    const isTwoWheeler = ["motorcycle", "auto", "bike"].includes(
      selectedRideType || ""
    );
    const mode = "driving";
    const avoid = isTwoWheeler ? "&avoid=highways" : "";

    let origin, destination;

    if (acceptedDriver && acceptedDriver.location && pickupCoord) {
      // Driver accepted → route from driver to pickup
      origin = {
        latitude: acceptedDriver.location.lat,
        longitude: acceptedDriver.location.lng,
      };
      destination = pickupCoord;

      // Animate map to driver location
      const region: Region = {
        latitude: acceptedDriver.location.lat - 0.002, // same offset for centering
        longitude: acceptedDriver.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setTimeout(() => {
        mapRef.current?.animateToRegion(region, 1000);
      }, 100);
    } else if (pickupCoord && dropoffCoord) {
      // No driver yet → route from pickup to dropoff
      origin = pickupCoord;
      destination = dropoffCoord;
    }

    if (origin && destination) {
      fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}${avoid}&key=${mapsApiKey}`
      )
        .then((res) => res.json())
        .then(({ routes }) => {
          if (routes?.length) {
            const points = polyline.decode(routes[0].overview_polyline.points);
            setRouteCoords(
              points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
            );
          }
        })
        .catch((err) => console.error("Error fetching route:", err));
    }
  }, [pickupCoord, dropoffCoord, selectedRideType, acceptedDriver]);

  // Prepare ride details to pass to modal
  const rideDetails = {
    pickup,
    dropoff,
    pickupCoord,
    dropoffCoord,
    rideType: selectedRideType || "",
    fare,
  };

  // Called when user accepts a driver from the modal
  const handleDriverAccepted = (offer: any) => {
    console.log("Driver accepted:", offer.driver);

    socket.emit("acceptDriverOffer", {
      rideId: offer.rideId,
      driverId: offer.driver.id,
      passengerId: passengerId,
      counterFare: offer.counterFare ?? offer.driver.fare, // send whichever is active
    });

    setDriverOffers([]);
    setAcceptedDriver(offer.driver);
    setFare(offer.counterFare?.toString() || "");
    setShowOffersModal(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Render autocomplete suggestions
  const renderSuggestions = (
    suggestions: string[],
    onSelect: (suggestion: string) => void
  ) => (
    <View className="bg-white border border-gray-200 rounded-lg mt-1 max-h-40">
      <FlatList
        data={suggestions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item)}
            className="p-3 border-b border-gray-100"
          >
            <Text className="text-gray-800">{item}</Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );

  const handleCall = async () => {
    const phoneNumber = acceptedDriver?.phoneNumber;
    const url = `tel:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Error", "Unable to make a call.");
    }
  };

  const handleWhatsApp = async () => {
    const phoneNumber = acceptedDriver?.phoneNumber;
    const url = `https://wa.me/${phoneNumber}?text=Hello%20${acceptedDriver?.firstname},%20I%20am%20your%20gomate%20passenger.`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on your device.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  const handleCancelRide = () => {
    if (!rideId || !passengerId || !acceptedDriver?.id) {
      if (!rideId) console.log("❌ Missing rideId");
      if (!passengerId) console.log("❌ Missing passengerId");
      if (!acceptedDriver?.id)
        console.log("❌ Missing driverId (acceptedDriver.id)");

      return; // stop execution if something is missing
    }

    socket.emit("cancelRide", {
      rideId,
      cancelledBy: "passenger",
      passengerId,
      driverId: acceptedDriver.id,
      reason: "Passenger cancelled the ride",
    });

    setRideStatus("cancelled");
    setFare("");
    setAcceptedDriver(null);
    setDriverOffers([]);
    setRideId(null);
    setDriverArrived(false);
  };

  function onClearPickup(_: GestureResponderEvent): void {
    // Clear pickup text and any visible suggestions
    setPickup("");
    setPickupSuggestions([]);
    setPickupCoord(null);
    setShowPickupSuggestions(false);
    // Intentionally keep pickupCoord so marker stays in place
  }

  function onClearDropoff(_: GestureResponderEvent): void {
    // Clear dropoff text and any visible suggestions
    setDropoff("");
    setDropoffSuggestions([]);
    setDropoffCoord(null);
    setShowDropoffSuggestions(false);
    // Intentionally keep dropoffCoord so marker stays in place
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      {/* Fake background for StatusBar
      <View
        style={{
          height: (StatusBar.currentHeight ? StatusBar.currentHeight : 0) * 0.8, // status bar height on Android
          backgroundColor: "rgba(0,0,0,0.6)", // slightly black, adjust opacity
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      /> */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        followsUserLocation={false}
        onPress={handleMapPress}
        mapPadding={{ top: 50, right: 0, bottom: 0, left: 0 }} // 👈 push buttons down
        mapType="standard"
      >
        {/* Always show pickup marker when coordinates exist */}
        {pickupCoord && (
          <Marker
            coordinate={pickupCoord}
            title="Pickup Location"
            description={pickup || "Current Location"}
            pinColor="red"
            //image={icons.pin}
            draggable={true}
            onDragEnd={(e) => handlePickupMarkerDrag(e.nativeEvent.coordinate)}
          />
        )}

        {/* Show either driver marker if accepted OR dropoff marker otherwise */}
        {acceptedDriver && acceptedDriver.location ? (
          <Marker
            coordinate={{
              latitude: acceptedDriver.location.lat,
              longitude: acceptedDriver.location.lng,
            }}
            title="Driver's Location"
            //description={`${acceptedDriver.firstname} ${acceptedDriver.lastname}`}
            image={icons.marker}
          />
        ) : (
          dropoffCoord && (
            <Marker
              coordinate={dropoffCoord}
              title="Drop-off Location"
              description={dropoff}
              pinColor="green"
              draggable={true}
              onDragEnd={(e) =>
                handleDropoffMarkerDrag(e.nativeEvent.coordinate)
              }
            />
          )
        )}

        {/* Route polyline */}
        {pickupCoord && dropoffCoord && routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#0486FE"
          />
        )}
      </MapView>
      {/* Current Location Button */}
      <TouchableOpacity
        onPress={returnToCurrentLocation}
        className="absolute top-16 right-4 bg-white p-3 rounded-full shadow-lg"
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={currentLocation ? "#007AFF" : "#ccc"}
          />
        )}
      </TouchableOpacity>

      <BurgerMenu
        passengerName="Ahmad"
        profilePic="https://i.pravatar.cc/150?img=3"
        style="top-16 left-5"
        onLogout={() => console.log("Logged out")}
        currentScreen="newHome"
      />
      {/* Loading */}
      {isLoadingLocation && (
        <View></View>
        // <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
        //   <Text className="text-center font-JakartaMedium">
        //     Getting your location...
        //   </Text>
        // </View>
      )}

      {/* Driver Banner */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={`absolute bottom-[1px] w-full ${driverArrived ? "bg-blue-200" : "bg-blue-100"} rounded-t-[40px] shadow-lg border-t-2 border-l-2 border-r-2 border-blue-300`}
      >
        {acceptedDriver ? (
          <>
            <View className="p-5">
              {rideStatus !== "started" && (
                <View className="flex-row justify-between items-center p-1 mb-2">
                  <DriverBanner driverArrived={driverArrived}>
                    <Text className="text-3xl font-JakartaExtraBold p-2">
                      {driverArrived
                        ? "Driver has arrived!"
                        : "Driver is on the way"}
                    </Text>
                  </DriverBanner>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={handleCall}
                      className="p-2 rounded-full bg-blue-500 shadow-sm border-[1px] border-white"
                    >
                      <MaterialCommunityIcons
                        name={"phone"}
                        size={44}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleWhatsApp}
                      className="p-2 ml-6 rounded-full bg-green-500 shadow-sm border-[1px] border-white"
                    >
                      <MaterialCommunityIcons
                        name={"whatsapp"}
                        size={44}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {rideStatus === "started" && (
                <View className="flex-row justify-center items-center p-1 mb-2">
                  <Text className="text-3xl font-JakartaExtraBold p-2">
                    Ride in Progress
                  </Text>
                </View>
              )}

              {/* Driver Info */}
              <View className="flex-row items-center space-x-4 mb-4">
                <Image
                  source={{
                    uri: "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
                  }}
                  className="w-16 h-16 rounded-full"
                />
                <View className="ml-4">
                  <Text className="text-xl font-JakartaBold">
                    {acceptedDriver.firstname} {acceptedDriver.lastname}
                  </Text>
                  <Text className="text-gray-600 text-xl font-JakartaMedium">
                    {acceptedDriver.vehicle.color}{" "}
                    {acceptedDriver.vehicle.company}{" "}
                    {acceptedDriver.vehicle.model}{" "}
                  </Text>
                  <Text className="text-primary-500 text-2xl font-JakartaExtraBold">
                    {acceptedDriver.vehicle.plate}
                  </Text>
                </View>
              </View>

              {/* Pickup & Dropoff */}
              <View className="mb-3">
                <Text className="text-lg text-gray-500 font-JakartaSemiBold">
                  Pickup
                </Text>
                <Text className="text-xl font-JakartaBold">{pickup}</Text>
              </View>

              <View className="mb-5">
                <Text className="text-lg text-gray-500 font-JakartaSemiBold">
                  Drop-off
                </Text>
                <Text className="text-xl font-JakartaBold">{dropoff}</Text>
              </View>
              <View className="mb-5">
                <Text className="text-lg text-gray-500 font-JakartaSemiBold">
                  Fare
                </Text>
                <Text className="text-2xl font-JakartaExtraBold">
                  PKR {fare}
                </Text>
              </View>

              {/* Cancel Ride Button */}
              <CustomButton
                title="Cancel Ride"
                className="bg-red-500"
                onPress={() => {
                  handleCancelRide();
                }}
              />
            </View>
          </>
        ) : (
          <>
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 pb-4">
              <Text className="text-2xl font-JakartaExtraBold">
                {isCollapsed ? "Tap to expand" : "Choose Ride Type."}
              </Text>
              <TouchableOpacity
                onPress={toggleCollapse}
                className="p-2 rounded-full bg-white shadow-sm border-[1px]"
              >
                <MaterialCommunityIcons
                  name={isCollapsed ? "chevron-up" : "chevron-down"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>

            {/* Collapsible content */}
            {!isCollapsed && (
              <View className="px-5 pb-5 ">
                <View className="flex-row justify-around mb-2">
                  {rideTypes.map((ride) => (
                    <TouchableOpacity
                      key={ride.id}
                      onPress={() => setSelectedRideType(ride.id)}
                      className={`w-[24%] p-2 rounded-xl mb-2 border-2 items-center ${
                        selectedRideType === ride.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Text className="text-sm text-gray-50">{ride.icon}</Text>
                      <Text
                        className={`font-JakartaBold text-lg ${
                          selectedRideType === ride.id
                            ? "text-blue-600"
                            : "text-gray-800"
                        }`}
                      >
                        {ride.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pickup Location Input with Autocomplete */}
                <View>
                  <View className="flex-row items-center justify-center">
                    <View className="flex-1">
                      <InputField
                        placeholder="Enter Pickup"
                        placeholderTextColor="grey"
                        icon={
                          <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={26}
                            color="red"
                          />
                        }
                        value={pickup}
                        onChangeText={handlePickupChange}
                        onFocus={() => setShowDropoffSuggestions(false)}
                        rightIcon={
                          <View className="flex-row items-center space-x-4">
                            {pickup.length > 0 ? (
                              <TouchableOpacity onPress={onClearPickup}>
                                <MaterialCommunityIcons
                                  name="close-circle"
                                  size={26}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={handleUseCurrentPickup}
                              >
                                <MaterialCommunityIcons
                                  name="crosshairs-gps"
                                  size={26}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        }
                      />
                    </View>
                  </View>
                  {showPickupSuggestions &&
                    pickupSuggestions.length > 0 &&
                    renderSuggestions(
                      pickupSuggestions,
                      handlePickupSuggestionSelect
                    )}
                </View>

                {/* Drop-off Location Input with Autocomplete */}
                <View>
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <InputField
                        placeholder="Enter Destination"
                        placeholderTextColor="grey"
                        icon={
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={26}
                            color="green"
                          />
                        }
                        value={dropoff}
                        onChangeText={handleDropoffChange}
                        onFocus={() => setShowPickupSuggestions(false)}
                        rightIcon={
                          <View className="flex-row items-center space-x-4">
                            {dropoff.length > 0 ? (
                              <TouchableOpacity onPress={onClearDropoff}>
                                <MaterialCommunityIcons
                                  name="close-circle"
                                  size={26}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                onPress={handleUseCurrentDropoff}
                              >
                                <MaterialCommunityIcons
                                  name="crosshairs-gps"
                                  size={26}
                                  color="gray"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        }
                      />
                    </View>
                  </View>
                  {showDropoffSuggestions &&
                    dropoffSuggestions.length > 0 &&
                    renderSuggestions(
                      dropoffSuggestions,
                      handleDropoffSuggestionSelect
                    )}
                </View>
                {!loadingDistanceTime && rideDistance && rideDuration && (
                  <View className="flex-row items-center justify-center space-x-4 ">
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={24}
                      color="gray"
                    />
                    <Text className="text-gray-600 text-lg text-center font-JakartaMedium mr-16">
                      {": "}
                      {rideDistance}
                    </Text>
                    <Ionicons name="time-sharp" size={24} color="gray" />
                    <Text className="text-gray-600 text-lg text-center font-JakartaMedium">
                      {": "}
                      {rideDuration}
                    </Text>
                  </View>
                )}

                <InputField
                  placeholder="Enter Fare"
                  placeholderTextColor="grey"
                  keyboardType="numeric"
                  containerStyle={
                    fare === "" || isNaN(Number(fare))
                      ? "border-2 border-gray-300"
                      : Number(fare) <= 0
                        ? "border-2 border-red-500"
                        : minFare !== null &&
                            minFare !== undefined &&
                            Number(fare) < minFare
                          ? "border-2 border-red-500"
                          : "border-2 border-green-400"
                  }
                  icon={
                    <MaterialCommunityIcons
                      name="currency-rupee"
                      size={26}
                      color="black"
                    />
                  }
                  value={fare}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9]/g, "");
                    setFare(numeric);
                  }}
                />
                {calculatedFare && !loadingDistanceTime && (
                  <Text className="text-gray-600 text-lg text-center font-JakartaMedium">
                    Suggested Fare: PKR {calculatedFare}
                  </Text>
                )}

                <CustomButton
                  title="Find Ride"
                  className="mt-4 font-JakartaBold mb-6"
                  onPress={handleFindRide}
                />
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>

      {/* Driver Offers Modal */}
      <DriverOffersModal
        visible={showOffersModal}
        onClose={closeOffersModal}
        onDriverAccepted={handleDriverAccepted}
        rideDetails={rideDetails}
        offers={driverOffers}
      />

      <AlertModal
        visible={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title="Missing Information"
        message={alertMessage}
        iconColor="orange"
        iconBgColor="yellow-100"
      />

      <AlertModal
        visible={showFareModal}
        onClose={() => setShowFareModal(false)}
        title="Minimum Fare Required"
        message={
          <>
            The minimum fare for this ride is{" "}
            <Text className="font-JakartaExtraBold text-red-500">
              Rs {minFare}
            </Text>
          </>
        }
        iconColor="red"
        iconBgColor="gray-100"
      />
    </SafeAreaView>
  );
};

export default newHome;
