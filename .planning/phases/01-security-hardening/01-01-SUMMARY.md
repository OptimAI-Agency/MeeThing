# Plan 01-01 Summary: Token Encryption + CORS

**Phase:** 01-security-hardening
**Completed:** 2026-03-25
**Requirements addressed:** SEC-01, SEC-03

## What was built

### New files
- `supabase/functions/_shared/crypto.ts` — AES-256-GCM encrypt/decrypt using `ENCRYPTION_KEY` env var (64-char hex). Prepends 12-byte random IV to ciphertext, base64-encodes for DB storage. Fails closed if key is missing or wrong length.
- `supabase/functions/_shared/cors.ts` — CORS header factory reading `ALLOWED_ORIGIN` env var. Throws if unset (fail-closed, no wildcard fallback). Exports `getCorsHeaders()` and `handleCorsPreflightIfNeeded()`.
- `supabase/migrations/20260322000000_forced_reconnect_drop_dupes.sql` — Deletes all `meetings` and `calendar_connections` rows (forced reconnect). Drops duplicate `encrypted_access_token` / `encrypted_refresh_token` columns.

### Modified files
- `supabase/functions/google-oauth/index.ts` — Encrypts `access_token` and `refresh_token` before DB upsert. Uses shared CORS module.
- `supabase/functions/google-calendar-sync/index.ts` — Decrypts access token on read, decrypts refresh token before token refresh call, re-encrypts new access token before write-back. Uses shared CORS module.

## Acceptance criteria check
- ✓ `_shared/crypto.ts` exports `encrypt` and `decrypt` using AES-GCM with random IV
- ✓ `_shared/cors.ts` exports `getCorsHeaders` / `handleCorsPreflightIfNeeded`, throws if `ALLOWED_ORIGIN` unset
- ✓ Neither edge function contains `"Access-Control-Allow-Origin": "*"`
- ✓ `google-oauth` stores `encryptedAccess` / `encryptedRefresh` (not plaintext tokens)
- ✓ `google-calendar-sync` calls `decrypt()` on read and `encrypt()` on refresh write-back
- ✓ Migration deletes connections and drops duplicate columns
- ✓ Build passes (`npm run build` ✓)

## User action required before deploying
1. Generate key: `openssl rand -hex 32`
2. Set secrets: `supabase secrets set ENCRYPTION_KEY=<hex> ALLOWED_ORIGIN=<origin>`
3. For local dev: add both to `supabase/functions/.env`
4. Run migration on the target Supabase project
