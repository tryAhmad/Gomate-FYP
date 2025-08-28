import CustomButton from "@/components/CustomButton";
import DriverOffersModal from "@/components/DriverOffersModal";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
} from "react-native";
//import polyline from "@mapbox/polyline";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  Polyline,
} from "react-native-maps";
import polyline from "@mapbox/polyline";
import Constants from "expo-constants";
import * as Location from "expo-location";
import {
  getAutoCompleteSuggestions,
  getAddressCoordinate,
} from "@/utils/mapsApi";
import socket from "@/utils/socket";

const rideTypes = [
  {
    id: "motorcycle",
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

  const [driverOffers, setDriverOffers] = useState<any[]>([]);

  // Autocomplete states
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

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

  const DEFAULT_REGION: Region = {
    latitude: 31.5204, // Lahore fallback
    longitude: 74.3587,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    // when driver sends counter offer
    socket.on("receiveCounterOffer", (data) => {
      console.log("Counter fare received:", data);
      setDriverOffers((prev) => [...prev, data]); // append to state
      //setShowOffersModal(true); // open modal automatically
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("receiveCounterOffer");
      socket.off("disconnect");
    };
  }, []);

  // // Get current location on component mount
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       setIsLoadingLocation(true);

  //       // Request location permissions
  //       const { status } = await Location.requestForegroundPermissionsAsync();
  //       if (status !== "granted") {
  //         Alert.alert(
  //           "Permission denied",
  //           "Location permission is required to get your current location"
  //         );
  //         setIsLoadingLocation(false);
  //         return;
  //       }

  //       // Get current location
  //       const location = await Location.getCurrentPositionAsync({
  //         accuracy: Location.Accuracy.Balanced,
  //       });
  //       const { coords } = location;
  //       if (!coords) {
  //         Alert.alert("Error", "Unable to fetch current location");
  //         setIsLoadingLocation(false);
  //         return;
  //       }

  //       // Set current location first
  //       setCurrentLocation(location);

  //       // Set pickup coordinates to current location
  //       const currentCoords = {
  //         latitude: coords.latitude,
  //         longitude: coords.longitude,
  //       };
  //       setPickupCoord(currentCoords);

  //       // Define region
  //       const region: Region = {
  //         latitude: coords.latitude,
  //         longitude: coords.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       };

  //       // Animate map to current location with delay to ensure map is ready
  //       setTimeout(() => {
  //         mapRef.current?.animateToRegion(region, 1000);
  //       }, 100);

  //       // Reverse geocode to get address
  //       try {
  //         const [place] = await Location.reverseGeocodeAsync(coords);
  //         if (place) {
  //           const formattedAddress = [place.name, place.street, place.city]
  //             .filter(Boolean)
  //             .join(", ");

  //           setPickup(formattedAddress);
  //         }
  //       } catch (geocodeError) {
  //         console.error("Error reverse geocoding:", geocodeError);
  //         // Set a fallback address if reverse geocoding fails
  //         setPickup(
  //           `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
  //         );
  //       }

  //       setIsLoadingLocation(false);
  //     } catch (error) {
  //       console.error("Error getting current location:", error);
  //       Alert.alert("Error", "Unable to get current location");
  //       setIsLoadingLocation(false);
  //     }
  //   })();
  // }, []);

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
          latitude: coords.latitude - 0.0055,
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
        latitude: coords.latitude - 0.0055, // 👈 shift upward
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

  // Handle suggestion selection for dropoff
  const handleDropoffSuggestionSelect = async (suggestion: string) => {
    setDropoff(suggestion);
    setShowDropoffSuggestions(false);
    setDropoffSuggestions([]);
    try {
      const coords = await getAddressCoordinate(suggestion);
      setDropoffCoord(coords);

      const region: Region = {
        latitude: coords.latitude - 0.0055, // 👈 same offset
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
        latitude: currentLocation.coords.latitude - 0.0055,
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
      setPickupCoord(currentCoords);

      try {
        const [place] = await Location.reverseGeocodeAsync(currentCoords);
        if (place) {
          const formattedAddress = [place.name, place.street, place.city]
            .filter(Boolean)
            .join(", ");
          setPickup(formattedAddress);
        } else {
          // fallback if reverse geocode returns nothing
          setPickup(
            `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`
          );
        }
      } catch (error) {
        console.error("Error reverse geocoding pickup:", error);
        // fallback if geocoding fails
        setPickup(
          `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}`
        );
      }
    }
  };

  const handleFindRide = async () => {
    if (!selectedRideType || !pickupCoord || !dropoffCoord || !fare) {
      Alert.alert("Missing info", "Please fill in pickup, dropoff, and fare");
      return;
    }

    console.log(pickupCoord.latitude, pickupCoord.longitude);
    console.log(dropoffCoord.latitude, dropoffCoord.longitude);
    console.log("helloo");

    try {
      const response = await fetch("http://192.168.1.13:3000/ride-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFobWFkQGV4YW1wbGUuY29tIiwic3ViIjoiNjg4YzY5ZjIwNjUzZWMwZjQzZGY2ZTJjIiwicm9sZSI6InBhc3NlbmdlciIsImlhdCI6MTc1NjIwMzM3MSwiZXhwIjoxNzU2Mjg5NzcxfQ.73_2hsvq0LDc8bAdHeRVSw5Jey7Dy-hK_USwxJzndvM", // replace with actual token
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

      // show modal with offers
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
    if (pickupCoord && dropoffCoord) {
      const isTwoWheeler = ["motorcycle", "auto"].includes(
        selectedRideType || ""
      );
      const mode = "driving";
      const avoid = isTwoWheeler ? "&avoid=highways" : "";

      fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupCoord.latitude},${pickupCoord.longitude}&destination=${dropoffCoord.latitude},${dropoffCoord.longitude}&mode=${mode}${avoid}&key=${mapsApiKey}`
      )
        .then((res) => res.json())
        .then(({ routes }) => {
          if (routes?.length) {
            const points = polyline.decode(routes[0].overview_polyline.points);
            setRouteCoords(
              points.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
            );
          }
        });
    }
  }, [pickupCoord, dropoffCoord, selectedRideType]);

  // Prepare ride details to pass to modal
  const rideDetails = {
    pickup,
    dropoff,
    rideType: selectedRideType || "",
    fare,
  };

  // Called when user accepts a driver from the modal
  const handleDriverAccepted = (driver: any) => {
    console.log("Driver accepted:", driver.id);
    setDriverOffers([]); // clear offers
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

  function onClearPickup(_: GestureResponderEvent): void {
    // Clear pickup text and any visible suggestions
    setPickup("");
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
    // Intentionally keep pickupCoord so marker stays in place
  }

  function onClearDropoff(_: GestureResponderEvent): void {
    // Clear dropoff text and any visible suggestions
    setDropoff("");
    setDropoffSuggestions([]);
    setShowDropoffSuggestions(false);
    // Intentionally keep dropoffCoord so marker stays in place
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      {/* <View className="p-2 mt-10 bg-transparent">
        <Text className="text-2xl font-JakartaExtraBold text-center">Mapscreen</Text>
      </View> */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        followsUserLocation={false}
        onPress={handleMapPress}
        mapPadding={{ top: 50, right: 0, bottom: 0, left: 0 }} // 👈 push buttons down
        mapType="standard"
        //showsTraffic={true}
      >
        {/* Always show pickup marker when coordinates exist */}
        {pickupCoord && (
          <Marker
            coordinate={pickupCoord}
            title="Pickup Location"
            description={pickup || "Current Location"}
            pinColor="#000000"
            //image={icons.pin}
            draggable={true}
            onDragEnd={(e) => handlePickupMarkerDrag(e.nativeEvent.coordinate)}
          />
        )}

        {/* Show dropoff marker only when dropoff coordinates exist */}
        {dropoffCoord && (
          <Marker
            coordinate={dropoffCoord}
            title="Drop-off Location"
            description={dropoff}
            pinColor="red"
            //image={icons.pin}
            draggable={true}
            onDragEnd={(e) => handleDropoffMarkerDrag(e.nativeEvent.coordinate)}
          />
        )}

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={3}
            strokeColor="black"
            //strokePattern={[1]}
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

      {/* Loading */}
      {isLoadingLocation && (
        <View></View>
        // <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
        //   <Text className="text-center font-JakartaMedium">
        //     Getting your location...
        //   </Text>
        // </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="absolute bottom-[1px] w-full bg-blue-100 rounded-t-[40px] shadow-lg border-t-2 border-l-2 border-r-2 border-blue-300"
      >
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
                    label="Pickup Location"
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
                      pickup.length > 0 && (
                        <TouchableOpacity onPress={onClearPickup}>
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={26}
                            color="gray"
                          />
                        </TouchableOpacity>
                      )
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
                    label="Drop-off Location"
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
                      dropoff.length > 0 && (
                        <TouchableOpacity onPress={onClearDropoff}>
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={26}
                            color="gray"
                          />
                        </TouchableOpacity>
                      )
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

            <InputField
              label="Fare Offer"
              placeholder="Enter Fare"
              placeholderTextColor="grey"
              keyboardType="numeric"
              icon={
                <MaterialCommunityIcons
                  name="currency-usd"
                  size={26}
                  color="black"
                />
              }
              value={fare}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, ""); // removes everything except digits
                setFare(numeric);
              }}
            />

            <CustomButton
              title="Find Ride"
              className="mt-4 font-JakartaBold"
              onPress={handleFindRide}
            />
          </View>
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
    </SafeAreaView>
  );
};

export default newHome;
