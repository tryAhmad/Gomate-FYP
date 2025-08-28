import axios from "axios";
import Constants from "expo-constants";

const mapsApiKey = Constants.expoConfig?.extra?.MAPS_API_KEY;

// Put your key in app.json -> extra or in .env with expo-env

export const getAddressCoordinate = async (address: string) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${mapsApiKey}`;
  const response = await axios.get(url);
  if (response.data.status === "OK") {
    const loc = response.data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  }
  throw new Error("Unable to fetch coordinates");
};

export const getDistanceTime = async (origin: string, destination: string) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${mapsApiKey}`;
  const response = await axios.get(url);
  if (response.data.status === "OK") {
    return response.data.rows[0].elements[0]; // {distance, duration, status}
  }
  throw new Error("Unable to fetch distance and time");
};

export const getAutoCompleteSuggestions = async (input: string) => {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&location=31.5497,74.3436&radius=20000&components=country:pk&key=${mapsApiKey}`;
  const response = await axios.get(url);
  if (response.data.status === "OK") {
    return response.data.predictions
      .filter((p: any) => p.description.includes("Lahore"))
      .map((p: any) => p.description);
  }
  return [];
};


// New function for reverse geocoding
export const reverseGeocode = async (latitude: number, longitude: number) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${mapsApiKey}`;
  const response = await axios.get(url);
  if (response.data.status === "OK" && response.data.results.length > 0) {
    const lahoreResult = response.data.results.find((r: any) =>
      r.formatted_address.includes("Lahore")
    );
    return lahoreResult ? lahoreResult.formatted_address : null;
  }
  throw new Error("Unable to reverse geocode coordinates");
};

