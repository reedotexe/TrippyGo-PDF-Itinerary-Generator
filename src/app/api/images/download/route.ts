import { NextRequest, NextResponse } from "next/server";
import { trackUnsplashDownload } from "@/lib/images/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, downloadLocation } = body;

    if (provider === "unsplash" && downloadLocation) {
      await trackUnsplashDownload(downloadLocation);
    }

    return NextResponse.json({
      success: true,
      message: "Download event tracked successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to track image download", details: (error as Error).message },
      { status: 500 }
    );
  }
}
