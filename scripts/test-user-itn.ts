import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";
import { getItinerary } from "../src/lib/db/itineraries";
import { computeClientView } from "../src/lib/schema/client-view";
import ItineraryTemplate from "../src/templates/itinerary/ItineraryTemplate";

async function testUserItinerary() {
  const rawItn = await getItinerary("abff3f57-7bb1-482c-834b-655838c4cbb6");
  if (!rawItn) {
    console.error("Itinerary not found!");
    return;
  }
  const clientView = computeClientView(rawItn);
  const templateElement = React.createElement(ItineraryTemplate, { clientView });
  const renderedMarkup = renderToStaticMarkup(templateElement);
  const printCss = fs.readFileSync(path.join(process.cwd(), "src", "styles", "print.css"), "utf8");

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${printCss}</style>
</head>
<body class="bg-white p-0 m-0">
  ${renderedMarkup}
</body>
</html>`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  const pdfPath = path.join(process.cwd(), ".uploads", "audit", "user-itn-test.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);

  const pages = await page.$$(".itinerary-page, .cover-page, .back-page");
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(process.cwd(), ".uploads", "audit", `user-page-${i + 1}.png`) });
  }

  await browser.close();

  const parser = new PDFParse({ data: pdfBuffer });
  const res = await parser.getText();
  await parser.destroy();

  console.log(`Total Pages: ${res.pages.length}`);
  res.pages.forEach((p, i) => {
    console.log(`Page ${i + 1}: footer=${p.text.includes("Friends Travels")} | ends=${JSON.stringify(p.text.trim().slice(-60))}`);
  });
}

testUserItinerary().catch(console.error);
