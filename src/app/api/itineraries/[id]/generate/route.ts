import { NextRequest, NextResponse } from "next/server";
import { getItinerary } from "@/lib/db/itineraries";
import { renderItineraryToPdf } from "@/lib/pdf/render";
import { getPresignedDownloadUrl } from "@/lib/storage/s3";
import { createHash } from "crypto";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/security/rate-limit";
import { requireUser, toAuthResponse } from "@/lib/auth/guard";
import { recordAuditEvent } from "@/lib/audit/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Session verification & ownership check
    const { user } = await requireUser(req);
    const { id } = await params;

    // Verify caller owns proposal (or is admin) - Anti-probing: 404 on unowned
    const itinerary = await getItinerary(id, user);
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    // 2. Per-user Rate Limiting (20 PDF generations / hour per client)
    const clientId = getClientIdentifier(req, user.id);
    const maxRequests = process.env.NODE_ENV === "production" ? 20 : 100;
    const rateCheck = checkRateLimit(`generate_${clientId}`, {
      maxRequests,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck.resetInSeconds);
    }

    // 3. Determine base URL from incoming request
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    try {
      // Execute Playwright rendering service (HMAC signed internally)
      const renderResult = await renderItineraryToPdf(id, { baseUrl });

      // Direct PDF file download link with fallback to print view
      let pdfDownloadUrl = `/print/${id}?version=${renderResult.versionNumber}&preview=1&download=1`;
      if (renderResult.pdfS3Key) {
        try {
          pdfDownloadUrl = await getPresignedDownloadUrl(renderResult.pdfS3Key);
        } catch {
          // fallback to print route
        }
      }

      await recordAuditEvent({
        actorId: user.id,
        action: "pdf.generate",
        targetType: "itinerary",
        targetId: id,
        metadata: { versionNumber: renderResult.versionNumber, pdfJsonHash: renderResult.pdfJsonHash },
        req,
      });

      return NextResponse.json({
        success: true,
        versionNumber: renderResult.versionNumber,
        pdfS3Key: renderResult.pdfS3Key,
        pdfJsonHash: renderResult.pdfJsonHash,
        pdfUrl: pdfDownloadUrl,
        printUrl: `/print/${id}?version=${renderResult.versionNumber}&preview=1`,
        message: "PDF generated and immutable version recorded successfully",
      });
    } catch (renderError) {
      console.warn(
        "[Generate Route] Playwright direct render failed, falling back to print route link:",
        (renderError as Error).message
      );

      const jsonString = JSON.stringify(itinerary);
      const pdfJsonHash = createHash("sha256").update(jsonString).digest("hex");
      const pdfUrl = `/print/${id}?preview=1&download=1`;

      return NextResponse.json({
        success: true,
        versionNumber: 1,
        pdfJsonHash,
        pdfUrl,
        warning: (renderError as Error).message,
        message: "Print link ready",
      });
    }
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to generate PDF version", details: (error as Error).message },
      { status: 500 }
    );
  }
}
