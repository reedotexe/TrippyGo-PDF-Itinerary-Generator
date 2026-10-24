/**
 * Image search and download tracking service for Unsplash & Pexels
 */

export interface NormalizedImage {
  provider: "unsplash" | "pexels";
  photoId: string;
  thumbUrl: string;
  fullUrl: string;
  photographerName: string;
  photographerUrl: string;
  downloadLocation: string | null;
  altDescription?: string;
}

interface CacheEntry {
  timestamp: number;
  data: NormalizedImage[];
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const searchCache = new Map<string, CacheEntry>();

const CURATED_MOCK_IMAGES: NormalizedImage[] = [
  {
    provider: "unsplash",
    photoId: "m-dal-lake-1",
    thumbUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1600&auto=format&fit=crop&q=85",
    photographerName: "Imad Clicks",
    photographerUrl: "https://unsplash.com/@imadclicks?utm_source=trippygo&utm_medium=referral",
    downloadLocation: "https://api.unsplash.com/photos/m-dal-lake-1/download",
    altDescription: "Shikara boat on Dal Lake Srinagar with snow peaks",
  },
  {
    provider: "pexels",
    photoId: "p-gulmarg-2",
    thumbUrl: "https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=400",
    fullUrl: "https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1600",
    photographerName: "Tanveer Malik",
    photographerUrl: "https://www.pexels.com/@tanveermalik",
    downloadLocation: null,
    altDescription: "Snowy pine forest and mountain gondola in Gulmarg",
  },
  {
    provider: "unsplash",
    photoId: "m-goa-beach-3",
    thumbUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&auto=format&fit=crop&q=85",
    photographerName: "Alexey Turenkov",
    photographerUrl: "https://unsplash.com/@alexe_i?utm_source=trippygo&utm_medium=referral",
    downloadLocation: "https://api.unsplash.com/photos/m-goa-beach-3/download",
    altDescription: "Golden sunset over palm trees and ocean beach in Goa",
  },
  {
    provider: "pexels",
    photoId: "p-kerala-houseboat-4",
    thumbUrl: "https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=400",
    fullUrl: "https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg?auto=compress&cs=tinysrgb&w=1600",
    photographerName: "Aman Sen",
    photographerUrl: "https://www.pexels.com/@amansen",
    downloadLocation: null,
    altDescription: "Traditional wooden houseboat cruising Kerala backwaters",
  },
  {
    provider: "unsplash",
    photoId: "m-bali-temple-5",
    thumbUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&auto=format&fit=crop&q=85",
    photographerName: "Oliver Sjöström",
    photographerUrl: "https://unsplash.com/@ollivves?utm_source=trippygo&utm_medium=referral",
    downloadLocation: "https://api.unsplash.com/photos/m-bali-temple-5/download",
    altDescription: "Tropical coastline and cliffside temple in Bali",
  },
  {
    provider: "pexels",
    photoId: "p-dubai-skyline-6",
    thumbUrl: "https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=400",
    fullUrl: "https://images.pexels.com/photos/162031/dubai-tower-arab-khalifa-162031.jpeg?auto=compress&cs=tinysrgb&w=1600",
    photographerName: "Pixabay",
    photographerUrl: "https://www.pexels.com/@pixabay",
    downloadLocation: null,
    altDescription: "Burj Khalifa and Dubai downtown skyline illuminated",
  },
];

/**
 * Search Unsplash API
 */
async function searchUnsplash(query: string, page: number): Promise<NormalizedImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.includes("placeholder")) {
    return [];
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=10&orientation=landscape`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!res.ok) {
      console.warn(`[Unsplash] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.results || []).map((photo: any) => ({
      provider: "unsplash" as const,
      photoId: photo.id,
      thumbUrl: photo.urls.small || photo.urls.thumb,
      fullUrl: photo.urls.regular,
      photographerName: photo.user?.name || "Unsplash Contributor",
      photographerUrl: `${photo.user?.links?.html || "https://unsplash.com"}?utm_source=trippygo&utm_medium=referral`,
      downloadLocation: photo.links?.download_location || null,
      altDescription: photo.alt_description || photo.description || query,
    }));
  } catch (err) {
    console.warn("[Unsplash] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Search Pexels API
 */
async function searchPexels(query: string, page: number): Promise<NormalizedImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    return [];
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=10&orientation=landscape`;

    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!res.ok) {
      console.warn(`[Pexels] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.photos || []).map((photo: any) => ({
      provider: "pexels" as const,
      photoId: String(photo.id),
      thumbUrl: photo.src?.medium || photo.src?.tiny,
      fullUrl: photo.src?.large || photo.src?.original,
      photographerName: photo.photographer || "Pexels Contributor",
      photographerUrl: photo.photographer_url || "https://www.pexels.com",
      downloadLocation: null,
      altDescription: photo.alt || query,
    }));
  } catch (err) {
    console.warn("[Pexels] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Unified image search calling Unsplash and Pexels in parallel with 10-minute caching
 */
export async function searchImages(query: string, page: number = 1): Promise<NormalizedImage[]> {
  const cacheKey = `${query.toLowerCase().trim()}_p${page}`;
  const now = Date.now();

  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Parallel API queries
  const [unsplashResults, pexelsResults] = await Promise.all([
    searchUnsplash(query, page),
    searchPexels(query, page),
  ]);

  // Interleave results from both providers
  const combined: NormalizedImage[] = [];
  const maxLen = Math.max(unsplashResults.length, pexelsResults.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < unsplashResults.length) combined.push(unsplashResults[i]);
    if (i < pexelsResults.length) combined.push(pexelsResults[i]);
  }

  // Fallback to curated mock fixtures if live API keys are unset or quota exceeded
  const finalResults = combined.length > 0 ? combined : CURATED_MOCK_IMAGES;

  searchCache.set(cacheKey, { timestamp: now, data: finalResults });
  return finalResults.slice(0, 20);
}

/**
 * Track Unsplash photo download event (required by Unsplash API terms)
 */
export async function trackUnsplashDownload(downloadLocation: string): Promise<boolean> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.includes("placeholder") || !downloadLocation) {
    return true; // Dev mode mock passes
  }

  try {
    const res = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn("[Unsplash] Download tracking failed:", (err as Error).message);
    return false;
  }
}
