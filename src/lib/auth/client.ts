import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, roles } from "./permissions";

/**
 * Better Auth React Client.
 * Note: baseURL is deliberately omitted so that requests are relative (/api/auth)
 * and resolve dynamically to whichever origin/domain the browser is visiting,
 * preventing hardcoded localhost:3000 build-time leakages in production.
 */
export const authClient = createAuthClient({
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
