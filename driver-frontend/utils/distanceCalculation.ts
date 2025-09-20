import Constants from "expo-constants"

// Getting the API key from app.config.js structure
const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey

export interface DistanceTimeResult {
  distance: string
  timeAway: string
  distanceValue: number // in meters
  durationValue: number // in seconds
}

/**
 * Calculate distance and travel time between two addresses using Google Maps Distance Matrix API
 */
export const calculateDistanceAndTime = async (
  origin: string,
  destination: string,
  driverLocation?: { latitude: number; longitude: number },
): Promise<DistanceTimeResult> => {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not found")
      throw new Error("Google Maps API key not configured")
    }

    // Use driver location if provided, otherwise use origin address
    const originParam = driverLocation
      ? `${driverLocation.latitude},${driverLocation.longitude}`
      : encodeURIComponent(origin)

    const destinationParam = encodeURIComponent(destination)

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originParam}&destinations=${destinationParam}&mode=driving&units=metric&key=${GOOGLE_MAPS_API_KEY}`

    console.log("Making distance matrix request...")

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Distance Matrix response status:", data.status)

    if (data.status === "OK" && data.rows && data.rows.length > 0) {
      const element = data.rows[0].elements[0]

      if (element.status === "OK") {
        const distanceValue = element.distance.value // in meters
        const durationValue = element.duration.value // in seconds

        // Format distance
        const distanceKm = distanceValue / 1000
        const distance = distanceKm < 1 ? `${Math.round(distanceValue)} m` : `${distanceKm.toFixed(1)} KM`

        // Format time
        const durationMinutes = Math.round(durationValue / 60)
        const timeAway = durationMinutes <= 1 ? "1 min away" : `${durationMinutes} min away`

        console.log("Distance calculated:", { distance, timeAway, distanceValue, durationValue })

        return {
          distance,
          timeAway,
          distanceValue,
          durationValue,
        }
      } else {
        throw new Error(`Distance calculation failed: ${element.status}`)
      }
    } else {
      throw new Error(`Distance Matrix API failed: ${data.status} - ${data.error_message}`)
    }
  } catch (error) {
    console.error("Error calculating distance and time:", error)
    // Return fallback values
    return {
      distance: "1 KM",
      timeAway: "5 min away",
      distanceValue: 1000,
      durationValue: 300,
    }
  }
}

/**
 * Calculate distance between pickup and destination for ride distance
 */
export const calculateRideDistance = async (pickup: string, destination: string): Promise<DistanceTimeResult> => {
  return calculateDistanceAndTime(pickup, destination)
}

/**
 * Calculate time from driver's current location to pickup point
 */
export const calculateTimeToPickup = async (
  driverLocation: { latitude: number; longitude: number },
  pickupAddress: string,
): Promise<DistanceTimeResult> => {
  return calculateDistanceAndTime(pickupAddress, pickupAddress, driverLocation)
}
