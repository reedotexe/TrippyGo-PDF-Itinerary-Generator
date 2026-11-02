import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";
import { restoreItinerary } from "@/lib/db/itineraries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser } = await requireAdmin(req);
    const { id } = await params;

    const success = await restoreItinerary(id, adminUser);
    if (!success) {
      return NextResponse.json(
        { error: "Itinerary not found in trash or cannot be restored" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Itinerary restored successfully" });
  } catch (err: any) {
    if (err?.status) return toAuthResponse(err);
    return NextResponse.json(
      { error: "Failed to restore itinerary", details: err?.message },
      { status: 500 }
    );
  }
}
