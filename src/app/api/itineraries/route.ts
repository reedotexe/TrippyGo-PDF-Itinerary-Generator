import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createItinerary, listItineraries } from "@/lib/db/itineraries";
import { createEmptyFallbackItinerary } from "@/lib/schema/factory";
import { requireUser, toAuthResponse } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const ownerFilter = searchParams.get("ownerFilter") || undefined;

    const list = await listItineraries(user, { search, status, ownerFilter });

    return NextResponse.json({
      success: true,
      count: list.length,
      itineraries: list,
    });
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to list itineraries", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const id = body.id || randomUUID();
    const data = body.data || createEmptyFallbackItinerary("manual_creation");

    // Stamp ownership into document metadata as well
    if (!data.ownership) {
      data.ownership = {};
    }
    data.ownership.ownerId = user.id;
    data.ownership.ownerName = user.name;
    data.ownership.createdBy = user.id;

    await createItinerary(id, data, user);

    return NextResponse.json({
      success: true,
      id,
      itinerary: data,
    });
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to create itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}
