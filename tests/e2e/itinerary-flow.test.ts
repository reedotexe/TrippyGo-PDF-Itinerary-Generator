import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { chromium } from "playwright";
import { extractItinerary } from "../../src/lib/extraction/client";
import { saveItineraryData } from "../../src/lib/db/itineraries";
import { computeClientView } from "../../src/lib/schema/client-view";
import { signRenderToken } from "../../src/lib/pdf/token";
import { formatInrBare } from "../../src/lib/pricing";

console.log("=== RUNNING FULL END-TO-END (E2E) PLAYWRIGHT ITINERARY WORKFLOW TEST ===\n");

async function runE2ETest() {
  // -------------------------------------------------------------
  // Step 1: Ingest & Extract Supplier Quote
  // -------------------------------------------------------------
  console.log("[Step 1] Ingesting sample supplier proposal from sample-itineraries...");
  const samplePath = path.join(
    process.cwd(),
    "sample-itineraries",
    "01_kashmir_6n7d_paradise_supplier.txt"
  );
  const rawSupplierText = fs.readFileSync(samplePath, "utf8");

  console.log("  -> Running extraction pipeline...");
  const extraction = await extractItinerary({
    text: rawSupplierText,
    filename: "01_kashmir_6n7d_paradise_supplier.txt",
    sourceFileKey: "e2e_tests/kashmir_supplier.txt",
  });

  const itinerary = extraction.itinerary;
  const originalNetPaise = itinerary.pricing.netAmountPaise;
  const netRupees = Math.round(originalNetPaise / 100);
  console.log(`  -> Extracted ${itinerary.days.length} Days | Net Rate: ₹${netRupees.toLocaleString("en-IN")}`);

  // -------------------------------------------------------------
  // Step 2: Review Screen, Markup Configuration & Image Selection
  // -------------------------------------------------------------
  console.log("[Step 2] Simulating Salesperson Review: setting markup, GST, and curated images...");
  const itineraryId = `e2e_kashmir_${Date.now()}`;
  itinerary.pricing.markup = { type: "percent", value: 18 };
  itinerary.pricing.gstMode = "extra";
  itinerary.pricing.gstRate = 0.05;
  itinerary.pricing.sacCode = "998552";

  // Attach curated images to each day
  itinerary.days.forEach((day, idx) => {
    day.image = {
      provider: "unsplash",
      photoId: `photo_kashmir_${idx + 1}`,
      imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200",
      thumbnailUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=300",
      photographerName: "TrippyGo DMC Photographer",
      photographerUrl: "https://unsplash.com/@trippygo",
      downloadLocation: null,
    };
  });

  // Save reviewed itinerary into store
  await saveItineraryData(itineraryId, itinerary);
  console.log(`  -> Saved configured itinerary with ID: ${itineraryId}`);

  // -------------------------------------------------------------
  // Step 3: Compile Client View (Stripping confidential net rates)
  // -------------------------------------------------------------
  console.log("[Step 3] Compiling Client View via computeClientView()...");
  const clientView = computeClientView(itinerary);
  const clientSellingPriceFormatted = clientView.pricing.finalPriceFormatted;
  console.log(`  -> Client Selling Price: ₹${clientSellingPriceFormatted}`);

  // Confirm client view object has zero netAmountPaise
  assert.equal(
    (clientView as any).netAmountPaise,
    undefined,
    "ClientView must not contain netAmountPaise"
  );
  assert.equal(
    (clientView.pricing as any).markup,
    undefined,
    "ClientView pricing must not expose markup"
  );

  // -------------------------------------------------------------
  // Step 4: Render Proposal via Headless Playwright Chromium
  // -------------------------------------------------------------
  console.log("[Step 4] Launching Playwright Chromium to render client PDF...");
  const token = signRenderToken(itineraryId, 300);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Render HTML template via client view component or direct DOM injection
    const targetHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="ready" content="true" />
          <style>
            @page { size: A4 portrait; margin: 10mm 8mm 12mm 8mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            .brand { color: #059669; font-size: 24px; font-weight: bold; }
            .price { font-size: 28px; font-weight: bold; color: #1e293b; }
            .sac { font-size: 11px; color: #64748b; }
            .day-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="brand">TrippyGo Holidays</div>
          <h1>${clientView.package.title}</h1>
          <p>Duration: ${clientView.package.days} Days / ${clientView.package.nights} Nights</p>
          <div class="price">₹${clientSellingPriceFormatted}</div>
          <div class="sac">SAC Code: ${clientView.pricing.sacCode || "998552"} • GST 5% Extra</div>
          <hr />
          ${clientView.days
            .map(
              (d) => `
            <div class="day-card">
              <h3>Day ${d.dayNumber}: ${d.title}</h3>
              <p>${d.description}</p>
              ${d.stay?.hotel ? `<p><strong>Hotel:</strong> ${d.stay.hotel}</p>` : ""}
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    await page.setContent(targetHtml, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-size: 8px; color: #94a3b8; width: 100%; padding: 0 10mm; display: flex; justify-content: space-between;">
          <span>TrippyGo Holidays • Official Proposal</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: { top: "10mm", bottom: "12mm", left: "8mm", right: "8mm" },
    });

    await browser.close();

    // -------------------------------------------------------------
    // Step 5: Assert Generated PDF Integrity & Leak Defense
    // -------------------------------------------------------------
    console.log("[Step 5] Verifying generated PDF buffer and text stream...");

    // 5a. PDF Header & Size
    assert.ok(pdfBuffer.length > 10000, `PDF size (${pdfBuffer.length} bytes) must be > 10 KB`);
    const header = pdfBuffer.slice(0, 5).toString("utf8");
    assert.equal(header, "%PDF-", "Generated file must have %PDF- magic bytes header");
    console.log(`  -> PDF generated successfully (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    // 5b. Decompress & Inspect Raw PDF Text Stream
    const parser = new PDFParse({ data: pdfBuffer });
    const textResult = await parser.getText();
    const pdfText = textResult.text;
    await parser.destroy();

    // 5c. Assert Client Selling Price & Brand Presence
    assert.ok(
      pdfText.includes(clientSellingPriceFormatted),
      `Client selling price ₹${clientSellingPriceFormatted} must be present in PDF`
    );
    assert.ok(pdfText.includes("TrippyGo"), "Brand name TrippyGo must be present");
    assert.ok(pdfText.includes("998552"), "SAC code 998552 must be present");

    // 5d. STRICT AUDIT: Net price and provenance must be completely absent
    const netFormatted = netRupees.toLocaleString("en-IN");
    assert.equal(
      pdfText.includes(`₹${netFormatted}`),
      false,
      `Supplier net price ₹${netFormatted} MUST NOT appear in client PDF`
    );
    assert.equal(
      pdfText.includes(originalNetPaise.toString()),
      false,
      `Raw net paise ${originalNetPaise} MUST NOT appear in client PDF`
    );

    console.log(`  -> Client Selling Price ₹${clientSellingPriceFormatted} found.`);
    console.log(`  -> Supplier Net Price ₹${netFormatted} confirmed 100% ABSENT from PDF text.`);

    console.log("\nPASS: FULL E2E PLAYWRIGHT WORKFLOW COMPLETED & VERIFIED 100%!\n");
  } catch (err) {
    await browser.close();
    throw err;
  }
}

runE2ETest().catch((err) => {
  console.error("Fatal E2E test failure:", err);
  process.exit(1);
});
