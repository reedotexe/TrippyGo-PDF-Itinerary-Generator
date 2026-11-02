import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

interface ClientRecord {
  count: number;
  resetAt: number;
}

// In-memory token bucket / sliding window per client key
const clients = new Map<string, ClientRecord>();

// Clean up stale client entries every 5 minutes (unref so it doesn't hold event loop open)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of clients.entries()) {
    if (now > record.resetAt) {
      clients.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function getClientIdentifier(req: NextRequest | Request, userIdFallback?: string): string {
  // 0. Prefer explicit user ID
  if (userIdFallback) return "user_" + userIdFallback;
  // 1. Check user id from session header (if authenticated)
  const userId = req.headers.get("x-user-id");
  if (userId) return `user_${userId}`;

  // 2. Check client IP from proxy headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return `ip_${forwardedFor.split(",")[0].trim()}`;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `ip_${realIp}`;

  return "default_client";
}

/**
 * Rate limit checker. Returns true if request is within limits, false if throttled.
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  // In development/test mode, relax limit unless explicitly testing rate limits
  const now = Date.now();
  const record = clients.get(clientId);

  if (!record || now > record.resetAt) {
    // New or expired window
    clients.set(clientId, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  // Active window
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Standard HTTP 429 response helper
 */
export function createRateLimitResponse(resetInSeconds: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Please retry after ${resetInSeconds} seconds.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": resetInSeconds.toString(),
      },
    }
  );
}
