/**
 * Image search and download tracking service for Unsplash & Pexels
 */

export type ImageOrientation = "portrait" | "landscape" | "all";

export interface NormalizedImage {
  provider:
    | "unsplash"
    | "pexels"
    | "wikimedia"
    | "openverse"
    | "picsum"
    | "pixabay"
    | "upload"
    | "custom";
  photoId: string;
  thumbUrl: string;
  fullUrl: string;
  photographerName: string;
  photographerUrl: string;
  downloadLocation: string | null;
  altDescription?: string;
  width?: number;
  height?: number;
  orientation?: ImageOrientation;
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
    photographerName: "Oliver SjÃ¶strÃ¶m",
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

const CURATED_MOCK_PORTRAIT_IMAGES: NormalizedImage[] = [
  {
    provider: "unsplash",
    photoId: "m-dubai-khalifa-vert",
    thumbUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&h=566&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=2480&auto=format&fit=crop&q=85",
    photographerName: "David Rodrigo",
    photographerUrl: "https://unsplash.com/@davidrodrigo?utm_source=trippygo&utm_medium=referral",
    downloadLocation: null,
    altDescription: "Burj Khalifa rising vertically into twilight sky Dubai",
    width: 2480,
    height: 3508,
    orientation: "portrait",
  },
  {
    provider: "unsplash",
    photoId: "m-bali-temple-vert",
    thumbUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=566&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=2480&auto=format&fit=crop&q=85",
    photographerName: "Oliver SjÃ¶strÃ¶m",
    photographerUrl: "https://unsplash.com/@ollivves?utm_source=trippygo&utm_medium=referral",
    downloadLocation: null,
    altDescription: "Ulun Danu Beratan temple vertical reflection Bali",
    width: 2480,
    height: 3508,
    orientation: "portrait",
  },
  {
    provider: "unsplash",
    photoId: "m-kashmir-shikara-vert",
    thumbUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400&h=566&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=2480&auto=format&fit=crop&q=85",
    photographerName: "Imad Clicks",
    photographerUrl: "https://unsplash.com/@imadclicks?utm_source=trippygo&utm_medium=referral",
    downloadLocation: null,
    altDescription: "Vertical shikara cruising on tranquil Dal Lake Kashmir",
    width: 2480,
    height: 3508,
    orientation: "portrait",
  },
  {
    provider: "unsplash",
    photoId: "m-switzerland-matterhorn-vert",
    thumbUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=566&auto=format&fit=crop&q=80",
    fullUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=2480&auto=format&fit=crop&q=85",
    photographerName: "Fabian MÃ¸ller",
    photographerUrl: "https://unsplash.com/@fabianmoller?utm_source=trippygo&utm_medium=referral",
    downloadLocation: null,
    altDescription: "Iconic Matterhorn peak vertical morning reflection Switzerland",
    width: 2480,
    height: 3508,
    orientation: "portrait",
  },
  {
    provider: "pexels",
    photoId: "p-paris-eiffel-vert",
    thumbUrl: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=400",
    fullUrl: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=2480",
    photographerName: "Thorsten technoman",
    photographerUrl: "https://www.pexels.com/@thorsten-technoman-109629",
    downloadLocation: null,
    altDescription: "Eiffel Tower vertical view at twilight Paris",
    width: 2480,
    height: 3508,
    orientation: "portrait",
  },
];

/**
 * Search Unsplash API
 */
async function searchUnsplash(
  query: string,
  page: number,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey || accessKey.includes("placeholder")) {
    return [];
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=10${orientation === "portrait" ? "&orientation=portrait" : orientation === "landscape" ? "&orientation=landscape" : ""}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      signal: AbortSignal.timeout(4000),
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
      fullUrl:
        orientation === "portrait" && photo.urls?.raw
          ? `${photo.urls.raw}&w=2480&q=85&auto=format`
          : photo.urls?.regular || photo.urls?.full,
      photographerName: photo.user?.name || "Unsplash Contributor",
      photographerUrl: `${photo.user?.links?.html || "https://unsplash.com"}?utm_source=trippygo&utm_medium=referral`,
      downloadLocation: photo.links?.download_location || null,
      altDescription: photo.alt_description || photo.description || query,
      width: photo.width,
      height: photo.height,
      orientation:
        photo.width && photo.height
          ? photo.height > photo.width
            ? "portrait"
            : "landscape"
          : orientation,
    }));
  } catch (err) {
    console.warn("[Unsplash] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Search Pexels API
 */
async function searchPexels(
  query: string,
  page: number,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    return [];
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=10${orientation === "portrait" ? "&orientation=portrait" : orientation === "landscape" ? "&orientation=landscape" : ""}`;

    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      signal: AbortSignal.timeout(4000),
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
      fullUrl: photo.src?.large2x || photo.src?.original || photo.src?.large,
      photographerName: photo.photographer || "Pexels Contributor",
      photographerUrl: photo.photographer_url || "https://www.pexels.com",
      downloadLocation: null,
      altDescription: photo.alt || query,
      width: photo.width,
      height: photo.height,
      orientation:
        photo.width && photo.height
          ? photo.height > photo.width
            ? "portrait"
            : "landscape"
          : orientation,
    }));
  } catch (err) {
    console.warn("[Pexels] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Search Pixabay API (High-resolution vertical photography)
 */
async function searchPixabay(
  query: string,
  page: number,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey || apiKey.includes("placeholder")) {
    return [];
  }

  try {
    const orientParam =
      orientation === "portrait"
        ? "vertical"
        : orientation === "landscape"
        ? "horizontal"
        : "all";
    const minH = orientation === "portrait" ? "&min_height=1800" : "";
    const url = `https://pixabay.com/api/?key=${encodeURIComponent(
      apiKey
    )}&q=${encodeURIComponent(
      query
    )}&page=${page}&per_page=10&orientation=${orientParam}&image_type=photo${minH}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn(`[Pixabay] API returned status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data.hits || []).map((photo: any) => ({
      provider: "pixabay" as const,
      photoId: `pixabay-${photo.id}`,
      thumbUrl: photo.webformatURL || photo.previewURL,
      fullUrl: photo.largeImageURL || photo.webformatURL,
      photographerName: photo.user || "Pixabay Contributor",
      photographerUrl: photo.pageURL || "https://pixabay.com",
      downloadLocation: null,
      altDescription: photo.tags || query,
      width: photo.imageWidth,
      height: photo.imageHeight,
      orientation:
        photo.imageWidth && photo.imageHeight
          ? photo.imageHeight > photo.imageWidth
            ? "portrait"
            : "landscape"
          : orientation,
    }));
  } catch (err) {
    console.warn("[Pixabay] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Build editorial luxury travel query tailored for A4 vertical magazine cover imagery.
 */
export function buildEditorialCoverQuery(destination: string, theme?: string): string {
  const cleanDest = destination
    .replace(/\b(days?|tours?|trips?|itinerary|packages?|nights?)\b/gi, "")
    .replace(/[-â€“â€”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleanDest) return "luxury travel destination aerial vertical";

  if (theme && theme.trim()) {
    return `${cleanDest} ${theme.trim()} vertical`;
  }

  return `${cleanDest} aerial vertical`;
}

/**
 * Search Wikimedia Commons via Wikivoyage and Wikipedia APIs (100% free, zero API keys required)
 * Wikivoyage is Wikipedia's travel project, specifically dedicated to scenic travel destination photos.
 */
async function searchWikimedia(
  query: string,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  // Strip common generic stop words to match encyclopedia article titles
  const cleanQuery = query.replace(/\b(travel|landscape|tour|itinerary|package|trip)\b/gi, "").trim() || query;

  const isPortrait = orientation === "portrait";

  const commonsUrl = isPortrait
    ? `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        `${cleanQuery} vertical filetype:bitmap`
      )}&gsrnamespace=6&gsrlimit=15&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=600&format=json`
    : `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
        `${cleanQuery} filetype:bitmap`
      )}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=600&format=json`;

  const endpoints = [
    // 1. Wikimedia Commons Media Library
    commonsUrl,
    // 1. Wikivoyage (Travel-dedicated guide with high-res scenic photos)
    `https://en.wikivoyage.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrlimit=8&prop=pageimages&piprop=original|thumbnail&pithumbsize=1600&format=json`,
    // 2. Wikipedia (World landmarks and geographic entities)
    `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      cleanQuery
    )}&gsrlimit=8&prop=pageimages&piprop=original|thumbnail&pithumbsize=1600&format=json`,
  ];

  try {
    const responses = await Promise.all(
      endpoints.map((url) =>
        fetch(url, {
          headers: {
            "User-Agent": "TrippyGo/1.0 (trippygo-itinerary-generator; info@trippygo.com)",
          },
          signal: AbortSignal.timeout(4000),
        })
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    );

    const results: NormalizedImage[] = [];
    const seenUrls = new Set<string>();

    for (const data of responses) {
      if (!data?.query?.pages) continue;
      const pages = Object.values(data.query.pages) as any[];

      for (const p of pages) {
        const imageInfo = p.imageinfo?.[0];
        const imgUrl = imageInfo?.url || p.original?.source || p.thumbnail?.source;
        if (!imgUrl || typeof imgUrl !== "string") continue;

        const lowerUrl = imgUrl.toLowerCase();
        const lowerTitle = (p.title || "").toLowerCase();

        // Filter out flags, maps, diagrams, logos, coats of arms, and SVG vector graphics
        if (
          lowerUrl.includes(".svg") ||
          lowerUrl.includes("flag") ||
          lowerUrl.includes("map-") ||
          lowerUrl.includes("_map") ||
          lowerUrl.includes("coat_of_arms") ||
          lowerUrl.includes("schema") ||
          lowerUrl.includes("diagram") ||
          lowerUrl.includes("plan") ||
          lowerUrl.includes("locator") ||
          lowerUrl.includes("logo") ||
          lowerTitle.includes("map") ||
          lowerTitle.includes("flag") ||
          lowerTitle.includes("conflict")
        ) {
          continue;
        }

        if (seenUrls.has(imgUrl)) continue;
        seenUrls.add(imgUrl);

        const thumbUrl = imageInfo?.thumburl || p.thumbnail?.source || imgUrl;
        const w: number | undefined = imageInfo?.width || p.original?.width || p.thumbnail?.width;
        const h: number | undefined = imageInfo?.height || p.original?.height || p.thumbnail?.height;
        const isPortraitItem = h && w ? h > w : isPortrait;

        if (w && h) {
          if (isPortrait) {
            if (h < w * 1.15) continue;
            if (h < 1500 && imageInfo) continue;
          } else if (orientation === "landscape") {
            if (h > w * 1.05) continue;
          }
        } else if (isPortrait) {
          continue;
        }

        let artistName = "";
        let licenseName = "";
        if (imageInfo?.extmetadata) {
          const rawArtist = imageInfo.extmetadata.Artist?.value || "";
          artistName = rawArtist.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          licenseName = (imageInfo.extmetadata.LicenseShortName?.value || "").trim();
        }

        const cleanTitle = (p.title || "")
          .replace(/^File:/i, "")
          .replace(/\.[a-zA-Z0-9]+$/, "")
          .replace(/[-_]/g, " ")
          .trim();

        const photographerDisplay = artistName
          ? `${artistName} (${licenseName || "Wikimedia Commons"})`
          : cleanTitle
          ? `${cleanTitle} (Wikimedia Commons)`
          : "Wikimedia Commons Contributor";

        const photographerLink = imageInfo?.descriptionurl || "https://commons.wikimedia.org";


        results.push({
          provider: "wikimedia" as const,
          photoId: `wiki-${p.pageid || Math.random().toString(36).slice(2)}`,
          thumbUrl,
          fullUrl: imgUrl,
          photographerName: photographerDisplay,
          photographerUrl: photographerLink,
          downloadLocation: null,
          altDescription: cleanTitle || query,
          width: w,
          height: h,
          orientation: isPortraitItem ? "portrait" : "landscape",
        });
      }
    }

    return results;
  } catch (err) {
    console.warn("[Wikimedia] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Search Openverse (WordPress-backed Creative Commons image index, zero API keys required)
 */
async function searchOpenverse(
  query: string,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  const cleanQuery = query.replace(/\b(travel|landscape|tour|itinerary|package)\b/gi, "").trim() || query;

  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(cleanQuery)}&page_size=10`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "TrippyGo/1.0 (trippygo-itinerary-generator; info@trippygo.com)",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    const items = (data.results || []) as any[];

    return items
      .filter((item: any) => {
        if (!item.url || typeof item.url !== "string" || item.url.endsWith(".svg")) return false;
        if (orientation === "portrait" && item.width && item.height && item.width >= item.height) return false;
        if (orientation === "landscape" && item.width && item.height && item.height > item.width * 1.1) return false;
        return true;
      })
      .map((item: any) => ({
        provider: "openverse" as const,
        photoId: `ov-${item.id}`,
        thumbUrl: item.thumbnail || item.url,
        fullUrl: item.url,
        photographerName: item.creator || "Openverse Creator",
        photographerUrl: item.foreign_landing_url || "https://openverse.org",
        downloadLocation: null,
        altDescription: item.title || query,
        width: item.width,
        height: item.height,
        orientation:
          item.height && item.width
            ? item.height > item.width
              ? "portrait"
              : "landscape"
            : orientation,
      }));
  } catch (err) {
    console.warn("[Openverse] Search failed:", (err as Error).message);
    return [];
  }
}

/**
 * Seeded Picsum Photos fallback (guaranteed 100% network uptime, zero API key)
 */
function getPicsumFallback(
  query: string,
  orientation: ImageOrientation = "landscape"
): NormalizedImage[] {
  const seed = query.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30) || "travel";
  return [
    {
      provider: "picsum" as const,
      photoId: `picsum-${seed}`,
      thumbUrl:
        orientation === "portrait"
          ? `https://picsum.photos/seed/${seed}/400/566`
          : `https://picsum.photos/seed/${seed}/400/250`,
      fullUrl:
        orientation === "portrait"
          ? `https://picsum.photos/seed/${seed}/1240/1754`
          : `https://picsum.photos/seed/${seed}/1600/900`,
      photographerName: "Lorem Picsum Travel Collection",
      photographerUrl: "https://picsum.photos",
      downloadLocation: null,
      altDescription: `${query} ${orientation === "portrait" ? "portrait A4 cover" : "landscape view"}`,
      width: orientation === "portrait" ? 1240 : 1600,
      height: orientation === "portrait" ? 1754 : 900,
      orientation: orientation === "portrait" ? "portrait" : "landscape",
    },
  ];
}

/**
 * Unified image search calling Unsplash, Pexels, Wikimedia Commons (Wikivoyage + Wikipedia),
 * Openverse, and Picsum with local caching
 */
export async function searchImages(
  query: string,
  page: number = 1,
  orientation: ImageOrientation = "landscape"
): Promise<NormalizedImage[]> {
  const cacheKey = `${query.toLowerCase().trim()}_${orientation}_p${page}`;
  const now = Date.now();

  const cached = searchCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Primary queries: Unsplash, Pexels, and Pixabay in parallel
  const [unsplashResults, pexelsResults, pixabayResults] = await Promise.all([
    searchUnsplash(query, page, orientation),
    searchPexels(query, page, orientation),
    searchPixabay(query, page, orientation),
  ]);

  // Interleave results from both providers
  let combined: NormalizedImage[] = [];
  const maxLen = Math.max(unsplashResults.length, pexelsResults.length, pixabayResults.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < unsplashResults.length) combined.push(unsplashResults[i]);
    if (i < pexelsResults.length) combined.push(pexelsResults[i]);
    if (i < pixabayResults.length) combined.push(pixabayResults[i]);
  }

  // 2. Fallback tier: Wikimedia Commons (Wikivoyage + Wikipedia) and Openverse (Zero API keys required)
  if (combined.length === 0) {
    const [wikiResults, openverseResults] = await Promise.all([
      searchWikimedia(query, orientation),
      searchOpenverse(query, orientation),
    ]);
    combined = [...wikiResults, ...openverseResults];
  }

  // 3. Fallback tier 2: Deterministic seeded landscape photo (Picsum)
  if (combined.length === 0) {
    combined = getPicsumFallback(query, orientation);
  }

  // 4. Emergency offline fallback: Curated mock fixtures
  const mockFallback =
    orientation === "portrait" ? CURATED_MOCK_PORTRAIT_IMAGES : CURATED_MOCK_IMAGES;
  const finalResults = combined.length > 0 ? combined : mockFallback;

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
