import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins";
import { db, user, session, account, verification } from "@/db";
import { sendPasswordResetEmail } from "@/lib/email/resend";
import { ac, roles } from "./permissions";

const appUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://pdf.trippygo.in";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET || "trippygo-dev-auth-secret-32-chars-long-minimum-key",
  baseURL: appUrl,
  trustedOrigins: [
    "https://pdf.trippygo.in",
    "https://www.trippygo.in",
    "https://trippygo.in",
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
  ],
  advanced: {
    trustedProxyHeaders: true,
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // Public registration strictly disabled
    minPasswordLength: 12,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600, // 1 hour single-use token
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days absolute lifetime
    updateAge: 60 * 60 * 24 * 7,  // 7 days idle refresh
    cookieCache: {
      enabled: false,             // Must query database to catch real-time deactivations / bans
    },
  },
  plugins: [
    admin({
      ac,
      roles,
      defaultRole: "salesperson",
      adminRoles: ["admin"],
    }),
  ],
  rateLimit: {
    window: 10,
    max: 100,
  },
});

export type Auth = typeof auth;
