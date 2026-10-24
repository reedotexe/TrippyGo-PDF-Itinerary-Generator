import http from "http";
import { chromium, Browser } from "playwright";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const MAX_CONCURRENT_RENDERS = 3;

let browser: Browser | null = null;
let activeRenders = 0;

/**
 * Initialize Singleton Playwright Chromium Instance
 */
async function initBrowser(): Promise<Browser> {
  if (!browser) {
    console.log("[Renderer Service] Launching singleton Chromium instance...");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
    console.log("[Renderer Service] Chromium initialized successfully.");
  }
  return browser;
}

/**
 * Concurrency Queue Limiter
 */
async function acquireSlot(): Promise<void> {
  while (activeRenders >= MAX_CONCURRENT_RENDERS) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  activeRenders++;
}

function releaseSlot(): void {
  activeRenders = Math.max(0, activeRenders - 1);
}

/**
 * Main HTTP Server
 */
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        browserReady: !!browser,
        activeRenders,
        maxConcurrency: MAX_CONCURRENT_RENDERS,
      })
    );
    return;
  }

  // PDF Render endpoint: POST /render
  if (req.method === "POST" && req.url === "/render") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      // 1MB request body limit
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      let payload: { url?: string; token?: string } = {};
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      const { url } = payload;
      if (!url) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required 'url' parameter" }));
        return;
      }

      await acquireSlot();
      const currentBrowser = await initBrowser();

      try {
        const context = await currentBrowser.newContext({
          viewport: { width: 1200, height: 1600 },
          deviceScaleFactor: 2,
        });
        const page = await context.newPage();

        // SSRF Network Isolation: Block egress to private IP subnets, loopback & AWS metadata
        await page.route("**", (route) => {
          const reqUrl = route.request().url();
          try {
            const parsed = new URL(reqUrl);
            const host = parsed.hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");

            const isMetadata = host === "169.254.169.254" || host.startsWith("169.254.");
            const isLoopback = host === "localhost" || host === "0.0.0.0" || host === "::" || host === "::1" || host.startsWith("127.");
            const isPrivateSubnet =
              host.startsWith("10.") ||
              host.startsWith("192.168.") ||
              /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
              host.startsWith("fc00:") ||
              host.startsWith("fe80:");

            const targetBase = url.split("?")[0];
            const isTargetApp = reqUrl.startsWith(targetBase);

            if ((isMetadata || isPrivateSubnet || isLoopback) && !isTargetApp) {
              console.warn(`[Renderer SSRF Defense] Blocked private/loopback IP access: ${reqUrl}`);
              return route.abort("blockedbyclient");
            }
          } catch {
            // Pass through valid local resources
          }
          return route.continue();
        });

        try {
          await page.goto(url, {
            waitUntil: "networkidle",
            timeout: 15000,
          });

          // Wait up to 10s for document readiness flag
          await page
            .waitForSelector('meta[name="ready"][content="true"]', { timeout: 10000 })
            .catch(() => {
              // Proceed if timeout fired
            });
        } catch (navErr) {
          console.warn(`[Renderer Service] Navigation warning for ${url}:`, navErr);
        }

        // Wait for all images and fonts
        await page.evaluate(() => {
          return Promise.all(
            Array.from(document.images).map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise((r) => {
                    img.onload = r;
                    img.onerror = r;
                  })
            )
          );
        });
        await page.evaluate(() => document.fonts.ready);

        // Emulate print media
        await page.emulateMedia({ media: "print" });

        // Generate A4 PDF with exact headers & footers
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: true,
          displayHeaderFooter: true,
          headerTemplate: "<div></div>",
          footerTemplate: `
            <div style="font-size: 8px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; padding: 0 10mm; display: flex; justify-content: space-between; align-items: center;">
              <span>TrippyGo Holidays • Official Travel Proposal</span>
              <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
          `,
          margin: {
            top: "10mm",
            bottom: "12mm",
            left: "8mm",
            right: "8mm",
          },
        });

        await context.close();

        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Length": pdfBuffer.length,
          "Content-Disposition": 'inline; filename="itinerary.pdf"',
        });
        res.end(Buffer.from(pdfBuffer));
      } catch (err: unknown) {
        console.error("[Renderer Service] Error generating PDF:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Failed to render PDF",
            message: err instanceof Error ? err.message : String(err),
          })
        );
      } finally {
        releaseSlot();
      }
    });
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Route not found" }));
});

// Start Server and Chromium
initBrowser().then(() => {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Renderer Service] HTTP server listening on http://0.0.0.0:${PORT}`);
  });
});

// Graceful Shutdown
async function shutdown() {
  console.log("[Renderer Service] Shutting down gracefully...");
  server.close();
  if (browser) {
    await browser.close();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
