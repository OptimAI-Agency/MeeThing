# Technology Stack

**Project:** MeeThing (wellness-focused calendar companion)
**Researched:** 2026-03-22
**Scope:** Additions to existing React 18 + Vite + TypeScript + Supabase stack

This document covers NEW technology decisions only. The existing stack (React 18, Vite 5, TanStack Query 5, shadcn/ui, Supabase) is established and not under review.

---

## Recommended Stack Additions

### Microsoft Outlook OAuth + Calendar Sync

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Microsoft Identity Platform v2.0 (raw HTTP) | N/A (REST endpoints) | OAuth 2.0 authorization code flow for Outlook | Use raw HTTP `fetch()` in the Deno edge function, same pattern as the existing Google OAuth. MSAL.js is designed for browser/Node.js, not Deno edge functions. The Microsoft Identity Platform endpoints are simple REST -- no SDK needed. | HIGH |
| Microsoft Graph API v1.0 | v1.0 | Calendar event retrieval | `/me/calendarView` endpoint returns events in a date range, directly analogous to Google Calendar's events.list. Use v1.0 (stable), not beta. | HIGH |

**Do NOT use:**
- **MSAL.js (`@azure/msal-browser`, `@azure/msal-node`)** -- These are heavy SDKs designed for browser SPAs or Node.js backends. They do not run in Deno. The raw OAuth 2.0 flow is 30 lines of `fetch()` code, identical in structure to the existing Google implementation. Adding an SDK would be overengineering.
- **Microsoft Graph SDK for JavaScript** -- Pulls in MSAL as a dependency; same Deno incompatibility. The Graph REST API is a single `fetch()` call with a Bearer token.

**Microsoft Identity Platform endpoints (verified from official docs):**

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Authorize | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` | User consent + auth code |
| Token | `https://login.microsoftonline.com/common/oauth2/v2.0/token` | Code-to-token exchange + refresh |
| Calendar | `https://graph.microsoft.com/v1.0/me/calendarView` | Fetch events in date range |

**Required scopes:** `offline_access Calendars.Read`
- `offline_access` -- returns a refresh token
- `Calendars.Read` -- read-only access to calendar events (least privilege; do not request `Calendars.ReadWrite` unless writing events)

**Tenant value:** Use `common` to support both personal Microsoft accounts and work/school (Microsoft 365) accounts. This matches MeeThing's broad target audience.

**Required env vars (Supabase Edge Function secrets):**

| Variable | Purpose |
|----------|---------|
| `MICROSOFT_CLIENT_ID` | App registration client ID from Microsoft Entra admin center |
| `MICROSOFT_CLIENT_SECRET` | App registration client secret |
| `MICROSOFT_OAUTH_REDIRECT_URI` | OAuth redirect URI (same AuthCallback page, different state param) |

**App registration:** Register at https://entra.microsoft.com (formerly Azure AD). Add `Web` platform with redirect URI. Under API permissions, add `Microsoft Graph > Calendars.Read` (delegated). Grant admin consent if using organizational accounts.

**Key API differences from Google (affects sync edge function):**

| Aspect | Google Calendar API | Microsoft Graph API |
|--------|-------------------|---------------------|
| Date filtering | `timeMin`/`timeMax` params | `startDateTime`/`endDateTime` params (required) |
| Recurrence expansion | `singleEvents=true` | `calendarView` auto-expands |
| Title field | `e.summary` | `e.subject` |
| Start/end format | `e.start.dateTime` (ISO with TZ) | `e.start.dateTime` (no TZ suffix) + `e.start.timeZone` |
| All-day detection | Missing `dateTime` (has `date`) | `e.isAllDay === true` |
| Attendees | `e.attendees[].email` | `e.attendees[].emailAddress.address` |
| Web link | `e.htmlLink` | `e.webLink` |
| Refresh token behavior | Effectively permanent | Expires after 90 days of inactivity; rotates on use |

---

### Token Encryption at Rest

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| AES-256-GCM via Web Crypto API (`crypto.subtle`) | Built into Deno runtime | Symmetric encryption of OAuth tokens before database storage | Web Crypto API is natively available in the Deno edge function runtime. AES-256-GCM provides authenticated encryption (integrity + confidentiality). Each token gets a unique random IV. | HIGH |

**Architecture decision: Application-level encryption in edge functions.**

Two viable approaches exist. After analysis, **application-level encryption is recommended** because the encryption key lives in a separate security boundary from the database:

| Approach | Key Location | Pros | Cons |
|----------|-------------|------|------|
| **Application-level (recommended)** | Edge function env var (`TOKEN_ENCRYPTION_KEY`) | Key never enters database; database breach alone cannot decrypt tokens; Web Crypto is hardware-accelerated | Key is in edge function env vars (visible to function deployers) |
| **pgcrypto (SQL-level)** | Database config parameter (`app.encryption_key`) | Edge function never sees the key; encryption is transparent to application code | Key is IN the database (same security boundary as the encrypted data); key appears in `pg_stat_statements` and query logs |

The pgcrypto approach has a fundamental flaw: if the database is compromised, both the encrypted tokens AND the encryption key are available in the same system. Application-level encryption ensures the key and the data live in separate security boundaries.

**Implementation approach (shared module):**

```typescript
// supabase/functions/_shared/crypto.ts
const KEY_ENV = "TOKEN_ENCRYPTION_KEY"; // base64-encoded 256-bit key

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Store as base64(iv + ciphertext)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encrypted: string): Promise<string> {
  const key = await importKey();
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

async function importKey(): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(Deno.env.get(KEY_ENV)!), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
```

**Do NOT use:**
- **pgcrypto for per-row token encryption** -- Key lives in the same security boundary as the data. If the database is breached, both are compromised. Use pgcrypto for data integrity checks, not for security-critical encryption where the threat model includes database compromise.
- **Supabase Vault for per-user tokens** -- Vault is designed for application-level secrets (API keys), not per-row encrypted data.
- **Client-side encryption** -- The browser should never see or handle OAuth tokens. Encryption/decryption is strictly server-side (edge functions).

---

### OAuth CSRF Protection

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `crypto.randomUUID()` + `sessionStorage` | Built-in browser API | Generate and validate OAuth state parameters | The current implementation uses a hardcoded string `"google"` as the OAuth state parameter, which provides zero CSRF protection. Generate a random UUID, store in `sessionStorage`, encode in the state parameter, validate on callback. | HIGH |

**Why `sessionStorage` over a database table:**
- The OAuth flow starts and ends in the same browser tab/session
- `sessionStorage` is automatically scoped to the tab (no cross-tab leakage)
- No database round-trip needed for state validation
- Automatically cleared when the tab closes
- Simpler than maintaining an `oauth_state_tokens` table with TTL and cleanup

**Implementation approach:**
1. Before redirect: `const csrf = crypto.randomUUID(); sessionStorage.setItem('oauth_csrf', csrf);`
2. Encode provider + CSRF in state: `state = \`${provider}:${csrf}\``
3. On callback: parse state, compare CSRF to `sessionStorage.getItem('oauth_csrf')`, reject if mismatch
4. Clean up: `sessionStorage.removeItem('oauth_csrf')`

**Do NOT use:**
- **Database-stored state tokens** -- Overengineered for a client-initiated flow that completes in the same browser session. Adds a table, cleanup logic, and latency.
- **Signed JWTs as state** -- Overengineered. A random UUID validated against session storage is simpler and equally secure.

---

### Email Verification + Password Reset

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase Auth (built-in) | `@supabase/supabase-js@^2.84.0` | Email verification and password reset flows | Supabase Auth has built-in support for email confirmation and password recovery. These are configuration changes + UI work, not new dependencies. | HIGH |

**Email verification:**
- Enable `Confirm email` in Supabase Auth settings (Dashboard > Authentication > Email)
- Supabase automatically sends a confirmation email on signup
- Use `supabase.auth.onAuthStateChange()` to detect unconfirmed sessions and redirect to a "check your email" page
- The existing `AuthContext` already listens to auth state changes

**Password reset:**
- Call `supabase.auth.resetPasswordForEmail(email)` to trigger the reset email
- Handle the recovery link via `supabase.auth.onAuthStateChange()` listening for `PASSWORD_RECOVERY` event
- Present a "set new password" form, then call `supabase.auth.updateUser({ password })`
- No new dependencies; this is built into `@supabase/supabase-js`

**Do NOT use:**
- **Custom email sending** (SendGrid, Resend, etc.) -- Supabase handles transactional auth emails. Custom email templates can be configured in the Supabase dashboard. Consider a custom SMTP provider only if Supabase's default deliverability proves insufficient.
- **Third-party auth libraries** -- Everything needed is in the existing Supabase client.

---

### Wellness Features

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| CSS `@keyframes` + existing design system | Built into browsers | Breathing exercise animations | No library needed. The design system already defines `breathe`, `gentle-float`, and `fade-in` animations in `src/index.css`. A breathing circle is an expanding/contracting circle with timed phases. | HIGH |
| `date-fns` (already installed) | `^3.6.0` | Meeting gap detection for transition buffers | Already in the project. Use `differenceInMinutes()` to detect back-to-back meetings. | HIGH |
| Notification API (browser built-in) | Web standard | Optional browser notifications for breathing reminders | Request permission with `Notification.requestPermission()`, then create notifications on a timer. Falls back to in-app toast (sonner) if permission denied. | MEDIUM |
| Page Visibility API (`document.visibilitychange`) | Web standard | Detect tab focus changes for reminder reliability | When the tab becomes visible again, immediately check for missed reminders. Mitigates browser timer throttling for background tabs. | HIGH |

**Do NOT use:**
- **Heavy animation libraries** (Framer Motion, GSAP, Lottie) -- The breathing animation is a pulsing circle. CSS keyframes are sufficient and avoid adding 30-100KB to the bundle.
- **`setInterval` for reminder scheduling** -- Use `setTimeout` with the next meeting's start time minus buffer. Combine with `visibilitychange` to catch missed timers. `setInterval` drifts and wastes CPU.
- **Service Workers for reminders** -- Enormous complexity (SW lifecycle, update flow, offline handling) for a feature that only needs to work while the app is open. v2 consideration if users demand background reminders.

**Wellness UX patterns (MEDIUM confidence, training data):**

| Pattern | Implementation | Rationale |
|---------|---------------|-----------|
| Box breathing (4-4-4-4) | Animated circle: expand 4s, hold 4s, contract 4s, hold 4s | Simpler than 4-7-8; easier to follow; well-studied |
| Transition buffer | Detect meetings < configurable threshold apart, show "take a moment" card | Prevents rushed feeling between consecutive meetings |
| Dismissible, not blocking | All wellness prompts easily dismissible; never block calendar access | Wellness features that annoy users defeat their purpose |
| Default OFF | Breathing reminders off by default; user opts in via settings | Avoids notification fatigue; respect user autonomy |
| Pre-permission dialog | Custom in-app dialog before triggering browser Notification permission | Increases acceptance rate; explains purpose; avoids permanent "Block" |

---

### Settings Persistence

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TanStack Query mutations (already installed) | `^5.56.2` | Read/write user settings to Supabase | Use `useQuery` to load settings from `user_settings` table on mount, `useMutation` to update with optimistic updates. The table and RLS policies already exist. This is wiring, not new technology. | HIGH |

**Schema additions needed in `user_settings`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `breathing_reminders_enabled` | `BOOLEAN` | `false` | WEL-01: enable/disable breathing reminders |
| `breathing_minutes_before` | `INTEGER` | `5` | Minutes before meeting to trigger reminder |
| `transition_buffer_minutes` | `INTEGER` | `0` | WEL-02: configurable buffer threshold (0 = disabled) |

---

### CORS Hardening

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Origin allowlist in edge functions | N/A (code change) | Restrict CORS to app origin only | Currently `Access-Control-Allow-Origin: *`. Replace with the actual app origin (from env var). This is a code change, not a new dependency. | HIGH |

**Implementation:** Read `ALLOWED_ORIGIN` from edge function env vars, set `Access-Control-Allow-Origin` to that value. Return 403 for requests from other origins. For local dev, support a comma-separated list.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| MS OAuth | Raw HTTP fetch in Deno | MSAL.js | MSAL doesn't run in Deno; raw HTTP is identical pattern to existing Google OAuth |
| MS OAuth | Raw HTTP fetch in Deno | Supabase Auth OAuth provider | Supabase Auth's built-in Microsoft provider manages auth sessions, not calendar API tokens. We need calendar scopes and long-lived refresh tokens. |
| Token encryption | AES-256-GCM in edge function (Web Crypto) | pgcrypto (SQL-level) | pgcrypto key lives in the same security boundary as the data; database breach compromises both |
| Token encryption | AES-256-GCM in edge function (Web Crypto) | Supabase Vault | Vault is for app-level secrets, not per-row encrypted data |
| CSRF state | sessionStorage + UUID | Database-stored state tokens | Overengineered; OAuth flow completes in same browser session |
| CSRF state | sessionStorage + UUID | Signed JWT state | Overengineered for this use case |
| Breathing animation | CSS keyframes | Framer Motion / Lottie | 30-100KB dependency for a pulsing circle; CSS is sufficient |
| Notifications | Browser Notification API + sonner | Push notifications (FCM/APNs) | v2 feature; requires service worker; browser notifications are sufficient for v1 |
| Reminder timing | setTimeout + visibilitychange | Service Worker | Enormous complexity increase for v1; service worker is a v2 option if users need background reminders |

---

## Installation

No new npm packages required. All additions use:
- Existing dependencies (`@supabase/supabase-js`, `date-fns`, TanStack Query)
- Built-in browser APIs (CSS animations, Notification API, Page Visibility API, `crypto.randomUUID()`)
- Built-in Deno APIs (Web Crypto `crypto.subtle` for AES-256-GCM)
- Raw HTTP calls to Microsoft Identity Platform / Graph API

The only "installation" is:
1. Register an app in Microsoft Entra admin center
2. Add Microsoft OAuth env vars to Supabase Edge Function secrets
3. Generate and set `TOKEN_ENCRYPTION_KEY` as edge function secret
4. Set `ALLOWED_ORIGIN` as edge function secret
5. Run database migration adding wellness columns to `user_settings`

---

## Environment Variables Summary

**New Edge Function secrets (set in Supabase dashboard):**

| Variable | Purpose |
|----------|---------|
| `MICROSOFT_CLIENT_ID` | Microsoft app registration client ID |
| `MICROSOFT_CLIENT_SECRET` | Microsoft app registration client secret |
| `MICROSOFT_OAUTH_REDIRECT_URI` | OAuth redirect URI for Microsoft flow |
| `TOKEN_ENCRYPTION_KEY` | Base64-encoded 256-bit AES key for token encryption |
| `ALLOWED_ORIGIN` | App origin URL for CORS (e.g., `https://meething.app`) |

---

## Sources

- Microsoft Identity Platform OAuth 2.0 auth code flow: https://learn.microsoft.com/en-us/graph/auth-v2-user (verified via WebFetch, updated 2025-08-29)
- Microsoft Graph calendarView API: https://learn.microsoft.com/en-us/graph/api/user-list-calendarview (verified via WebFetch, updated 2025-07-23)
- Web Crypto API (AES-GCM): Available natively in Deno runtime (HIGH confidence, part of Web Standards)
- Supabase Auth email/password docs: https://supabase.com/docs/guides/auth (HIGH confidence -- existing integration already uses this)
- Existing codebase patterns: `google-oauth/index.ts`, `google-calendar-sync/index.ts`, `AuthCallback.tsx` (verified by reading source)
