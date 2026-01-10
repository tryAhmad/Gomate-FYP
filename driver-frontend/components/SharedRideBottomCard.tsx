import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Stop {
  type: "pickup" | "destination";
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
  completed?: boolean;
  coordinate: Coordinate;
  passengerPhone?: string;
  isFirstInSequence?: boolean;
  passengerId?: string;
}

interface SharedRideBottomCardProps {
  stops: Stop[];
  currentStopIndex: number;
  onNextStop: () => void;
  onEndRide: () => void;
  onCancel: () => void;
  onCall: (phoneNumber?: string) => void;
  onWhatsApp: (phoneNumber?: string, passengerName?: string) => void;
}

export const SharedRideBottomCard: React.FC<SharedRideBottomCardProps> = ({
  stops,
  currentStopIndex,
  onNextStop,
  onEndRide,
  onCancel,
  onCall,
  onWhatsApp,
}) => {
  const currentStop = stops[currentStopIndex];
  const isLastStop = currentStopIndex === stops.length - 1;

  if (!currentStop) {
    return (
      <View style={styles.container}>
        <Text>Loading stops...</Text>
      </View>
    );
  }

  const getStopIcon = (stop: Stop) => {
    if (stop.type === "pickup") {
      return stop.stopNumber === 1 ? "map-marker-outline" : "map-marker";
    } else {
      return stop.stopNumber === 3 ? "map-marker-outline" : "map-marker";
    }
  };

  const getStopColor = (stop: Stop) => {
    return stop.type === "pickup" ? "#FF4444" : "#4CAF50";
  };

  const getButtonText = () => {
    const currentStop = stops[currentStopIndex];
    if (!currentStop) return "Continue";

    if (currentStop.type === "pickup") {
      if (currentStop.completed) {
        return "Start Ride";
      }
      return "I'm here";
    }

    if (currentStop.type === "destination") {
      if (isLastStop) {
        return `Collect Rs ${currentStop.fare} and End Ride`;
      }
      return `Collect Rs ${currentStop.fare}`;
    }

    return "Continue";
  };

  const shouldShowCancelButton = () => {
    return currentStopIndex === 0 && !stops[0].completed;
  };

  const shouldShowContactButtons = () => {
    return currentStop.type === "pickup";
  };

  const shouldShowEndRideButton = () => {
    return (
      isLastStop && currentStop.type === "destination" && currentStop.completed
    );
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content Area */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Stop Section */}
        <View style={styles.currentStopSection}>
          <View style={styles.currentStopHeader}>
            <View style={styles.stopNumberBadge}>
              <Text style={styles.stopNumberText}>
                {currentStop.stopNumber}
              </Text>
            </View>
            <View style={styles.currentStopInfo}>
              <Text style={styles.currentStopType}>
                {currentStop.type === "pickup" ? "Pickup" : "Destination"} •{" "}
                {currentStop.passengerName}
              </Text>
              {currentStop.type === "destination" && (
                <Text style={styles.fareAmount}>Rs {currentStop.fare}</Text>
              )}
            </View>

            {/* Contact Buttons for Pickup Stops */}
            {shouldShowContactButtons() && (
              <View style={styles.contactButtons}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => onCall(currentStop.passengerPhone)}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() =>
                    onWhatsApp(
                      currentStop.passengerPhone,
                      currentStop.passengerName
                    )
                  }
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.addressContainer}>
            <MaterialCommunityIcons
              name={getStopIcon(currentStop)}
              size={22}
              color={getStopColor(currentStop)}
            />
            <Text style={styles.addressText}>{currentStop.address}</Text>
          </View>
        </View>

        {/* All Stops Progress */}
        <View style={styles.allStopsContainer}>
          <Text style={styles.progressTitle}>Route Progress</Text>
          {stops.map((stop, index) => (
            <View key={`stop-${index}`} style={styles.stopItem}>
              <View
                style={[
                  styles.stopDot,
                  stop.completed
                    ? styles.completedDot
                    : index === currentStopIndex
                    ? styles.activeDot
                    : styles.incompleteDot,
                ]}
              >
                {stop.completed ? (
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stopDotNumber,
                      stop.completed && styles.completedDotNumber,
                    ]}
                  >
                    {stop.stopNumber}
                  </Text>
                )}
              </View>
              <View style={styles.stopDetails}>
                <Text
                  style={[
                    styles.stopLabel,
                    index === currentStopIndex && styles.activeStopLabel,
                    stop.completed && styles.completedStopLabel,
                    !stop.completed &&
                      index !== currentStopIndex &&
                      styles.incompleteStopLabel,
                  ]}
                  numberOfLines={1}
                >
                  {stop.type === "pickup" ? "Pickup" : "Drop"} •{" "}
                  {stop.passengerName}
                </Text>
                <Text
                  style={[
                    styles.stopAddressSmall,
                    stop.completed && styles.completedAddressSmall,
                  ]}
                  numberOfLines={1}
                >
                  {stop.address}
                </Text>
              </View>
              {stop.type === "destination" && (
                <Text
                  style={[
                    styles.stopFareSmall,
                    stop.completed && styles.completedFareSmall,
                  ]}
                >
                  Rs {stop.fare}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View style={styles.actionButtons}>
        {shouldShowCancelButton() ? (
          // Initial state: Cancel + I'm Here buttons
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={onNextStop}>
              <Text style={styles.primaryButtonText}>{getButtonText()}</Text>
            </TouchableOpacity>
          </>
        ) : shouldShowEndRideButton() ? (
          // Final state: End Ride button only
          <TouchableOpacity style={styles.endRideButton} onPress={onEndRide}>
            <Text style={styles.endRideButtonText}>End Ride</Text>
          </TouchableOpacity>
        ) : (
          // Intermediate states: Single primary button
          <TouchableOpacity style={styles.fullWidthButton} onPress={onNextStop}>
            <Text style={styles.fullWidthButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: height * 0.65,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 8,
  },
  currentStopSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0286FF",
  },
  currentStopHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stopNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0286FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stopNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  currentStopInfo: {
    flex: 1,
  },
  currentStopType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0286FF",
  },
  contactButtons: {
    flexDirection: "row",
    gap: 8,
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0286FF",
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
  },
  allStopsContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 40,
  },
  stopDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  completedDot: {
    backgroundColor: "#4CAF50",
  },
  activeDot: {
    backgroundColor: "#0286FF",
  },
  stopDotNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  completedDotNumber: {
    color: "#fff",
  },
  stopDetails: {
    flex: 1,
    justifyContent: "center",
    minHeight: 40,
  },
  stopLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 2,
  },
  activeStopLabel: {
    color: "#0286FF",
    fontWeight: "600",
  },
  completedStopLabel: {
    color: "#4CAF50",
  },
  stopAddressSmall: {
    fontSize: 12,
    color: "#999",
  },
  stopFareSmall: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E3F2FD",
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
  cancelText: {
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
  fullWidthButton: {
    flex: 1,
    backgroundColor: "#0286FF",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  fullWidthButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  endRideButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: "center",
  },
  endRideButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  incompleteDot: {
    backgroundColor: "#E0E0E0",
  },
  incompleteStopLabel: {
    color: "#666",
  },
  completedAddressSmall: {
    color: "#888",
  },
  completedFareSmall: {
    color: "#888",
  },
});
