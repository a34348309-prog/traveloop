const OTM_KEY = process.env.EXPO_PUBLIC_OPENTRIPMAP_KEY;
const BASE = 'https://api.opentripmap.com/0.1/en';

export interface OTMPlace {
  xid: string;
  name: string;
  kinds: string;
  dist?: number;
  rate?: number;
  osm?: string;
  wikidata?: string;
  point: { lon: number; lat: number };
}

export interface OTMPlaceDetail {
  xid: string;
  name: string;
  kinds: string;
  wikipedia_extracts?: { text: string; html: string };
  preview?: { source: string };
  point: { lon: number; lat: number };
  address?: {
    city?: string; state?: string; country?: string;
  };
}

/** Get list of places near lat/lon */
export async function getPlacesNearby(
  lat: number,
  lon: number,
  radius = 5000,
  kinds = 'interesting_places',
  limit = 20
): Promise<OTMPlace[]> {
  const url = `${BASE}/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=${kinds}&limit=${limit}&apikey=${OTM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTripMap error: ${res.status}`);
  const data = await res.json();
  return data.features?.map((f: any) => ({
    xid: f.properties.xid,
    name: f.properties.name,
    kinds: f.properties.kinds,
    dist: f.properties.dist,
    rate: f.properties.rate,
    point: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
  })) || [];
}

/** Get detail of a single place by xid */
export async function getPlaceDetail(xid: string): Promise<OTMPlaceDetail> {
  const url = `${BASE}/places/xid/${xid}?apikey=${OTM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTripMap error: ${res.status}`);
  return res.json();
}

/** Search places by name */
export async function searchPlaces(name: string, country = 'IN', limit = 15): Promise<OTMPlace[]> {
  const url = `${BASE}/places/autosuggest?name=${encodeURIComponent(name)}&country=${country}&limit=${limit}&apikey=${OTM_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenTripMap error: ${res.status}`);
  const data = await res.json();
  return data.features?.map((f: any) => ({
    xid: f.properties.xid,
    name: f.properties.name,
    kinds: f.properties.kinds,
    point: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
  })) || [];
}

/** Category labels for display */
export function formatKinds(kinds: string): string {
  return kinds
    .split(',')[0]
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
