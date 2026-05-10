const BASE = 'https://en.wikipedia.org/api/rest_v1';

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: { source: string; width: number; height: number };
  content_urls?: { desktop: { page: string } };
}

/** Get Wikipedia summary for a place/topic */
export async function getWikiSummary(title: string): Promise<WikiSummary | null> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, '_'));
    const res = await fetch(`${BASE}/page/summary/${encoded}`, {
      headers: { 'Api-User-Agent': 'Traveloop/1.0 (travel-app)' },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}
