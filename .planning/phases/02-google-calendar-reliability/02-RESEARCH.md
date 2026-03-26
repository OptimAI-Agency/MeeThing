# Phase 2: Google Calendar Reliability - Research

**Researched:** 2026-03-26
**Domain:** Google Calendar API integration, OAuth token lifecycle, Supabase Edge Functions
**Confidence:** HIGH

## Summary

Phase 2 hardens the existing Google Calendar sync into a production-reliable feature. Three changes are needed: (1) the sync edge function must paginate through all events using `nextPageToken` instead of stopping at 50, (2) error responses from the sync function must distinguish auth failures from API errors so the frontend can show specific messages and a reconnect action, and (3) a new `google-calendar-disconnect` edge function must revoke the OAuth token with Google, delete the calendar connection row, and cascade-delete all synced meetings.

The existing codebase is well-structured for these changes. The `google-calendar-sync` edge function already handles token refresh, CORS, and auth -- it needs a pagination loop and structured error responses. The frontend already uses `useToast` with action elements and has shadcn's `AlertDialog` installed for the confirmation dialog. `date-fns` is already a dependency for relative time formatting ("Last synced 2 minutes ago").

**Primary recommendation:** Implement pagination in the sync edge function first (highest user-facing impact), then the disconnect edge function (new code, no existing code changes), then wire up the frontend error handling and UI changes last.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Loop until no `nextPageToken` in the Google Calendar API response -- fetch ALL events in the 7-day window, not just the first page
- **D-02:** No hard cap on total events -- the 7-day window is the natural bound
- **D-03:** Disconnect goes through a new edge function `google-calendar-disconnect` -- calls Google's token revocation endpoint server-side (keeps client secret safe), then deletes the `calendar_connections` row and all associated `meetings` rows
- **D-04:** Disconnecting requires a confirmation dialog: "This will remove all synced meetings. Are you sure?" -- prevents accidental disconnects
- **D-05:** Synced meetings are hard-deleted from the DB (DELETE, not soft-delete) when a calendar is disconnected
- **D-06:** Error messages are specific, not generic:
  - Token refresh failure -> "Your Google Calendar session expired -- please reconnect" (with action to navigate to Connections tab)
  - Google API error -> "Google Calendar sync failed -- try again"
  - Network error -> "Sync failed -- check your connection and try again"
- **D-07:** Token refresh failure surfaces a toast with a "Reconnect" action button that navigates the user to the Connections tab -- not just a message
- **D-08:** Show "Last synced X ago" on the connected Google Calendar provider card in the Connections tab -- reads from `last_synced_at` on `calendar_connections`
- **D-09:** After a successful "Sync now", invalidate calendar-connections query so the timestamp updates immediately
- **D-10:** Sync primary calendar only -- no change to current scope

### Claude's Discretion
- Exact pagination loop implementation (accumulate events array across pages, pass `pageToken` param)
- Wording and formatting of the confirmation dialog
- Relative time display format for last-synced (e.g., "2 minutes ago", "just now", "1 hour ago")
- Error type detection logic (distinguish HTTP 401/403 as auth errors vs other HTTP errors)

### Deferred Ideas (OUT OF SCOPE)
- Secondary/shared calendar sync
- Sync frequency settings (auto-sync on interval)
- Sync progress indicator for large event sets
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAL-01 | Google Calendar sync fetches all events in the 7-day window with pagination (currently hard-capped at 50 events, silently missing overflow) | Google Calendar API supports `nextPageToken` pagination; loop until field is absent from response; max 2500 per page (set `maxResults` to 2500 to minimize round-trips) |
| CAL-02 | Manual "Sync now" is reliable -- handles token refresh, errors surfaced to user rather than failing silently | Edge function must return structured error with `error_type` field; frontend maps error types to specific toast messages; `ToastAction` component already available for reconnect button |
| CAL-03 | Disconnecting Google Calendar revokes the OAuth token with Google and clears all synced meetings | Google revocation endpoint: POST `https://oauth2.googleapis.com/revoke` with `token={refresh_token}`; new edge function handles revocation + DB cleanup in a transaction-like sequence |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.84.0 | DB queries, edge function invocation | Already the project backend |
| @tanstack/react-query | ^5.56.2 | Cache invalidation after sync/disconnect | Already used for all data fetching |
| date-fns | ^3.6.0 | `formatDistanceToNow` for "Last synced X ago" | Already a dependency |
| @radix-ui/react-alert-dialog | ^1.1.1 | Confirmation dialog for disconnect | Already installed, shadcn AlertDialog component exists |
| @radix-ui/react-toast | ^1.2.1 | Toast with action button for reconnect prompt | Already installed, ToastAction component exists |

### Supporting (no new dependencies needed)
No new packages required. All functionality is covered by existing dependencies plus the Deno standard library in edge functions.

**Installation:** None required -- all packages already present.

## Architecture Patterns

### Edge Function Structure (existing pattern)
```
supabase/functions/
  _shared/
    cors.ts          # getCorsHeaders, handleCorsPreflightIfNeeded
    crypto.ts        # encrypt, decrypt (AES-256-GCM)
  google-oauth/      # Token exchange (existing)
  google-calendar-sync/  # Sync with pagination (modify)
  google-calendar-disconnect/  # NEW: revoke + delete
```

### Pattern 1: Pagination Loop in Edge Function
**What:** Accumulate all events across pages before processing
**When to use:** Any Google Calendar API call that could exceed one page of results

```typescript
// Accumulate all events across pages
let allEvents: any[] = [];
let pageToken: string | undefined;

do {
  const params: Record<string, string> = {
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",  // Maximum allowed per page
  };
  if (pageToken) params.pageToken = pageToken;

  const calRes = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?" +
      new URLSearchParams(params),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!calRes.ok) { /* handle error */ }

  const calData = await calRes.json();
  allEvents = allEvents.concat(calData.items ?? []);
  pageToken = calData.nextPageToken;
} while (pageToken);
```
Source: [Google Calendar API pagination guide](https://developers.google.com/workspace/calendar/api/guides/pagination)

### Pattern 2: Structured Error Response from Edge Functions
**What:** Return `error_type` alongside `error` message so the frontend can branch on error category
**When to use:** Any edge function where different errors require different user-facing behavior

```typescript
// In edge function catch block:
const isAuthError = err.message.includes("Token refresh failed") ||
                    err.message.includes("no refresh token");
return new Response(
  JSON.stringify({
    error: err.message,
    error_type: isAuthError ? "auth_expired" : "sync_failed",
  }),
  {
    status: isAuthError ? 401 : 400,
    headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
  },
);
```

### Pattern 3: Toast with Action Button
**What:** shadcn toast with a clickable action that navigates the user
**When to use:** When an error requires the user to take action in a different part of the UI

```typescript
import { ToastAction } from "@/components/ui/toast";

toast({
  title: "Session expired",
  description: "Your Google Calendar session expired -- please reconnect.",
  variant: "destructive",
  action: (
    <ToastAction altText="Reconnect" onClick={() => setActiveTab("connections")}>
      Reconnect
    </ToastAction>
  ),
});
```

### Pattern 4: Google Token Revocation
**What:** Server-side POST to Google's revocation endpoint
**When to use:** When a user disconnects their calendar

```typescript
// Source: https://developers.google.com/identity/protocols/oauth2/web-server
const revokeRes = await fetch("https://oauth2.googleapis.com/revoke", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ token: refreshToken }),
});
// Google returns 200 on success. Non-200 means revocation failed,
// but we should still clean up locally.
```

### Pattern 5: Confirmation Dialog with AlertDialog
**What:** shadcn AlertDialog for destructive confirmation
**When to use:** Before any irreversible action (disconnect = delete all meetings)

```typescript
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">Disconnect</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove all synced meetings from MeeThing.
        You can reconnect at any time.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDisconnect("google")}>
        Disconnect
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Anti-Patterns to Avoid
- **Swallowing pagination:** Never assume one page is all events. The current `maxResults: "50"` with no `nextPageToken` handling is exactly this bug.
- **Generic error messages:** "Something went wrong" is useless. The edge function must classify errors so the frontend can show actionable messages.
- **Client-side token revocation:** Never call Google's revocation endpoint from the browser -- it would expose the refresh token. Always go through an edge function.
- **Soft-deleting on disconnect:** Per D-05, hard-delete meetings. Soft-delete creates orphan data with no path to cleanup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time formatting | Custom "X minutes ago" logic | `date-fns/formatDistanceToNow` | Handles edge cases (just now, minutes, hours, days), i18n-ready |
| Confirmation dialogs | Custom modal with state management | shadcn `AlertDialog` (already installed) | Accessible, keyboard-navigable, focus-trapped |
| Toast with actions | Custom notification component | shadcn `Toast` + `ToastAction` (already installed) | Handles dismiss timing, stacking, animation |

## Common Pitfalls

### Pitfall 1: Google API Returns Fewer Events Than maxResults
**What goes wrong:** Developer assumes `items.length < maxResults` means no more pages. Wrong -- Google may return fewer items than `maxResults` even when more pages exist.
**Why it happens:** Google's documentation explicitly warns: "The number of events in the resulting page may be less than this value, or none at all, even if there are more events matching the query."
**How to avoid:** Only stop paginating when `nextPageToken` is absent from the response. Never use item count as a stop condition.
**Warning signs:** Users report missing events despite having fewer than 2500 in the window.

### Pitfall 2: Token Revocation Failure Blocks Disconnect
**What goes wrong:** If Google's revocation endpoint returns an error (network issue, already-revoked token), the disconnect handler throws and the user is stuck "connected" with no way to clean up.
**Why it happens:** Treating revocation failure as a hard error.
**How to avoid:** Attempt revocation, log failure, but proceed with local cleanup (delete connection + meetings) regardless. The token will expire naturally. Log the revocation failure for monitoring.
**Warning signs:** Users unable to disconnect after extended offline periods.

### Pitfall 3: Race Condition Between Disconnect and In-Flight Sync
**What goes wrong:** User clicks "Sync now" then immediately clicks "Disconnect". The sync finishes and re-inserts meetings after disconnect deleted them.
**Why it happens:** No guard against concurrent operations.
**How to avoid:** Disable the "Sync now" button while disconnect is in progress (and vice versa). The disconnect edge function deletes the `calendar_connections` row first, so any in-flight sync will fail when it tries to update `last_synced_at` on the now-deleted row. Frontend should also disable disconnect while syncing.
**Warning signs:** Meetings reappear after disconnect.

### Pitfall 4: Stale Meetings After Pagination Fix
**What goes wrong:** After implementing pagination, the cleanup query that removes meetings no longer in the window becomes more important. Previously with max 50 events, the `NOT IN (externalIds)` delete was bounded. With potentially hundreds of events, the `NOT IN` clause could hit Supabase query limits.
**Why it happens:** The current cleanup uses `.not("external_id", "in", ...)` with string interpolation.
**How to avoid:** The current approach of building a parenthesized list should still work for hundreds of IDs, but verify that Supabase/PostgREST handles large `NOT IN` lists. If >1000 events becomes realistic, consider chunking.
**Warning signs:** Cleanup query fails silently or times out.

### Pitfall 5: supabase.functions.invoke Error Handling
**What goes wrong:** `supabase.functions.invoke` does not throw on HTTP 4xx/5xx. It returns `{ data, error }` where `error` is only set for network-level failures. A 401 response from the edge function comes back in `data` with the error body.
**Why it happens:** Supabase client treats edge function responses as successful if the HTTP request completed.
**How to avoid:** Check both `error` (network failure) and parse `data` for error fields. The current code does `if (error) throw new Error(error.message)` which only catches network errors. Must also check `data?.error` or `data?.error_type`.
**Warning signs:** Auth errors show as "Synced" success because the 401 response was treated as data.

## Code Examples

### Relative Time Display with date-fns
```typescript
import { formatDistanceToNow } from "date-fns";

// "Last synced 2 minutes ago"
const lastSyncedText = connection.last_synced_at
  ? `Last synced ${formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true })}`
  : "Never synced";
```

### Edge Function: Handling supabase.functions.invoke Response
```typescript
// Current (broken for structured errors):
const { error } = await supabase.functions.invoke("google-calendar-sync");
if (error) throw new Error(error.message);

// Fixed (handles both network errors and structured error responses):
const { data, error } = await supabase.functions.invoke("google-calendar-sync");
if (error) throw { message: error.message, type: "network" };
if (data?.error) throw { message: data.error, type: data.error_type ?? "unknown" };
```

### Disconnect Edge Function Skeleton
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/crypto.ts";
import { getCorsHeaders, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

serve(async (req) => {
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Load connection to get refresh token for revocation
    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("id, refresh_token_encrypted")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("is_active", true)
      .single();

    if (connError || !connection) throw new Error("No active Google Calendar connection");

    // 1. Revoke token with Google (best-effort)
    if (connection.refresh_token_encrypted) {
      const refreshToken = await decrypt(connection.refresh_token_encrypted);
      const revokeRes = await fetch("https://oauth2.googleapis.com/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: refreshToken }),
      });
      if (!revokeRes.ok) {
        console.warn("Token revocation failed (proceeding with cleanup):", await revokeRes.text());
      }
    }

    // 2. Delete all meetings for this connection
    await supabase
      .from("meetings")
      .delete()
      .eq("calendar_connection_id", connection.id);

    // 3. Delete the calendar connection
    await supabase
      .from("calendar_connections")
      .delete()
      .eq("id", connection.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("google-calendar-disconnect error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...getCorsHeaders(), "Content-Type": "application/json" },
    });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `maxResults: "50"`, no pagination | Loop with `nextPageToken`, `maxResults: "2500"` | Google Calendar API v3 (stable) | Fetches all events in window |
| `is_active: false` soft-disconnect | Hard-delete connection + revoke token | Phase 2 decision D-03/D-05 | Clean data, proper OAuth lifecycle |
| Generic error toast | Structured error types with actionable toasts | Phase 2 decision D-06/D-07 | Users can self-recover from auth expiry |

**Deprecated/outdated:**
- The `encrypted_access_token` / `encrypted_refresh_token` columns (without `_encrypted` suffix) are duplicates noted in STATE.md as needing cleanup. Phase 2 does not address this -- it uses the `access_token_encrypted` / `refresh_token_encrypted` columns that the Phase 1 edge functions already use.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per CLAUDE.md) |
| Config file | None |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint && npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAL-01 | Pagination fetches all events | manual-only | Manual: connect account with >50 events in 7 days, verify all appear | N/A |
| CAL-02 | Sync errors surface specific messages | manual-only | Manual: test with expired token, verify toast shows reconnect action | N/A |
| CAL-03 | Disconnect revokes token + deletes meetings | manual-only | Manual: disconnect, verify meetings removed, check Google permissions page | N/A |

**Justification for manual-only:** No test framework is configured (CLAUDE.md confirms "linting is the only automated quality check"). Edge functions run in Deno on Supabase and require a live Google OAuth token to test. Frontend error handling requires browser interaction. All three requirements involve external API integration that cannot be unit-tested without mocking infrastructure that does not exist.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Full lint + build green, manual verification of all 3 requirements

### Wave 0 Gaps
- None -- no test framework to set up (project uses lint + build as quality gates)

## Open Questions

1. **supabase.functions.invoke response shape for edge function errors**
   - What we know: The Supabase JS client v2 `functions.invoke` returns `{ data, error }`. `error` is for invocation failures (network, CORS). For HTTP 4xx/5xx responses, the behavior depends on the response content-type.
   - What's unclear: Whether `data` automatically parses JSON error bodies from edge functions, or whether we need to check `response` directly.
   - Recommendation: Test empirically during implementation. The code example above (checking `data?.error`) is the most common pattern in community usage. If needed, the edge function can return 200 with an error body to avoid the ambiguity.

2. **Large NOT IN clause for meeting cleanup**
   - What we know: Current cleanup uses `.not("external_id", "in", ...)` with string interpolation.
   - What's unclear: Whether PostgREST/Supabase has a practical limit on `NOT IN` list size.
   - Recommendation: For Phase 2, keep the existing approach. A user's 7-day window is unlikely to exceed a few hundred events. Monitor for issues.

## Sources

### Primary (HIGH confidence)
- [Google Calendar Events.list API reference](https://developers.google.com/calendar/api/v3/reference/events/list) -- pagination parameters, maxResults limits (250 default, 2500 max)
- [Google Calendar pagination guide](https://developers.google.com/workspace/calendar/api/guides/pagination) -- nextPageToken loop pattern
- [Google OAuth2 Web Server guide](https://developers.google.com/identity/protocols/oauth2/web-server) -- token revocation endpoint: POST `https://oauth2.googleapis.com/revoke`

### Secondary (MEDIUM confidence)
- Existing codebase analysis (all edge functions, hooks, components read directly) -- established patterns for CORS, auth, crypto, query invalidation

### Tertiary (LOW confidence)
- `supabase.functions.invoke` error handling behavior -- based on community patterns, needs empirical verification during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use
- Architecture: HIGH -- follows established patterns in the codebase, Google API is well-documented
- Pitfalls: HIGH -- derived from reading existing code and official API docs

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable APIs, no fast-moving dependencies)
