import { NextRequest, NextResponse } from "next/server";
import { restoreItineraryVersion } from "@/lib/db/itineraries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionNumber: string }> }
) {
  try {
    const { id, versionNumber: vStr } = await params;
    const vNum = parseInt(vStr, 10);
    if (isNaN(vNum) || vNum < 1) {
      return NextResponse.json({ error: "Invalid version number" }, { status: 400 });
    }

    const restored = await restoreItineraryVersion(id, vNum);
    if (!restored) {
      return NextResponse.json({ error: `Version ${vNum} not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, itinerary: restored, versionNumber: vNum });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to restore version", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
