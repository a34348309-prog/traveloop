const OPENTRIPMAP_API_KEY = process.env.EXPO_PUBLIC_OPENTRIPMAP_KEY;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OPENTRIPMAP_BASE = 'https://api.opentripmap.com/0.1/en';
const OPENMETEO_BASE = 'https://api.open-meteo.com/v1';
const WIKI_BASE = 'https://en.wikipedia.org/api/rest_v1';

export async function searchPlaces(query: string) {
  if (!query) return [];
  const res = await fetch(`${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Traveloop/1.0' }
  });
  if (!res.ok) throw new Error('Failed to fetch places');
  return res.json();
}

export async function getAttractions(lat: number, lon: number, radius = 10000, limit = 20) {
  const url = `${OPENTRIPMAP_BASE}/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=interesting_places&limit=${limit}&apikey=${OPENTRIPMAP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch attractions');
  const data = await res.json();
  return data.features?.map((f: any) => ({
    xid: f.properties.xid,
    name: f.properties.name,
    kinds: f.properties.kinds,
    point: { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }
  })) || [];
}

export async function getWeather(lat: number, lon: number, startDate?: string, endDate?: string) {
  const params = `latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto`;
  const url = startDate && endDate 
    ? `${OPENMETEO_BASE}/forecast?${params}&start_date=${startDate}&end_date=${endDate}`
    : `${OPENMETEO_BASE}/forecast?${params}`;
    
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();
  if (!data.daily) return [];
  
  const wmoCodes: Record<number, { label: string; icon: string }> = {
    0: { label: 'Clear sky', icon: '☀️' },
    1: { label: 'Mainly clear', icon: '🌤️' },
    2: { label: 'Partly cloudy', icon: '⛅' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Foggy', icon: '🌫️' },
    48: { label: 'Icy fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    61: { label: 'Slight rain', icon: '🌧️' },
    71: { label: 'Slight snow', icon: '❄️' },
    80: { label: 'Rain showers', icon: '🌧️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
  };

  return data.daily.time.map((date: string, i: number) => {
    const code = data.daily.weathercode[i];
    return {
      date,
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      precipitation: data.daily.precipitation_sum[i] || 0,
      weatherCode: code,
      weatherLabel: wmoCodes[code]?.label || 'Unknown',
      icon: wmoCodes[code]?.icon || '🌡️',
    };
  });
}

export async function getWikiSummary(placeName: string) {
  const encoded = encodeURIComponent(placeName.replace(/ /g, '_'));
  const res = await fetch(`${WIKI_BASE}/page/summary/${encoded}`, {
    headers: { 'Api-User-Agent': 'Traveloop/1.0' }
  });
  if (!res.ok) return null;
  return res.json();
}
