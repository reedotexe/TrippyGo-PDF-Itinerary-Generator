/**
 * TrippyGo Flight Search Integration - Flights Sky (Skyscanner Global Scraper)
 * API Host: flights-sky.p.rapidapi.com
 */

export interface FlightSegment {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureDate: string;
  departureCode: string;
  departureCity: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalDate: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalAirport: string;
  duration: string;
}

export interface RouteConnectingFlight {
  id: string;
  airline: string;
  flightNumberSummary: string;
  priceFormatted?: string;
  totalDuration: string;
  stopCount: number;
  transitHubs: string;
  layoverDuration: string;
  departureTime: string;
  departureDate: string;
  departureCode: string;
  departureCity: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalDate: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalAirport: string;
  segments: FlightSegment[];
}

export interface SkyDirectFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureCode: string;
  departureCity: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalAirport: string;
  stops: string;
  duration: string;
  priceFormatted?: string;
  isEstimatedSchedule: boolean;
}

export interface SkySearchResult {
  directFlights: SkyDirectFlight[];
  connectingFlights: RouteConnectingFlight[];
}

function formatMinutes(mins?: number | null): string {
  if (!mins || isNaN(mins)) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) {
    return `${h}h${m > 0 ? ` ${m}m` : ""}`.trim();
  }
  return `${m}m`;
}

function extractHHMM(isoStr?: string): string {
  if (!isoStr) return "";
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function extractDateOnly(isoStr?: string): string {
  if (!isoStr) return "";
  return isoStr.split("T")[0] || "";
}

/**
 * Searches flight itineraries (both direct & connecting multi-leg flights)
 * using the Flights Sky API (ntd119 / RapidAPI).
 */
export async function searchFlightsSky(
  fromIata: string,
  toIata: string,
  departDate: string,
  apiKey: string
): Promise<SkySearchResult> {
  const url = `https://flights-sky.p.rapidapi.com/flights/search-one-way?fromEntityId=${encodeURIComponent(
    fromIata.toUpperCase()
  )}&toEntityId=${encodeURIComponent(toIata.toUpperCase())}&departDate=${encodeURIComponent(
    departDate
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "flights-sky.p.rapidapi.com",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) {
      console.warn("RapidAPI key unauthorized for flights-sky");
    }
    return { directFlights: [], connectingFlights: [] };
  }

  const json = await res.json();
  const buckets = Array.isArray(json?.data?.itineraries?.buckets)
    ? json.data.itineraries.buckets
    : [];

  const allItems: any[] = [];
  for (const b of buckets) {
    if (Array.isArray(b.items)) {
      allItems.push(...b.items);
    }
  }

  // Deduplicate itineraries by item ID
  const seenIds = new Set<string>();
  const directFlights: SkyDirectFlight[] = [];
  const connectingFlights: RouteConnectingFlight[] = [];

  for (const item of allItems) {
    if (!item?.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);

    const leg = item.legs?.[0];
    if (!leg) continue;

    const stopCount = Number(leg.stopCount ?? 0);
    const rawSegments: any[] = Array.isArray(leg.segments) ? leg.segments : [];

    const segments: FlightSegment[] = rawSegments.map((s, sIdx) => {
      const carrierPrefix = s.marketingCarrier?.displayCode || "";
      const flNumber = s.flightNumber || "";
      const fullFlightNumber =
        carrierPrefix && flNumber && !flNumber.startsWith(carrierPrefix)
          ? `${carrierPrefix} ${flNumber}`
          : flNumber || carrierPrefix;

      return {
        id: s.id || `seg_${sIdx}`,
        airline:
          s.marketingCarrier?.name ||
          s.operatingCarrier?.name ||
          leg.carriers?.marketing?.[0]?.name ||
          "Scheduled Airline",
        flightNumber: fullFlightNumber,
        departureTime: extractHHMM(s.departure),
        departureDate: extractDateOnly(s.departure),
        departureCode: s.origin?.displayCode || s.origin?.flightPlaceId || "",
        departureCity: s.origin?.parent?.name || s.origin?.name || "",
        departureAirport: s.origin?.name || "",
        arrivalTime: extractHHMM(s.arrival),
        arrivalDate: extractDateOnly(s.arrival),
        arrivalCode: s.destination?.displayCode || s.destination?.flightPlaceId || "",
        arrivalCity: s.destination?.parent?.name || s.destination?.name || "",
        arrivalAirport: s.destination?.name || "",
        duration: formatMinutes(s.durationInMinutes),
      };
    });

    if (stopCount === 0) {
      // Direct Flight
      const seg0 = segments[0];
      const carrierName =
        leg.carriers?.marketing?.[0]?.name || seg0?.airline || "Scheduled Airline";
      const flightNumber =
        seg0?.flightNumber || leg.carriers?.marketing?.[0]?.alternateId || "";

      directFlights.push({
        id: item.id,
        airline: carrierName,
        flightNumber,
        departureTime: extractHHMM(leg.departure) || seg0?.departureTime || "",
        departureCode: leg.origin?.displayCode || seg0?.departureCode || fromIata,
        departureCity: leg.origin?.city || seg0?.departureCity || fromIata,
        departureAirport: leg.origin?.name || seg0?.departureAirport || "",
        arrivalTime: extractHHMM(leg.arrival) || seg0?.arrivalTime || "",
        arrivalCode: leg.destination?.displayCode || seg0?.arrivalCode || toIata,
        arrivalCity: leg.destination?.city || seg0?.arrivalCity || toIata,
        arrivalAirport: leg.destination?.name || seg0?.arrivalAirport || "",
        stops: "Non-stop",
        duration: formatMinutes(leg.durationInMinutes),
        priceFormatted: item.price?.formatted || undefined,
        isEstimatedSchedule: false,
      });
    } else {
      // Connecting Flight (1 or more stops)
      let transitHubs = "";
      let layoverDuration = "";

      if (segments.length > 1) {
        const hubs: string[] = [];
        const layovers: string[] = [];

        for (let i = 0; i < segments.length - 1; i++) {
          const segA = rawSegments[i];
          const segB = rawSegments[i + 1];
          const hubCode = segments[i].arrivalCode;
          const hubCity = segments[i].arrivalCity;
          hubs.push(hubCity ? `${hubCode} (${hubCity})` : hubCode);

          if (segA?.arrival && segB?.departure) {
            const diffMs =
              new Date(segB.departure).getTime() - new Date(segA.arrival).getTime();
            const diffMins = Math.round(diffMs / 60000);
            if (diffMins > 0) {
              layovers.push(`${formatMinutes(diffMins)} layover in ${hubCity || hubCode}`);
            }
          }
        }
        transitHubs = hubs.join(", ");
        layoverDuration = layovers.join(" • ");
      }

      connectingFlights.push({
        id: item.id,
        airline:
          leg.carriers?.marketing?.[0]?.name ||
          segments[0]?.airline ||
          "Connecting Airline",
        flightNumberSummary: segments
          .map((s) => s.flightNumber)
          .filter(Boolean)
          .join(" • "),
        priceFormatted: item.price?.formatted || undefined,
        totalDuration: formatMinutes(leg.durationInMinutes),
        stopCount,
        transitHubs,
        layoverDuration,
        departureTime:
          extractHHMM(leg.departure) || segments[0]?.departureTime || "",
        departureDate:
          extractDateOnly(leg.departure) || segments[0]?.departureDate || departDate,
        departureCode: leg.origin?.displayCode || segments[0]?.departureCode || fromIata,
        departureCity: leg.origin?.city || segments[0]?.departureCity || fromIata,
        departureAirport: leg.origin?.name || segments[0]?.departureAirport || "",
        arrivalTime:
          extractHHMM(leg.arrival) ||
          segments[segments.length - 1]?.arrivalTime ||
          "",
        arrivalDate:
          extractDateOnly(leg.arrival) ||
          segments[segments.length - 1]?.arrivalDate ||
          departDate,
        arrivalCode:
          leg.destination?.displayCode ||
          segments[segments.length - 1]?.arrivalCode ||
          toIata,
        arrivalCity:
          leg.destination?.city ||
          segments[segments.length - 1]?.arrivalCity ||
          toIata,
        arrivalAirport:
          leg.destination?.name ||
          segments[segments.length - 1]?.arrivalAirport ||
          "",
        segments,
      });
    }
  }

  return { directFlights, connectingFlights };
}
