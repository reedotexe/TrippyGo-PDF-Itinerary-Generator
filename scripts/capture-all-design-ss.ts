import { chromium, Browser, Page } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const ITINERARY_ID = "a8c9e6ed-c594-41f5-b3f1-8c0e05e6e4a0";
const OUTPUT_ROOT = path.join(process.cwd(), "docs", "original_design_ss");

// Subdirectories
const DIRS = {
  pages: path.join(OUTPUT_ROOT, "01_pages"),
  sections: path.join(OUTPUT_ROOT, "02_sections"),
  modals: path.join(OUTPUT_ROOT, "03_modals"),
  pdf: path.join(OUTPUT_ROOT, "04_pdf_pages"),
};

function ensureDirs() {
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureHome(browser: Browser) {
  console.log("--> Capturing Home Page & Sections...");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await sleep(2000);

  // Full home page
  await page.screenshot({
    path: path.join(DIRS.pages, "home_full_page.png"),
    fullPage: true,
  });

  // Home Hero Workbench section
  const workbench = await page.$("section, [data-testid='workbench'], .bg-slate-900, form, .border-dashed");
  // Look for the main intake card or top section
  const heroCard = await page.$("div.grid, .bg-white.rounded-2xl, .bg-white.rounded-xl");
  if (heroCard) {
    await heroCard.screenshot({
      path: path.join(DIRS.sections, "home_workbench_card.png"),
    });
  }

  // Itineraries table / list section
  const table = await page.$("table, div[class*='divide-y'], div.bg-white.rounded-xl.border");
  if (table) {
    await table.screenshot({
      path: path.join(DIRS.sections, "home_recent_itineraries.png"),
    });
  }

  // Open New Itinerary Modal
  console.log("--> Capturing New Itinerary Modal...");
  const newBtn = await page.getByRole("button", { name: /new itinerary/i }).first();
  if (newBtn) {
    await newBtn.click();
    await sleep(800);
    const modal = await page.$("div[role='dialog'], div.fixed.inset-0");
    if (modal) {
      await modal.screenshot({
        path: path.join(DIRS.modals, "modal_new_itinerary_intake.png"),
      });
    }
  }

  await page.close();
}

async function captureSettings(browser: Browser) {
  console.log("--> Capturing Admin Settings Page & Sections...");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: "domcontentloaded" });
  await sleep(2000);

  // Full settings page
  await page.screenshot({
    path: path.join(DIRS.pages, "settings_full_page.png"),
    fullPage: true,
  });

  // Individual sections
  const sections = await page.$$("section");
  console.log(`Found ${sections.length} sections on Settings page.`);
  if (sections[0]) {
    await sections[0].screenshot({
      path: path.join(DIRS.sections, "settings_agency_profile.png"),
    });
  }
  if (sections[1]) {
    await sections[1].screenshot({
      path: path.join(DIRS.sections, "settings_pdf_presentation.png"),
    });
  }
  if (sections[2]) {
    await sections[2].screenshot({
      path: path.join(DIRS.sections, "settings_ai_integrations.png"),
    });
  }

  await page.close();
}

async function captureEditor(browser: Browser) {
  console.log("--> Capturing Editor Tabs, Sections, and Modals...");
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`${BASE_URL}/itineraries/${ITINERARY_ID}/edit`, {
    waitUntil: "domcontentloaded",
  });
  await sleep(3000);

  // 1. Overview Tab Full Page
  await page.screenshot({
    path: path.join(DIRS.pages, "editor_tab_overview_full.png"),
  });

  // Basics Panel
  const basicsPanel = await page.$("div[data-testid='basics-panel'], div.space-y-6");
  if (basicsPanel) {
    await basicsPanel.screenshot({
      path: path.join(DIRS.sections, "editor_panel_basics.png"),
    });
  }

  // Live Preview Pane (Right side)
  const previewPane = await page.$("aside, .preview-container, div.bg-slate-200\\/50, div.overflow-y-auto.flex-1");
  if (previewPane) {
    await previewPane.screenshot({
      path: path.join(DIRS.sections, "editor_live_pdf_preview_pane.png"),
    });
  }

  // Version History Modal
  console.log("--> Capturing Version History Modal...");
  const versionBtn = await page.$("button[title*='Version History'], button[aria-label*='versions']");
  if (versionBtn) {
    await versionBtn.click();
    await sleep(800);
    const modal = await page.$("div.fixed.inset-0.z-50, div[role='dialog']");
    if (modal) {
      await modal.screenshot({
        path: path.join(DIRS.modals, "modal_version_history.png"),
      });
    }
    // Close modal
    const closeBtn = await page.$("button:has-text('✕'), button:has-text('Close'), div.fixed.inset-0 button.text-slate-400");
    if (closeBtn) {
      await closeBtn.click();
      await sleep(500);
    } else {
      await page.keyboard.press("Escape");
      await sleep(500);
    }
  }

  // Image Picker Modal (Search Tab)
  console.log("--> Capturing Image Picker Modal (Search & Gallery)...");
  const changeCoverBtn = await page.getByRole("button", { name: /change cover photo|choose cover photo/i }).first();
  if (changeCoverBtn) {
    await changeCoverBtn.click();
    await sleep(1500);
    const imgModal = await page.$("div.fixed.inset-0.z-50, div[role='dialog']");
    if (imgModal) {
      await imgModal.screenshot({
        path: path.join(DIRS.modals, "modal_image_picker_search.png"),
      });

      // Switch to Upload Tab
      const uploadTabBtn = await page.getByRole("button", { name: /upload/i }).first();
      if (uploadTabBtn) {
        await uploadTabBtn.click();
        await sleep(600);
        await imgModal.screenshot({
          path: path.join(DIRS.modals, "modal_image_picker_upload_dropzone.png"),
        });

        // Trigger Cropper by setting test image
        const testImgPath = path.join(process.cwd(), "public", "brand", "trippygo-logo.png");
        const fileInput = await page.$("#custom-file-input");
        if (fileInput && fs.existsSync(testImgPath)) {
          console.log("--> Capturing Cover Image Cropper Modal...");
          await fileInput.setInputFiles(testImgPath);
          await sleep(1500);
          await imgModal.screenshot({
            path: path.join(DIRS.modals, "modal_cover_image_cropper.png"),
          });
        }
      }
    }
    // Close image modal
    await page.keyboard.press("Escape");
    await sleep(500);
  }

  // 2. Flights Tab
  console.log("--> Capturing Flights Tab & Search Modal...");
  await page.click("button#tab-flights, button:has-text('Flights')");
  await sleep(1000);
  await page.screenshot({
    path: path.join(DIRS.pages, "editor_tab_flights_full.png"),
  });
  const flightsPanel = await page.$("div.space-y-6, div.bg-white.rounded-xl");
  if (flightsPanel) {
    await flightsPanel.screenshot({
      path: path.join(DIRS.sections, "editor_panel_flights.png"),
    });
  }

  // Open Flight Search Modal
  const flightAddMenuBtn = await page.$("button[aria-label='Flight creation options']");
  if (flightAddMenuBtn) {
    await flightAddMenuBtn.click();
    await sleep(400);
    const searchFlightOption = await page.getByRole("button", { name: /search live flight database/i });
    if (searchFlightOption) {
      await searchFlightOption.click();
      await sleep(1000);
      const flightModal = await page.$("div.fixed.inset-0.z-50, div[role='dialog']");
      if (flightModal) {
        await flightModal.screenshot({
          path: path.join(DIRS.modals, "modal_flight_search.png"),
        });
      }
      await page.keyboard.press("Escape");
      await sleep(500);
    }
  }

  // 3. Days Tab
  console.log("--> Capturing Days Tab...");
  await page.click("button#tab-days, button:has-text('Days')");
  await sleep(1000);
  await page.screenshot({
    path: path.join(DIRS.pages, "editor_tab_days_full.png"),
  });
  const daysPanel = await page.$("div.space-y-6, div.bg-white.rounded-xl");
  if (daysPanel) {
    await daysPanel.screenshot({
      path: path.join(DIRS.sections, "editor_panel_days.png"),
    });
  }

  // 4. Inclusions & Terms Tab
  console.log("--> Capturing Inclusions & Terms Tab...");
  await page.click("button#tab-inclusions, button:has-text('Inclusions')");
  await sleep(1000);
  await page.screenshot({
    path: path.join(DIRS.pages, "editor_tab_inclusions_full.png"),
  });
  const inclusionsSections = await page.$$("div.bg-white.rounded-xl.border, div.space-y-6");
  if (inclusionsSections[0]) {
    await inclusionsSections[0].screenshot({
      path: path.join(DIRS.sections, "editor_panel_inclusions_exclusions.png"),
    });
  }
  if (inclusionsSections[1]) {
    await inclusionsSections[1].screenshot({
      path: path.join(DIRS.sections, "editor_panel_terms_policies.png"),
    });
  }

  // 5. Pricing Tab
  console.log("--> Capturing Pricing Tab...");
  await page.click("button#tab-pricing, button:has-text('Pricing')");
  await sleep(1000);
  await page.screenshot({
    path: path.join(DIRS.pages, "editor_tab_pricing_full.png"),
  });
  const pricingPanel = await page.$("div.space-y-6, div.bg-white.rounded-xl");
  if (pricingPanel) {
    await pricingPanel.screenshot({
      path: path.join(DIRS.sections, "editor_panel_pricing.png"),
    });
  }

  await page.close();
}

async function capturePdfPages(browser: Browser) {
  console.log("--> Capturing PDF Print Template Pages...");
  const page = await browser.newPage({ viewport: { width: 1200, height: 1697 } }); // A4 aspect ratio at 1200px width
  await page.goto(`${BASE_URL}/print/${ITINERARY_ID}?preview=1`, {
    waitUntil: "domcontentloaded",
  });
  await sleep(2500);

  // Full multi-page print preview
  await page.screenshot({
    path: path.join(DIRS.pages, "print_full_document.png"),
    fullPage: true,
  });

  // 1. Cover Page
  const coverPage = await page.$(".cover-page");
  if (coverPage) {
    console.log("Capturing Page 01: Cover Page...");
    await coverPage.screenshot({
      path: path.join(DIRS.pdf, "page_01_cover_page.png"),
    });
  }

  // 2. Query each individual A4 page element
  const pageElements = await page.$$(".itinerary-page");
  console.log(`Found ${pageElements.length} interior print pages.`);

  const pageNames = [
    "page_02_trip_overview",
    "page_03_stays_part1",
    "page_04_stays_part2",
    "page_05_flights_outbound",
    "page_06_flights_inbound_part1",
    "page_07_flights_inbound_part2",
    "page_08_day_itinerary_part1",
    "page_09_day_itinerary_part2",
    "page_10_day_itinerary_part3",
    "page_11_pricing_and_breakup",
    "page_12_inclusions_exclusions",
    "page_13_terms_and_policies",
    "page_14_back_cover_socials",
  ];

  for (let i = 0; i < pageElements.length; i++) {
    const p = pageElements[i];
    const name = i < pageNames.length ? pageNames[i] : `page_${i + 2}_extra`;
    console.log(`Capturing ${name}...`);
    await p.screenshot({
      path: path.join(DIRS.pdf, `${name}.png`),
    });
  }

  // Clean up any old generic files in DIRS.pdf if they exist
  const files = fs.readdirSync(DIRS.pdf);
  for (const f of files) {
    if (f.startsWith("0") && f.includes("_0")) {
      fs.unlinkSync(path.join(DIRS.pdf, f));
    }
  }

  await page.close();
}

async function main() {
  console.log("Starting full application design screenshot capture...");
  ensureDirs();

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    await captureHome(browser);
    await captureSettings(browser);
    await captureEditor(browser);
    await capturePdfPages(browser);
    console.log("All screenshots successfully captured in docs/original_design_ss/ !");
  } catch (err) {
    console.error("Error during screenshot capture:", err);
  } finally {
    await browser.close();
  }
}

main();
