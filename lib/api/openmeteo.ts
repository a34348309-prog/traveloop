const BASE = 'https://api.open-meteo.com/v1';

export interface DayWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  weatherCode: number;
  weatherLabel: string;
  icon: string;
}

const WMO_CODES: Record<number, { label: string; icon: string }> = {
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

function decodeWMO(code: number): { label: string; icon: string } {
  return WMO_CODES[code] ?? { label: 'Unknown', icon: '🌡️' };
}

/** Get weather forecast for a location and date range */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<DayWeather[]> {
  const url =
    `${BASE}/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
    `&timezone=Asia/Kolkata&start_date=${startDate}&end_date=${endDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Open-Meteo error');
  const data = await res.json();
  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum, weathercode } = data.daily;
  return time.map((date: string, i: number) => {
    const wmo = decodeWMO(weathercode[i]);
    return {
      date,
      tempMax: Math.round(temperature_2m_max[i]),
      tempMin: Math.round(temperature_2m_min[i]),
      precipitation: Math.round(precipitation_sum[i] ?? 0),
      weatherCode: weathercode[i],
      weatherLabel: wmo.label,
      icon: wmo.icon,
    };
  });
}
