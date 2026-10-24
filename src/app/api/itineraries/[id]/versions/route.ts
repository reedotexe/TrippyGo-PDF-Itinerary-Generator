import { NextRequest, NextResponse } from "next/server";
import { getItineraryVersions } from "@/lib/db/itineraries";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await getItineraryVersions(id);
    return NextResponse.json({ success: true, versions });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch versions", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
