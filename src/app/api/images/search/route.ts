import { NextRequest, NextResponse } from "next/server";
import { searchImages } from "@/lib/images/client";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // 0. Rate limiting (100 searches / hour per client)
    const clientId = getClientIdentifier(req);
    const maxRequests = process.env.NODE_ENV === "production" ? 100 : 500;
    const rateCheck = checkRateLimit(`images_${clientId}`, {
      maxRequests,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.resetInSeconds);
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const orientationParam = searchParams.get("orientation")?.toLowerCase();
    const orientation =
      orientationParam === "portrait" || orientationParam === "all"
        ? orientationParam
        : "landscape";

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'query' is required" },
        { status: 400 }
      );
    }

    const images = await searchImages(query, page, orientation);

    return NextResponse.json({
      success: true,
      query,
      orientation,
      page,
      count: images.length,
      images,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to search images", details: (error as Error).message },
      { status: 500 }
    );
  }
}
