# TrippyGo Auth & Access Control: Ideation and Requirements Brief

Oct 31, 2026 · @Reedham

## Purpose and scope

TrippyGo has no user accounts today, so every itinerary is visible to anyone who can open the app. This brief defines accounts, login, sessions and per-user visibility so that admins see every itinerary and each salesperson sees only their own.

In scope: authentication, user creation and lifecycle, session management, the ownership data model, and the authorization layer that enforces visibility. Out of scope: changes to pricing, extraction, flight logic or the PDF design.

Why it matters beyond tidiness: itineraries hold client names and margin data. Without ownership enforcement, one salesperson could read or overwrite another's quotes, or open the commercial settings page.

## Decisions confirmed

These choices are settled and drive everything below.

| Topic | Decision |
| --- | --- |
| Login method | Email and password only |
| Account creation | Admin creates accounts; no public signup |
| Admin powers over itineraries | View, edit, generate PDF and reassign ownership |
| Database | PostgreSQL is mandatory; the JSON file fallback is kept for tests only |
| Auth library (proposed) | Better Auth with its Drizzle adapter and admin plugin, from the earlier research |

Settled after the first review (31 October 2026):

- Invites and password resets are emailed through Resend.
- Margin permissions do not change: salespeople see and set any margin on their own itineraries.
- Itineraries are soft-deleted only, and admins can restore them.
- There are no existing itineraries, so no backfill is needed.
- The proposed session lengths are accepted.
- Admin impersonation is a future development, not part of this release.

## Roles and permissions

There are two roles, `admin` and `salesperson`. Every itinerary has exactly one owner, and ownership decides what a salesperson can touch.

| Capability | Salesperson | Admin |
| --- | --- | --- |
| Create an itinerary (becomes the owner) | Yes | Yes |
| List and open itineraries | Own only | All |
| Edit, delete, generate PDF | Own only | All |
| View version history | Own only | All |
| Reassign an itinerary to another user | No | Yes |
| Use extraction, flight search, image search | Yes | Yes |
| Open agency commercial settings (`/admin/settings`) | No | Yes |
| Create, deactivate, reset passwords for users | No | Yes |
| Change own password | Yes | Yes |

Rules that follow from this:

- A salesperson requesting another user's itinerary gets "not found", never "forbidden", so IDs cannot be probed.
- When an admin edits someone's itinerary, the owner does not change. The edit is recorded in `updated_by`.
- The last active admin cannot be demoted, deactivated or deleted.
- Margin and net-cost fields stay visible and editable for salespeople on their own itineraries. This release changes nothing about margin permissions, and the client PDF still never shows them.
- Deleting an itinerary is a soft delete: the row is hidden from normal lists and kept. Admins get a Deleted view and can restore any itinerary; salespeople cannot see or restore deleted ones.

## User creation and lifecycle

Only admins create accounts. The first admin is seeded by a one-time script, never through the UI.

1. **Create:** the admin enters name, email and role. The system emails a one-time invite link through Resend; the user opens it to set their password.
2. **First login:** the user must set their own password before reaching any other page.
3. **Active use:** the user can change their own password; only an admin can change name, email or role.
4. **Password reset:** the admin triggers a reset email through Resend, and the old password stops working. All of that user's sessions are revoked at the same moment.
5. **Offboarding:** the admin deactivates the account (a ban, not a delete). Sessions are revoked immediately and login is refused.
6. **Handover:** before or after deactivation, the admin reassigns the user's itineraries to another user. Unassigned itineraries stay visible to admins only.

Accounts are never hard-deleted while they own itineraries, because the ownership and audit trail must stay intact.

Email: invites and resets are sent through Resend from a verified agency domain. The API key lives in a server-only environment variable. Proposed expiry: invite links 48 hours, reset links 1 hour, both single-use. If sending fails, the admin sees an error and can retry; no password is ever shown in the UI. In local development, with no API key set, emails are printed to the server console instead.

The admin screen needs a user list (name, email, role, status, last login, itinerary count) and actions for create, change role, reset password, deactivate and reactivate.

## Authentication requirements

Login is email and password, handled by Better Auth running inside the Next.js app and storing users in the existing PostgreSQL database. The values below are proposed defaults; change any that don't suit the agency.

| Requirement | Proposed default |
| --- | --- |
| Public signup | Disabled |
| Password policy | Minimum 12 characters, checked against a common-password list; no forced periodic rotation |
| Password storage | Hashed by the library (never logged, never returned by any API) |
| Login throttling | 5 failed attempts per 15 minutes per account and per IP, then a timed lockout |
| Error messages | Same generic message for unknown email and wrong password |
| Login page | Single `/login` page; no "register" link |
| Logout | Ends the current session; a "sign out everywhere" option revokes all of the user's sessions |
| Multi-factor authentication | Not in the first release; the library supports adding it later |

The dev-only auth bypass is not used. Local development uses the Docker Compose PostgreSQL and a seed script that creates one admin and one salesperson.

## Session management requirements

Sessions are server-side records in PostgreSQL, referenced by a signed cookie. That lets an admin revoke access instantly, which a stateless token cannot do.

| Requirement | Proposed default |
| --- | --- |
| Cookie flags | `HttpOnly`, `Secure` in production, `SameSite=Lax` |
| Idle timeout | 7 days, refreshed on use |
| Absolute lifetime | 30 days, then login is required again |
| Concurrent sessions | Allowed (office desktop and phone); each is listed and revocable |
| Revocation triggers | Password change, password reset, role change, deactivation, "sign out everywhere" |
| Role freshness | Role and active status are read from the database on every protected request, not trusted from a long-lived cookie cache |
| Expired session | API returns 401; pages redirect to `/login` and return the user to where they were |
| PDF render sessions | None. The headless renderer keeps using the existing 60-second HMAC token and never receives a user cookie |

The last row matters for your architecture. The renderer must stay session-free, so the check "does this user own this itinerary" happens in the generate endpoint before the HMAC token is signed.

## Authorization architecture and data model

Visibility is enforced in one server-side data-access layer, not scattered across pages. The Next.js `proxy.ts` file only redirects unauthenticated visitors; it is never the security boundary.

Every protected request follows the same path:

1. `proxy.ts` redirects to `/login` if there is no session cookie, and keeps non-admins out of `/admin/*`.
2. The route handler or server action calls `requireUser()`, which loads the session, role and active status, or rejects.
3. Itinerary reads and writes go through data-access functions that take the user. Admins get no filter; salespeople get `WHERE owner_id = user.id`.
4. A missing or foreign record returns "not found".

Data model changes:

| Change | Detail |
| --- | --- |
| `user`, `session`, `account` tables | Generated by Better Auth; `role` and ban fields come from its admin plugin |
| `itineraries.owner_id` | Foreign key to the user; indexed; required for new rows |
| `itineraries.created_by`, `updated_by` | Foreign keys to the user, for audit. Soft deletion adds deleted-at and deleted-by columns |
| `itinerary_versions` | No owner column; access is inherited from the parent itinerary |
| Schema version | Bump `schemaVersion` to 2 and extend `migrateItinerarySchema` |
| Backfill | None needed: there are no existing itineraries, so owner is required from the start |

Endpoint rules:

| Endpoint | Rule |
| --- | --- |
| `GET/POST /api/itineraries` | List is scoped by role; create stamps `owner_id` |
| `/api/itineraries/[id]` | Ownership check on read and update; delete is soft and hides the row from lists |
| `/api/itineraries/[id]/generate` | Ownership check before signing the HMAC token or calling the renderer |
| `/api/extract`, `/api/flights`, `/api/images` | Session required; no ownership check |
| `/print/[id]` | No session; HMAC token only, minted after the check above |
| `/admin/*` and user-management actions | Admin only, checked again inside each action |
| Rate limits | Move from per-IP to per-user, because office staff share one IP |

## Security and audit requirements

- **Secrets:** the auth secret and database credentials stay in server environment variables; the existing client-bundle scan in `tests/security/api-keys.test.ts` must still pass.
- **Database role:** the application connects as a non-superuser. This also keeps the door open for PostgreSQL row-level security later, which superusers would silently bypass.
- **Net-rate protection:** `computeClientView()` and the PDF leak test are unchanged. Auth must never weaken them, and `test:leak` stays in CI.
- **Audit log:** record who did what and when for login success and failure, user creation, role change, password reset, deactivation, itinerary reassignment, delete, restore and PDF generation. Admins can view it; nobody can edit it.
- **CSRF and origin:** state-changing requests accept only the app's own origin.
- **Transport:** HTTPS only in production, as the existing Nginx setup already provides.
- **Admin impersonation:** not in this release and listed as a future development. It would blur the audit trail and the ownership stamps, so it needs its own design first.

Required authorization tests, added to `test:security`:

- Salesperson A requesting salesperson B's itinerary on every route returns "not found".
- A salesperson cannot reach `/admin/*` or its actions, including by calling them directly.
- The generate endpoint never signs a token for an itinerary the caller does not own.
- A deactivated user's existing session stops working on the next request.
- The dashboard list and summaries never contain another user's rows.

## Out of scope, assumptions and settled questions

Not in the first release: admin impersonation (a future development), Google or other single sign-on, multi-factor authentication, teams or team leads, itinerary sharing between salespeople, per-field permissions, and database row-level security.

Assumptions: one agency (no multi-tenant separation), a small user count (tens, not thousands), and that there are no existing itineraries to migrate.

Questions settled on 31 October 2026:

- Email: Resend sends invites and password resets.
- Margin: unchanged. Salespeople may use any margin on their own itineraries.
- Deletion: soft delete only; admins can restore.
- Existing data: none, so no backfill.
- Sessions: 7 days idle and 30 days absolute are accepted.
- Impersonation: deferred to a future development.

## Acceptance criteria and rollout

The work ships in five phases. Each phase has a gate that must pass before the next starts.

| Phase | Work | Gate |
| --- | --- | --- |
| 1. Accounts | Better Auth, user tables, `/login`, seeded admin, Docker Postgres for local dev, Resend invite and reset emails | Admin and salesperson can log in and out; wrong password is throttled |
| 2. Ownership | `owner_id` migration, schema version 2, backfill | Every existing itinerary has an owner or is explicitly unassigned |
| 3. Enforcement | Data-access layer, guards on every route and action, per-user rate limits | All authorization tests pass; `test:leak` still passes |
| 4. Admin UI | User management, all-itineraries view with owner filter, reassignment, deleted-itineraries view with restore, audit log view | An admin can onboard, hand over and offboard a user end to end |
| 5. Hardening | Session review, password reset flow, production config check | Revoked and deactivated users lose access on the next request |

The feature is done when:

- A salesperson sees only their own itineraries in the dashboard, search and every API response.
- An admin sees all itineraries and can edit, generate PDFs and reassign any of them.
- No route returns another user's data when its ID is guessed or its URL is typed directly.
- Deactivating a user ends their access without waiting for a session to expire.
- The existing suites (`test:unit`, `test:security`, `test:leak`, `test:e2e`) all pass, with the e2e flow running as a logged-in user.
