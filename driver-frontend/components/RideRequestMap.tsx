import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'react-native';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Stop {
  type: 'pickup' | 'destination';
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
  coordinate: Coordinate;
}

export interface RideRequestMapProps {
  pickupCoords: Coordinate[];
  destinationCoords: Coordinate[];
  routeCoords: Coordinate[];
  isLoading: boolean;
  mapRef: React.RefObject<MapView | null>;
  getPinColor: (stopNumber: number, type: 'pickup' | 'destination') => string;
  getPinIcon: (stopNumber: number, type: 'pickup' | 'destination') => 'map-marker' | 'map-marker-outline';
  isSharedRide: boolean;
  optimizedStops: Stop[];
  driverLocation?: Coordinate | null;
  carRotation?: number;
  remainingRouteCoords?: Coordinate[];
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
  isSharedRide,
  optimizedStops,
  driverLocation,
  carRotation = 0,
  remainingRouteCoords = [],
}) => {
  const renderMarkers = () => {
    if (!pickupCoords || !destinationCoords) return null
    if (isSharedRide && optimizedStops && optimizedStops.length > 0) {
      // Render markers for shared ride stops
      return optimizedStops.map((stop, index) => (
        <Marker
          key={`stop-${index}`}
          coordinate={stop.coordinate}
          title={`Stop ${stop.stopNumber}`}
          description={`${stop.type === 'pickup' ? 'Pickup' : 'Destination'}: ${stop.passengerName}`}
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
      // Render markers for solo ride
      return (
        <>
          {pickupCoords.map((coord, index) => (
            <Marker
              key={`pickup-${index}`}
              coordinate={coord}
              title="Pickup Location"
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={40}
                color="#FF4444"
              />
            </Marker>
          ))}
          {destinationCoords.map((coord, index) => (
            <Marker
              key={`destination-${index}`}
              coordinate={coord}
              title="Destination"
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -12 }}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={40}
                color="#4CAF50"
              />
            </Marker>
          ))}
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Driver Location Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Location"
            description="Driver current location"
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={carRotation}
          >
            <View style={styles.driverMarker}>
              <Image 
                source={require("@/assets/car-marker.png")} 
                style={styles.carIcon} 
                resizeMode="contain" 
              />
            </View>
          </Marker>
        )}

        {/* Render pickup and destination markers */}
        {renderMarkers()}

        {/* Driver to pickup route */}
        {remainingRouteCoords.length > 0 && (
          <Polyline
            coordinates={remainingRouteCoords}
            strokeWidth={5}
            strokeColor="#007AFF"
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}

        {/* Main route */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#007AFF"
            lineCap="round"
            lineJoin="round"
            zIndex={3}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  driverMarker: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    width: 32,
    height: 32,
    tintColor: '#000000ff',
  },
});