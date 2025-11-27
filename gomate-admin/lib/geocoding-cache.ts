/**
 * Cached reverse geocoding for table display
 * Converts coordinates to short area names with in-memory caching
 */

interface CachedAddress {
  shortName: string;
  timestamp: number;
}

// In-memory cache: "lat,lng" -> { shortName, timestamp }
const geocodeCache = new Map<string, CachedAddress>();

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000;

/**
 * Generate cache key from coordinates
 */
function getCacheKey(lat: number, lng: number): string {
  // Round to 4 decimal places (~11m precision) to improve cache hits
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Check if cached entry is still valid
 */
function isCacheValid(entry: CachedAddress): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Extract short area name from geocoding results
 * Priority: sublocality > locality > administrative_area_level_2 > neighborhood
 */
function extractShortName(addressComponents: any[]): string {
  // Try to find the most specific location name
  const priorities = [
    "sublocality_level_1",
    "sublocality",
    "neighborhood",
    "locality",
    "administrative_area_level_2",
  ];

  for (const priority of priorities) {
    const component = addressComponents.find((c: any) =>
      c.types.includes(priority)
    );
    if (component) {
      return component.long_name;
    }
  }

  // Fallback: use first component
  if (addressComponents.length > 0) {
    return addressComponents[0].long_name;
  }

  return "Unknown";
}

/**
 * Reverse geocode to short area name with caching
 * @param lat Latitude
 * @param lng Longitude
 * @returns Short area name (e.g., "Model Town", "Gulberg") or null if failed
 */
export async function reverseGeocodeShortCached(
  lat: number,
  lng: number
): Promise<string | null> {
  const cacheKey = getCacheKey(lat, lng);

  // Check cache first
  const cached = geocodeCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.shortName;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn("Google Maps API key is not configured");
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const shortName = extractShortName(data.results[0].address_components);

      // Cache the result
      geocodeCache.set(cacheKey, {
        shortName,
        timestamp: Date.now(),
      });

      return shortName;
    } else if (data.status === "ZERO_RESULTS") {
      // Cache the "not found" result to avoid repeated calls
      geocodeCache.set(cacheKey, {
        shortName: "Unknown",
        timestamp: Date.now(),
      });
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
 * Batch reverse geocode multiple coordinate pairs
 * Useful for geocoding all rides in a table at once
 */
export async function batchReverseGeocode(
  coordinates: Array<{ lat: number; lng: number }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const uncachedCoords: Array<{ lat: number; lng: number; key: string }> = [];

  // Check cache for each coordinate
  for (const coord of coordinates) {
    const cacheKey = getCacheKey(coord.lat, coord.lng);
    const cached = geocodeCache.get(cacheKey);

    if (cached && isCacheValid(cached)) {
      results.set(cacheKey, cached.shortName);
    } else {
      uncachedCoords.push({ ...coord, key: cacheKey });
    }
  }

  // Fetch uncached coordinates (with rate limiting)
  const BATCH_SIZE = 10;
  const DELAY_MS = 100; // Small delay between batches to avoid rate limits

  for (let i = 0; i < uncachedCoords.length; i += BATCH_SIZE) {
    const batch = uncachedCoords.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async ({ lat, lng, key }) => {
      const shortName = await reverseGeocodeShortCached(lat, lng);
      if (shortName) {
        results.set(key, shortName);
      }
    });

    await Promise.all(promises);

    // Add delay between batches (except for last batch)
    if (i + BATCH_SIZE < uncachedCoords.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return results;
}

/**
 * Clear the geocoding cache
 * Useful for testing or if you want to force fresh data
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: geocodeCache.size,
    entries: Array.from(geocodeCache.entries()).map(([key, value]) => ({
      key,
      shortName: value.shortName,
      age: Date.now() - value.timestamp,
    })),
  };
}
