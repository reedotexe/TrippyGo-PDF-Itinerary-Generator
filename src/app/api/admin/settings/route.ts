import { NextRequest, NextResponse } from "next/server";
import { getAgencySettings, saveAgencySettings } from "@/lib/config/settings";

export async function GET() {
  try {
    const settings = getAgencySettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to read agency settings", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const updates = await req.json();
    const updatedSettings = saveAgencySettings(updates);
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to save agency settings", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
