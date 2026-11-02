import { chromium } from "playwright";
import path from "path";
import fs from "fs";

async function main() {
  const browser = await chromium.launch({
    headless: true,
  });

  const artifactDir = "C:\\Users\\Admin\\.gemini\\antigravity\\brain\\9627fe67-27b9-421a-a4db-5bb956f502d1";
  const docsDir = path.join(process.cwd(), "docs");

  // Viewport 1: 1440px (Desktop)
  const context1440 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context1440.addCookies([
    {
      name: "better-auth.session_token",
      value: "dev_sess_9c3c4319-512e-477c-b1f8-23bf883dbb0d",
      domain: "localhost",
      path: "/",
    },
  ]);

  const page1440 = await context1440.newPage();
  await page1440.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page1440.waitForTimeout(1000);

  const shot1440Path = path.join(artifactDir, "dashboard-1440px.png");
  const docs1440Path = path.join(docsDir, "dashboard-1440px.png");
  await page1440.screenshot({ path: shot1440Path, fullPage: true });
  fs.copyFileSync(shot1440Path, docs1440Path);
  console.log("Saved 1440px screenshot to:", shot1440Path);

  // Viewport 2: 768px (Tablet / Medium)
  const context768 = await browser.newContext({
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 1,
  });
  await context768.addCookies([
    {
      name: "better-auth.session_token",
      value: "dev_sess_9c3c4319-512e-477c-b1f8-23bf883dbb0d",
      domain: "localhost",
      path: "/",
    },
  ]);

  const page768 = await context768.newPage();
  await page768.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page768.waitForTimeout(1000);

  const shot768Path = path.join(artifactDir, "dashboard-768px.png");
  const docs768Path = path.join(docsDir, "dashboard-768px.png");
  await page768.screenshot({ path: shot768Path, fullPage: true });
  fs.copyFileSync(shot768Path, docs768Path);
  console.log("Saved 768px screenshot to:", shot768Path);

  // Viewport 3: 390px (Mobile)
  const context390 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await context390.addCookies([
    {
      name: "better-auth.session_token",
      value: "dev_sess_9c3c4319-512e-477c-b1f8-23bf883dbb0d",
      domain: "localhost",
      path: "/",
    },
  ]);

  const page390 = await context390.newPage();
  await page390.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page390.waitForTimeout(1000);

  const shot390Path = path.join(artifactDir, "dashboard-390px.png");
  const docs390Path = path.join(docsDir, "dashboard-390px.png");
  await page390.screenshot({ path: shot390Path, fullPage: true });
  fs.copyFileSync(shot390Path, docs390Path);
  console.log("Saved 390px screenshot to:", shot390Path);

  await browser.close();
  console.log("Done capturing screenshots!");
}

main().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
