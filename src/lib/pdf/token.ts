import { createHmac } from "crypto";

const DEFAULT_SECRET = process.env.INTERNAL_RENDER_SECRET || "trippygo_default_hmac_secret_32bytes_min";

/**
 * Sign a short-lived HMAC token for the Playwright internal renderer
 */
export function signRenderToken(itineraryId: string, ttlSeconds: number = 60): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${itineraryId}:${expiresAt}`;
  const hmac = createHmac("sha256", DEFAULT_SECRET).update(payload).digest("hex");
  return `${expiresAt}:${hmac}`;
}

/**
 * Verify HMAC render token and check expiration
 */
export function verifyRenderToken(itineraryId: string, token: string | null | undefined): boolean {
  if (!token) return false;

  const parts = token.split(":");
  if (parts.length !== 2) return false;

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > expiresAt) {
    return false; // Token expired
  }

  const payload = `${itineraryId}:${expiresAt}`;
  const expectedHmac = createHmac("sha256", DEFAULT_SECRET).update(payload).digest("hex");

  return signature === expectedHmac;
}
