import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Exempt public routes, auth flows, static assets, and HMAC-guarded print routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/Brand Assets") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/set-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/print") // Print is strictly sessionless, guarded by 60s HMAC token
  ) {
    return NextResponse.next();
  }

  // 2. Session detection (Cookie or test runner headers)
  const sessionCookie =
    getSessionCookie(req) ||
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("trippygo_session")?.value;

  const testUserId = req.headers.get("x-user-id");
  const testUserRole = req.headers.get("x-user-role");
  const isAuthenticated = Boolean(sessionCookie || testUserId);

  // 3. Routing gate for unauthenticated visitors
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role gate for Administrative routes (/admin/* and /api/admin/*)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (testUserRole && testUserRole !== "admin") {
      if (pathname.startsWith("/api/admin")) {
        return new NextResponse(
          JSON.stringify({ error: "Forbidden: Administrator privileges required" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 5. Downstream header propagation
  const response = NextResponse.next();
  if (testUserId) {
    response.headers.set("x-user-id", testUserId);
  }
  if (testUserRole) {
    response.headers.set("x-user-role", testUserRole);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|Brand Assets|fonts).*)",
  ],
};
