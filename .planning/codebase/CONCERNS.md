# Concerns

## Security

### OAuth Tokens Stored as Plaintext
**Severity: High**
`calendar_connections` column names include `*_encrypted` suffix but tokens are stored as plain text strings — there is no encryption implementation. Column naming implies security that doesn't exist.
- `supabase/functions/google-oauth/index.ts` — tokens inserted directly without encryption

### CORS Wildcard on Edge Functions
**Severity: Medium**
Both `google-oauth` and `google-calendar-sync` Edge Functions have `Access-Control-Allow-Origin: *`. Should be restricted to the app's origin.

### OAuth State Parameter is Static
**Severity: Medium**
The OAuth `state` parameter in `CalendarConnections.tsx` is the static string `"google"` rather than a cryptographically random CSRF token. This is vulnerable to CSRF attacks on the OAuth callback.
- `src/components/calendar/CalendarConnections.tsx` — OAuth URL construction

### Signup Redirects Before Email Confirmation
**Severity: Low-Medium**
`AuthContext.signUp()` redirects to `/calendar` immediately without waiting for email verification, allowing unverified users access to protected routes.

## Tech Debt

### Duplicate Column Names in calendar_connections
**Severity: Medium**
A migration added `encrypted_*` column variants alongside existing `*_encrypted` columns — both exist in the schema, creating confusion about which columns are actually used.
- `supabase/migrations/` — check column names in `calendar_connections`

### Settings Page Disconnected from Database
**Severity: Medium**
`CalendarSettings.tsx` (and its sub-components `SyncSettings.tsx`, `NotificationSettings.tsx`) never read from or write to the `user_settings` table. The settings UI is purely cosmetic — nothing persists.
- `src/components/calendar/CalendarSettings.tsx`
- `src/components/calendar/settings/SyncSettings.tsx`
- `src/components/calendar/settings/NotificationSettings.tsx`

### Broken Tab Deep-Linking
**Severity: Low**
`CalendarHub.tsx` line 15 has a broken tab URL param — the tab state doesn't correctly restore from `?tab=` query params in all cases.

### Double Session Initialization in AuthContext
**Severity: Low**
`AuthContext.tsx` initializes the session in two places, causing a potential double-load on mount.

### `as any` Type Casts
**Severity: Low**
Multiple `as any` casts in hot paths:
- `calendar_connections` join result in `useMeetings.ts`
- `metadata.htmlLink` access in `MeetingsList.tsx`

These bypass TypeScript's type safety and should use proper type narrowing.

## Performance

### No Automatic Background Sync
The `sync_frequency_minutes` column exists in `user_settings` but is never acted upon — there is no scheduled or background sync. Users must manually trigger sync.

### Sync Capped at 50 Events, No Pagination
`google-calendar-sync` fetches `maxResults: 50` from Google Calendar API with no pagination. Users with dense calendars will silently miss events.

### Stale Deletion Uses Fragile Query
The cleanup query that deletes meetings outside the 7-day window uses a pattern that could be brittle under edge cases (timezone boundaries).

## Missing Features

### No OAuth Token Revocation on Disconnect
When a user disconnects a calendar provider, the connection record is deleted but the OAuth tokens are not revoked with Google. The tokens remain valid until they naturally expire.

### No Email Verification Flow
There is no UI or logic to handle the email verification step after signup. Users who click the verification link are not gracefully handled.

### Microsoft and Apple Calendar: UI Only
`CalendarConnections.tsx` renders connection cards for Microsoft Outlook and Apple Calendar, but clicking "Connect" shows a toast saying "Coming soon." Only Google Calendar is implemented.

## Dependency Risks

### Outdated Deno Standard Library
`supabase/functions/` reference `deno.land/std@0.168.0` which is significantly outdated (current stable is 1.x). This may have security patches missing.

### Conflicting Lockfiles
Both `package-lock.json` (npm) and `bun.lockb` (Bun) exist in the repo. This creates ambiguity about which package manager should be used and can cause dependency inconsistencies across environments.

## Testing

### Zero Test Coverage
No test framework is configured. No test files exist. See `TESTING.md` for details and recommended setup.

## Fragile Areas

| Area | File | Risk |
|------|------|------|
| OAuth callback error handling | `src/pages/AuthCallback.tsx` | Silent failures if edge function errors |
| Token refresh logic | `supabase/functions/google-calendar-sync/index.ts` | Race condition if token expires mid-sync |
| Meeting dedup | `supabase/migrations/` unique constraint | Relies on `external_id` being stable across Google API calls |
| Calendar provider hardcoding | `supabase/functions/google-calendar-sync/` | All sync logic assumes Google; adding providers requires significant refactor |
