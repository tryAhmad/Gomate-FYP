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

const snapToRoad = async (lat: number, lng: number) => {
  const url = `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lng}&key=${mapsApiKey}`;
  const response = await axios.get(url);
  const snappedPoints = response.data.snappedPoints;
  if (snappedPoints && snappedPoints.length > 0) {
    const { latitude, longitude } = snappedPoints[0].location;
    return `${latitude},${longitude}`;
  }
  return `${lat},${lng}`; // fallback
};

export const getDistanceTime = async (
  originCoords: { lat: number; lng: number },
  destinationCoords: { lat: number; lng: number },
  rideType?: string
) => {
  const origin = await snapToRoad(originCoords.lat, originCoords.lng);
  const destination = await snapToRoad(
    destinationCoords.lat,
    destinationCoords.lng
  );

  // ✅ If rideType is bike or rickshaw → avoid highways
  const avoidHighways = ["bike", "auto"].includes(
    (rideType || "").toLowerCase()
  )
    ? "&avoid=highways"
    : "";

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&departure_time=now&traffic_model=best_guess${avoidHighways}&key=${mapsApiKey}`;

  const response = await axios.get(url);

  if (response.data.status === "OK") {
    const element = response.data.rows[0].elements[0];
    return {
      distance: element.distance,
      duration: element.duration_in_traffic || element.duration,
      status: element.status,
    };
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

