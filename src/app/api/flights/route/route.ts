import { requireUser, toAuthResponse } from "@/lib/auth/guard";
import { NextRequest, NextResponse } from "next/server";
import {
  AeroFlightItem,
  resolveAirportCode,
  resolveAirportCodeAsync,
  extractTime,
  cleanCity,
  cleanAirportName,
  AIRPORT_CODE_CITIES,
} from "@/lib/flights/airports";
import {
  searchFlightsSky,
  RouteConnectingFlight,
  SkyDirectFlight,
} from "@/lib/flights/sky-scanner";

interface RouteFlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureCode: string;
  departureCity: string;
  departureAirport: string;
  departureTerminal?: string;
  arrivalTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTerminal?: string;
  stops: string;
  duration?: string;
  priceFormatted?: string;
  isEstimatedSchedule: boolean;
}

function calculateDuration(depTime: string, arrTime: string): string {
  if (!depTime || !arrTime) return "";
  const [dh, dm] = depTime.split(":").map(Number);
  const [ah, am] = arrTime.split(":").map(Number);
  if (isNaN(dh) || isNaN(dm) || isNaN(ah) || isNaN(am)) return "";

  let depMinutes = dh * 60 + dm;
  let arrMinutes = ah * 60 + am;
  if (arrMinutes < depMinutes) {
    arrMinutes += 24 * 60;
  }
  const diff = arrMinutes - depMinutes;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
}

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (error: any) {
    return toAuthResponse(error);
  }

  const apiKey =
    process.env.AERODATABOX_API_KEY ||
    process.env.RAPIDAPI_KEY ||
    process.env.FLIGHTS_SKY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "RapidAPI key (AERODATABOX_API_KEY) is not configured in .env.local" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawFrom = searchParams.get("from") || searchParams.get("origin") || "";
  const rawTo = searchParams.get("to") || searchParams.get("destination") || "";
  const rawDate = searchParams.get("date") || "";

  const fromInfo = await resolveAirportCodeAsync(rawFrom, apiKey);
  const toInfo = await resolveAirportCodeAsync(rawTo, apiKey);

  const fromIata = fromInfo?.code || resolveAirportCode(rawFrom);
  const toIata = toInfo?.code || resolveAirportCode(rawTo);

  if (!fromIata) {
    return NextResponse.json(
      {
        error: `Could not identify Origin airport or location for '${rawFrom}'. Try searching by city name (e.g. Delhi, Mumbai) or 3-letter IATA code (DEL, BOM).`,
      },
      { status: 400 }
    );
  }

  if (!toIata) {
    return NextResponse.json(
      {
        error: `Could not identify Destination airport or location for '${rawTo}'. Try searching by city name (e.g. Phu Quoc, Bangkok, Da Nang) or 3-letter IATA code (PQC, BKK, DAD).`,
      },
      { status: 400 }
    );
  }

  if (fromIata === toIata) {
    return NextResponse.json(
      { error: "Origin and Destination airports cannot be the same." },
      { status: 400 }
    );
  }

  // Format date to YYYY-MM-DD
  let targetDate = "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
    targetDate = rawDate.trim();
  } else if (rawDate.trim()) {
    const parsed = new Date(rawDate.trim());
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed.toISOString().split("T")[0];
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const searchDate = targetDate || todayStr;

  const fetchHalfDayAero = async (
    originCode: string,
    dateStr: string,
    start: string,
    end: string
  ): Promise<AeroFlightItem[]> => {
    try {
      const url = `https://aerodatabox.p.rapidapi.com/flights/airports/iata/${originCode}/${dateStr}T${start}/${dateStr}T${end}?direction=Departure&withLeg=true&withCancelled=false&withCodeshared=false`;
      const res = await fetch(url, {
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
        },
        next: { revalidate: 3600 },
      });

      if (res.status === 204) return [];
      if (!res.ok) return [];

      const data = await res.json();
      return Array.isArray(data.departures) ? data.departures : [];
    } catch {
      return [];
    }
  };

  try {
    // Concurrently trigger Flights Sky (for direct + connecting itineraries) and AeroDataBox
    const [skySettled, aeroMorningSettled, aeroEveningSettled] =
      await Promise.allSettled([
        searchFlightsSky(fromIata, toIata, searchDate, apiKey),
        fetchHalfDayAero(fromIata, searchDate, "00:00", "11:59"),
        fetchHalfDayAero(fromIata, searchDate, "12:00", "23:59"),
      ]);

    // 1. Process Flights Sky results
    let skyDirect: SkyDirectFlight[] = [];
    let connectingFlights: RouteConnectingFlight[] = [];

    if (skySettled.status === "fulfilled" && skySettled.value) {
      skyDirect = skySettled.value.directFlights || [];
      connectingFlights = skySettled.value.connectingFlights || [];
    }

    // 2. Process AeroDataBox departures
    let aeroDepartures: AeroFlightItem[] = [];
    if (aeroMorningSettled.status === "fulfilled")
      aeroDepartures.push(...aeroMorningSettled.value);
    if (aeroEveningSettled.status === "fulfilled")
      aeroDepartures.push(...aeroEveningSettled.value);

    let aeroMatching = aeroDepartures.filter(
      (f) => (f.arrival?.airport?.iata || "").toUpperCase() === toIata
    );

    // Fallback timetable for AeroDataBox if 0 found on future date
    let isEstimatedSchedule = false;
    if (
      skyDirect.length === 0 &&
      connectingFlights.length === 0 &&
      aeroMatching.length === 0 &&
      searchDate !== todayStr
    ) {
      const [todayMorning, todayEvening] = await Promise.allSettled([
        fetchHalfDayAero(fromIata, todayStr, "00:00", "11:59"),
        fetchHalfDayAero(fromIata, todayStr, "12:00", "23:59"),
      ]);
      const todayDepartures: AeroFlightItem[] = [];
      if (todayMorning.status === "fulfilled")
        todayDepartures.push(...todayMorning.value);
      if (todayEvening.status === "fulfilled")
        todayDepartures.push(...todayEvening.value);

      const todayMatching = todayDepartures.filter(
        (f) => (f.arrival?.airport?.iata || "").toUpperCase() === toIata
      );
      if (todayMatching.length > 0) {
        aeroMatching = todayMatching;
        isEstimatedSchedule = true;
      }
    }

    // 3. Merge and deduplicate direct flights
    const directResults: RouteFlightResult[] = [];
    const seenFlightNumbers = new Set<string>();

    // Add Flights Sky direct flights
    for (const d of skyDirect) {
      const cleanNum = d.flightNumber.replace(/\s+/g, "").toUpperCase();
      if (cleanNum) seenFlightNumbers.add(cleanNum);

      directResults.push({
        id: `sky_${d.id}`,
        airline: d.airline,
        flightNumber: d.flightNumber,
        departureTime: d.departureTime,
        departureCode: d.departureCode,
        departureCity: d.departureCity,
        departureAirport: d.departureAirport,
        arrivalTime: d.arrivalTime,
        arrivalCode: d.arrivalCode,
        arrivalCity: d.arrivalCity,
        arrivalAirport: d.arrivalAirport,
        stops: "Non-stop",
        duration: d.duration,
        priceFormatted: d.priceFormatted,
        isEstimatedSchedule: false,
      });
    }

    // Add AeroDataBox direct flights if not already seen
    for (const f of aeroMatching) {
      const num = (f.number || "").trim().toUpperCase();
      const cleanNum = num.replace(/\s+/g, "").toUpperCase();
      if (cleanNum && seenFlightNumbers.has(cleanNum)) continue;
      if (cleanNum) seenFlightNumbers.add(cleanNum);

      const departureTime = extractTime(f.departure?.scheduledTime);
      const arrivalTime = extractTime(f.arrival?.scheduledTime);
      const depCity =
        cleanCity(f.departure?.airport) ||
        AIRPORT_CODE_CITIES[fromIata]?.city ||
        fromIata;
      const arrCity =
        cleanCity(f.arrival?.airport) ||
        AIRPORT_CODE_CITIES[toIata]?.city ||
        toIata;

      directResults.push({
        id: `aero_${(num || "fl").replace(/[^a-zA-Z0-9]/g, "")}`,
        airline: f.airline?.name || "Scheduled Airline",
        flightNumber: num,
        departureTime,
        departureCode: fromIata,
        departureCity: depCity,
        departureAirport: cleanAirportName(f.departure?.airport, depCity),
        departureTerminal: f.departure?.terminal,
        arrivalTime,
        arrivalCode: toIata,
        arrivalCity: arrCity,
        arrivalAirport: cleanAirportName(f.arrival?.airport, arrCity),
        arrivalTerminal: f.arrival?.terminal,
        stops: "Non-stop",
        duration: calculateDuration(departureTime, arrivalTime),
        isEstimatedSchedule,
      });
    }

    // Sort direct flights chronologically by departure time
    directResults.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    const originInfo = AIRPORT_CODE_CITIES[fromIata] || {
      city: fromInfo?.city || fromIata,
      airport: fromInfo?.airport || `${fromIata} Airport`,
    };
    const destInfo = AIRPORT_CODE_CITIES[toIata] || {
      city: toInfo?.city || toIata,
      airport: toInfo?.airport || `${toIata} Airport`,
    };

    return NextResponse.json({
      success: true,
      from: fromIata,
      fromCity: originInfo.city,
      to: toIata,
      toCity: destInfo.city,
      date: searchDate,
      isEstimatedSchedule,
      count: directResults.length,
      flights: directResults,
      connectingCount: connectingFlights.length,
      connectingFlights,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search route flights", details: (error as Error).message },
      { status: 500 }
    );
  }
}
