/**
 * Network Isolation & SSRF Defense Utilities
 * Protects headless Chromium and server-side renderers from querying
 * private subnets, cloud metadata endpoints, or unauthorized local services.
 */

/**
 * Checks whether a given hostname or IP string is a private, loopback, or cloud-metadata address.
 */
export function isPrivateOrBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim().replace(/^\[|\]$/g, "");

  // Localhost & Zero IP
  if (host === "localhost" || host === "0.0.0.0" || host === "::" || host === "::1") {
    return true;
  }

  // AWS / GCP / Azure Cloud Metadata Service (IMDSv1 / IMDSv2)
  if (host === "169.254.169.254" || host.startsWith("169.254.")) {
    return true;
  }

  // IPv4 Loopback (127.0.0.0/8)
  if (host.startsWith("127.")) {
    return true;
  }

  // IPv4 RFC 1918 Private Address Spaces:
  // 10.0.0.0/8
  if (host.startsWith("10.")) {
    return true;
  }

  // 192.168.0.0/16
  if (host.startsWith("192.168.")) {
    return true;
  }

  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) {
    return true;
  }

  // IPv6 Unique Local (fc00::/7) and Link-Local (fe80::/10)
  if (host.startsWith("fc00:") || host.startsWith("fd00:") || host.startsWith("fe80:")) {
    return true;
  }

  return false;
}

/**
 * Validates whether an incoming HTTP request in Playwright is permitted during PDF rendering.
 * Allows the explicit target print route and external public CDNs/image providers,
 * but aborts any request attempting to scan internal networks, private IPs, or metadata services.
 */
export function isRequestAllowedInRenderer(requestUrl: string, targetPrintUrl: string): boolean {
  try {
    const parsed = new URL(requestUrl);
    const host = parsed.hostname;

    // 1. Allow the explicitly designated print page route itself
    const targetBase = targetPrintUrl.split("?")[0];
    if (requestUrl.startsWith(targetBase)) {
      return true;
    }

    // 2. Allow local Next.js static asset bundles from the same origin as targetPrintUrl
    try {
      const targetParsed = new URL(targetPrintUrl);
      if (
        parsed.origin === targetParsed.origin &&
        (parsed.pathname.startsWith("/_next/") ||
          parsed.pathname.startsWith("/static/") ||
          parsed.pathname.endsWith(".css") ||
          parsed.pathname.endsWith(".woff2") ||
          parsed.pathname.endsWith(".svg"))
      ) {
        return true;
      }
    } catch {
      // ignore parsing error
    }

    // 3. Block any requests to private subnets, localhost, or cloud metadata
    if (isPrivateOrBlockedHost(host)) {
      return false;
    }

    // 4. Allow legitimate public web resources (e.g. Unsplash images, Google Fonts)
    return true;
  } catch {
    return false;
  }
}
