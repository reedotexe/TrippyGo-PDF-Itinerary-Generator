import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({
    headless: true,
  });

  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1";
  const docsDir = path.join(process.cwd(), "docs");

  const sessionToken = "dev_sess_9c3c4319-512e-477c-b1f8-23bf883dbb0d";

  // Viewport 1: 1440px (Desktop)
  const context1440 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context1440.addCookies([
    {
      name: "better-auth.session_token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
    },
  ]);

  const page1440 = await context1440.newPage();
  await page1440.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page1440.reload({ waitUntil: "networkidle" });
  await page1440.waitForTimeout(1000);

  // Click "+ New itinerary" button to open modal
  const newBtn1440 = page1440.getByRole("button", { name: /New itinerary/i });
  await newBtn1440.click();
  await page1440.waitForTimeout(500);

  // Screenshot 1: 1440px - Default Upload Quote tab
  const shot1440Upload = path.join(artifactDir, "modal-new-itinerary-1440px.png");
  await page1440.screenshot({ path: shot1440Upload });
  fs.copyFileSync(shot1440Upload, path.join(docsDir, "modal-new-itinerary-1440px.png"));
  console.log("Saved 1440px Upload modal screenshot to:", shot1440Upload);

  // Switch to Paste text tab
  await page1440.getByRole("tab", { name: /Paste text/i }).click();
  await page1440.waitForTimeout(300);
  const shot1440Paste = path.join(artifactDir, "modal-new-itinerary-paste-1440px.png");
  await page1440.screenshot({ path: shot1440Paste });
  console.log("Saved 1440px Paste modal screenshot to:", shot1440Paste);

  // Switch to Start blank tab
  await page1440.getByRole("tab", { name: /Start blank/i }).click();
  await page1440.waitForTimeout(300);
  const shot1440Blank = path.join(artifactDir, "modal-new-itinerary-blank-1440px.png");
  await page1440.screenshot({ path: shot1440Blank });
  console.log("Saved 1440px Blank modal screenshot to:", shot1440Blank);

  // Switch back to Upload and attach a file to verify selected file state
  await page1440.getByRole("tab", { name: /Upload quote/i }).click();
  await page1440.waitForTimeout(300);

  const sampleFilePath = path.join(process.cwd(), "sample-itineraries", "01_kashmir_6n7d_paradise_supplier.txt");
  const fileInput = page1440.locator('input[type="file"]');
  await fileInput.setInputFiles(sampleFilePath);
  await page1440.waitForTimeout(300);

  const shot1440FileSelected = path.join(artifactDir, "modal-new-itinerary-file-selected-1440px.png");
  await page1440.screenshot({ path: shot1440FileSelected });
  console.log("Saved 1440px File Selected modal screenshot to:", shot1440FileSelected);

  await context1440.close();

  // Viewport 2: 768px (Tablet)
  const context768 = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 1,
  });
  await context768.addCookies([
    {
      name: "better-auth.session_token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
    },
  ]);

  const page768 = await context768.newPage();
  await page768.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page768.waitForTimeout(1000);

  // Click "+ New itinerary" button on 768px
  const newBtn768 = page768.getByRole("button", { name: /New itinerary/i });
  await newBtn768.click();
  await page768.waitForTimeout(500);

  const shot768Upload = path.join(artifactDir, "modal-new-itinerary-768px.png");
  await page768.screenshot({ path: shot768Upload });
  fs.copyFileSync(shot768Upload, path.join(docsDir, "modal-new-itinerary-768px.png"));
  console.log("Saved 768px Upload modal screenshot to:", shot768Upload);

  await context768.close();
  await browser.close();
  console.log("All screenshots captured successfully.");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
