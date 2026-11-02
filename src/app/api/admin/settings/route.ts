import { NextRequest, NextResponse } from "next/server";
import { getAgencySettings, saveAgencySettings } from "@/lib/config/settings";
import { requireAdmin, toAuthResponse } from "@/lib/auth/guard";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const settings = getAgencySettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    if (err?.status) {
      return toAuthResponse(err);
    }
    return NextResponse.json(
      { error: "Failed to read agency settings", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const updates = await req.json();
    const updatedSettings = saveAgencySettings(updates);
    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: any) {
    if (err?.status) {
      return toAuthResponse(err);
    }
    return NextResponse.json(
      { error: "Failed to save agency settings", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
