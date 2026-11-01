import { NextRequest, NextResponse } from "next/server";
import { AIRPORT_CODE_CITIES } from "@/lib/flights/airports";

interface AirportSuggestion {
  code: string;
  city: string;
  name: string;
  country?: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  if (!query) {
    return NextResponse.json({ success: true, items: [] });
  }

  // 1. First, search local high-priority dictionary
  const localMatches: AirportSuggestion[] = [];
  for (const [code, item] of Object.entries(AIRPORT_CODE_CITIES)) {
    if (
      code.toLowerCase().includes(query) ||
      item.city.toLowerCase().includes(query) ||
      item.airport.toLowerCase().includes(query) ||
      item.aliases.some((a) => a.toLowerCase().includes(query))
    ) {
      localMatches.push({
        code: item.code,
        city: item.city,
        name: item.airport,
      });
    }
  }

  // If we already have strong local matches and query is short, return them
  if (localMatches.length >= 5 || (localMatches.length > 0 && query.length < 3)) {
    return NextResponse.json({ success: true, items: localMatches.slice(0, 8) });
  }

  // 2. Query AeroDataBox for comprehensive worldwide location search
  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: true, items: localMatches.slice(0, 8) });
  }

  try {
    const url = `https://aerodatabox.p.rapidapi.com/airports/search/term?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
      },
      next: { revalidate: 86400 }, // Cache airport searches for 24 hours
    });

    if (res.status === 200) {
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];

      const externalMatches: AirportSuggestion[] = rawItems
        .filter((item: any) => item.iata && item.iata.length === 3)
        .map((item: any) => ({
          code: item.iata.toUpperCase(),
          city: item.shortName || item.municipalityName || item.name,
          name: item.name || `${item.municipalityName || item.iata} Airport`,
          country: item.countryCode,
        }));

      // Combine and deduplicate
      const seen = new Set<string>();
      const combined: AirportSuggestion[] = [];

      for (const item of [...localMatches, ...externalMatches]) {
        if (!seen.has(item.code)) {
          seen.add(item.code);
          combined.push(item);
        }
      }

      return NextResponse.json({ success: true, items: combined.slice(0, 8) });
    }
  } catch (error) {
    console.warn("AeroDataBox airport search failed:", error);
  }

  return NextResponse.json({ success: true, items: localMatches.slice(0, 8) });
}
