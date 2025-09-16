import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  Switch,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

interface RideRequest {
  id: string;
  pickup: string;
  destination: string;
  fare: number;
  distance: string;
  timeAgo: string;
  passengerName: string;
  passengerRating: number;
}

// Mock ride data
const mockRides: RideRequest[] = [
  {
    id: '1',
    pickup: 'Garhi Shahu, Lahore',
    destination: 'Faiz Road 12 (Muslim Town)',
    fare: 250,
    distance: '1 KM',
    timeAgo: 'Just Now',
    passengerName: 'Adil',
    passengerRating: 4.8,
  },
  {
    id: '2',
    pickup: 'Eden Villas',
    destination: 'K Block, Lake City',
    fare: 540,
    distance: '2 KM',
    timeAgo: '5 min ago',
    passengerName: 'Ahmad',
    passengerRating: 4.5,
  },
  {
    id: '3',
    pickup: 'Wapda Town',
    destination: 'G1, Johar Town',
    fare: 400,
    distance: '2.5 KM',
    timeAgo: '1 min ago',
    passengerName: 'Ali',
    passengerRating: 4.9,
  },
  {
    id: '4',
    pickup: 'Nargis Block, Allama Iqbal Town',
    destination: 'Kareem Block',
    fare: 750,
    distance: '0.5 KM',
    timeAgo: '3 min ago',
    passengerName: 'Umer',
    passengerRating: 4.7,
  },
  {
    id: '5',
    pickup: 'St 14, A Block, Model Town',
    destination: 'Tulip Block, Bahria Town',
    fare: 1120,
    distance: '1 KM',
    timeAgo: '7 min ago',
    passengerName: 'Adil',
    passengerRating: 4.6,
  },
];

const DriverLandingPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [availableRides, setAvailableRides] = useState<RideRequest[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');
  const [slideAnim] = useState(new Animated.Value(-width * 0.7));
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  // Get current location
  useEffect(() => {
    const getLocation = async () => {
      try {
        // First, check if we already have permission
        let { status } = await Location.getForegroundPermissionsAsync();
        
        // If we don't have permission, request it
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          status = newStatus;
        }

        if (status !== 'granted') {
          setCurrentLocation('Location permission denied');
          setIsLocationLoaded(true);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const locationString = `${address.street || ''} ${address.city || ''}, ${address.region || ''}`.trim();
          setCurrentLocation(locationString || 'Unknown location');
        }
        
        setIsLocationLoaded(true);
        setIsOnline(true); // Automatically turn online after getting location
      } catch (error) {
        setCurrentLocation('Unable to get location');
        setIsLocationLoaded(true);
      }
    };

    getLocation();
  }, []);

  // Simulate real-time ride updates
  useEffect(() => {
    if (isOnline) {
      setAvailableRides(mockRides);
      // Simulate new rides coming in
      const interval = setInterval(() => {
        setAvailableRides(prev => [...prev]);
      }, 10000);
      return () => clearInterval(interval);
    } else {
      setAvailableRides([]);
    }
  }, [isOnline]);

  const handleToggleOnline = () => {
    if (isLocationLoaded) {
      setIsOnline(!isOnline);
    }
  };

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    console.log('Opening profile...');
    // router.push('/profile'); // Add your navigation logic here
  };

  const handleViewRide = (rideId: string) => {
    // Navigate to ride details page
    console.log(`Navigating to ride details for ride ID: ${rideId}`);
    // router.push(`/ride-details/${rideId}`); // Add your navigation logic here
  };

  const renderSidebar = () => (
    <Modal
      animationType="none"
      transparent={true}
      visible={sidebarVisible}
      onRequestClose={closeSidebar}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={closeSidebar}
      >
        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          >
            <View style={styles.sidebarHeader}>
              <TouchableOpacity style={styles.profileSection} onPress={handleProfileClick}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>A</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Ahmad</Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="time-outline" size={20} color="#333" />
                <Text style={styles.menuText}>Ride History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="cash-outline" size={20} color="#333" />
                <Text style={styles.menuText}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
                <Text style={styles.menuText}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={20} color="#333" />
                <Text style={styles.menuText}>Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="log-out-outline" size={20} color="#333" />
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.switchModeButton}>
              <Text style={styles.switchModeText}>Switch to Rider mode</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  const renderRideCard = (ride: RideRequest) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.passengerInfo}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerInitial}>
              {ride.passengerName.charAt(0)}
            </Text>
          </View>
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{ride.passengerName}</Text>
            <Text style={styles.rideDistance}>{ride.distance}</Text>
            <Text style={styles.timeAgo}>{ride.timeAgo}</Text>
          </View>
        </View>
        <Text style={styles.fareAmount}>PKR {ride.fare}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.dotLineContainer}>
            <View style={styles.greenDot} />
            <View style={styles.verticalLine} />
          </View>
          <Text style={styles.locationText}>{ride.pickup}</Text>
        </View>
        <View style={styles.locationRow}>
          <View style={styles.dotLineContainer}>
            <View style={styles.redDot} />
          </View>
          <Text style={styles.locationText}>{ride.destination}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewRideButton}
        onPress={() => handleViewRide(ride.id)}
      >
        <Text style={styles.viewRideText}>View Ride</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOfflineContent = () => (
    <View style={styles.offlineContainer}>
      <Ionicons name="car-outline" size={80} color="#ccc" />
      <Text style={styles.offlineTitle}>You&apos;re Offline</Text>
      <Text style={styles.offlineSubtitle}>
        Turn online to start receiving ride requests
      </Text>
    </View>
  );

  const renderNoRidesContent = () => (
    <View style={styles.noRidesContainer}>
      <Ionicons name="car-outline" size={60} color="#ccc" />
      <Text style={styles.noRidesText}>No rides available</Text>
      <Text style={styles.noRidesSubtext}>
        Stay online and we&apos;ll notify you when rides are available
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={openSidebar}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={!isLocationLoaded}
            trackColor={{ false: '#767577', true: '#007AFF' }}
            thumbColor={isOnline ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.profileButton} onPress={handleProfileClick}>
          <View style={styles.headerProfileImage}>
            <Text style={styles.headerProfileInitial}>A</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isOnline ? (
          <>
            <View style={styles.titleContainer}>
              <Text style={styles.sectionTitle}>Available Rides</Text>
              <View style={styles.currentLocationContainer}>
                <Ionicons name="location" size={12} color="#666" />
                <Text style={styles.currentLocationText} numberOfLines={1}>
                  {currentLocation}
                </Text>
              </View>
            </View>
            <View style={styles.spacer} />
            {availableRides.length > 0 ? (
              availableRides.map(renderRideCard)
            ) : (
              renderNoRidesContent()
            )}
          </>
        ) : (
          renderOfflineContent()
        )}
      </ScrollView>

      {renderSidebar()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  profileButton: {
    padding: 4,
  },
  headerProfileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileInitial: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  currentLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '45%',
  },
  currentLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    textAlign: 'right',
  },
  spacer: {
    height: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  passengerInitial: {
    fontWeight: '600',
    fontSize: 16,
    color: '#007AFF',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rideDistance: {
    fontSize: 12,
    color: '#666',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dotLineContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: '#ccc',
    marginTop: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginTop: -2,
  },
  viewRideButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewRideText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  offlineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  noRidesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noRidesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noRidesSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: width * 0.7,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'flex-start',
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  switchModeButton: {
    margin: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  switchModeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DriverLandingPage;