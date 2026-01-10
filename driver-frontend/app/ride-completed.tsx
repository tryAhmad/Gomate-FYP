import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

type RideCompleteParams = {
  pickup?: string;
  destination?: string;
  fare?: string;
  passengerName?: string;
  profilePhoto?: string;
  rideType?: "solo" | "shared";
  optimizedStops?: string;
};

interface Passenger {
  name: string;
  fare: string;
  pickup?: string;
  destination?: string;
  profilePhoto?: string;
}

const RideCompleteScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams() as RideCompleteParams;

  const [rideDetails, setRideDetails] = useState({
    pickup: "",
    destination: "",
    fare: "0",
    passengerName: "",
    profilePhoto: "",
    rideType: "solo" as "solo" | "shared",
    passengers: [] as Passenger[],
    totalFare: "0",
  });

  // Helper function for safe JSON parsing
  const safeJsonParse = (str: string, fallback: any) => {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error("JSON parse error:", error);
      return fallback;
    }
  };

  // Parse ride data only once when component mounts
  useEffect(() => {
    console.log("[RIDE_COMPLETE] Ride completed with params:", params);

    const parseRideData = () => {
      const rideType = (params.rideType as "solo" | "shared") || "solo";

      if (rideType === "shared") {
        try {
          const pickups = params.pickup
            ? safeJsonParse(params.pickup as string, [])
            : [];
          const destinations = params.destination
            ? safeJsonParse(params.destination as string, [])
            : [];
          const fares = params.fare
            ? safeJsonParse(params.fare as string, [])
            : [];
          const passengerNames = params.passengerName
            ? safeJsonParse(params.passengerName as string, [])
            : [];

          const passengers: Passenger[] = passengerNames.map(
            (name: string, index: number) => ({
              name: name || `Passenger ${index + 1}`,
              fare: fares[index]?.toString() || "0",
              pickup: pickups[index],
              destination: destinations[index],
            })
          );

          const totalFare = fares
            .reduce((sum: number, fare: any) => {
              const fareValue = parseFloat(fare?.toString() || "0");
              return sum + (isNaN(fareValue) ? 0 : fareValue);
            }, 0)
            .toString();

          return {
            pickup: pickups[0] || "Unknown Pickup",
            destination:
              destinations[destinations.length - 1] || "Unknown Destination",
            fare: "0",
            passengerName: passengerNames[0] || "Passenger",
            profilePhoto: params.profilePhoto?.toString() || "",
            rideType: "shared" as "shared",
            passengers,
            totalFare,
          };
        } catch (error) {
          console.error(
            "[RIDE_COMPLETE] Error parsing shared ride data:",
            error
          );
          return {
            pickup: "Unknown Pickup",
            destination: "Unknown Destination",
            fare: "0",
            passengerName: "Passenger",
            profilePhoto: "",
            rideType: "shared" as "shared",
            passengers: [],
            totalFare: "0",
          };
        }
      } else {
        return {
          pickup: params.pickup?.toString() || "Unknown Pickup",
          destination: params.destination?.toString() || "Unknown Destination",
          fare: params.fare?.toString() || "0",
          passengerName: params.passengerName?.toString() || "Passenger",
          profilePhoto: params.profilePhoto?.toString() || "",
          rideType: "solo" as "solo",
          passengers: [],
          totalFare: params.fare?.toString() || "0",
        };
      }
    };

    const parsedData = parseRideData();
    setRideDetails(parsedData);
  }, []);

  // Save ride to history - separate useEffect to avoid infinite loop
  useEffect(() => {
    const saveRide = async () => {
      try {
        const storageKey =
          rideDetails.rideType === "shared"
            ? "driverSharedRideHistory"
            : "driverRideHistory";

        const cached = await AsyncStorage.getItem(storageKey);
        let rides = cached ? JSON.parse(cached) : [];

        // Parse optimizedStops from params if available
        const optimizedStops = params.optimizedStops
          ? safeJsonParse(params.optimizedStops as string, [])
          : [];

        console.log(
          "[RIDE_COMPLETE] Saving optimizedStops to history:",
          optimizedStops
        );

        const newRide = {
          _id: Date.now().toString(),
          pickupLocation: { address: rideDetails.pickup },
          dropoffLocation: { address: rideDetails.destination },
          fare:
            parseFloat(
              rideDetails.rideType === "shared"
                ? rideDetails.totalFare
                : rideDetails.fare
            ) || 0,
          passengerName: rideDetails.passengerName,
          profilePhoto: rideDetails.profilePhoto,
          createdAt: new Date().toISOString(),
          status: "completed",
          type: rideDetails.rideType,
          ...(rideDetails.rideType === "shared" && {
            passengers: rideDetails.passengers,
            passengerCount: rideDetails.passengers.length,
            optimizedStops: optimizedStops,
          }),
        };

        rides = [newRide, ...rides];
        await AsyncStorage.setItem(storageKey, JSON.stringify(rides));

        console.log(
          `[RIDE_COMPLETE] Saved ${rideDetails.rideType} ride to history with optimizedStops`
        );
      } catch (err) {
        console.error("Error saving ride history:", err);
      }
    };

    if (rideDetails.pickup && rideDetails.destination) {
      saveRide();
    }
  }, [rideDetails.pickup, rideDetails.destination]); // Only depend on these to avoid loops

  const handleBookAnotherRide = () => {
    console.log("[RIDE_COMPLETE] Navigating to landing page for new ride");
    router.replace("/" as any);
  };

  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P";

  // Safe fare formatting function
  const formatFare = (fare: any): string => {
    if (fare === undefined || fare === null) {
      return "0";
    }

    const fareString = fare.toString();
    const numericFare = fareString.replace(/[^\d.]/g, "");
    return numericFare || "0";
  };

  const renderSoloRide = () => (
    <>
      {/* Passenger Info */}
      <View style={styles.passengerSection}>
        {rideDetails.profilePhoto && rideDetails.profilePhoto.trim() !== "" ? (
          <Image
            source={{ uri: rideDetails.profilePhoto }}
            style={styles.avatarPlaceholder}
            onError={() => {
              console.log("Error loading profile photo, using fallback");
            }}
            defaultSource={require("@/assets/images/react-logo.png")}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {getInitial(rideDetails.passengerName)}
            </Text>
          </View>
        )}
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{rideDetails.passengerName}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeSection}>
        <View style={styles.routeItem}>
          <View style={styles.routeIconContainer}>
            <Ionicons name="location" size={16} color="#FF4444" />
          </View>
          <View style={styles.routeTextContainer}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.routeText}>{rideDetails.pickup}</Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        <View style={styles.routeItem}>
          <View style={styles.routeIconContainer}>
            <Ionicons name="location" size={16} color="#4CAF50" />
          </View>
          <View style={styles.routeTextContainer}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.routeText}>{rideDetails.destination}</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderSharedRide = () => (
    <View style={styles.sharedRideContainer}>
      {/* Passengers */}
      {rideDetails.passengers.map((passenger, index) => (
        <View key={index}>
          {/* Passenger Section */}
          <View style={styles.sharedPassengerSection}>
            <View style={styles.passengerHeader}>
              <View style={styles.passengerInfoLeft}>
                {passenger.profilePhoto &&
                passenger.profilePhoto.trim() !== "" ? (
                  <Image
                    source={{ uri: passenger.profilePhoto }}
                    style={styles.smallAvatarPlaceholder}
                    onError={() => {
                      console.log(
                        `Error loading profile photo for ${passenger.name}`
                      );
                    }}
                    defaultSource={require("@/assets/images/react-logo.png")}
                  />
                ) : (
                  <View style={styles.smallAvatarPlaceholder}>
                    <Text style={styles.smallAvatarInitial}>
                      {getInitial(passenger.name)}
                    </Text>
                  </View>
                )}
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>{passenger.name}</Text>
                </View>
              </View>
              <Text style={styles.individualFare}>
                Rs {formatFare(passenger.fare)}
              </Text>
            </View>

            {/* Locations */}
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <View style={styles.dotLineContainer}>
                  <View style={styles.pinIcon}>
                    <Ionicons name="location" size={16} color="#FF4444" />
                  </View>
                  <View style={styles.verticalLine} />
                </View>
                <Text style={styles.locationText}>{passenger.pickup}</Text>
              </View>
              <View style={styles.locationRow}>
                <View style={styles.dotLineContainer}>
                  <View style={styles.pinIcon}>
                    <Ionicons name="location" size={16} color="#4CAF50" />
                  </View>
                </View>
                <Text style={styles.locationText}>{passenger.destination}</Text>
              </View>
            </View>
          </View>

          {/* Divider between passengers */}
          {index < rideDetails.passengers.length - 1 && (
            <View style={styles.passengerDivider} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0286FF" barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Original Size Success Header */}
        <View style={styles.headerSection}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={80}
              color="#0286FF"
            />
          </View>
          <Text style={styles.headerTitle}>
            {rideDetails.rideType === "shared"
              ? "Shared Ride Completed"
              : "Ride Completed"}
          </Text>
          <Text style={styles.headerSubtitle}>Thank you for your service!</Text>
        </View>

        {/* Ride Details Card - Auto sizing */}
        <View
          style={[
            styles.detailsCard,
            rideDetails.rideType === "shared" && styles.sharedDetailsCard,
          ]}
        >
          {rideDetails.rideType === "solo"
            ? renderSoloRide()
            : renderSharedRide()}
        </View>

        {/* Original Size Fare Section */}
        <View style={styles.fareSection}>
          <View style={styles.fareContainer}>
            <View style={styles.fareHeader}>
              <Text style={styles.fareLabel}>
                {rideDetails.rideType === "shared"
                  ? "Total Fare Earned"
                  : "Fare Earned"}
              </Text>
              <MaterialCommunityIcons name="cash" size={24} color="#0286FF" />
            </View>
            <View style={styles.fareAmountContainer}>
              <Text style={styles.currencySymbol}>Rs</Text>
              <Text style={styles.fareAmount}>
                {formatFare(
                  rideDetails.rideType === "shared"
                    ? rideDetails.totalFare
                    : rideDetails.fare
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.bookAnotherButton}
            onPress={handleBookAnotherRide}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
            <Text style={styles.bookAnotherButtonText}>Book Another Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RideCompleteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0286FF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  detailsCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    // Auto height - will expand based on content
  },
  sharedDetailsCard: {
    minHeight: 200,
  },
  // Solo Ride Styles
  passengerSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  rideTypeBadge: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  routeSection: {
    marginBottom: 8,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  routeIconContainer: {
    width: 30,
    alignItems: "center",
    marginTop: 2,
  },
  routeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 12,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  routeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 0,
  },
  routeLine: {
    width: 2,
    height: 28,
    backgroundColor: "#ddd",
    marginLeft: 14,
    marginVertical: 5,
  },
  // Shared Ride Styles
  sharedRideContainer: {
    marginBottom: 0,
  },
  sharedPassengerSection: {
    marginBottom: 16,
  },
  passengerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  passengerInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  smallAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  smallAvatarInitial: {
    color: "#0286FF",
    fontSize: 16,
    fontWeight: "600",
  },
  passengerDetails: {
    flex: 1,
  },
  individualFare: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  passengerDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },
  locationContainer: {
    marginBottom: 0,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dotLineContainer: {
    width: 20,
    alignItems: "center",
    marginRight: 12,
  },
  pinIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: "#ddd",
    marginTop: 6,
    marginBottom: 1,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginTop: 0,
    lineHeight: 18,
  },
  // Fare Section
  fareSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  fareContainer: {
    backgroundColor: "#E3F2FD",
    padding: 30,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0286FF",
  },
  fareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0286FF",
  },
  fareAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0286FF",
    marginRight: 6,
  },
  fareAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0286FF",
  },
  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  bookAnotherButton: {
    backgroundColor: "#0286FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#0286FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookAnotherButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
});
