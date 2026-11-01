import { chromium } from "playwright";
import path from "path";

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1697 }); // A4 aspect ratio @ 1200w

  const htmlPath = path.join(process.cwd(), ".uploads", "audit", "luxury-itinerary-preview.html");
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // Find the cover page
  const cover = await page.$(".cover-page");
  if (cover) {
    await cover.screenshot({
      path: path.join(process.cwd(), ".uploads", "audit", "preview-cover.png"),
    });
    console.log("Cover screenshot captured successfully.");
  } else {
    console.error("No .cover-page found!");
  }
  await browser.close();
}

capture().catch(console.error);
