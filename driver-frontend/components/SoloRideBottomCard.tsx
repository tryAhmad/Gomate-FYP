import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

interface SoloRideBottomCardProps {
  passengerName?: string;
  profilePhoto?: string;
  pickup?: string;
  destination?: string;
  distance?: string;
  fare?: string;
  hasArrived: boolean;
  rideStarted: boolean;
  onCall: () => void;
  onWhatsApp: () => void;
  onCancel: () => void;
  onImHere: () => void;
  onStartRide: () => void;
  onEndRide: () => void;
}

export const SoloRideBottomCard: React.FC<SoloRideBottomCardProps> = ({
  passengerName,
  profilePhoto,
  pickup,
  destination,
  distance,
  fare,
  hasArrived,
  rideStarted,
  onCall,
  onWhatsApp,
  onCancel,
  onImHere,
  onStartRide,
  onEndRide,
}) => {
  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P";

  return (
    <View style={styles.container}>
      {/* Passenger Info */}
      <View style={styles.passengerRow}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {getInitial(passengerName)}
            </Text>
          </View>
        )}
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>
            {passengerName || "Passenger"}
          </Text>
        </View>

        {/* Contact Buttons - Hidden during ride */}
        {!rideStarted && (
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={onCall}>
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={onWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location Details - This section will always be visible at minimum height */}
      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={22}
            color="red"
          />
          <Text style={styles.locationText}>{pickup || "Pickup Location"}</Text>
        </View>

        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker" size={22} color="green" />
          <Text style={styles.locationText}>
            {destination || "Destination"}
          </Text>
        </View>

        {distance && (
          <Text style={styles.distanceText}>Distance: {distance}</Text>
        )}
      </View>

      {/* Fare Section - This can be scrolled out of view */}
      <View style={styles.fareSection}>
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Fare</Text>
          <View style={styles.fareAmountContainer}>
            <Text style={styles.currencySymbol}>Rs</Text>
            <Text style={styles.fareAmount}>{fare || "250"}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {rideStarted ? (
        <View style={styles.singleButtonContainer}>
          <TouchableOpacity style={styles.endRideButton} onPress={onEndRide}>
            <Text style={styles.endRideButtonText}>End Ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          {hasArrived ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onStartRide}
            >
              <Text style={styles.primaryButtonText}>Start Ride</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={onImHere}>
              <Text style={styles.primaryButtonText}>I&apos;m here</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
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
    padding: 20,
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
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
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
    fontSize: 26,
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
  primaryButton: {
    flex: 1,
    backgroundColor: "#0286FF",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
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
});
