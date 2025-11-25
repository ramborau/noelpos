// Default laundry location (Euro Plaza Building, Riffa, Bahrain)
export const DEFAULT_LAUNDRY_LOCATION = {
  lat: 26.125805,
  lng: 50.562897,
  address: 'Euro Plaza Building, Block 923, Bukuwarah, Deebel Avenue, Riffa, Bahrain'
};

export interface DistanceResult {
  distance: string; // e.g., "5.2 km"
  duration: string; // e.g., "12 mins"
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

// Get laundry location from localStorage or use default
export function getLaundryLocation(): { lat: number; lng: number; address: string } {
  if (typeof window === 'undefined') {
    return DEFAULT_LAUNDRY_LOCATION;
  }

  try {
    const stored = localStorage.getItem('laundryLocation');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }

  return DEFAULT_LAUNDRY_LOCATION;
}

// Save laundry location to localStorage
export function saveLaundryLocation(location: { lat: number; lng: number; address: string }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('laundryLocation', JSON.stringify(location));
}

// Calculate distance using Google Maps Distance Matrix API (server-side proxy)
export async function calculateDistance(
  destinationLat: number,
  destinationLng: number
): Promise<DistanceResult | null> {
  const laundry = getLaundryLocation();

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/distance/calculate.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: laundry.lat, lng: laundry.lng },
        destination: { lat: destinationLat, lng: destinationLng }
      })
    });

    const data = await response.json();

    if (data.success) {
      return {
        distance: data.distance,
        duration: data.duration,
        distanceValue: data.distanceValue,
        durationValue: data.durationValue
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Calculate straight-line distance (Haversine formula) as fallback
export function calculateStraightLineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

// Get quick distance estimate using Haversine (no API call)
export function getQuickDistanceEstimate(
  destinationLat: number,
  destinationLng: number
): string {
  const laundry = getLaundryLocation();
  const km = calculateStraightLineDistance(
    laundry.lat,
    laundry.lng,
    destinationLat,
    destinationLng
  );
  return formatDistance(km);
}
