import { NextRequest, NextResponse } from "next/server";
import { getItinerary, getItineraryVersions } from "@/lib/db/itineraries";
import { getPresignedDownloadUrl } from "@/lib/storage/s3";
import { requireUser, toAuthResponse } from "@/lib/auth/guard";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireUser(req);
    const { id } = await params;

    // Verify ownership / anti-probing
    const itinerary = await getItinerary(id, user);
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    // Retrieve historical versions
    const versions = await getItineraryVersions(id);
    const latestVersionWithPdf = versions.find((v) => !!v.pdfS3Key || !!v.downloadUrl);

    if (latestVersionWithPdf) {
      let downloadUrl = latestVersionWithPdf.downloadUrl;
      if (!downloadUrl && latestVersionWithPdf.pdfS3Key) {
        downloadUrl = await getPresignedDownloadUrl(latestVersionWithPdf.pdfS3Key);
      }

      if (downloadUrl) {
        const redirectUrl = downloadUrl.startsWith("http")
          ? downloadUrl
          : new URL(downloadUrl, req.url).toString();
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Fallback if no static PDF binary exists yet: open print preview
    const printFallback = new URL(`/print/${id}?preview=1`, req.url).toString();
    return NextResponse.redirect(printFallback);
  } catch (error: any) {
    if (error?.status) {
      return toAuthResponse(error);
    }
    return NextResponse.json(
      { error: "Failed to open PDF", details: (error as Error).message },
      { status: 500 }
    );
  }
}
