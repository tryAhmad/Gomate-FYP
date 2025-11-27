/**
 * Reverse geocoding utility using Google Maps Geocoding API
 * Converts coordinates (lat, lng) to human-readable addresses
 */

interface GeocodingResult {
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GeocodingResponse {
  results: GeocodingResult[];
  status: string;
}

/**
 * Reverse geocode coordinates to a formatted address
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted address string or null if failed
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is not configured");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      // Return the first (most specific) formatted address
      return data.results[0].formatted_address;
    } else if (data.status === "ZERO_RESULTS") {
      console.warn("No address found for coordinates:", lat, lng);
      return null;
    } else {
      console.error("Geocoding failed with status:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}

/**
 * Get a short version of the address (e.g., street + city)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Short formatted address or null if failed
 */
export async function reverseGeocodeShort(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API key is not configured");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResponse = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const components = data.results[0].address_components;

      // Try to extract street and city
      const street = components.find((c) =>
        c.types.includes("route")
      )?.long_name;
      const city = components.find((c) =>
        c.types.includes("locality")
      )?.long_name;

      if (street && city) {
        return `${street}, ${city}`;
      }

      // Fallback to full address
      return data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}
