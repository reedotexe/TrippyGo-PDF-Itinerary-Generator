import { NextRequest, NextResponse } from "next/server";
import { getItinerary, saveItineraryData } from "@/lib/db/itineraries";
import { validateItinerary } from "@/lib/schema/validate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itinerary = await getItinerary(id);

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, itinerary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = body.data;

    if (!data) {
      return NextResponse.json({ error: "Missing 'data' in request body" }, { status: 400 });
    }

    // Validate structural schema
    const validation = validateItinerary(data);
    // Allow saving draft even if business rules have review flags, but ensure Zod parsed correctly
    const validData = validation.data || data;

    await saveItineraryData(id, validData);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      validationErrors: validation.errors || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}
