# Phase 2: Google Calendar Reliability - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Google Calendar sync is robust enough for users with dense schedules. Three capabilities delivered:
1. **Pagination (CAL-01):** Sync fetches all events in the 7-day window — no silent cap at 50
2. **Reliable sync (CAL-02):** "Sync now" reports success or a clear, specific error; token refresh failures surface a re-connect prompt with navigation action
3. **Clean disconnect (CAL-03):** Disconnecting Google Calendar revokes the OAuth token with Google and hard-deletes all synced meetings from the database

</domain>

<decisions>
## Implementation Decisions

### Pagination
- **D-01:** Loop until no `nextPageToken` in the Google Calendar API response — fetch ALL events in the 7-day window, not just the first page
- **D-02:** No hard cap on total events — the 7-day window is the natural bound

### Disconnect architecture
- **D-03:** Disconnect goes through a new edge function `google-calendar-disconnect` — calls Google's token revocation endpoint server-side (keeps client secret safe), then deletes the `calendar_connections` row and all associated `meetings` rows
- **D-04:** Disconnecting requires a confirmation dialog: "This will remove all synced meetings. Are you sure?" — prevents accidental disconnects
- **D-05:** Synced meetings are hard-deleted from the DB (DELETE, not soft-delete) when a calendar is disconnected

### Sync error communication
- **D-06:** Error messages are specific, not generic:
  - Token refresh failure → "Your Google Calendar session expired — please reconnect" (with action to navigate to Connections tab)
  - Google API error → "Google Calendar sync failed — try again"
  - Network error → "Sync failed — check your connection and try again"
- **D-07:** Token refresh failure surfaces a toast with a "Reconnect" action button that navigates the user to the Connections tab — not just a message

### Last-synced display
- **D-08:** Show "Last synced X ago" on the connected Google Calendar provider card in the Connections tab — reads from `last_synced_at` on `calendar_connections`
- **D-09:** After a successful "Sync now", invalidate calendar-connections query so the timestamp updates immediately

### Calendar scope
- **D-10:** Sync primary calendar only — no change to current scope. Secondary, shared, and subscribed calendars are out of scope for Phase 2.

### Claude's Discretion
- Exact pagination loop implementation (accumulate events array across pages, pass `pageToken` param)
- Wording and formatting of the confirmation dialog
- Relative time display format for last-synced (e.g., "2 minutes ago", "just now", "1 hour ago")
- Error type detection logic (distinguish HTTP 401/403 as auth errors vs other HTTP errors)

</decisions>

<specifics>
## Specific Ideas

- The confirmation dialog should name the consequence clearly: "This will remove all synced meetings" — not vague like "Are you sure?"
- The re-connect toast action should navigate to the Connections tab, not open a new OAuth flow directly — user should initiate reconnect themselves from a clean state

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Calendar Integration — CAL-01, CAL-02, CAL-03 define acceptance criteria
- `.planning/ROADMAP.md` §Phase 2 — Success criteria 1–4 define what must be TRUE after this phase

### Existing code to extend
- `supabase/functions/google-calendar-sync/index.ts` — pagination loop needed (current `maxResults: "50"` with no nextPageToken handling); error response needs to distinguish auth failure vs API error
- `supabase/functions/google-oauth/index.ts` — reference for edge function patterns (CORS, auth header, Supabase client setup) — new disconnect function follows same structure
- `supabase/functions/_shared/crypto.ts` — shared encrypt/decrypt used by all edge functions
- `supabase/functions/_shared/cors.ts` — shared CORS handler used by all edge functions
- `src/components/calendar/CalendarConnections.tsx` — `handleDisconnect` (lines 83–109) must be replaced to call new edge function instead of direct DB update; confirmation dialog added here; last-synced display added to provider card
- `src/components/calendar/CalendarHub.tsx` — `handleSync` (lines 31–43) error handling needs to detect auth errors and trigger re-connect toast with navigation action

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_shared/crypto.ts` + `_shared/cors.ts`: All edge functions use these — new `google-calendar-disconnect` follows the same import pattern
- `useCalendarConnections` hook (`src/hooks/useCalendarConnections.ts`): Returns `last_synced_at` — already selected in query, ready to display
- `useToast` + `useQueryClient`: Already used in `CalendarHub.tsx` and `CalendarConnections.tsx` — re-connect toast with action button slots into existing pattern
- `supabase.functions.invoke()`: Already used for sync — same pattern for disconnect edge function call

### Established Patterns
- Edge functions authenticate via `Authorization` header passed from `supabase.functions.invoke()` — new disconnect function follows same pattern
- `queryClient.invalidateQueries()` used after sync to refresh meetings — also needed after disconnect to refresh connections + meetings
- `toast()` with `variant: "destructive"` used for errors — continue this pattern

### Integration Points
- `CalendarConnections.tsx` `handleDisconnect`: Swap direct Supabase DB call → `supabase.functions.invoke("google-calendar-disconnect", { body: { provider: providerId } })`
- `CalendarHub.tsx` `handleSync`: Inspect error type from edge function response to show specific toast variant
- `calendar_connections.last_synced_at`: Already updated by `google-calendar-sync` (after upsert) — confirm the column is written on each sync, then read it in `useCalendarConnections`

</code_context>

<deferred>
## Deferred Ideas

- Secondary/shared calendar sync — out of scope for Phase 2; candidate for v2 or a Phase 2.x insert
- Sync frequency settings (auto-sync on interval) — Phase 3 wires settings to DB; sync scheduling is a v2 concern
- Sync progress indicator for large event sets — could add in Phase 4 polish pass if pagination is noticeably slow

</deferred>

---

*Phase: 02-google-calendar-reliability*
*Context gathered: 2026-03-26*
