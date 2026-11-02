import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  plugins: [
    adminClient({
      ac,
      roles,
    }),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = authClient;
