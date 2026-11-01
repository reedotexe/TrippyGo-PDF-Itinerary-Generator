import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveItineraryData, listItineraries } from "@/lib/db/itineraries";
import { createEmptyFallbackItinerary } from "@/lib/extraction/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const list = await listItineraries({ search, status });

    return NextResponse.json({
      success: true,
      count: list.length,
      itineraries: list,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list itineraries", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body.id || randomUUID();
    const data = body.data || createEmptyFallbackItinerary("manual_creation");

    await saveItineraryData(id, data);

    return NextResponse.json({
      success: true,
      id,
      itinerary: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}
