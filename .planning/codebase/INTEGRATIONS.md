# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Google Calendar:**
- Service: Google Calendar API v3 (`https://www.googleapis.com/calendar/v3/`)
  - Used to fetch calendar events for the next 7 days (primary calendar only)
  - OAuth 2.0 flow: authorization code exchange + token refresh
  - Token exchange endpoint: `https://oauth2.googleapis.com/token`
  - Edge function: `supabase/functions/google-calendar-sync/index.ts`
  - Edge function: `supabase/functions/google-oauth/index.ts`

- Google OAuth 2.0
  - Used for: user authorization to read Google Calendar
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Supabase Edge Function env vars)
  - Redirect URI: `GOOGLE_OAUTH_REDIRECT_URI` (Supabase Edge Function env var)
  - Tokens stored (unencrypted despite column names suggesting encryption) in `calendar_connections` table

**Microsoft Calendar:**
- Scaffold only — provider value `'microsoft'` is allowed in DB schema (`calendar_connections.provider` check constraint), but no Edge Function or sync logic implemented yet

**Apple Calendar:**
- Scaffold only — provider value `'apple'` is allowed in DB schema, but no Edge Function or sync logic implemented yet

## Data Storage

**Databases:**
- Supabase PostgreSQL (hosted, project ID: `kpuyjhwyojeqenuocoyd`)
  - Connection: `VITE_SUPABASE_URL` env var
  - Client: `@supabase/supabase-js@^2.84.0`, singleton at `src/integrations/supabase/client.ts`
  - Generated types: `src/integrations/supabase/types.ts`
  - All tables use Row Level Security (RLS) enforced policies

**Key Tables:**
- `public.profiles` — user info, auto-created on signup via `on_auth_user_created` trigger
- `public.user_roles` — RBAC roles (`admin`, `user`, `premium`); enforced via `has_role()` security definer function
- `public.calendar_connections` — OAuth tokens per provider; one row per `(user_id, provider)` pair; token fields: `access_token_encrypted`, `refresh_token_encrypted`, `encrypted_access_token`, `encrypted_refresh_token` (duplicated columns — see CONCERNS.md)
- `public.meetings` — synced calendar events; unique constraint on `(user_id, external_id)` for upsert support
- `public.user_settings` — per-user preferences (sync frequency, notifications, theme, background)

**File Storage:**
- None — no Supabase Storage buckets or local file storage detected

**Caching:**
- TanStack Query in-memory cache on the frontend (no explicit stale/cache time configuration observed)
- No server-side caching layer

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in email/password)
  - Implementation: `src/contexts/AuthContext.tsx` — React context wrapping `supabase.auth`
  - Session persisted in `localStorage`, auto-refreshed via `autoRefreshToken: true` in client config
  - `onAuthStateChange` listener wired at app root
  - Auth state accessible via `useAuth()` hook from `src/contexts/AuthContext.tsx`
  - Session also available at `src/AuthContext.tsx` (duplicate file at `src/` root — differs from `src/contexts/AuthContext.tsx`)

**Protected Routes:**
- `ProtectedRoute` component at `src/components/auth/` guards the `/calendar` route

**OAuth (Calendar Providers):**
- Google OAuth handled via Supabase Edge Function `google-oauth` (server-side token exchange, not Supabase Auth OAuth)
- Redirect/callback page: `src/pages/AuthCallback.tsx`
- Tokens stored as plaintext in `calendar_connections` despite encrypted column naming

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, LogRocket, or equivalent

**Logs:**
- Edge Functions use `console.error()` for error logging (visible in Supabase Edge Function logs dashboard)
- Frontend uses no structured logging library; `console.*` only

## CI/CD & Deployment

**Hosting:**
- Lovable.dev platform (frontend SPA deployment, inferred from `lovable-tagger` dev dependency)
- Supabase managed infrastructure (Edge Functions + PostgreSQL)

**CI Pipeline:**
- None detected — no GitHub Actions, CircleCI, or equivalent configuration files

## Environment Configuration

**Required frontend env vars (`.env`):**
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key

**Required Edge Function env vars (set in Supabase dashboard, not in repo):**
- `GOOGLE_CLIENT_ID` — Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth app client secret
- `GOOGLE_OAUTH_REDIRECT_URI` — OAuth redirect URI
- `SUPABASE_URL` — Supabase project URL (injected automatically by Supabase)
- `SUPABASE_ANON_KEY` — Supabase anon key (injected automatically by Supabase)

**Secrets location:**
- Frontend secrets: `.env` file at project root (in `.gitignore`)
- Edge Function secrets: Supabase project dashboard (not in repository)

## Webhooks & Callbacks

**Incoming:**
- `src/pages/AuthCallback.tsx` — OAuth redirect callback page; handles Google OAuth redirect after user authorization

**Outgoing:**
- None detected — no outbound webhooks configured

## Supabase Edge Functions

**`google-oauth`** (`supabase/functions/google-oauth/index.ts`):
- Accepts: `{ code: string }` JSON body + Bearer token header
- Action: exchanges Google authorization code for access/refresh tokens, upserts into `calendar_connections`
- CORS: allows all origins (`Access-Control-Allow-Origin: *`)

**`google-calendar-sync`** (`supabase/functions/google-calendar-sync/index.ts`):
- Accepts: Bearer token header (no body required)
- Action: fetches next 7 days of Google Calendar events, upserts into `meetings`, refreshes tokens if expiring within 5 minutes, updates `last_synced_at`
- CORS: allows all origins (`Access-Control-Allow-Origin: *`)

---

*Integration audit: 2026-03-22*
