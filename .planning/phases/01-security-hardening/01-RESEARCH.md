# Phase 1: Security Hardening - Research

**Researched:** 2026-03-22
**Domain:** OAuth token encryption (AES-256-GCM), CSRF protection, CORS hardening in Supabase Edge Functions (Deno)
**Confidence:** HIGH

## Summary

This phase hardens three security surfaces in the existing MeeThing OAuth flow: (1) encrypting tokens at rest using AES-256-GCM via the Deno Web Crypto API, (2) replacing the static `"google"` state parameter with a cryptographically random value stored in `sessionStorage`, and (3) locking CORS headers to a single allowed origin read from an environment variable.

All three changes are well-supported by standard Web APIs available in Deno (Supabase Edge Functions runtime). The Web Crypto API provides native AES-256-GCM support with no third-party dependencies. The CSRF fix uses `crypto.randomUUID()` (built-in) and `sessionStorage` (browser-native). The CORS change is a straightforward env var swap in the existing `corsHeaders` object.

The existing codebase has a duplicate-column issue in `calendar_connections`: both `access_token_encrypted`/`refresh_token_encrypted` (original migration) and `encrypted_access_token`/`encrypted_refresh_token` (second migration). The edge functions currently use the `access_token_encrypted`/`refresh_token_encrypted` columns. The duplicate columns should be dropped in a cleanup migration.

**Primary recommendation:** Create a shared `_shared/crypto.ts` utility for encrypt/decrypt, update both edge functions to use it, fix CORS in both functions, fix CSRF on client side, and run a forced-reconnect migration that deletes existing `calendar_connections` rows.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use AES-256-GCM encryption for both `access_token_encrypted` and `refresh_token_encrypted` fields in `calendar_connections`
- **D-02:** Encryption key stored as a Deno env var (`ENCRYPTION_KEY`) -- set per environment in Supabase Edge Function secrets
- **D-03:** Both edge functions (`google-oauth` and `google-calendar-sync`) must encrypt on write and decrypt on read
- **D-04:** Forced reconnect -- all existing `calendar_connections` rows are deleted as part of the migration. Users must reconnect Google Calendar once after the deploy.
- **D-05:** No transparent migration of plaintext tokens. Simpler, safer, and acceptable at pre-public scale.
- **D-06:** On OAuth initiation, generate a cryptographically random state token (e.g. `crypto.randomUUID()`) and store it in `sessionStorage`
- **D-07:** On callback in `AuthCallback.tsx`, read state from `sessionStorage`, compare to the `state` query param, and reject if they don't match -- remove the stored value after validation
- **D-08:** The static `"google"` string check is removed entirely
- **D-09:** Both edge functions read allowed origin from a `ALLOWED_ORIGIN` env var (e.g. `https://meethi.ng` in production, `http://localhost:8080` in local dev)
- **D-10:** `Access-Control-Allow-Origin` is set to the value of `ALLOWED_ORIGIN` -- no wildcard
- **D-11:** If `ALLOWED_ORIGIN` is not set, the function throws rather than falling back to `*`

### Claude's Discretion
- Exact AES-256-GCM implementation (key derivation format, IV handling, encoding of ciphertext stored in DB)
- Error message shown to users who land on the callback after a forced-reconnect migration

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | OAuth access and refresh tokens are encrypted at rest using AES-256-GCM before being stored in `calendar_connections` | Deno Web Crypto API provides native AES-256-GCM. Shared `_shared/crypto.ts` module for encrypt/decrypt. Key from `ENCRYPTION_KEY` env var (hex-encoded 32-byte key). IV generated per-encryption, prepended to ciphertext. |
| SEC-02 | OAuth authorization requests use a cryptographically random `state` parameter to prevent CSRF attacks | `crypto.randomUUID()` available in browser. Store in `sessionStorage` before redirect, validate and clear on callback. |
| SEC-03 | Supabase Edge Functions restrict CORS to the app's own origin | `ALLOWED_ORIGIN` env var read by both functions. Fail-closed: throw if unset. Set via `supabase secrets set`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Deno Web Crypto API | Built-in (Deno runtime) | AES-256-GCM encrypt/decrypt | No dependency needed; standard Web Crypto API, native in Supabase Edge Functions |
| crypto.randomUUID() | Built-in (browser) | CSRF state token generation | Cryptographically secure, zero dependencies |
| sessionStorage | Built-in (browser) | CSRF state storage | Session-scoped, cleared on tab close, no XSS-accessible persistence |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | 2 (already in use) | DB operations for migration | Already imported in edge functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Crypto AES-GCM | pgcrypto (PostgreSQL extension) | pgcrypto encrypts at DB level but requires Supabase Vault or custom extension config; edge-function-level encryption is simpler and keeps keys out of DB |
| sessionStorage for state | Cookie-based state | Cookies work cross-tab but add complexity; sessionStorage is simpler and sufficient for single-tab OAuth flows |

## Architecture Patterns

### Recommended Project Structure
```
supabase/functions/
  _shared/
    cors.ts          # corsHeaders factory + ALLOWED_ORIGIN validation
    crypto.ts        # encrypt() and decrypt() using AES-256-GCM
  google-oauth/
    index.ts         # Token exchange + encrypt before DB write
  google-calendar-sync/
    index.ts         # Decrypt on read, encrypt on refresh write-back
```

### Pattern 1: Shared Crypto Module (`_shared/crypto.ts`)
**What:** A single module exporting `encrypt(plaintext: string): Promise<string>` and `decrypt(ciphertext: string): Promise<string>` functions. The module reads `ENCRYPTION_KEY` from `Deno.env.get()` once, imports it as a `CryptoKey`, and reuses it.
**When to use:** Every edge function that reads or writes token fields.
**Example:**
```typescript
// Source: https://docs.deno.com/examples/aes_encryption/
// supabase/functions/_shared/crypto.ts

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96-bit IV per NIST recommendation

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Use standard base64 for DB storage
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get("ENCRYPTION_KEY");
  if (!keyHex) throw new Error("ENCRYPTION_KEY not set");
  if (keyHex.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex chars (256 bits)");
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: ALGORITHM },
    false,          // not extractable
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt plaintext. Returns base64 string of (IV || ciphertext || tag).
 * AES-GCM appends the 16-byte auth tag to the ciphertext automatically.
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded),
  );
  // Prepend IV to ciphertext for storage
  const combined = new Uint8Array(IV_LENGTH + encrypted.length);
  combined.set(iv);
  combined.set(encrypted, IV_LENGTH);
  return bytesToBase64(combined);
}

/**
 * Decrypt base64 string of (IV || ciphertext || tag) back to plaintext.
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const combined = base64ToBytes(ciphertext);
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );
  return new TextDecoder().decode(decrypted);
}
```

### Pattern 2: Shared CORS Module (`_shared/cors.ts`)
**What:** A module that reads `ALLOWED_ORIGIN` from env, validates it is set, and exports `corsHeaders` and a `handleCors(req)` helper for OPTIONS preflight.
**When to use:** Every edge function that handles HTTP requests.
**Example:**
```typescript
// supabase/functions/_shared/cors.ts

function getAllowedOrigin(): string {
  const origin = Deno.env.get("ALLOWED_ORIGIN");
  if (!origin) {
    throw new Error("ALLOWED_ORIGIN environment variable is not set — refusing to serve with wildcard CORS");
  }
  return origin;
}

export function getCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders() });
  }
  return null;
}
```

### Pattern 3: CSRF State in sessionStorage (Client)
**What:** Before redirecting to Google OAuth, generate a random state token, store in `sessionStorage`, and include in the authorization URL. On callback, validate and clear.
**When to use:** `CalendarConnections.tsx` (initiation) and `AuthCallback.tsx` (validation).
**Example:**
```typescript
// In CalendarConnections.tsx handleConnect():
const stateToken = crypto.randomUUID();
sessionStorage.setItem("oauth_state", stateToken);
url.searchParams.set("state", stateToken);

// In AuthCallback.tsx handleCallback():
const expectedState = sessionStorage.getItem("oauth_state");
sessionStorage.removeItem("oauth_state"); // clear immediately
if (!code || !state || state !== expectedState) {
  // CSRF validation failed
  toast({ title: "Connection failed", description: "Invalid OAuth state.", variant: "destructive" });
  navigate("/calendar");
  return;
}
```

### Anti-Patterns to Avoid
- **Reusing IVs:** Every call to `encrypt()` MUST generate a fresh random IV. Never store a static IV or derive it from the data.
- **Wildcard CORS fallback:** Never fall back to `*` if `ALLOWED_ORIGIN` is unset. Fail-closed.
- **Storing state in localStorage:** `localStorage` persists across sessions and tabs, increasing the window for replay attacks. Use `sessionStorage` which is tab-scoped and cleared on close.
- **Catching and ignoring decrypt errors:** If `decrypt()` throws, the token is corrupt or the key changed. Surface the error; do not serve stale tokens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AES-256-GCM encryption | Custom byte manipulation | `crypto.subtle.encrypt/decrypt` (Web Crypto API) | Battle-tested, constant-time, handles auth tag automatically |
| Random state tokens | Custom random generators | `crypto.randomUUID()` | Cryptographically secure, 122 bits of entropy, built-in |
| Base64 encoding | Manual bit shifting | `btoa()`/`atob()` with byte conversion | Standard, well-tested, sufficient for DB TEXT columns |
| CORS header management | Per-function inline headers | Shared `_shared/cors.ts` module | Single source of truth, fail-closed validation |

**Key insight:** The entire encryption/CORS/CSRF implementation uses zero third-party dependencies -- everything is built into Deno and the browser. This eliminates version conflicts and supply chain risk.

## Common Pitfalls

### Pitfall 1: ENCRYPTION_KEY Format Mismatch
**What goes wrong:** The key is set as a plain string instead of a 64-character hex string (32 bytes). `importKey` silently creates a shorter key or fails.
**Why it happens:** Developer sets `ENCRYPTION_KEY=my-secret-key` instead of a proper hex string.
**How to avoid:** Validate key length is exactly 64 hex characters in `getKey()`. Generate with `openssl rand -hex 32`.
**Warning signs:** `OperationError` on encrypt/decrypt, or key length validation error.

### Pitfall 2: IV Not Prepended to Ciphertext
**What goes wrong:** The IV is discarded after encryption. Decryption becomes impossible because AES-GCM requires the exact IV used during encryption.
**Why it happens:** Tutorials sometimes show IV generation and encryption separately without showing storage.
**How to avoid:** Always prepend IV to ciphertext before encoding. The `encrypt()` function in the shared module does this automatically.
**Warning signs:** `OperationError: Decryption failed` on every decrypt attempt.

### Pitfall 3: CORS Preflight Fails Silently
**What goes wrong:** The browser blocks the actual request after OPTIONS returns a non-matching origin, but the error message is vague ("Failed to fetch").
**Why it happens:** `ALLOWED_ORIGIN` doesn't match the actual request origin (e.g., trailing slash, wrong port, http vs https).
**How to avoid:** Ensure `ALLOWED_ORIGIN` matches exactly what `window.location.origin` returns. For local dev: `http://localhost:8080` (no trailing slash). Test with browser devtools Network tab.
**Warning signs:** Network tab shows CORS error on preflight, console shows "has been blocked by CORS policy".

### Pitfall 4: sessionStorage Cleared Before Callback
**What goes wrong:** The OAuth redirect navigates away from the SPA. If the browser reloads the SPA from scratch on return, `sessionStorage` may be intact (same-origin navigation preserves it), but if the user opens the callback URL in a different tab, state validation fails.
**Why it happens:** `sessionStorage` is tab-scoped. A new tab has empty storage.
**How to avoid:** This is expected and correct behavior -- it prevents CSRF. The user simply retries the connection from the same tab. Document this as intentional, not a bug.
**Warning signs:** User reports "Invalid OAuth state" after opening callback link manually.

### Pitfall 5: Duplicate Token Columns Cause Confusion
**What goes wrong:** The DB has both `access_token_encrypted`/`refresh_token_encrypted` (original) AND `encrypted_access_token`/`encrypted_refresh_token` (added in second migration). Code writes to one pair but reads from another.
**Why it happens:** Second migration added columns without removing originals.
**How to avoid:** Drop the unused `encrypted_access_token`/`encrypted_refresh_token` columns in the cleanup migration. The edge functions use `access_token_encrypted`/`refresh_token_encrypted` -- keep those.
**Warning signs:** Tokens appear null when they were just written.

### Pitfall 6: Token Refresh Write-Back Needs Encryption Too
**What goes wrong:** `google-calendar-sync` refreshes an expired access token and writes the new one back to DB in plaintext, bypassing encryption.
**Why it happens:** The refresh path (line 75-81 of `google-calendar-sync/index.ts`) is a separate code path from initial token storage.
**How to avoid:** The refresh write-back MUST call `encrypt()` on the new access token before updating the DB.
**Warning signs:** Mixed plaintext and ciphertext in the same column, decrypt failures on subsequent syncs.

## Code Examples

### Generating an ENCRYPTION_KEY
```bash
# Generate a 256-bit (32-byte) key as a 64-character hex string
openssl rand -hex 32

# Set it as a Supabase Edge Function secret
supabase secrets set ENCRYPTION_KEY=<output-from-above>

# Set ALLOWED_ORIGIN
supabase secrets set ALLOWED_ORIGIN=https://meethi.ng

# For local dev, add to supabase/functions/.env
echo 'ENCRYPTION_KEY=<hex>' >> supabase/functions/.env
echo 'ALLOWED_ORIGIN=http://localhost:8080' >> supabase/functions/.env
```

### Forced Reconnect Migration SQL
```sql
-- Migration: delete all calendar_connections (forced reconnect)
-- Also drops the duplicate encrypted_* columns from the second migration
DELETE FROM public.calendar_connections;

ALTER TABLE public.calendar_connections
  DROP COLUMN IF EXISTS encrypted_access_token,
  DROP COLUMN IF EXISTS encrypted_refresh_token;
```

### Edge Function: Encrypt on Write (google-oauth)
```typescript
// In google-oauth/index.ts -- after token exchange, before DB upsert:
import { encrypt } from "../_shared/crypto.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Replace plaintext storage:
const encryptedAccess = await encrypt(tokens.access_token);
const encryptedRefresh = tokens.refresh_token
  ? await encrypt(tokens.refresh_token)
  : null;

// Then upsert with encrypted values
await supabase.from("calendar_connections").upsert({
  user_id: user.id,
  provider: "google",
  access_token_encrypted: encryptedAccess,
  refresh_token_encrypted: encryptedRefresh,
  token_expires_at: expiresAt,
  is_active: true,
  connected_at: new Date().toISOString(),
}, { onConflict: "user_id,provider" });
```

### Edge Function: Decrypt on Read (google-calendar-sync)
```typescript
// In google-calendar-sync/index.ts -- after loading connection:
import { encrypt, decrypt } from "../_shared/crypto.ts";

let accessToken = await decrypt(connection.access_token_encrypted);

// If refresh is needed:
if (needsRefresh) {
  const refreshToken = await decrypt(connection.refresh_token_encrypted);
  const refreshed = await refreshAccessToken(refreshToken);
  accessToken = refreshed.accessToken;

  // Re-encrypt the new access token before writing back
  const encryptedNewAccess = await encrypt(refreshed.accessToken);
  await supabase.from("calendar_connections").update({
    access_token_encrypted: encryptedNewAccess,
    token_expires_at: refreshed.expiresAt,
  }).eq("id", connection.id);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pgcrypto for column encryption | Application-level encryption (Web Crypto) in edge functions | Standard practice for Supabase Edge Functions | Keys never touch DB; encryption/decryption happens in function runtime |
| Static OAuth state strings | `crypto.randomUUID()` per flow | Always best practice, widely adopted | Prevents CSRF on OAuth callbacks |
| `Access-Control-Allow-Origin: *` | Explicit origin from env var | Always best practice | Prevents cross-origin abuse |

**Deprecated/outdated:**
- Deno `std@0.168.0` import in existing code: This is an older version of the Deno standard library. Not a blocker for this phase (only `serve` is used), but worth noting for future updates.

## Open Questions

1. **Supabase types.ts regeneration**
   - What we know: The generated types file includes both the original and duplicate columns. After the migration drops `encrypted_access_token`/`encrypted_refresh_token`, the types file will be stale.
   - What's unclear: Whether the project has a script to regenerate types or if it is done manually.
   - Recommendation: After running the migration, regenerate types with `supabase gen types typescript --project-id kpuyjhwyojeqenuocoyd > src/integrations/supabase/types.ts`. This is a nice-to-have, not a blocker -- edge functions don't use the generated types.

2. **Local dev .env for ENCRYPTION_KEY and ALLOWED_ORIGIN**
   - What we know: `supabase/functions/.env` is auto-loaded on `supabase start`.
   - What's unclear: Whether this file already exists or needs to be created; whether it is gitignored.
   - Recommendation: Create `supabase/functions/.env` if missing, ensure it is in `.gitignore`, document the required vars.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test framework is configured") |
| Config file | None |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | Tokens encrypted at rest in DB | manual-only | Verify via Supabase dashboard: `calendar_connections` rows contain base64 ciphertext, not plaintext tokens | N/A |
| SEC-02 | OAuth state is cryptographically random and validated | manual-only | Connect Google Calendar, verify `state` param in URL is UUID-format, verify callback validates it | N/A |
| SEC-03 | CORS restricted to app origin | manual-only | Call edge function from different origin, verify 403/CORS block. Or: unset `ALLOWED_ORIGIN`, verify function throws | N/A |

**Justification for manual-only:** No test framework is configured. Linting is the only automated check. Edge function behavior requires a running Supabase instance. Client-side CSRF flow requires browser interaction.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Full lint+build green, then manual verification of SEC-01/02/03

### Wave 0 Gaps
None -- no test infrastructure to create given the project has no test framework. Linting covers TypeScript type errors and code quality.

## Sources

### Primary (HIGH confidence)
- [Deno AES Encryption Example](https://docs.deno.com/examples/aes_encryption/) - AES-GCM encrypt/decrypt patterns with Web Crypto API
- [MDN SubtleCrypto.importKey()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey) - Raw key import format
- [MDN SubtleCrypto.encrypt()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) - AES-GCM algorithm parameters
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets) - Environment variable management
- [Supabase Edge Functions Development Tips](https://supabase.com/docs/guides/functions/development-tips) - Shared `_shared/` folder pattern

### Secondary (MEDIUM confidence)
- [Deno SubtleCrypto.importKey](https://docs.deno.com/api/web/~/SubtleCrypto.importKey) - Deno-specific Web Crypto API docs
- [Deno SubtleCrypto.generateKey](https://docs.deno.com/api/web/~/SubtleCrypto.generateKey) - Key generation API

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All APIs are built-in Web standards (Web Crypto, sessionStorage), no third-party deps
- Architecture: HIGH - `_shared/` folder pattern is documented by Supabase; crypto module pattern is standard
- Pitfalls: HIGH - Based on direct code inspection of existing edge functions and known Web Crypto gotchas

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- Web Crypto API and Supabase Edge Functions patterns are mature)
