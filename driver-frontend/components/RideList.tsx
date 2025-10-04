import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import RideCard, { RideRequest } from "./RideCard"

interface RideListProps {
  rides: RideRequest[]
  onViewRide: (rideId: string) => void
  currentLocation: string
}

const RideList: React.FC<RideListProps> = ({ 
  rides, 
  onViewRide, 
  currentLocation 
}) => {
  const renderNoRidesContent = () => (
    <View style={styles.noRidesContainer}>
      <Ionicons name="car-outline" size={60} color="#ccc" />
      <Text style={styles.noRidesText}>No rides available</Text>
      <Text style={styles.noRidesSubtext}>
        Stay online and we&apos;ll notify you when rides are available
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Title Section - Moved outside ScrollView for fixed positioning */}
      <View style={styles.titleContainer}>
        <Text style={styles.sectionTitle}>Available Rides</Text>
        <View style={styles.currentLocationContainer}>
          <Ionicons name="location" size={12} color="#666" />
          <Text style={styles.currentLocationText} numberOfLines={1}>
            {currentLocation}
          </Text>
        </View>
      </View>
      
      {/* Rides List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {rides.length > 0 ? (
          rides.map((ride) => (
            <RideCard 
              key={ride.id} 
              ride={ride} 
              onViewRide={onViewRide}
            />
          ))
        ) : (
          renderNoRidesContent()
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  currentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "45%",
  },
  currentLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  noRidesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noRidesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  noRidesSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
})

export default RideList