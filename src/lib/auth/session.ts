import { NextRequest } from "next/server";
import { agencyDefaults } from "@/config/agency";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "salesperson";
}

export const SESSION_COOKIE_NAME = "trippygo_session";

// Default dev session (matches agency salesperson default)
export const DEFAULT_DEV_SESSION: UserSession = {
  id: "u-dev-12345",
  name: "Vikram Malhotra",
  email: "vikram@trippygo.com",
  phone: "+91 98765 43210",
  role: "salesperson",
};

export const DEFAULT_ADMIN_SESSION: UserSession = {
  id: "u-admin-00001",
  name: "Agency Administrator",
  email: "admin@trippygo.com",
  phone: "+91 99999 00000",
  role: "admin",
};

/**
 * Retrieve current user session from cookies or headers
 */
export async function getSession(req?: NextRequest | Request): Promise<UserSession | null> {
  // 1. Check cookies if request is provided
  if (req) {
    let cookieVal: string | null = null;
    if ("cookies" in req && typeof (req as any).cookies.get === "function") {
      cookieVal = (req as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value || null;
    } else {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
      cookieVal = match ? decodeURIComponent(match[1]) : null;
    }

    if (cookieVal) {
      try {
        const parsed = JSON.parse(cookieVal);
        if (parsed && parsed.id && parsed.role) {
          return parsed as UserSession;
        }
      } catch {
        // Invalid cookie format
      }
    }

    // Check optional x-user-role header for integration tests
    const roleHeader = req.headers.get("x-user-role");
    if (roleHeader === "admin") {
      return DEFAULT_ADMIN_SESSION;
    } else if (roleHeader === "salesperson") {
      return DEFAULT_DEV_SESSION;
    }
  }

  // 2. In local development, seamlessly provide default session
  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_DEV_SESSION;
  }

  return null;
}

/**
 * Serialize a session payload into a cookie value
 */
export function serializeSession(session: UserSession): string {
  return JSON.stringify(session);
}

/**
 * Validate role permissions
 */
export function hasRole(session: UserSession | null, requiredRole: "admin" | "salesperson"): boolean {
  if (!session) return false;
  if (session.role === "admin") return true; // Admins have super-user privileges
  return session.role === requiredRole;
}
