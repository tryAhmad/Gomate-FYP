import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface RideRequest {
  id: string;
  pickup: string | string[];
  destination: string | string[];
  fare: number | number[];
  distance: string;
  timeAway: string;
  passengerName: string | string[];
  passengerPhone: string | string[];
  passengerId: string | string[]; // Added for socket communication
  isCalculating?: boolean;
  type: "solo" | "shared";
}

interface RideCardProps {
  ride: RideRequest;
  onViewRide: (rideId: string) => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onViewRide }) => {
  const renderSoloRide = () => {
    return (
      <>
        <View style={styles.rideHeader}>
          <View style={styles.passengerInfo}>
            <View style={styles.passengerAvatar}>
              <Text style={styles.passengerInitial}>
                {String(ride.passengerName).charAt(0)}
              </Text>
            </View>
            <View style={styles.passengerDetails}>
              <Text style={styles.passengerName}>{ride.passengerName}</Text>
              <Text style={styles.rideDistance}>{ride.distance}</Text>
              <Text style={styles.timeAway}>{ride.timeAway}</Text>
            </View>
          </View>
          <Text style={styles.fareAmount}>PKR {ride.fare as number}</Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.dotLineContainer}>
              <View style={styles.pinIcon}>
                <Ionicons name="location" size={16} color="#F44336" />
              </View>
              <View style={styles.verticalLine} />
            </View>
            <Text style={styles.locationText}>{ride.pickup as string}</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.dotLineContainer}>
              <View style={styles.pinIcon}>
                <Ionicons name="location" size={16} color="#4CAF50" />
              </View>
            </View>
            <Text style={styles.locationText}>
              {ride.destination as string}
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderSharedRide = () => {
    const passengers = ride.passengerName as string[];
    const fares = ride.fare as number[];
    const pickups = ride.pickup as string[];
    const destinations = ride.destination as string[];

    return (
      <>
        {/* Shared Ride Header with Distance and Time Away */}
        <View style={styles.sharedRideHeader}>
          <View style={styles.sharedRideInfo}>
            <Text style={styles.sharedRideDistance}>
              Distance: {ride.distance}
            </Text>
            <Text style={styles.sharedRideTimeAway}>{ride.timeAway}</Text>
          </View>
          <Text style={styles.totalFareAmount}>PKR {fares[0] + fares[1]}</Text>
        </View>

        {/* First Passenger Section */}
        <View style={styles.sharedPassengerSection}>
          <View style={styles.passengerHeader}>
            <View style={styles.passengerInfo}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.passengerInitial}>
                  {passengers[0]?.charAt(0)}
                </Text>
              </View>
              <View style={styles.passengerDetails}>
                <Text style={styles.passengerName}>{passengers[0]}</Text>
              </View>
            </View>
            <Text style={styles.individualFare}>PKR {fares[0]}</Text>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#F44336" />
                </View>
                <View style={styles.verticalLine} />
              </View>
              <Text style={styles.locationText}>{pickups[0]}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.locationText}>{destinations[0]}</Text>
            </View>
          </View>
        </View>

        {/* Separating Line */}
        <View style={styles.passengerDivider} />

        {/* Second Passenger Section */}
        <View style={styles.sharedPassengerSection}>
          <View style={styles.passengerHeader}>
            <View style={styles.passengerInfo}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.passengerInitial}>
                  {passengers[1]?.charAt(0)}
                </Text>
              </View>
              <View style={styles.passengerDetails}>
                <Text style={styles.passengerName}>{passengers[1]}</Text>
              </View>
            </View>
            <Text style={styles.individualFare}>PKR {fares[1]}</Text>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#F44336" />
                </View>
                <View style={styles.verticalLine} />
              </View>
              <Text style={styles.locationText}>{pickups[1]}</Text>
            </View>
            <View style={styles.locationRow}>
              <View style={styles.dotLineContainer}>
                <View style={styles.pinIcon}>
                  <Ionicons name="location" size={16} color="#4CAF50" />
                </View>
              </View>
              <Text style={styles.locationText}>{destinations[1]}</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={styles.rideCard}>
      {ride.type === "solo" ? renderSoloRide() : renderSharedRide()}

      <TouchableOpacity
        style={[
          styles.viewRideButton,
          ride.isCalculating && styles.viewRideButtonDisabled,
        ]}
        onPress={() => onViewRide(ride.id)}
        disabled={ride.isCalculating}
      >
        <Text style={styles.viewRideText}>
          {ride.isCalculating ? "Calculating..." : "View Ride"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rideCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
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
  sharedRideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sharedRideInfo: {
    flex: 1,
  },
  sharedRideDistance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  sharedRideTimeAway: {
    fontSize: 14,
    color: "#666",
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  sharedPassengerSection: {
    marginBottom: 12,
  },
  passengerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  passengerDivider: {
    height: 3,
    backgroundColor: "#fff",
    marginVertical: 12,
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
    backgroundColor: "#fff",
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
  individualFare: {
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
    height: 28,
    backgroundColor: "#fff",
    marginTop: 6,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginTop: 2,
    lineHeight: 18,
  },
  viewRideButton: {
    backgroundColor: "#0286FF",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 8,
  },
  viewRideButtonDisabled: {
    backgroundColor: "#ccc",
  },
  viewRideText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default RideCard;
