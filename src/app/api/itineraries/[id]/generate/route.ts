import { NextRequest, NextResponse } from "next/server";
import { getItinerary } from "@/lib/db/itineraries";
import { renderItineraryToPdf } from "@/lib/pdf/render";
import { createHash } from "crypto";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 0. Rate limiting (20 PDF generations / hour per client)
    const clientId = getClientIdentifier(req);
    const maxRequests = process.env.NODE_ENV === "production" ? 20 : 100;
    const rateCheck = checkRateLimit(`generate_${clientId}`, {
      maxRequests,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.resetInSeconds);
    }

    const { id } = await params;
    const itinerary = await getItinerary(id);

    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    // Determine base URL from incoming request
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    try {
      // Execute Playwright rendering service
      const renderResult = await renderItineraryToPdf(id, { baseUrl });

      return NextResponse.json({
        success: true,
        versionNumber: renderResult.versionNumber,
        pdfS3Key: renderResult.pdfS3Key,
        pdfJsonHash: renderResult.pdfJsonHash,
        pdfUrl: `/print/${id}?version=${renderResult.versionNumber}&download=1`,
        message: "PDF generated and immutable version recorded successfully",
      });
    } catch (renderError) {
      console.warn(
        "[Generate Route] Playwright direct render failed, falling back to print route link:",
        (renderError as Error).message
      );

      const jsonString = JSON.stringify(itinerary);
      const pdfJsonHash = createHash("sha256").update(jsonString).digest("hex");
      const pdfUrl = `/print/${id}?download=1`;

      return NextResponse.json({
        success: true,
        versionNumber: 1,
        pdfJsonHash,
        pdfUrl,
        warning: (renderError as Error).message,
        message: "Print link ready",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate PDF version", details: (error as Error).message },
      { status: 500 }
    );
  }
}
