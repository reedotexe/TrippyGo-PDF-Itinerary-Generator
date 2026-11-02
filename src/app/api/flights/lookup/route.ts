import { NextRequest, NextResponse } from "next/server";
import { requireUser, toAuthResponse } from "@/lib/auth/guard";

import {
  AeroAirport,
  AeroTime,
  AeroFlightItem,
  extractTime,
  cleanCity,
  cleanAirportName,
} from "@/lib/flights/airports";

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
  } catch (err: any) {
    return toAuthResponse(err);
  }

  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AERODATABOX_API_KEY is not configured in .env.local" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawNumber =
    searchParams.get("flight") ||
    searchParams.get("number") ||
    searchParams.get("flightNumber") ||
    "";
  const rawDate = searchParams.get("date") || "";

  const cleanNumber = rawNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!cleanNumber) {
    return NextResponse.json(
      { error: "Query parameter 'number' is required (e.g. 6E204 or AI101)" },
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

  const fetchAeroFlight = async (dateToUse: string): Promise<AeroFlightItem[] | null> => {
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${cleanNumber}/${dateToUse}`;
    const res = await fetch(url, {
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
      },
      next: { revalidate: 3600 },
    });

    if (res.status === 204) return null;
    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        throw new Error("Invalid or unauthenticated RapidAPI key for AeroDataBox");
      }
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data as AeroFlightItem[]) : null;
  };

  try {
    let flights = await fetchAeroFlight(searchDate);

    // Fallback: If not found on requested future date, check today to still auto-fill route & times
    let isEstimatedSchedule = false;
    if (!flights && searchDate !== todayStr) {
      flights = await fetchAeroFlight(todayStr);
      if (flights) isEstimatedSchedule = true;
    }

    if (!flights || flights.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No flight found for ${cleanNumber} on ${searchDate}. Enter details manually.`,
        },
        { status: 404 }
      );
    }

    // Pick main flight if codeshare
    const item =
      flights.find((f) => f.codeshareStatus === "IsMain" || !f.isCargo) || flights[0];

    const departureCity = cleanCity(item.departure?.airport);
    const arrivalCity = cleanCity(item.arrival?.airport);

    const departureTime = extractTime(item.departure?.scheduledTime);
    const arrivalTime = extractTime(item.arrival?.scheduledTime);

    const flightDetails = {
      airline: item.airline?.name || "",
      flightNumber: rawNumber.trim().toUpperCase(),
      departureTime,
      departureCode: (item.departure?.airport?.iata || "").toUpperCase(),
      departureCity,
      departureAirport: cleanAirportName(item.departure?.airport, departureCity),
      arrivalTime,
      arrivalCode: (item.arrival?.airport?.iata || "").toUpperCase(),
      arrivalCity,
      arrivalAirport: cleanAirportName(item.arrival?.airport, arrivalCity),
      stops: "Non-stop",
      isEstimatedSchedule,
    };

    return NextResponse.json({
      success: true,
      flight: flightDetails,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch flight data", details: (error as Error).message },
      { status: 500 }
    );
  }
}
