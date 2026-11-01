import { notFound } from "next/navigation";
import { getItinerary } from "@/lib/db/itineraries";
import { computeClientView } from "@/lib/schema/client-view";
import { verifyRenderToken } from "@/lib/pdf/token";
import ItineraryTemplate from "@/templates/itinerary/ItineraryTemplate";
import PrintActionBar from "@/components/print/PrintActionBar";
import "@/styles/print.css";

export const instant = false;

export default async function PrintItineraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string; download?: string; version?: string; token?: string }>;
}) {
  const { id } = await params;
  const { preview, download, version, token } = await searchParams;

  // Render Auth Security: valid HMAC token, live preview (?preview=1), direct download (?download=1), version inspection, or dev mode
  const isAuthorized =
    preview === "1" ||
    download === "1" ||
    Boolean(version) ||
    process.env.NODE_ENV !== "production" ||
    (token ? verifyRenderToken(id, token) : false);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center text-xl font-bold mb-3">
          🔒
        </div>
        <h1 className="text-xl font-bold mb-1">Unauthorized PDF Render Request</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          Access to this print route is protected. A signed HMAC token or an active staff preview session is required.
        </p>
      </div>
    );
  }

  const rawItinerary = await getItinerary(id);
  if (!rawItinerary) {
    notFound();
  }

  // Safe client view - Net amount, markup, and internal meta are guaranteed stripped
  const clientView = computeClientView(rawItinerary);

  return (
    <>
      {/* Ready state meta tag for Playwright headless browser polling (hoisted automatically by Next.js) */}
      <meta name="ready" content="false" id="render-ready-meta" />

      <div className="min-h-screen bg-slate-100 print:bg-white text-slate-800 font-sans antialiased">
        {/* Top action bar when in iframe preview mode */}
        {preview && <PrintActionBar version={version} />}

        {/* Main A4 Document Container */}
        <main>
          <ItineraryTemplate clientView={clientView} />
        </main>

        {/* Readiness signal script: sets meta[name=ready] to "true" once fonts & images are resolved */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function setReady() {
                  const meta = document.getElementById('render-ready-meta') || document.querySelector('meta[name="ready"]');
                  if (meta) meta.setAttribute('content', 'true');
                  document.documentElement.classList.add('rendered-ready');
                }

                if (document.readyState === 'complete') {
                  Promise.all([
                    document.fonts ? document.fonts.ready : Promise.resolve(),
                    Promise.all(Array.from(document.images).map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })))
                  ]).then(setReady).catch(setReady);
                } else {
                  window.addEventListener('load', function() {
                    Promise.all([
                      document.fonts ? document.fonts.ready : Promise.resolve(),
                      Promise.all(Array.from(document.images).map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })))
                    ]).then(setReady).catch(setReady);
                  });
                }
              })();
            `,
          }}
        />

        {/* Auto-print trigger if download query param was set */}
        {download && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.addEventListener('DOMContentLoaded', () => { setTimeout(() => window.print(), 800); });`,
            }}
          />
        )}
      </div>
    </>
  );
}
