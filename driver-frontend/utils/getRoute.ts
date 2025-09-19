import Constants from 'expo-constants';
import polyline from '@mapbox/polyline';

// Getting the API key from app.config.js structure
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;

console.log('API Key available:', !!GOOGLE_MAPS_API_KEY);

export interface Coordinate {
  latitude: number;
  longitude: number;
}

 {/* Get coordinates from address using Google Geocoding API*/}
export const getCoordinatesFromAddress = async (address: string): Promise<Coordinate | null> => {
  try {
    console.log('Getting coordinates for:', address);
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found');
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Making geocoding request to:', url.substring(0, 100) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Geocoding response status:', data.status);

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = {
        latitude: location.lat,
        longitude: location.lng,
      };
      console.log('Coordinates found:', coords);
      return coords;
    } else {
      console.error('Geocoding failed:', data.status, data.error_message);
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message}`);
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

 {/* Get route coordinates between two points using Google Directions API*/}
export const getRouteCoordinates = async (
  origin: Coordinate,
  destination: Coordinate
): Promise<Coordinate[]> => {
  try {
    console.log('Getting route from:', origin, 'to:', destination);
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found');
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    console.log('Making directions request...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Directions response status:', data.status);

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const points = polyline.decode(data.routes[0].overview_polyline.points);
      const routeCoords = points.map(([latitude, longitude]) => ({ latitude, longitude }));
      console.log('Route found with', routeCoords.length, 'points');
      return routeCoords;
    } else {
      console.error('Directions failed:', data.status, data.error_message);
      throw new Error(`Directions failed: ${data.status} - ${data.error_message}`);
    }
  } catch (error) {
    console.error('Error fetching route:', error);
    throw error;
  }
};