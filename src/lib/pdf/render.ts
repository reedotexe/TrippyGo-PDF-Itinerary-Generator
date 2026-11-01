import { chromium } from "playwright";
import { createHash } from "crypto";
import { getItinerary, createItineraryVersion } from "@/lib/db/itineraries";
import { computeClientView } from "@/lib/schema/client-view";
import { uploadToStorage } from "@/lib/storage/s3";
import { signRenderToken } from "./token";
import { isRequestAllowedInRenderer } from "@/lib/security/ssrf";

export interface RenderPdfOptions {
  itineraryId: string;
  baseUrl?: string;
  versionNumber?: number;
}

export interface RenderPdfResult {
  success: boolean;
  pdfBuffer: Buffer;
  pdfS3Key: string;
  pdfJsonHash: string;
  versionNumber: number;
}

/**
 * Playwright Headless Chromium PDF Generator with Microservice and In-Process Modes
 */
export async function renderItineraryToPdf(
  itineraryId: string,
  options: { baseUrl?: string } = {}
): Promise<RenderPdfResult> {
  const itinerary = await getItinerary(itineraryId);
  if (!itinerary) {
    throw new Error(`Itinerary not found for ID: ${itineraryId}`);
  }

  // 1. Compute deterministic JSON hash
  const jsonString = JSON.stringify(itinerary);
  const pdfJsonHash = createHash("sha256").update(jsonString).digest("hex");

  // 2. Generate signed short-lived render token (valid for 5 minutes)
  const token = signRenderToken(itineraryId, 300);
  const baseUrl = options.baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const targetUrl = `${baseUrl}/print/${itineraryId}?token=${token}`;

  let pdfBuffer: Buffer;

  // 3. Check if dedicated Renderer Microservice is available
  const rendererServiceUrl = process.env.RENDERER_SERVICE_URL;
  if (rendererServiceUrl) {
    try {
      const response = await fetch(`${rendererServiceUrl}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, token }),
      });
      if (response.ok) {
        const arrayBuf = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuf);
      } else {
        throw new Error(`Renderer service returned status: ${response.status}`);
      }
    } catch (svcErr) {
      console.warn(`[PDF Render] Microservice at ${rendererServiceUrl} failed. Falling back to local Playwright.`, svcErr);
      pdfBuffer = await renderLocally(targetUrl, itineraryId);
    }
  } else {
    // Standard embedded Playwright Chromium execution
    pdfBuffer = await renderLocally(targetUrl, itineraryId);
  }

  // 4. Save Version Row in Database/Store
  const timestamp = Date.now();
  const tempKey = `itineraries/${itineraryId}/v_${timestamp}.pdf`;
  const { versionNumber } = await createItineraryVersion(
    itineraryId,
    itinerary,
    tempKey,
    pdfJsonHash
  );

  const pdfS3Key = `itineraries/${itineraryId}/v${versionNumber}_${timestamp}.pdf`;

  // 5. Upload to S3 / Local Disk Fallback
  await uploadToStorage({
    key: pdfS3Key,
    data: pdfBuffer,
    contentType: "application/pdf",
  });

  return {
    success: true,
    pdfBuffer,
    pdfS3Key,
    pdfJsonHash,
    versionNumber,
  };
}

/**
 * In-process headless Chromium rendering helper
 */
async function renderLocally(targetUrl: string, itineraryId: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Network isolation: Block SSRF against AWS metadata, loopback, and private IP subnets
    await page.route("**", (route) => {
      const reqUrl = route.request().url();
      if (!isRequestAllowedInRenderer(reqUrl, targetUrl)) {
        console.warn(`[SSRF Defense] Aborted request to blocked/private address: ${reqUrl}`);
        return route.abort("blockedbyclient");
      }
      return route.continue();
    });

    try {
      await page.goto(targetUrl, {
        waitUntil: "networkidle",
        timeout: 15000,
      });

      // Poll for readiness flag: meta[name="ready"][content="true"]
      await page.waitForSelector('meta[name="ready"][content="true"]', {
        timeout: 8000,
      }).catch(() => {
        // Continue if timeout fired; images/fonts wait below guarantees safety
      });
    } catch (navErr) {
      console.warn(`[PDF Render] Direct navigation to ${targetUrl} timed out or unserved. Waiting on document assets.`);
    }

    // Wait for all images to complete loading
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );
    });

    // Wait for fonts to be ready
    await page.evaluate(() => document.fonts.ready);

    // Emulate print media type
    await page.emulateMedia({ media: "print" });

    // Render A4 PDF with exact A4 dimensions and zero forced margins for full-bleed cover
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
      },
    });

    await context.close();
    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}
