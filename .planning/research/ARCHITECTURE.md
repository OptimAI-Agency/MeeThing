# Architecture Patterns

**Domain:** Wellness-focused calendar companion (OAuth multi-provider + wellness features)
**Researched:** 2026-03-22

## Recommended Architecture

The system extends MeeThing's existing SPA + BaaS pattern with three new subsystems: (1) a provider-agnostic OAuth/sync layer, (2) application-level token encryption in edge functions, and (3) a client-side wellness engine driven by meeting data and user settings.

```
Browser (React SPA)
  |
  |-- AuthContext (Supabase Auth)
  |-- CalendarConnections UI
  |      |-- Google OAuth URL construction
  |      |-- Microsoft OAuth URL construction (NEW)
  |      |-- AuthCallback (provider-aware, NEW: state encodes provider)
  |
  |-- Settings UI (reads/writes user_settings via useSettings hook, NEW)
  |      |-- SyncSettings
  |      |-- NotificationSettings
  |      |-- WellnessSettings
  |
  |-- WellnessEngine (NEW, client-side)
  |      |-- MeetingAnalyzer (detects gaps, back-to-back)
  |      |-- ReminderScheduler (setTimeout + Notification API)
  |      |-- BreathingOverlay (modal/drawer component)
  |
  |-- TanStack Query cache
  |      |-- ["calendar-connections", userId]
  |      |-- ["meetings", userId]
  |      |-- ["user-settings", userId]  (NEW)
  |
Supabase Edge Functions (Deno)
  |-- provider-oauth (NEW: replaces google-oauth, handles both providers)
  |      |-- encrypt tokens before DB write
  |-- provider-calendar-sync (NEW: replaces google-calendar-sync)
  |      |-- decrypt tokens before API call
  |      |-- provider-specific API adapters (Google, Microsoft)
  |
Supabase PostgreSQL
  |-- calendar_connections (tokens encrypted with AES-256-GCM)
  |-- meetings
  |-- user_settings (wellness + notification preferences)
  |-- profiles, user_roles
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **CalendarConnections** (existing, modified) | OAuth URL construction for Google and Microsoft; provider cards UI | AuthCallback (via redirect), Supabase DB (disconnect) |
| **AuthCallback** (existing, modified) | Receives OAuth callback, dispatches to correct edge function based on `state` param | `provider-oauth` edge function, `provider-calendar-sync` edge function |
| **`provider-oauth` edge function** (new) | Exchanges auth code for tokens with Google/Microsoft, encrypts tokens, stores in DB | Google/Microsoft token endpoints, Supabase DB, encryption module |
| **`provider-calendar-sync` edge function** (new) | Decrypts tokens, fetches events from correct provider API, upserts meetings | Google Calendar API, Microsoft Graph API, Supabase DB, encryption module |
| **`useSettings` hook** (new) | CRUD for `user_settings` table via TanStack Query | Supabase DB |
| **WellnessEngine** (new) | Analyzes meeting schedule, triggers breathing reminders and transition buffers | `useMeetings` data, `useSettings` data, Notification API, BreathingOverlay UI |
| **BreathingOverlay** (new) | Full-screen or modal breathing exercise UI | WellnessEngine (trigger), user interaction (dismiss) |
| **Encryption module** (new, shared by edge functions) | AES-256-GCM encrypt/decrypt using Web Crypto API | Edge function secrets (`TOKEN_ENCRYPTION_KEY`) |

### Data Flow

#### Microsoft OAuth Flow (New)

This mirrors the existing Google flow but uses Microsoft Identity Platform endpoints. The key architectural decision is to use the **authorization code flow with client secret** (not PKCE) because the token exchange happens server-side in an edge function, making client secrets safe.

```
CalendarConnections.tsx "Connect" button (provider=microsoft)
  --> Constructs Microsoft OAuth URL:
      https://login.microsoftonline.com/common/oauth2/v2.0/authorize
      ?client_id={MICROSOFT_CLIENT_ID}
      &response_type=code
      &redirect_uri={origin}/auth/callback
      &scope=offline_access Calendars.Read
      &state=microsoft:{random_csrf_token}
      &prompt=consent
  --> Browser redirects to Microsoft consent screen
  --> Microsoft redirects to /auth/callback?code=...&state=microsoft:{token}

AuthCallback.tsx (modified)
  --> Parses state: extracts provider prefix ("microsoft") and CSRF token
  --> Validates CSRF token against sessionStorage
  --> Calls provider-oauth edge function with { code, provider: "microsoft" }

provider-oauth edge function
  --> Routes to Microsoft token exchange:
      POST https://login.microsoftonline.com/common/oauth2/v2.0/token
      body: client_id, client_secret, code, redirect_uri, grant_type=authorization_code, scope
  --> Receives { access_token, refresh_token, expires_in }
  --> Encrypts tokens with AES-256-GCM (Web Crypto API)
  --> Upserts into calendar_connections (provider="microsoft")

provider-calendar-sync edge function
  --> Reads calendar_connections where provider="microsoft"
  --> Decrypts access_token
  --> Checks expiry, refreshes via Microsoft token endpoint if needed:
      POST https://login.microsoftonline.com/common/oauth2/v2.0/token
      body: client_id, client_secret, refresh_token, grant_type=refresh_token, scope
  --> Fetches events via Microsoft Graph calendarView:
      GET https://graph.microsoft.com/v1.0/me/calendar/calendarView
        ?startDateTime={ISO}&endDateTime={ISO}
      Authorization: Bearer {access_token}
  --> Maps Microsoft event shape to meetings schema
  --> Upserts meetings, cleans stale records
```

**Microsoft vs Google API differences that affect the sync adapter:**

| Aspect | Google Calendar API | Microsoft Graph API |
|--------|-------------------|---------------------|
| Endpoint | `googleapis.com/calendar/v3/calendars/primary/events` | `graph.microsoft.com/v1.0/me/calendar/calendarView` |
| Date filtering | `timeMin`/`timeMax` query params | `startDateTime`/`endDateTime` query params (required) |
| Expand recurrence | `singleEvents=true` | `calendarView` auto-expands recurrences |
| Event ID field | `e.id` | `e.id` |
| Title field | `e.summary` | `e.subject` |
| Start/end format | `e.start.dateTime` (ISO string) | `e.start.dateTime` (ISO string, no TZ suffix) + `e.start.timeZone` |
| All-day detection | Missing `dateTime` (has `date` instead) | `e.isAllDay === true` |
| Attendees | `e.attendees[].email` | `e.attendees[].emailAddress.address` |
| Web link | `e.htmlLink` | `e.webLink` |
| Pagination | `maxResults` + `nextPageToken` | `$top` + `@odata.nextLink` |
| Auth scopes | `calendar.readonly` | `Calendars.Read` + `offline_access` |
| Tenant config | Not applicable | Use `common` tenant for personal + work accounts |

**Microsoft app registration requirements:**
- Register at https://portal.azure.com > App registrations
- Set redirect URI type to "Web" (not SPA) since the edge function exchanges the code server-side
- Actually, the redirect happens to the SPA, but the code exchange is server-side. Set redirect URI type to "SPA" for CORS support on the authorize endpoint, and pass `client_secret` from the edge function. This works because the browser only sees the authorize redirect, while the token exchange POST happens from the edge function (server-to-server, no CORS).
- Required API permissions: `Calendars.Read` (delegated), `offline_access` (delegated)
- Generate a client secret in "Certificates & secrets"
- Store `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET` as Supabase edge function secrets

#### Token Encryption Flow (New)

**Decision: Application-level AES-256-GCM in edge functions using Web Crypto API.**

Why not pgcrypto:
- pgcrypto requires the encryption key to be passed in SQL queries, meaning it appears in query logs and `pg_stat_statements`
- Encrypting/decrypting at the SQL level means every query that touches tokens must include the key
- No way to scope key access -- any function or user with DB access sees the key in flight

Why not Supabase Vault:
- Vault is designed for storing secrets (like API keys), not for encrypting/decrypting arbitrary data in transit
- Vault's `pgsodium` transparent column encryption could work, but it is tightly coupled to Supabase internals and harder to reason about in migrations
- LOW confidence: Could not verify current Vault docs (access denied). This recommendation may need validation.

Why application-level encryption:
- Encryption key lives only in edge function environment variables, never touches the database
- Web Crypto API is available natively in Deno (edge function runtime)
- Encrypt before write, decrypt after read -- simple and auditable
- AES-256-GCM provides authenticated encryption (integrity + confidentiality)
- Each token gets a unique random IV, stored alongside the ciphertext

```
Encrypt (in provider-oauth edge function):
  1. Read TOKEN_ENCRYPTION_KEY from Deno.env (base64-encoded 256-bit key)
  2. Generate 12-byte random IV via crypto.getRandomValues()
  3. Import key via crypto.subtle.importKey("raw", key, "AES-GCM", false, ["encrypt"])
  4. Encrypt: crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  5. Store as base64(iv + ciphertext) in access_token_encrypted column

Decrypt (in provider-calendar-sync edge function):
  1. Read TOKEN_ENCRYPTION_KEY from Deno.env
  2. Decode base64, split first 12 bytes (IV) from rest (ciphertext)
  3. Import key, decrypt via crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext)
  4. Use plaintext token for API calls
```

**Shared encryption module** (`supabase/functions/_shared/crypto.ts`):
- `encryptToken(plaintext: string): Promise<string>` -- returns base64(iv+ciphertext)
- `decryptToken(encrypted: string): Promise<string>` -- returns plaintext
- Both read `TOKEN_ENCRYPTION_KEY` from environment
- This module is imported by both `provider-oauth` and `provider-calendar-sync`

**Migration note:** Existing plaintext tokens in `access_token_encrypted` and `refresh_token_encrypted` columns will need a one-time migration script that reads, encrypts, and writes them back. This should run as a Supabase edge function invoked manually or via a migration hook.

#### Settings Persistence Flow (New)

```
CalendarSettings.tsx
  --> useSettings() hook (TanStack Query)
      --> query: SELECT * FROM user_settings WHERE user_id = auth.uid()
      --> mutation: UPDATE user_settings SET ... WHERE user_id = auth.uid()
  --> On "Save Settings":
      --> mutate({ sync_frequency_minutes, notifications_enabled, ... })
      --> Optimistic update via TanStack Query
      --> Toast confirmation on success
```

The `user_settings` table already exists with appropriate columns and RLS policies. The `handle_new_user()` trigger creates default settings on signup. The gap is purely that no hook reads or writes this table.

**New columns needed in `user_settings`** (via migration):
```sql
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS wellness_breathing_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS wellness_breathing_minutes_before INTEGER NOT NULL DEFAULT 5
  CHECK (wellness_breathing_minutes_before IN (2, 5, 10)),
ADD COLUMN IF NOT EXISTS wellness_transition_buffer_minutes INTEGER NOT NULL DEFAULT 0
  CHECK (wellness_transition_buffer_minutes IN (0, 5, 10, 15));
```

#### Wellness Engine Flow (New)

**Architecture: Entirely client-side.** No push notifications, no service workers, no background sync. The wellness engine runs inside the React component tree when the app is open.

```
MeetingsPage (or CalendarHub overview tab)
  --> useWellnessEngine(meetings, settings)
      |
      |--> MeetingAnalyzer
      |      Input: meetings[] (from useMeetings), current time
      |      Output: { nextMeeting, minutesUntilNext, isBackToBack, gapMinutes }
      |      Recalculates on: meeting data change, 60-second interval
      |
      |--> ReminderScheduler
      |      Input: nextMeeting, settings.wellness_breathing_minutes_before
      |      Effect: Sets/clears setTimeout for breathing reminder
      |      When timer fires:
      |        1. Check Notification.permission === "granted"
      |        2. If yes: new Notification("Time to breathe", { body, icon, tag })
      |        3. Always: set showBreathingOverlay = true
      |
      |--> TransitionBuffer
             Input: meetings[], settings.wellness_transition_buffer_minutes
             Output: visual indicators on MeetingsList showing transition windows
             When back-to-back detected and buffer > 0:
               Insert visual "transition buffer" card between meeting items
```

**Why client-side only (no service worker or push):**
- PROJECT.md explicitly marks "Real-time push notifications" as out of scope for v1
- Service workers add significant complexity (registration, lifecycle, update handling)
- The app targets knowledge workers who have it open during work hours -- tab-based reminders are sufficient
- Notification API works from a foreground tab without service worker registration
- `setTimeout`-based scheduling is reliable for reminders within the current session

**Notification API usage:**
- Request `Notification.requestPermission()` when user enables breathing reminders in settings
- Use `tag` property to prevent duplicate notifications for same meeting
- Fall back to in-app overlay when permission is denied or unavailable
- Never assume permission -- always check and handle denial gracefully

**BreathingOverlay component:**
- Full-viewport overlay with the existing `breathe` CSS animation
- Timed breathing pattern (e.g., 4-7-8 or box breathing)
- Progress indicator (30-60 second session)
- Dismiss button always visible
- Conforms to existing glassmorphism design system
- Triggered by ReminderScheduler or manually from a "Breathe" button in the meeting list

## Patterns to Follow

### Pattern 1: Provider Adapter

Normalize Google and Microsoft API responses into a common meeting shape inside the sync edge function.

**What:** A `toMeeting()` adapter function per provider that maps provider-specific event shapes to the `meetings` table schema.

**When:** In the `provider-calendar-sync` edge function, after fetching events from the provider API.

```typescript
// supabase/functions/_shared/adapters/google.ts
export function googleEventToMeeting(
  event: GoogleCalendarEvent,
  userId: string,
  connectionId: string
): MeetingInsert {
  return {
    user_id: userId,
    calendar_connection_id: connectionId,
    external_id: event.id,
    title: event.summary ?? "Untitled",
    description: event.description ?? null,
    start_time: event.start.dateTime,
    end_time: event.end.dateTime,
    location: event.location ?? null,
    attendees: (event.attendees ?? []).map(a => ({
      email: a.email,
      name: a.displayName ?? null,
      self: a.self ?? false,
    })),
    metadata: {
      htmlLink: event.htmlLink ?? null,
      status: event.status ?? null,
      provider: "google",
    },
  };
}

// supabase/functions/_shared/adapters/microsoft.ts
export function microsoftEventToMeeting(
  event: MicrosoftCalendarEvent,
  userId: string,
  connectionId: string
): MeetingInsert {
  return {
    user_id: userId,
    calendar_connection_id: connectionId,
    external_id: event.id,
    title: event.subject ?? "Untitled",
    description: event.bodyPreview ?? null,
    start_time: event.start.dateTime + "Z", // Graph returns no TZ suffix for UTC
    end_time: event.end.dateTime + "Z",
    location: event.location?.displayName ?? null,
    attendees: (event.attendees ?? []).map(a => ({
      email: a.emailAddress.address,
      name: a.emailAddress.name ?? null,
      self: false, // Graph doesn't have a "self" flag; determine from user email
    })),
    metadata: {
      htmlLink: event.webLink ?? null,
      status: event.isCancelled ? "cancelled" : "confirmed",
      provider: "microsoft",
    },
  };
}
```

### Pattern 2: Edge Function Routing by Provider

**What:** A single edge function that routes to provider-specific logic based on a `provider` parameter, sharing common code (auth validation, encryption, DB operations).

**When:** For both OAuth token exchange and calendar sync.

```typescript
// supabase/functions/provider-oauth/index.ts (simplified structure)
serve(async (req) => {
  const { code, provider } = await req.json();
  const user = await getAuthenticatedUser(req);

  let tokens: OAuthTokens;
  if (provider === "google") {
    tokens = await exchangeGoogleCode(code);
  } else if (provider === "microsoft") {
    tokens = await exchangeMicrosoftCode(code);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const encryptedAccess = await encryptToken(tokens.access_token);
  const encryptedRefresh = await encryptToken(tokens.refresh_token);

  await upsertConnection(user.id, provider, encryptedAccess, encryptedRefresh, tokens.expires_in);
  return jsonResponse({ success: true });
});
```

### Pattern 3: CSRF State Token

**What:** Encode provider identity and a random CSRF token in the OAuth `state` parameter. Validate on callback.

**When:** Before constructing OAuth redirect URLs and in AuthCallback.

```typescript
// Before redirect:
const csrfToken = crypto.randomUUID();
sessionStorage.setItem("oauth_csrf", csrfToken);
const state = `${provider}:${csrfToken}`;

// In AuthCallback:
const [provider, csrfToken] = state.split(":");
const storedCsrf = sessionStorage.getItem("oauth_csrf");
if (csrfToken !== storedCsrf) throw new Error("CSRF validation failed");
sessionStorage.removeItem("oauth_csrf");
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Edge Functions Per Provider
**What:** Creating `microsoft-oauth` and `microsoft-calendar-sync` as separate functions alongside the existing Google ones.
**Why bad:** Code duplication for auth validation, encryption, DB operations, error handling, CORS headers. Every bug fix or improvement must be applied N times. Already seeing this with `google-oauth` and `google-calendar-sync`.
**Instead:** Consolidate into `provider-oauth` and `provider-calendar-sync` with provider-specific adapters. The existing Google functions should be refactored into this pattern.

### Anti-Pattern 2: Storing Encryption Key in Database
**What:** Keeping the token encryption key in a DB table or Supabase Vault for "convenience."
**Why bad:** If the database is compromised, both the encrypted tokens and the key are available together, defeating the purpose of encryption. The key must live in a separate security boundary.
**Instead:** Store the encryption key as a Supabase edge function secret (`supabase secrets set TOKEN_ENCRYPTION_KEY=...`). It is only accessible to edge functions at runtime, never stored in the database.

### Anti-Pattern 3: Service Worker for Wellness Reminders
**What:** Implementing a service worker to handle background notifications for breathing reminders.
**Why bad:** Enormous complexity increase (SW lifecycle, update flow, offline handling) for a feature that only needs to work while the app is open. Service workers are needed for push notifications from a server, not for client-scheduled reminders.
**Instead:** Use `setTimeout` + Notification API from the foreground tab. If the user closes the tab, reminders stop -- this is acceptable for v1 and matches the "no push notifications" constraint.

### Anti-Pattern 4: Polling for Settings Changes
**What:** Polling `user_settings` on an interval to detect changes.
**Why bad:** Wasteful. Settings only change when the user explicitly saves.
**Instead:** Use TanStack Query with `staleTime: Infinity` for settings. Only refetch on explicit user action (mutation invalidation) or on page load.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Token encryption overhead | Negligible (<1ms per encrypt/decrypt) | Negligible | Negligible -- Web Crypto is hardware-accelerated |
| Edge function cold starts | Acceptable (Supabase functions ~200ms cold start) | Acceptable | Consider connection pooling and function warm-up |
| Microsoft Graph rate limits | Not a concern (per-user limits are generous) | May need per-user rate limiting on manual sync | Need background sync with queue to stay under 10K req/10min per app |
| Meeting sync volume | Direct upsert works | Direct upsert works | Batch upserts, paginate all provider API calls |
| Wellness engine CPU | Trivial (runs in browser) | N/A (per-client) | N/A (per-client) |

## Suggested Build Order

The following order respects dependency chains and delivers shippable increments:

### Phase 1: Security Foundations
1. **Encryption module** (`_shared/crypto.ts`) -- zero dependencies, foundational
2. **CSRF state token** in CalendarConnections + AuthCallback -- fixes SEC-02
3. **CORS restriction** on edge functions -- fixes SEC-03
4. **Migrate existing Google OAuth** to encrypt tokens -- fixes SEC-01 for Google

*Rationale: Security fixes are prerequisites for public launch and block nothing else. Encryption module is needed by both Google (existing) and Microsoft (new).*

### Phase 2: Provider Abstraction + Microsoft OAuth
1. **Refactor `google-oauth` into `provider-oauth`** with provider routing + adapters
2. **Refactor `google-calendar-sync` into `provider-calendar-sync`** with provider adapters
3. **Add Microsoft OAuth URL construction** in CalendarConnections
4. **Add Microsoft token exchange** in provider-oauth edge function
5. **Add Microsoft Graph calendar sync** adapter in provider-calendar-sync
6. **Update AuthCallback** to parse provider from state, dispatch accordingly

*Rationale: Refactoring existing Google functions into the provider-agnostic pattern before adding Microsoft avoids building parallel duplicates. Microsoft OAuth is structurally identical to Google -- same auth code flow, same token shape, different endpoints.*

### Phase 3: Settings Persistence
1. **`useSettings` hook** -- TanStack Query CRUD for user_settings
2. **Wire CalendarSettings UI** to useSettings (SyncSettings, NotificationSettings)
3. **Add wellness columns** to user_settings via migration
4. **Wire WellnessSection UI** to useSettings for new wellness toggles

*Rationale: Settings persistence is independent of OAuth work and can be built in parallel if resources allow. But it must complete before wellness features since the wellness engine reads settings.*

### Phase 4: Wellness Engine
1. **MeetingAnalyzer** utility (pure function: meetings -> schedule analysis)
2. **ReminderScheduler** hook (setTimeout + Notification API)
3. **BreathingOverlay** component (modal with breathing animation)
4. **TransitionBuffer** component (visual cards between meetings)
5. **Integration**: Wire into CalendarHub overview tab

*Rationale: Depends on both meetings data (Phase 2 completion) and settings (Phase 3). The wellness engine is the product differentiator and benefits from having all other plumbing in place.*

### Phase 5: Auth Improvements
1. **Email verification enforcement** in AuthContext / ProtectedRoute
2. **Password reset flow** (Supabase Auth has built-in support, needs UI)
3. **OAuth token revocation on disconnect** (provider-specific revocation endpoints)

*Rationale: Auth improvements are important but independent. They do not block other phases and can be built last or in parallel.*

## Sources

- Microsoft Identity Platform OAuth 2.0 authorization code flow: https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow (verified 2026-01-09, HIGH confidence)
- Microsoft Graph calendarView API: https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview (verified, HIGH confidence)
- Microsoft Graph calendar events API: https://learn.microsoft.com/en-us/graph/api/calendar-list-events (verified, HIGH confidence)
- Supabase Vault documentation: access denied during research (LOW confidence on Vault assessment, recommendation based on training data)
- Web Crypto API (AES-GCM): Available natively in Deno runtime (HIGH confidence, part of Web Standards)
- Notification API: Standard Web API, works from foreground tabs without service worker (HIGH confidence)
- Existing codebase analysis: google-oauth, google-calendar-sync edge functions, CalendarConnections, AuthCallback, CalendarSettings, migrations (HIGH confidence, direct code review)
