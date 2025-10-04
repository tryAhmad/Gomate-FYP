import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LocationDetailsProps {
  pickup: string;
  destination: string;
  distance?: string;
  pickupColor?: string;
  destinationColor?: string;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  pickup,
  destination,
  distance,
  pickupColor = '#FF4444',
  destinationColor = '#4CAF50',
}) => {
  return (
    <View style={styles.locationSection}>
      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={22} color={pickupColor} />
        <Text style={styles.locationText}>{pickup}</Text>
      </View>

      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker" size={22} color={destinationColor} />
        <Text style={styles.locationText}>{destination}</Text>
      </View>

      {distance && <Text style={styles.distanceText}>Distance: {distance}</Text>}
    </View>
  );
};

const styles = {
  locationSection: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
    color: '#333',
    marginLeft: 12,
  },
  distanceText: {
    fontSize: 12,
    color: 'grey',
    marginLeft: 16,
    marginBottom: 8,
  },
};