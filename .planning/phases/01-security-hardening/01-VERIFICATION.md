---
phase: 01-security-hardening
verified: 2026-03-25T00:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 1: Security Hardening Verification Report

**Phase Goal:** All OAuth tokens are encrypted at rest and the OAuth flow is protected against CSRF and cross-origin attacks
**Verified:** 2026-03-25
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | OAuth tokens stored in `calendar_connections` are AES-256-GCM encrypted — no plaintext tokens exist in the database | VERIFIED | `google-oauth/index.ts` lines 43–46 call `encrypt()` before upsert; columns are `access_token_encrypted` / `refresh_token_encrypted`; no plaintext `access_token` or `refresh_token` column is written |
| 2 | Connecting Google Calendar uses a cryptographically random state parameter that is validated on callback — static string "google" is gone | VERIFIED | `CalendarConnections.tsx` lines 76–78: `crypto.randomUUID()` → `sessionStorage.setItem("oauth_state", stateToken)` → URL param. `AuthCallback.tsx` lines 29–32: reads, removes, then validates `state !== expectedState`. No occurrence of `state !== "google"` in the codebase. |
| 3 | Edge functions reject requests from origins other than the app's own domain | VERIFIED | `_shared/cors.ts` reads `ALLOWED_ORIGIN` env var and throws if unset (fail-closed). Both `google-oauth` and `google-calendar-sync` import and use `getCorsHeaders()` / `handleCorsPreflightIfNeeded()`. No `Access-Control-Allow-Origin: *` exists anywhere in the functions directory. |
| 4 | Existing Google Calendar connections continue to work after token migration (forced reconnect is acceptable — per CONTEXT.md D-04/D-05) | VERIFIED | Migration `20260322000000_forced_reconnect_drop_dupes.sql` deletes all rows from `meetings` and `calendar_connections` and drops the now-redundant `encrypted_*` duplicate columns. Decision D-04/D-05 explicitly accepts forced reconnect. New connections will be stored encrypted. |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/functions/_shared/crypto.ts` | AES-256-GCM encrypt/decrypt module | VERIFIED | 74 lines; exports `encrypt` and `decrypt`; uses `crypto.subtle` with AES-GCM, 12-byte random IV prepended to ciphertext, base64-encoded; throws on missing or wrong-length key |
| `supabase/functions/_shared/cors.ts` | CORS header factory, fail-closed on missing env var | VERIFIED | 24 lines; exports `getCorsHeaders` and `handleCorsPreflightIfNeeded`; throws if `ALLOWED_ORIGIN` unset; no wildcard fallback |
| `supabase/functions/google-oauth/index.ts` | Encrypt tokens before DB write, use shared CORS | VERIFIED | Calls `encrypt(tokens.access_token)` and `encrypt(tokens.refresh_token)` at lines 43–46; stores into `access_token_encrypted` / `refresh_token_encrypted`; uses `getCorsHeaders()` on all response paths |
| `supabase/functions/google-calendar-sync/index.ts` | Decrypt on read, decrypt + re-encrypt on refresh write-back, use shared CORS | VERIFIED | `decrypt(connection.access_token_encrypted)` at line 58; `decrypt(connection.refresh_token_encrypted)` at line 68; `encrypt(refreshed.accessToken)` at line 72 before write-back at line 76; uses `getCorsHeaders()` on all response paths |
| `src/components/calendar/CalendarConnections.tsx` | Generate random state token, store in sessionStorage, pass as OAuth state param | VERIFIED | Lines 76–78: `crypto.randomUUID()` → `sessionStorage.setItem("oauth_state", stateToken)` → `url.searchParams.set("state", stateToken)` |
| `src/pages/AuthCallback.tsx` | Read + remove sessionStorage state, validate against callback param | VERIFIED | Lines 29–32: `sessionStorage.getItem("oauth_state")`, `sessionStorage.removeItem("oauth_state")`, `state !== expectedState` check with destructive toast on failure |
| `supabase/migrations/20260322000000_forced_reconnect_drop_dupes.sql` | Delete all existing connections and meetings, drop duplicate columns | VERIFIED | Deletes from `public.meetings` and `public.calendar_connections`; drops `encrypted_access_token` and `encrypted_refresh_token` columns |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `CalendarConnections.tsx` | `AuthCallback.tsx` | `sessionStorage("oauth_state")` | WIRED | Written at `CalendarConnections.tsx:77`, read and cleared at `AuthCallback.tsx:29–30` |
| `AuthCallback.tsx` | `google-oauth` edge function | `supabase.functions.invoke("google-oauth", { body: { code } })` | WIRED | Line 50 in `AuthCallback.tsx` |
| `google-oauth/index.ts` | `_shared/crypto.ts` | `import { encrypt }` | WIRED | Line 3; `encrypt()` called at lines 43 and 45 |
| `google-oauth/index.ts` | `_shared/cors.ts` | `import { getCorsHeaders, handleCorsPreflightIfNeeded }` | WIRED | Line 4; used at lines 7, 81, 87 |
| `google-calendar-sync/index.ts` | `_shared/crypto.ts` | `import { encrypt, decrypt }` | WIRED | Line 3; `decrypt()` called at lines 58, 68; `encrypt()` called at line 72 |
| `google-calendar-sync/index.ts` | `_shared/cors.ts` | `import { getCorsHeaders, handleCorsPreflightIfNeeded }` | WIRED | Line 4; used at lines 31, 158, 164 |
| `App.tsx` | `AuthCallback.tsx` | `<Route path="/auth/callback">` | WIRED | Line 29 in `App.tsx` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 01-01-PLAN.md | OAuth tokens encrypted at rest using AES-256-GCM | SATISFIED | `_shared/crypto.ts` implements AES-256-GCM; both edge functions encrypt on write and decrypt on read |
| SEC-02 | 01-02-PLAN.md | OAuth uses cryptographically random state parameter to prevent CSRF | SATISFIED | `crypto.randomUUID()` used in `CalendarConnections.tsx`; validated and cleared in `AuthCallback.tsx`; old static "google" check absent |
| SEC-03 | 01-01-PLAN.md | Edge functions restrict CORS to app's own origin | SATISFIED | `_shared/cors.ts` enforces `ALLOWED_ORIGIN` env var; wildcard removed from both functions; fails closed if env var unset |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No stubs, placeholders, TODOs, or hardcoded empty values found in the modified files. All data flows are real — encryption wraps actual tokens from Google's API, CORS reads from env, state validation compares real values.

---

### Human Verification Required

#### 1. End-to-end OAuth connection flow

**Test:** Click "Connect" on Google Calendar, complete the Google consent screen, land at `/auth/callback`, and confirm redirection to `/calendar?tab=overview` with a success toast.
**Expected:** The flow completes without errors; a new row appears in `calendar_connections` with ciphertext values (not recognizable tokens) in `access_token_encrypted`.
**Why human:** Browser redirect flow and actual Supabase edge function execution cannot be verified programmatically from the source alone.

#### 2. CSRF rejection

**Test:** Manually navigate to `/auth/callback?code=fake&state=wrong` without a matching `sessionStorage` entry.
**Expected:** A destructive toast "Invalid or expired OAuth state" appears and the user is redirected to `/calendar`.
**Why human:** Requires browser execution to confirm `sessionStorage.removeItem` and toast behavior work together correctly.

#### 3. CORS rejection from a foreign origin

**Test:** Call the `google-oauth` edge function from a browser devtools console on a different domain (e.g. `example.com`), or via `curl` with `Origin: https://evil.example.com`.
**Expected:** The response does NOT include `Access-Control-Allow-Origin: https://evil.example.com`; a browser would block the request.
**Why human:** Requires a deployed environment with `ALLOWED_ORIGIN` set to confirm header enforcement is live.

---

### Gaps Summary

No gaps. All four success criteria are verifiably satisfied by the code as written:

1. **Encryption at rest (SC-1 / SEC-01):** `_shared/crypto.ts` provides AES-256-GCM with random IV; both edge functions use it for all token writes and reads. No plaintext token columns are written to the database.
2. **CSRF-resistant state parameter (SC-2 / SEC-02):** `crypto.randomUUID()` generates the state, `sessionStorage` carries it across the redirect, `AuthCallback` validates and immediately clears it. The old static `"google"` string is gone.
3. **CORS restriction (SC-3 / SEC-03):** `_shared/cors.ts` fails closed if `ALLOWED_ORIGIN` is unset; no wildcard remains in either function.
4. **Migration path (SC-4):** The forced-reconnect migration deletes stale plaintext rows and drops the now-unused duplicate columns. Decision D-04/D-05 in CONTEXT.md accepted this approach.

---

_Verified: 2026-03-25_
_Verifier: Claude (gsd-verifier)_
