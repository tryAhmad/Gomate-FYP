import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView from 'react-native-maps';
import { RideRequestMap } from '@/components/RideRequestMap';
import { PassengerInfo } from '@/components/PassengerInfo';
import { LocationDetails } from '@/components/LocationDetails';
import { getCoordinatesFromAddress, getRouteCoordinates, getSharedRideRoute } from '@/utils/getRoute';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateTimeToNearestPickup, calculateSharedRideDistance, calculateDistanceAndTime } from '@/utils/distanceCalculation';
import Constants from 'expo-constants';
import polyline from '@mapbox/polyline';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

type RideParams = {
  rideId?: string;
  pickup?: string;
  destination?: string;
  fare?: string;
  distance?: string;
  passengerName?: string;
  profilePhoto?: string;
  timeAway?: string;
  passengerPhone?: string;
  driverLat?: string;
  driverLng?: string;
  rideType?: 'solo' | 'shared';
};

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface SharedRideStop {
  type: 'pickup' | 'destination';
  address: string;
  passengerName: string;
  fare: string;
  stopNumber: number;
  isFirstInSequence?: boolean;
  coordinate: Coordinate; 
}

export default function RideRequestPage() {
  const router = useRouter();
  const params = useLocalSearchParams() as RideParams;
  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);

  const [counterFare, setCounterFare] = useState('');
  const [pickupCoords, setPickupCoords] = useState<Coordinate[]>([]);
  const [destinationCoords, setDestinationCoords] = useState<Coordinate[]>([]);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [optimizedStops, setOptimizedStops] = useState<SharedRideStop[]>([]);
  const [sharedRideDistance, setSharedRideDistance] = useState('Calculating...');
  const [timeToPickup, setTimeToPickup] = useState('Calculating...');

  const isSharedRide = params.rideType === 'shared';

  // Parse array data for shared rides
  const pickups = isSharedRide && params.pickup ? JSON.parse(params.pickup) : [params.pickup];
  const destinations = isSharedRide && params.destination ? JSON.parse(params.destination) : [params.destination];
  const passengerNames = isSharedRide && params.passengerName ? JSON.parse(params.passengerName) : [params.passengerName];
  const fares = isSharedRide && params.fare ? JSON.parse(params.fare) : [params.fare];

  const totalFare = fares.reduce((sum: number, fare: string) => sum + (Number(fare) || 0), 0);

  useEffect(() => {
    loadRouteData();

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadRouteData = async () => {
    try {
      setIsLoading(true);

      if (!pickups.length || !destinations.length) {
        Alert.alert('Error', 'Pickup or destination data missing.');
        return;
      }

      // Get coordinates for all locations
      const pickupCoordinates = await Promise.all(
        pickups.map((pickup: string) => getCoordinatesFromAddress(pickup))
      );
      const destinationCoordinates = await Promise.all(
        destinations.map((destination: string) => getCoordinatesFromAddress(destination))
      );

      const validPickupCoords = pickupCoordinates.filter(Boolean) as Coordinate[];
      const validDestinationCoords = destinationCoordinates.filter(Boolean) as Coordinate[];

      if (validPickupCoords.length > 0 && validDestinationCoords.length > 0) {
        setPickupCoords(validPickupCoords);
        setDestinationCoords(validDestinationCoords);

        // For shared rides, calculate optimized route and stops
        if (isSharedRide) {
          await calculateOptimizedSharedRide(validPickupCoords, validDestinationCoords);
        } else {
          // Solo ride
          const route = await getRouteCoordinates(validPickupCoords[0], validDestinationCoords[0]);
          setRouteCoords(route);
        }

        // Fit map to show all points
        setTimeout(() => {
          const allCoords = [...validPickupCoords, ...validDestinationCoords];
          if (allCoords.length > 0) {
            mapRef.current?.fitToCoordinates(allCoords, {
              edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
              animated: true,
            });
          }
        }, 1000);
      } else {
        Alert.alert('Error', 'Could not fetch coordinates for the given locations.');
      }
    } catch (error) {
      console.error('Error loading route:', error);
      Alert.alert('Error', 'Failed to load route information.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOptimizedSharedRide = async (pickupCoords: Coordinate[], destinationCoords: Coordinate[]) => {
    try {
      // Get driver location from params
      const driverLocation = params.driverLat && params.driverLng ? {
        latitude: parseFloat(params.driverLat),
        longitude: parseFloat(params.driverLng)
      } : {
        latitude: 31.5204, // Default Lahore coordinates as fallback
        longitude: 74.3587
      };

      // Calculate time to nearest pickup
      const timeResult = await calculateTimeToNearestPickup(driverLocation, pickups);
      setTimeToPickup(timeResult.timeAway);

      // Calculate shared ride distance
      const distanceResult = await calculateSharedRideDistance(pickups, destinations);
      setSharedRideDistance(distanceResult.distance);

      // Determine optimized route order
      const optimizedOrder = await determineTrueOptimalRouteOrder(
        driverLocation, 
        pickupCoords, 
        destinationCoords, 
        passengerNames, 
        fares
      );
      setOptimizedStops(optimizedOrder);

      // Get route for optimized order
      const route = await calculateOptimizedRoute(optimizedOrder, pickupCoords, destinationCoords);
      setRouteCoords(route);

    } catch (error) {
      console.error('Error optimizing shared ride:', error);
      // Fallback to default order
      const defaultStops = createDefaultStops();
      setOptimizedStops(defaultStops);
      
      // Try to get a basic route
      try {
        const basicRoute = await getSharedRideRoute(pickupCoords, destinationCoords);
        setRouteCoords(basicRoute);
      } catch (routeError) {
        console.error('Error getting basic route:', routeError);
        setRouteCoords([]);
      }
    }
  };

  const calculateOptimizedRoute = async (
    optimizedOrder: SharedRideStop[],
    pickupCoords: Coordinate[],
    destinationCoords: Coordinate[]
  ): Promise<Coordinate[]> => {
    try {
      // Create an array of coordinates in the optimized order
      const orderedCoords: Coordinate[] = [];
      
      for (const stop of optimizedOrder) {
        if (stop.type === 'pickup') {
          // Add type annotation to the addr parameter
          const index = pickups.findIndex((addr: string) => addr === stop.address);
          if (index >= 0 && pickupCoords[index]) {
            orderedCoords.push(pickupCoords[index]);
          }
        } else {
          // Add type annotation to the addr parameter
          const index = destinations.findIndex((addr: string) => addr === stop.address);
          if (index >= 0 && destinationCoords[index]) {
            orderedCoords.push(destinationCoords[index]);
          }
        }
      }

      // If we have at least 2 points, create a route
      if (orderedCoords.length >= 2) {
        const origin = orderedCoords[0];
        const destination = orderedCoords[orderedCoords.length - 1];
        const waypoints = orderedCoords.slice(1, -1);
        
        if (waypoints.length > 0) {
          const waypointsStr = waypoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&waypoints=optimize:true|${waypointsStr}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.status === "OK" && data.routes && data.routes.length > 0) {
            const points = polyline.decode(data.routes[0].overview_polyline.points);
            return points.map(([latitude, longitude]) => ({ latitude, longitude }));
          }
        } else {
          // Direct route without waypoints
          return await getRouteCoordinates(origin, destination);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error calculating optimized route:', error);
      return [];
    }
  };

  const determineTrueOptimalRouteOrder = async (
    driverLocation: { latitude: number; longitude: number },
    pickupCoords: Coordinate[],
    destinationCoords: Coordinate[],
    passengerNames: string[],
    fares: string[]
  ): Promise<SharedRideStop[]> => {
    try {
      // 1. Find pickup closest to driver (this becomes stop 1)
      const pickupDistances = await Promise.all(
        pickupCoords.map(async (coord, index) => {
          try {
            const result = await calculateDistanceAndTime(
              `${driverLocation.latitude},${driverLocation.longitude}`,
              `${coord.latitude},${coord.longitude}`
            );
            return { 
              index, 
              distance: result.distanceValue, 
              coord,
              address: pickups[index],
              passengerName: passengerNames[index]
            };
          } catch (error) {
            console.warn(`Error calculating distance to pickup ${index}:`, error);
            return { 
              index, 
              distance: 1000000 + index,
              coord,
              address: pickups[index],
              passengerName: passengerNames[index]
            };
          }
        })
      );
      
      // Sort pickups by distance to driver
      const sortedPickups = [...pickupDistances].sort((a, b) => a.distance - b.distance);
      
      const firstPickup = sortedPickups[0]; 
      const secondPickup = sortedPickups[1]; 

      // 2. From second pickup (stop 2), find closest destination
      const destinationDistances = await Promise.all(
        destinationCoords.map(async (coord, index) => {
          try {
            const result = await calculateDistanceAndTime(
              `${secondPickup.coord.latitude},${secondPickup.coord.longitude}`,
              `${coord.latitude},${coord.longitude}`
            );
            return {
              index,
              distance: result.distanceValue,
              coord,
              address: destinations[index],
              passengerName: passengerNames[index]
            };
          } catch (error) {
            console.warn(`Error calculating distance to destination ${index}:`, error);
            return {
              index,
              distance: 1000000 + index,
              coord,
              address: destinations[index],
              passengerName: passengerNames[index]
            };
          }
        })
      );

      // Sort destinations by distance from second pickup
      const sortedDestinations = [...destinationDistances].sort((a, b) => a.distance - b.distance);
      
      const firstDestination = sortedDestinations[0]; 
      const secondDestination = sortedDestinations[1]; 

      return [
        {
          type: 'pickup',
          address: firstPickup.address,
          passengerName: firstPickup.passengerName,
          fare: fares[firstPickup.index],
          stopNumber: 1,
          isFirstInSequence: true,
          coordinate: firstPickup.coord
        },
        {
          type: 'pickup',
          address: secondPickup.address,
          passengerName: secondPickup.passengerName,
          fare: fares[secondPickup.index],
          stopNumber: 2,
          isFirstInSequence: false,
          coordinate: secondPickup.coord
        },
        {
          type: 'destination',
          address: firstDestination.address,
          passengerName: firstDestination.passengerName,
          fare: fares[firstDestination.index],
          stopNumber: 3,
          isFirstInSequence: true,
          coordinate: firstDestination.coord
        },
        {
          type: 'destination',
          address: secondDestination.address,
          passengerName: secondDestination.passengerName,
          fare: fares[secondDestination.index],
          stopNumber: 4,
          isFirstInSequence: false,
          coordinate: secondDestination.coord
        }
      ];
    } catch (error) {
      console.error('Error determining optimal route:', error);
      return createDefaultStops();
    }
  };

  const createDefaultStops = (): SharedRideStop[] => {
    return [
      {
        type: 'pickup',
        address: pickups[0],
        passengerName: passengerNames[0],
        fare: fares[0],
        stopNumber: 1,
        isFirstInSequence: true,
        coordinate: pickupCoords[0] || { latitude: 0, longitude: 0 }
      },
      {
        type: 'pickup',
        address: pickups[1],
        passengerName: passengerNames[1],
        fare: fares[1],
        stopNumber: 2,
        isFirstInSequence: false,
        coordinate: pickupCoords[1] || { latitude: 0, longitude: 0 }
      },
      {
        type: 'destination',
        address: destinations[0],
        passengerName: passengerNames[0],
        fare: fares[0],
        stopNumber: 3,
        isFirstInSequence: true,
        coordinate: destinationCoords[0] || { latitude: 0, longitude: 0 }
      },
      {
        type: 'destination',
        address: destinations[1],
        passengerName: passengerNames[1],
        fare: fares[1],
        stopNumber: 4,
        isFirstInSequence: false,
        coordinate: destinationCoords[1] || { latitude: 0, longitude: 0 }
      }
    ];
  };

  const getPinColor = (stopNumber: number, type: 'pickup' | 'destination') => {
    if (!isSharedRide) {
      return type === 'pickup' ? '#FF4444' : '#4CAF50';
    }

    if (type === 'pickup') {
      return '#FF4444'; 
    } else {
      return '#4CAF50'; 
    }
  };

  const getPinIcon = (stopNumber: number, type: 'pickup' | 'destination'): 'map-marker' | 'map-marker-outline' => {
    if (!isSharedRide) {
      return type === 'pickup' ? 'map-marker-outline' : 'map-marker';
    }

    // For shared rides: 
    // - Stop 1 (first pickup): outline red
    // - Stop 2 (second pickup): filled red  
    // - Stop 3 (first destination): outline green
    // - Stop 4 (second destination): filled green
    
    if (type === 'pickup') {
      return stopNumber === 1 ? 'map-marker-outline' : 'map-marker';
    } else {  
      return stopNumber === 3 ? 'map-marker-outline' : 'map-marker';
    }
  };

  const handleAcceptRide = () => {
    router.push({
      pathname: '/pickup',
      params: {
        ...params,
        rideType: isSharedRide ? 'shared' : 'solo',
      },
    });
    
    Alert.alert(
      'Ride Accepted',
      `Navigate to ${isSharedRide ? 'pickup locations' : 'pickup location'}`,
      [{ text: 'OK' }],
      { cancelable: false },
    );
  };

  const handleOfferFare = () => {
    if (!isSharedRide) {
      const offeredFare = fares[0] ? Number(fares[0]) : 0;
      const fareValue = counterFare ? Number(counterFare) : 0;

      if (!counterFare || fareValue <= 0) {
        Alert.alert('Invalid Fare', 'Please enter a valid fare amount');
        return;
      }

      if (fareValue < offeredFare) {
        Alert.alert('Invalid Fare', `Your fare must be at least Rs ${offeredFare}`);
        return;
      }

      Alert.alert('Counter Offer Sent', `Your offer of Rs ${fareValue} has been sent to the passenger.`);
      router.back();
    }
  };

  const focusOnInput = () => {
    inputRef.current?.focus();
  };

  const renderSharedRideStops = () => {
    return optimizedStops.map((stop, index) => (
      <View key={`stop-${index}`} style={styles.stopContainer}>
        <View style={styles.stopHeader}>
          <View style={styles.stopNumberContainer}>
            <Text style={styles.stopNumber}>{stop.stopNumber}</Text>
          </View>
          <View style={styles.stopInfo}>
            <Text style={styles.stopType}>
              {stop.type === 'pickup' ? 'Pickup' : 'Destination'} • {stop.passengerName}
            </Text>
            
            {stop.type === 'destination' && (
              <Text style={styles.stopFare}>Rs {stop.fare}</Text>
            )}
          </View>
        </View>
        <View style={styles.stopAddressRow}>
          <MaterialCommunityIcons 
            name={getPinIcon(stop.stopNumber, stop.type)} 
            size={20} 
            color={getPinColor(stop.stopNumber, stop.type)} 
          />
          <Text style={styles.stopAddress}>{stop.address}</Text>
        </View>
        {index < optimizedStops.length - 1 && (
          <View style={styles.stopConnector} />
        )}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      {/* Map */}
      <View style={[styles.mapContainer, isKeyboardVisible && styles.mapContainerKeyboard]}>
        <RideRequestMap
          pickupCoords={pickupCoords}
          destinationCoords={destinationCoords}
          routeCoords={routeCoords}
          isLoading={isLoading}
          mapRef={mapRef}
          getPinColor={getPinColor}
          getPinIcon={getPinIcon}
          isSharedRide={isSharedRide}
          optimizedStops={isSharedRide ? optimizedStops : []}
        />
      </View>

      {/* Ride Details Card - Non Scrollable */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[
          styles.card, 
          isSharedRide ? styles.cardShared : styles.cardSolo,
          isKeyboardVisible && styles.cardKeyboard
        ]}>
          {/* Shared Ride Header */}
          {isSharedRide && (
            <View style={styles.sharedRideHeader}>
              <View style={styles.sharedRideInfo}>
                <Text style={styles.sharedRideDistance}>Distance: {sharedRideDistance}</Text>
                <Text style={styles.sharedRideTimeAway}>{timeToPickup}</Text>
              </View>
              <Text style={styles.totalFareAmount}>Rs {totalFare}</Text>
            </View>
          )}

          {/* Content based on ride type */}
          {isSharedRide ? (
            <View style={styles.sharedRideContent}>
              {renderSharedRideStops()}
            </View>
          ) : (
            // Solo Ride Content
            <>
              {passengerNames.map((name: string, index: number) => (
                <View key={`passenger-${index}`} style={styles.passengerSection}>
                  <PassengerInfo
                    name={name}
                    profilePhoto={params.profilePhoto}
                    timeAway={params.timeAway}
                    fare={fares[index]}
                    showFare={false}
                    size="medium"
                  />
                  <LocationDetails
                    pickup={pickups[0]}
                    destination={destinations[0]}
                    distance={params.distance}
                  />
                </View>
              ))}

              {/* Fare Counter Offer (Solo Rides Only) */}
              <>
                <Text style={styles.offerText}>Offer your Fare</Text>
                <View style={styles.fareInputContainer}>
                  <View style={styles.counterRow}>
                    <Text style={styles.currencyText}>Rs</Text>
                    <TextInput
                      ref={inputRef}
                      style={styles.input}
                      value={counterFare}
                      onChangeText={setCounterFare}
                      onFocus={focusOnInput}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      placeholderTextColor="#999"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (counterFare) handleOfferFare();
                      }}
                    />
                  </View>
                  <TouchableOpacity style={styles.sendButton} onPress={handleOfferFare}>
                    <Text style={styles.sendText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </>
            </>
          )}

          {/* Accept Button */}
          <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRide}>
            <Text style={styles.acceptText}>
              {isSharedRide ? `Accept Shared Ride - Rs ${totalFare}` : `Accept for Rs ${fares[0] || '250'}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  mapContainerKeyboard: {
    flex: 0.5,
  },
  keyboardAvoidingView: {
    flex: 0,
  },
  // Card styles - non scrollable
  card: {
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardSolo: {
    maxHeight: height * 0.50,
    minHeight: height * 0.4,
  },
  cardShared: {
    maxHeight: height * 0.65,
    minHeight: height * 0.58,
  },
  cardKeyboard: {
    maxHeight: height * 0.5,
  },
  sharedRideContent: {
    flex: 1,
    marginBottom: 8, 
  },
  stopContainer: {
    marginBottom: 4, 
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stopNumberContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0286FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 2,
  },
  stopNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  stopFare: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  stopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginLeft: 36, 
    marginBottom: 4, 
  },
  stopAddress: {
    fontSize: 15,
    flex: 1,
    color: '#333',
    marginLeft: 12,
  },
  stopConnector: {
    position: 'absolute',
    width: 2,
    height: 28, 
    backgroundColor: '#BBDEFB',
    left: 11, 
    top: 32, 
    zIndex: 1, 
  },
  passengerSection: {
    marginBottom: 8,
  },
  sharedRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, 
    paddingBottom: 12, 
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  sharedRideInfo: {
    flex: 1,
  },
  sharedRideDistance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sharedRideTimeAway: {
    fontSize: 14,
    color: '#666',
  },
  totalFareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#0286FF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4, 
    marginBottom: -6,
  },
  acceptText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  offerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fareInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  counterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    height: 45,
    overflow: 'hidden',
  },
  currencyText: {
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
    paddingHorizontal: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    height: 45,
    borderRadius: 24,
    minWidth: 100,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});