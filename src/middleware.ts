import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, DEFAULT_DEV_SESSION } from "@/lib/auth/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Exempt public routes and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/Brand Assets") ||
    pathname.startsWith("/print") || // Protected by HMAC render tokens
    pathname.startsWith("/api/extract") ||
    pathname.startsWith("/api/images") ||
    pathname.startsWith("/api/storage/download")
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const cookieVal = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let userSession = null;

  if (cookieVal) {
    try {
      userSession = JSON.parse(cookieVal);
    } catch {
      // Malformed cookie
    }
  }

  // Allow development mode fallback or test header
  const roleHeader = req.headers.get("x-user-role");
  if (roleHeader === "admin") {
    userSession = { id: "u-admin", role: "admin", name: "Admin User" };
  } else if (roleHeader === "salesperson") {
    userSession = DEFAULT_DEV_SESSION;
  } else if (!userSession && process.env.NODE_ENV !== "production") {
    userSession = DEFAULT_DEV_SESSION;
  }

  // 3. Admin Route Protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!userSession || userSession.role !== "admin") {
      // In development mode, auto-grant admin if directly visiting admin route
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.next();
      }
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: Admin privileges required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 4. Inject authenticated session headers for downstream routes
  const response = NextResponse.next();
  if (userSession) {
    response.headers.set("x-user-id", userSession.id);
    response.headers.set("x-user-role", userSession.role);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/itineraries/:path*",
    "/api/itineraries/:path*",
  ],
};
