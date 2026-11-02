import { NextRequest, NextResponse } from "next/server";
import { getItinerary, saveItineraryData, softDeleteItinerary } from "@/lib/db/itineraries";
import { validateItinerary } from "@/lib/schema/validate";
import { requireUser, toAuthResponse } from "@/lib/auth/guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser(req);
    const { id } = await params;
    const itinerary = await getItinerary(id, user);

    if (!itinerary) {
      // 404 Anti-probing guarantee: never return 403 Forbidden
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, itinerary });
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
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
    const { user } = await requireUser(req);
    const { id } = await params;
    const body = await req.json();
    const data = body.data;

    if (!data) {
      return NextResponse.json({ error: "Missing 'data' in request body" }, { status: 400 });
    }

    // Validate structural schema
    const validation = validateItinerary(data);
    const validData = validation.data || data;

    await saveItineraryData(id, validData, user);

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      validationErrors: validation.errors || [],
    });
  } catch (error: any) {
    if (error?.status === 404) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to update itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser(req);
    const { id } = await params;
    const deleted = await softDeleteItinerary(id, user);

    if (!deleted) {
      // Anti-probing: return 404 if record is absent or belongs to another salesperson
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to delete itinerary", details: (error as Error).message },
      { status: 500 }
    );
  }
}
