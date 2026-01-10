// utils/rideConverter.ts - Convert backend ride format to frontend RideRequest format

import { RideRequest } from "@/components/RideCard";

interface BackendRide {
  _id: string;
  passengerID: {
    username: string;
    _id: string;
    phone?: string;
    profilePicture?: string;
  };
  rideType: "car" | "motorcycle" | "auto";
  rideMode: "solo" | "shared";
  pickupLocation: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  dropoffLocation: {
    type: "Point";
    coordinates: [number, number];
  };
  fare: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

interface BackendPassenger {
  username: string;
  _id: string;
  phone?: string;
  phoneNumber?: string; // Backend uses phoneNumber
  profilePicture?: string;
}

interface NewRideRequestData {
  ride: BackendRide;
  passenger: BackendPassenger;
}

/**
 * Convert backend ride format to frontend RideRequest format
 */
export const convertBackendRideToFrontend = (
  data: NewRideRequestData,
  pickupAddress: string,
  dropoffAddress: string,
  distance: string = "Calculating...",
  timeAway: string = "Calculating..."
): RideRequest => {
  const { ride, passenger } = data;

  console.log(
    "🔍 [CONVERTER] Full passenger object:",
    JSON.stringify(passenger, null, 2)
  );
  console.log("🔍 [CONVERTER] passenger.phoneNumber:", passenger.phoneNumber);
  console.log("🔍 [CONVERTER] passenger.phone:", passenger.phone);

  const extractedPhone = passenger.phoneNumber || passenger.phone || "N/A";
  console.log("🔍 [CONVERTER] Extracted phone:", extractedPhone);

  return {
    id: ride._id,
    pickup: pickupAddress,
    destination: dropoffAddress,
    fare: ride.fare,
    distance,
    timeAway,
    passengerName: passenger.username,
    passengerPhone: extractedPhone,
    passengerId: passenger._id, // Added for socket communication
    profilePhoto: passenger.profilePicture || ride.passengerID.profilePicture,
    isCalculating: true, // Will be updated after distance calculation
    type: ride.rideMode, // "solo" or "shared"
  };
};

/**
 * Extract coordinates from backend ride
 */
export const extractCoordinates = (ride: BackendRide) => {
  return {
    pickup: {
      latitude: ride.pickupLocation.coordinates[1], // lat
      longitude: ride.pickupLocation.coordinates[0], // lng
    },
    dropoff: {
      latitude: ride.dropoffLocation.coordinates[1],
      longitude: ride.dropoffLocation.coordinates[0],
    },
  };
};
