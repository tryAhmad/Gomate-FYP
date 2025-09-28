import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
} from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"

const { width, height } = Dimensions.get("window")

type RideCompleteParams = {
  pickup?: string
  destination?: string
  fare?: string
  passengerName?: string
  profilePhoto?: string
}

const RideCompleteScreen: React.FC = () => {
  const router = useRouter()
  const params = useLocalSearchParams() as RideCompleteParams

  const [rideDetails, setRideDetails] = useState({
    pickup: params.pickup || "Unknown Pickup",
    destination: params.destination || "Unknown Destination", 
    fare: params.fare || "250",
    passengerName: params.passengerName || "Passenger",
    profilePhoto: params.profilePhoto || "",
  })

  useEffect(() => {
    // Here you could fetch additional ride details from your API if needed
    console.log("[RIDE_COMPLETE] Ride completed with details:", rideDetails)
    
    // Optional: Send completion status to backend
    // submitRideCompletion(rideDetails)
  }, [])

  const handleBookAnotherRide = () => {
    console.log("[RIDE_COMPLETE] Navigating to landing page for new ride")
    router.replace("/landing-page" as any)
  }

  const getInitial = (name?: string) => name?.charAt(0).toUpperCase() || "P"

  const formatFare = (fare: string) => {
    // Remove any existing currency symbols and format
    const numericFare = fare.replace(/[^\d]/g, "")
    return numericFare || "250"
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0286FF" barStyle="light-content" />
      
      {/* Success Header */}
      <View style={styles.headerSection}>
        <View style={styles.successIconContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#0286FF" />
        </View>
        <Text style={styles.headerTitle}>Ride Completed</Text>
        <Text style={styles.headerSubtitle}>Thank you for your service!</Text>
      </View>

      {/* Ride Details Card */}
      <View style={styles.detailsCard}>
        {/* Passenger Info */}
        <View style={styles.passengerSection}>
          {rideDetails.profilePhoto ? (
            <Image source={{ uri: rideDetails.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{getInitial(rideDetails.passengerName)}</Text>
            </View>
          )}
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{rideDetails.passengerName}</Text>
          </View>
        </View>

        {/* Trip Route */}
        <View style={styles.routeSection}>
          <View style={styles.routeItem}>
            <View style={styles.routeIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#FF4444" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeText}>{rideDetails.pickup}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeItem}>
            <View style={styles.routeIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#4CAF50" />
            </View>
            <View style={styles.routeTextContainer}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeText}>{rideDetails.destination}</Text>
            </View>
          </View>
        </View>

        {/* Fare Section */}
        <View style={styles.fareSection}>
          <View style={styles.fareContainer}>
            <View style={styles.fareHeader}>
              <Text style={styles.fareLabel}>Total Fare Earned</Text>
              <MaterialCommunityIcons name="cash" size={24} color="#0286FF" />
            </View>
            <View style={styles.fareAmountContainer}>
              <Text style={styles.currencySymbol}>Rs</Text>
              <Text style={styles.fareAmount}>{formatFare(rideDetails.fare)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={styles.bookAnotherButton} onPress={handleBookAnotherRide}>
          <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
          <Text style={styles.bookAnotherButtonText}>Book Another Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: "#fff",
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
  },
  passengerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
  fareSection: {
    marginBottom: 24,
  },
  fareContainer: {
    backgroundColor: "#E3F2FD",
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#0286FF",
    marginTop: 12,
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
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
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
})

export default RideCompleteScreen