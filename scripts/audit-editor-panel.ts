import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function runEditorPanelAudit() {
  console.log("=== STARTING DEEP PLAYWRIGHT AUDIT OF SALESPERSON EDITING PANEL ===");

  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1";
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const itineraryId = "feb43b07-4013-47eb-a80c-40fb494eba70";

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const context = await browser.newContext({
    viewport: { width: 1536, height: 960 },
  });
  const page = await context.newPage();

  console.log("[1] Navigating to editor page...");
  await page.goto(`http://localhost:3000/itineraries/${itineraryId}/edit`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(1000);

  // Capture full viewport overview
  await page.screenshot({ path: path.join(artifactDir, "audit-01-full-editor-overview.png") });
  console.log("  -> Captured audit-01-full-editor-overview.png");

  // Helper to get element details
  const auditSection = async (name: string, selector: string, screenshotName: string) => {
    console.log(`\n--- Auditing: ${name} (${selector}) ---`);
    const el = page.locator(selector).first();
    if ((await el.count()) > 0) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await el.screenshot({ path: path.join(artifactDir, screenshotName) });
      console.log(`  -> Screenshot saved: ${screenshotName}`);

      const info = await el.evaluate((dom) => {
        const buttons = Array.from(dom.querySelectorAll("button")).map((b) => ({
          text: b.innerText.trim().replace(/\n+/g, " "),
          title: b.title || "",
          ariaLabel: b.getAttribute("aria-label") || "",
          className: b.className,
        }));

        const inputs = Array.from(dom.querySelectorAll("input, select, textarea")).map((i) => {
          const elInput = i as HTMLInputElement;
          const label = dom.querySelector(`label[for="${elInput.id}"]`);
          return {
            id: elInput.id,
            type: elInput.type || elInput.tagName.toLowerCase(),
            value: elInput.value,
            placeholder: elInput.placeholder || "",
            label: label?.textContent?.trim().replace(/\n+/g, " ") || "",
          };
        });

        const headings = Array.from(dom.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((h) => ({
          tag: h.tagName,
          text: h.textContent?.trim().replace(/\n+/g, " "),
        }));

        const badgesAndAlerts = Array.from(dom.querySelectorAll(".badge, [class*='amber'], [class*='blue-50'], [class*='bg-emerald'], [class*='rounded-full']")).map((b) =>
          b.textContent?.trim().replace(/\n+/g, " ")
        ).filter(Boolean);

        return {
          totalButtons: buttons.length,
          buttons,
          totalInputs: inputs.length,
          inputs,
          headings,
          badgesCount: badgesAndAlerts.length,
          sampleBadges: badgesAndAlerts.slice(0, 10),
        };
      });

      console.log(`  -> Buttons (${info.totalButtons}):`, info.buttons.map((b) => `[${b.text || b.ariaLabel || b.title}]`).join(", "));
      console.log(`  -> Inputs (${info.totalInputs}):`, info.inputs.map((i) => `${i.label || i.id} (${i.placeholder})`).join(", "));
      return info;
    } else {
      console.log(`  -> Element not found: ${selector}`);
      return null;
    }
  };

  // 1. Top Command Bar
  await auditSection("Top Command Bar", "header", "audit-02-top-command-bar.png");

  // 2. Basics Panel
  await auditSection("Basics Panel", "div:has(> h3:has-text('Trip Overview & Basics'))", "audit-03-basics-panel.png");

  // 3. Flights Panel
  await auditSection("Flights Panel", "div:has(> .flex h3:has-text('Flight Schedule & Boarding Passes'))", "audit-04-flights-panel.png");

  // 4. Days Panel
  await auditSection("Days Panel", "div:has(> .flex h3:has-text('Day-by-Day Itinerary'))", "audit-05-days-panel.png");

  // 5. Inclusions Panel
  await auditSection("Inclusions Panel", "div:has(> h3:has-text('Inclusions & Exclusions'))", "audit-06-inclusions-panel.png");

  // 6. Pricing Panel
  await auditSection("Pricing Panel", "div:has(> .flex h3:has-text('Commercials, Markup & GST'))", "audit-07-pricing-panel.png");

  // 7. Terms Panel
  await auditSection("Terms Panel", "div:has(> .flex h3:has-text('Payment Schedule & Cancellation Policy'))", "audit-08-terms-panel.png");

  // 8. Contact Panel
  await auditSection("Contact Panel", "div:has(> .flex h3:has-text('Assigned Travel Specialist'))", "audit-09-contact-panel.png");

  // 9. Right Preview Pane
  await auditSection("Live Preview Pane", "div.w-full.lg\\:w-\\[45\\%\\], div:has(> iframe)", "audit-10-live-preview-pane.png");

  // 10. Audit Modal 1: ImagePickerModal (Cover mode)
  console.log("\n--- Auditing Modal: Cover ImagePickerModal ---");
  const changeCoverBtn = page.locator("button:has-text('Change Cover Photo'), button:has-text('Select A4 Cover Photo')").first();
  if ((await changeCoverBtn.count()) > 0) {
    await changeCoverBtn.click();
    await page.waitForSelector("div[role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(500);
    const modal = page.locator("div[role='dialog']");
    await modal.screenshot({ path: path.join(artifactDir, "audit-11-cover-image-modal.png") });
    console.log("  -> Saved audit-11-cover-image-modal.png");

    // Close modal
    const closeBtn = page.locator("div[role='dialog'] button:has-text('Cancel'), div[role='dialog'] button[aria-label='Close modal']").first();
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
      await page.waitForSelector("div[role='dialog']", { state: "detached", timeout: 3000 });
    }
  }

  // 11. Audit Modal 2: FlightSearchModal
  console.log("\n--- Auditing Modal: FlightSearchModal ---");
  const searchFlightsBtn = page.locator("button:has-text('Search Flights & Autofill')").first();
  if ((await searchFlightsBtn.count()) > 0) {
    await searchFlightsBtn.scrollIntoViewIfNeeded();
    await searchFlightsBtn.click();
    await page.waitForSelector("div[role='dialog']", { timeout: 5000 });
    await page.waitForTimeout(500);
    const modal = page.locator("div[role='dialog']");
    await modal.screenshot({ path: path.join(artifactDir, "audit-12-flight-search-modal.png") });
    console.log("  -> Saved audit-12-flight-search-modal.png");

    // Close modal
    const closeBtn = page.locator("div[role='dialog'] button:has-text('Cancel'), div[role='dialog'] button[aria-label='Close modal'], div[role='dialog'] button:has(svg.lucide-x)").first();
    if ((await closeBtn.count()) > 0) {
      await closeBtn.click();
      await page.waitForSelector("div[role='dialog']", { state: "detached", timeout: 3000 });
    }
  }

  // 12. Audit Modal 3: Versions Modal
  console.log("\n--- Auditing Modal: Versions Modal ---");
  const versionsBtn = page.locator("button:has-text('Versions')").first();
  if ((await versionsBtn.count()) > 0) {
    await versionsBtn.click();
    await page.waitForSelector("div[role='dialog'], .fixed.inset-0", { timeout: 5000 });
    await page.waitForTimeout(500);
    const modal = page.locator("div[role='dialog'], .fixed.inset-0").last();
    await modal.screenshot({ path: path.join(artifactDir, "audit-13-versions-modal.png") });
    console.log("  -> Saved audit-13-versions-modal.png");
  }

  await browser.close();
  console.log("\n=== COMPLETED PLAYWRIGHT AUDIT SUCCESSFULLY ===");
}

runEditorPanelAudit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
