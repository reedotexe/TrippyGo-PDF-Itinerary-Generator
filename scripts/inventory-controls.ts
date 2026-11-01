import { chromium } from "playwright";
import fs from "fs";

async function extractAllControls() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/itineraries/feb43b07-4013-47eb-a80c-40fb494eba70/edit", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const inventory = await page.evaluate(() => {
    const panels = Array.from(document.querySelectorAll("div.flex-1.overflow-y-auto > div"));
    return panels.map((panel, pIdx) => {
      const heading = panel.querySelector("h3, h4")?.textContent?.trim() || `Panel ${pIdx + 1}`;
      const buttons = Array.from(panel.querySelectorAll("button")).map((b) => ({
        text: b.innerText.trim().replace(/\s+/g, " "),
        ariaLabel: b.getAttribute("aria-label"),
        title: b.title,
        classes: b.className,
      }));
      const inputs = Array.from(panel.querySelectorAll("input, select, textarea")).map((inp) => {
        const el = inp as HTMLInputElement;
        const label = panel.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() || "";
        return {
          id: el.id,
          tagName: el.tagName.toLowerCase(),
          type: el.type,
          value: el.value,
          placeholder: el.placeholder,
          label,
        };
      });
      const paragraphs = Array.from(panel.querySelectorAll("p, span.text-slate-500, span.text-slate-400, div.text-xs")).map((t) =>
        t.textContent?.trim().replace(/\s+/g, " ")
      ).filter((t) => t && t.length > 20);

      return {
        heading,
        buttonCount: buttons.length,
        buttons,
        inputCount: inputs.length,
        inputs,
        textCount: paragraphs.length,
        sampleTexts: paragraphs.slice(0, 10),
      };
    });
  });

  fs.writeFileSync(".data/editor-controls-inventory.json", JSON.stringify(inventory, null, 2));
  console.log("Wrote full inventory of", inventory.length, "panels to .data/editor-controls-inventory.json");
  await browser.close();
}

extractAllControls().catch(console.error);
