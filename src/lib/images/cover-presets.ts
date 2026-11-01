/**
 * Curated A4 Portrait Cover Presets Library for TrippyGo Luxury PDF Itineraries
 * All photos are verified vertical compositions (1:1.414 aspect ratio) with
 * natural negative space at the top (for brand trust bar) and bottom (for dark navy title card).
 */

import { ItineraryImage } from "@/lib/schema/itinerary";

export interface CoverPreset {
  id: string;
  title: string;
  destinationKeys: string[];
  region: "Middle East" | "Southeast Asia" | "India & Subcontinent" | "Europe" | "Island Escapes" | "East Asia";
  imageUrl: string;
  thumbnailUrl: string;
  photographerName: string;
  photographerUrl: string;
  provider: "unsplash" | "pexels";
}

export const COVER_PRESETS: CoverPreset[] = [
  // --- MIDDLE EAST ---
  {
    id: "preset-dubai-khalifa",
    title: "Burj Khalifa Twilight Sky",
    destinationKeys: ["dubai", "uae", "united arab emirates"],
    region: "Middle East",
    imageUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "David Rodrigo",
    photographerUrl: "https://unsplash.com/@davidrodrigo?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-dubai-desert",
    title: "Arabian Desert Golden Dunes",
    destinationKeys: ["dubai", "abu dhabi", "sharjah", "uae"],
    region: "Middle East",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "NASA / Unsplash",
    photographerUrl: "https://unsplash.com?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-abu-dhabi-mosque",
    title: "Sheikh Zayed Grand Mosque",
    destinationKeys: ["abu dhabi", "uae", "dubai"],
    region: "Middle East",
    imageUrl: "https://images.unsplash.com/photo-1578895101407-7973059f7729?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1578895101407-7973059f7729?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Nick Fewings",
    photographerUrl: "https://unsplash.com/@jannerboy62?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },

  // --- SOUTHEAST ASIA ---
  {
    id: "preset-bali-temple",
    title: "Ulun Danu Beratan Temple",
    destinationKeys: ["bali", "indonesia", "ubud", "seminyak"],
    region: "Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Oliver Sjöström",
    photographerUrl: "https://unsplash.com/@ollivves?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-bali-rice-terrace",
    title: "Tegalalang Emerald Terraces",
    destinationKeys: ["bali", "ubud", "indonesia"],
    region: "Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Niklas Weiss",
    photographerUrl: "https://unsplash.com/@niklas_w?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-thailand-phi-phi",
    title: "Phi Phi Island Longtail Boat",
    destinationKeys: ["phuket", "krabi", "thailand", "bangkok", "phi phi"],
    region: "Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Sara Dubler",
    photographerUrl: "https://unsplash.com/@sadswim?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-vietnam-halong",
    title: "Ha Long Bay Emerald Karsts",
    destinationKeys: ["vietnam", "hanoi", "ha long", "da nang", "phu quoc"],
    region: "Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Amandyne Louvet",
    photographerUrl: "https://unsplash.com/@amandyne?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-singapore-skyline",
    title: "Marina Bay Sands Vertical",
    destinationKeys: ["singapore", "sentosa"],
    region: "Southeast Asia",
    imageUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Hu Chen",
    photographerUrl: "https://unsplash.com/@huchenme?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },

  // --- INDIA & SUBCONTINENT ---
  {
    id: "preset-kashmir-dal-lake",
    title: "Dal Lake Golden Shikara",
    destinationKeys: ["kashmir", "srinagar", "gulmarg", "pahalgam"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Imad Clicks",
    photographerUrl: "https://unsplash.com/@imadclicks?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-ladakh-pangong",
    title: "Pangong Tso Alpine Blue",
    destinationKeys: ["ladakh", "leh", "nubra", "pangong"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Cliford Mervil",
    photographerUrl: "https://unsplash.com/@cliford?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-kerala-houseboat",
    title: "Alleppey Palm Backwaters",
    destinationKeys: ["kerala", "alleppey", "munnar", "kochi", "wayanad"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Kyran Low",
    photographerUrl: "https://unsplash.com/@kyranlow?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-rajasthan-hawa-mahal",
    title: "Jaipur Hawa Mahal Palace",
    destinationKeys: ["rajasthan", "jaipur", "udaipur", "jodhpur", "jaisalmer"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1609137144822-42171120f2b3?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1609137144822-42171120f2b3?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Annie Spratt",
    photographerUrl: "https://unsplash.com/@anniespratt?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-taj-mahal-sunrise",
    title: "Taj Mahal Monument of Love",
    destinationKeys: ["agra", "delhi", "golden triangle", "uttar pradesh"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Jovyn Chamb",
    photographerUrl: "https://unsplash.com/@jovynchamb?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-goa-beach-sunset",
    title: "Goa Coastal Palms",
    destinationKeys: ["goa", "north goa", "south goa"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Alexey Turenkov",
    photographerUrl: "https://unsplash.com/@alexe_i?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-bhutan-tigers-nest",
    title: "Paro Taktsang Tiger's Nest",
    destinationKeys: ["bhutan", "paro", "thimphu", "punakha"],
    region: "India & Subcontinent",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Aditya Chache",
    photographerUrl: "https://unsplash.com/@adityachache?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },

  // --- EUROPE ---
  {
    id: "preset-switzerland-matterhorn",
    title: "Zermatt Matterhorn Sunrise",
    destinationKeys: ["switzerland", "zermatt", "interlaken", "lucerne", "zurich"],
    region: "Europe",
    imageUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Fabian Møller",
    photographerUrl: "https://unsplash.com/@fabianmoller?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-santorini-caldera",
    title: "Santorini Oia Caldera Domes",
    destinationKeys: ["greece", "santorini", "athens", "mykonos"],
    region: "Europe",
    imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Hellio & Van Ingen",
    photographerUrl: "https://unsplash.com/@hellio?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-amalfi-cliffside",
    title: "Positano Amalfi Coastline",
    destinationKeys: ["italy", "amalfi", "positano", "rome", "florence"],
    region: "Europe",
    imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Ricardo Gomez Angel",
    photographerUrl: "https://unsplash.com/@rvaldivia?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-paris-eiffel",
    title: "Eiffel Tower Twilight Vista",
    destinationKeys: ["paris", "france"],
    region: "Europe",
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Chris Karidis",
    photographerUrl: "https://unsplash.com/@chriskaridis?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },

  // --- ISLAND ESCAPES ---
  {
    id: "preset-maldives-lagoon",
    title: "Maldives Overwater Villas",
    destinationKeys: ["maldives", "male"],
    region: "Island Escapes",
    imageUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Colin Watts",
    photographerUrl: "https://unsplash.com/@colinwatts?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-mauritius-aerial",
    title: "Mauritius Le Morne Reef",
    destinationKeys: ["mauritius", "seychelles"],
    region: "Island Escapes",
    imageUrl: "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1589556264800-08ae9e129a8c?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Xavier Coiffic",
    photographerUrl: "https://unsplash.com/@xaviercoiffic?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },

  // --- EAST ASIA ---
  {
    id: "preset-kyoto-bamboo",
    title: "Arashiyama Bamboo Grove",
    destinationKeys: ["japan", "kyoto", "tokyo", "osaka"],
    region: "East Asia",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "Soragrit Wongsa",
    photographerUrl: "https://unsplash.com/@soragrit?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
  {
    id: "preset-japan-fuji",
    title: "Mount Fuji Chureito Vista",
    destinationKeys: ["japan", "tokyo", "fuji"],
    region: "East Asia",
    imageUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2480&q=85",
    thumbnailUrl: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=400&h=566&q=80",
    photographerName: "David Emrich",
    photographerUrl: "https://unsplash.com/@davidemrich?utm_source=trippygo&utm_medium=referral",
    provider: "unsplash",
  },
];

/**
 * Find matching curated cover presets based on itinerary destinations
 */
export function findPresetsForDestinations(destinations: string[]): CoverPreset[] {
  if (!destinations || destinations.length === 0) return COVER_PRESETS.slice(0, 6);

  const normalized = destinations.map((d) => d.toLowerCase().trim());
  const matches = COVER_PRESETS.filter((p) =>
    p.destinationKeys.some((k) =>
      normalized.some((userDest) => userDest.includes(k) || k.includes(userDest))
    )
  );

  return matches.length > 0 ? matches : COVER_PRESETS.slice(0, 6);
}

/**
 * Format a CoverPreset into the standard ItineraryImage schema
 */
export function presetToItineraryImage(preset: CoverPreset): ItineraryImage {
  return {
    provider: preset.provider,
    photoId: preset.id,
    imageUrl: preset.imageUrl,
    thumbnailUrl: preset.thumbnailUrl,
    photographerName: preset.photographerName,
    photographerUrl: preset.photographerUrl,
    downloadLocation: null,
  };
}
