# Phase 1: Security Hardening - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

All OAuth tokens are encrypted at rest using AES-256-GCM before being stored in `calendar_connections`. The OAuth flow uses a cryptographically random state parameter validated on callback. Edge functions reject requests from origins other than the app's own domain. Existing connections do not survive — users reconnect once.

</domain>

<decisions>
## Implementation Decisions

### Token encryption
- **D-01:** Use AES-256-GCM encryption for both `access_token_encrypted` and `refresh_token_encrypted` fields in `calendar_connections`
- **D-02:** Encryption key stored as a Deno env var (`ENCRYPTION_KEY`) — set per environment in Supabase Edge Function secrets
- **D-03:** Both edge functions (`google-oauth` and `google-calendar-sync`) must encrypt on write and decrypt on read

### Token migration
- **D-04:** Forced reconnect — all existing `calendar_connections` rows are deleted as part of the migration. Users must reconnect Google Calendar once after the deploy.
- **D-05:** No transparent migration of plaintext tokens. Simpler, safer, and acceptable at pre-public scale.

### CSRF state parameter
- **D-06:** On OAuth initiation, generate a cryptographically random state token (e.g. `crypto.randomUUID()`) and store it in `sessionStorage`
- **D-07:** On callback in `AuthCallback.tsx`, read state from `sessionStorage`, compare to the `state` query param, and reject if they don't match — remove the stored value after validation
- **D-08:** The static `"google"` string check is removed entirely

### CORS
- **D-09:** Both edge functions read allowed origin from a `ALLOWED_ORIGIN` env var (e.g. `https://meethi.ng` in production, `http://localhost:8080` in local dev)
- **D-10:** `Access-Control-Allow-Origin` is set to the value of `ALLOWED_ORIGIN` — no wildcard
- **D-11:** If `ALLOWED_ORIGIN` is not set, the function throws rather than falling back to `*`

### Claude's Discretion
- Exact AES-256-GCM implementation (key derivation format, IV handling, encoding of ciphertext stored in DB)
- Error message shown to users who land on the callback after a forced-reconnect migration

</decisions>

<specifics>
## Specific Ideas

- The forced reconnect is acceptable at this stage — app is pre-public and likely has only the developer as active user
- No in-app migration notice needed; the reconnect prompt from a failed sync is sufficient

</specifics>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Requirements
- `.planning/REQUIREMENTS.md` §Security — SEC-01, SEC-02, SEC-03 define the acceptance criteria
- `.planning/ROADMAP.md` §Phase 1 — Success criteria 1–4 define what must be true after this phase

### Existing code to modify
- `supabase/functions/google-oauth/index.ts` — stores plaintext tokens, needs encrypt-on-write; CORS wildcard
- `supabase/functions/google-calendar-sync/index.ts` — reads plaintext tokens, needs decrypt-on-read; CORS wildcard
- `src/pages/AuthCallback.tsx` — static state check (`state !== "google"`), needs sessionStorage validation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `supabase/functions/google-oauth/index.ts`: Token exchange and DB upsert are solid — only the storage step (lines 61–74) needs encryption wrapping
- `supabase/functions/google-calendar-sync/index.ts`: Token read and refresh are solid — only the read (line 62) and refresh write-back (line 77–80) need decrypt/encrypt wrapping
- `src/pages/AuthCallback.tsx`: Overall flow is correct — only the state validation (line 28) needs replacing with sessionStorage check

### Established Patterns
- Edge functions use Deno env vars for secrets (`GOOGLE_CLIENT_ID`, etc.) — `ENCRYPTION_KEY` and `ALLOWED_ORIGIN` follow the same pattern
- Supabase `upsert` with `onConflict: "user_id,provider"` in `google-oauth` — migration can use a simple `DELETE FROM calendar_connections` before deploy

### Integration Points
- `AuthCallback.tsx` initiates OAuth via browser redirect — the state token must be written to `sessionStorage` wherever the "Connect Google Calendar" button triggers the redirect (find in `CalendarConnections.tsx` or similar)
- `google-calendar-sync` writes refreshed access tokens back to DB (line 75–81) — this write-back path also needs encryption

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-security-hardening*
*Context gathered: 2026-03-22*
