const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_KEY;
const BASE = 'https://api.unsplash.com';

export interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string; thumb: string };
  alt_description: string | null;
  user: { name: string };
}

/** Search Unsplash photos */
export async function searchPhotos(query: string, count = 10): Promise<UnsplashPhoto[]> {
  if (!ACCESS_KEY) return [];
  try {
    const url = `${BASE}/photos/random?query=${encodeURIComponent(query)}&count=${count}&client_id=${ACCESS_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

/** Get a single random photo */
export async function getRandomPhoto(query: string): Promise<UnsplashPhoto | null> {
  if (!ACCESS_KEY) return null;
  try {
    const url = `${BASE}/photos/random?query=${encodeURIComponent(query)}&client_id=${ACCESS_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

/** Fallback India travel images (local URIs) when Unsplash is unavailable */
export const INDIA_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=800',
  'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=800',
];
