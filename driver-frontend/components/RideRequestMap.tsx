import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Coordinate {
  latitude: number;
  longitude: number;
}

type MaterialIconName = 'map-marker' | 'map-marker-outline';

interface SharedRideStop {
  type: 'pickup' | 'destination';
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
  isFirstInSequence?: boolean;
  coordinate: Coordinate; 
}

interface RideRequestMapProps {
  pickupCoords: Coordinate[];
  destinationCoords: Coordinate[];
  routeCoords: Coordinate[];
  isLoading: boolean;
  mapRef: React.RefObject<MapView | null>;
  getPinColor: (stopNumber: number, type: 'pickup' | 'destination') => string;
  getPinIcon: (stopNumber: number, type: 'pickup' | 'destination') => MaterialIconName;
  isSharedRide?: boolean;
  optimizedStops?: SharedRideStop[];
}

const DEFAULT_REGION = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const RideRequestMap: React.FC<RideRequestMapProps> = ({
  pickupCoords,
  destinationCoords,
  routeCoords,
  isLoading,
  mapRef,
  getPinColor,
  getPinIcon,
  isSharedRide = false,
  optimizedStops = [],
}) => {
  
  // For shared rides with optimized stops, use the optimized order
  // For solo rides or before optimization, use the original order
  const renderMarkers = () => {
    if (isSharedRide && optimizedStops.length > 0) {
      // Render optimized stops in order
      return optimizedStops.map((stop) => (
        <Marker
          key={`optimized-stop-${stop.stopNumber}`}
          coordinate={stop.coordinate}
          title={`${stop.type === 'pickup' ? 'Pickup' : 'Destination'} ${stop.stopNumber}`}
          description={stop.passengerName}
          anchor={{ x: 0.5, y: 1 }}
          centerOffset={{ x: 0, y: -12 }}
        >
          <MaterialCommunityIcons 
            name={getPinIcon(stop.stopNumber, stop.type)}
            size={40} 
            color={getPinColor(stop.stopNumber, stop.type)} 
          />
        </Marker>
      ));
    } else {
      // Fallback: render original pickup and destination markers
      return (
        <>
          {/* Pickup Markers */}
          {pickupCoords.map((coord, index) => (
            <Marker
              key={`pickup-${index}`}
              coordinate={coord}
              title={`Pickup ${index + 1}`}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons 
                name={getPinIcon(index + 1, 'pickup')}
                size={40} 
                color={getPinColor(index + 1, 'pickup')} 
              />
            </Marker>
          ))}

          {/* Destination Markers */}
          {destinationCoords.map((coord, index) => (
            <Marker
              key={`destination-${index}`}
              coordinate={coord}
              title={`Destination ${index + 1}`}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons 
                name={getPinIcon(index + 3, 'destination')}
                size={40} 
                color={getPinColor(index + 3, 'destination')} 
              />
            </Marker>
          ))}
        </>
      );
    }
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {renderMarkers()}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline 
            coordinates={routeCoords} 
            strokeWidth={4} 
            strokeColor="#007AFF" 
          />
        )}
      </MapView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  mapContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
};