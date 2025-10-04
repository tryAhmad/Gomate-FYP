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
      throw new Error(`Distance Matrix API failed: ${data.status} - ${data.error_message || 'No error message'}`)
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
  // Use driver location as origin, pickup address as destination
  return calculateDistanceAndTime("", pickupAddress, driverLocation)
}

/**
 * Calculate shared ride total distance using optimized route
 */
export const calculateSharedRideDistance = async (pickups: string[], destinations: string[]): Promise<{ distance: string }> => {
  try {
    if (pickups.length !== destinations.length) {
      throw new Error("Pickups and destinations arrays must have the same length")
    }

    // For shared rides, we need to calculate an optimized route
    // This is a simplified version - in production you'd use a proper routing algorithm
    
    if (pickups.length === 1) {
      // Single passenger - use regular calculation
      const result = await calculateRideDistance(pickups[0], destinations[0])
      return { distance: result.distance }
    }

    // For multiple passengers, estimate based on average distance
    // This is a simplified calculation - real implementation would use route optimization
    let totalDistance = 0
    
    for (let i = 0; i < pickups.length; i++) {
      const result = await calculateRideDistance(pickups[i], destinations[i])
      totalDistance += result.distanceValue
    }
    
    // Apply shared ride efficiency factor (shared rides are usually more efficient)
    const optimizedDistance = totalDistance * 0.7 // 30% more efficient
    
    const distanceKm = optimizedDistance / 1000
    const distance = `${distanceKm.toFixed(1)} KM`

    console.log("Shared ride distance calculated:", { totalDistance, optimizedDistance, distance })

    return { distance }
  } catch (error) {
    console.error('Error calculating shared ride distance:', error)
    return {
      distance: "Calculating..."
    }
  }
}

/**
 * Calculate time to nearest pickup for shared rides
 */
export const calculateTimeToNearestPickup = async (
  driverCoordinates: { latitude: number; longitude: number }, 
  pickups: string[]
): Promise<{ timeAway: string }> => {
  try {
    if (!pickups || pickups.length === 0) {
      return { timeAway: "5 min away" }
    }

    // Calculate time to each pickup and find the nearest one
    const pickupResults = await Promise.all(
      pickups.map(async (pickup) => {
        try {
          const result = await calculateTimeToPickup(driverCoordinates, pickup)
          return {
            pickup,
            timeAway: result.timeAway,
            durationValue: result.durationValue
          }
        } catch (error) {
          console.warn(`Error calculating time to pickup ${pickup}:`, error)
          return {
            pickup,
            timeAway: "5 min away",
            durationValue: 300 // 5 minutes fallback
          }
        }
      })
    )

    // Find the pickup with minimum time
    const nearestPickup = pickupResults.reduce((nearest, current) => 
      current.durationValue < nearest.durationValue ? current : nearest
    )

    console.log("Nearest pickup calculated:", { 
      nearestPickup: nearestPickup.pickup, 
      timeAway: nearestPickup.timeAway 
    })

    return { timeAway: nearestPickup.timeAway }
  } catch (error) {
    console.error('Error calculating time to nearest pickup:', error)
    return { timeAway: "5 min away" }
  }
}

/**
 * Get coordinates for multiple addresses (for mapping)
 */
export const getCoordinatesForAddresses = async (addresses: string[]): Promise<{ latitude: number; longitude: number }[]> => {
  try {
    const coordinates = await Promise.all(
      addresses.map(async (address) => {
        // This would typically call a geocoding API
        // For now, return mock coordinates that increment slightly
        const baseLat = 31.5204
        const baseLng = 74.3587
        return {
          latitude: baseLat + (Math.random() * 0.01 - 0.005), // Small variation
          longitude: baseLng + (Math.random() * 0.01 - 0.005) // Small variation
        }
      })
    )
    return coordinates
  } catch (error) {
    console.error('Error getting coordinates for addresses:', error)
    // Return default coordinates as fallback
    return addresses.map(() => ({ latitude: 31.5204, longitude: 74.3587 }))
  }
}