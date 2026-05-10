const BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'Traveloop/1.0' };

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

/** Search for a place by query string */
export async function geocodeSearch(query: string, limit = 8): Promise<NominatimResult[]> {
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1&countrycodes=in`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error('Geocoding failed');
  return res.json();
}

/** Reverse geocode: coords → address */
export async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
  const url = `${BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return null;
  return res.json();
}
