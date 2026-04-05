# Architecture Research — v2.0 Companion Experience

**Domain:** Wellness calendar companion — React 18 + Vite SPA layered on Supabase (Auth, Postgres, Edge Functions)
**Researched:** 2026-04-04
**Confidence:** HIGH (integration points) / MEDIUM (push notification stack — new territory for this codebase)

This document addresses integration architecture for the v2.0 Companion Experience milestone. It is grounded in the existing codebase (`src/App.tsx`, `src/pages/Calendar.tsx`, `src/components/calendar/CalendarHub.tsx`, `src/hooks/useMeetings.ts`, `src/hooks/useBackground.tsx`) rather than greenfield assumptions.

---

## Standard Architecture

### System Overview — v2.0 Target

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (React 18 SPA)                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   pages/Calendar.tsx  (background layer — ambient breathing BG)      │
│          │                                                           │
│          ▼                                                           │
│   CalendarHub (tabs + view mode: today|week)                         │
│     ├─ ContextualGreeting    (NEW — derived from user + meetings)    │
│     ├─ TodaysRhythmTimeline  (NEW — derives segments from meetings)  │
│     ├─ WeeklyToneSummary     (NEW — derived selector from meetings)  │
│     ├─ MeetingsList          (EXISTING — filters by view mode)       │
│     └─ WindDownPanel         (NEW — conditional render)              │
│                                                                      │
│   BreathingOverlay (EXISTING, React Portal)                          │
│                                                                      │
│   Service Worker (NEW — /sw.js in public/, registered in main.tsx)   │
│          ▲                                                           │
│          │ push events                                               │
│          │                                                           │
├──────────┼───────────────────────────────────────────────────────────┤
│          │                Push Service (Web Push)                    │
├──────────┼───────────────────────────────────────────────────────────┤
│          │                                                           │
│          ▼                                                           │
├──────────────────────────────────────────────────────────────────────┤
│                   Supabase (backend of record)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │  Auth/JWT    │  │  PostgreSQL  │  │   Edge Functions (Deno)    │  │
│  │              │  │  meetings    │  │  - google-calendar-sync    │  │
│  │              │  │  profiles    │  │  - send-push (NEW)         │  │
│  │              │  │  user_*      │  │  - schedule-push (NEW)     │  │
│  │              │  │  push_subs   │  │                            │  │
│  │              │  │  (NEW)       │  │                            │  │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (v2.0 Additions)

| Component | Responsibility | Integration Point |
|-----------|----------------|-------------------|
| `Calendar.tsx` (MODIFY) | Host ambient breathing background layer | Add `animate-breathe-slow` CSS class to existing overlay div |
| `CalendarHub.tsx` (MODIFY) | Add view mode toggle (today/week), render new companion components | Extend existing `activeTab` state pattern with new `viewMode` state |
| `useTodayMeetings` (NEW hook) | Derived selector that filters `useMeetings` result to today | Wraps `useMeetings()` — no new network call |
| `TodaysRhythmTimeline` (NEW) | Render horizontal day visualization | Consumes `useTodayMeetings()` + computes segments locally |
| `ContextualGreeting` (NEW) | Time-of-day + first-name + meetings-count copy | Consumes `AuthContext` profile + `useTodayMeetings()` |
| `WindDownPanel` (NEW) | End-of-day companion view | Derives "last meeting ended" from `useTodayMeetings()` |
| `WeeklyToneSummary` (NEW) | Tone-shifted weekly summary | Consumes `useMeetings()` (full 7-day array already fetched) |
| `usePushNotifications` (NEW hook) | Subscribe/unsubscribe, persist subscription to `push_subscriptions` table | Calls `navigator.serviceWorker` + Supabase client |
| `public/sw.js` (NEW) | Handle `push` event, show notification | Static file served by Vite, registered in `main.tsx` |
| `send-push` Edge Function (NEW) | Server-side push dispatch (called by cron/trigger) | Reads `push_subscriptions`, calls Web Push endpoint with VAPID keys |

---

## Recommended Project Structure (v2.0 additions)

```
meething/
├── public/
│   └── sw.js                                 # NEW — Service Worker entry
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── CalendarHub.tsx               # MODIFY — view mode toggle
│   │   │   ├── MeetingsList.tsx              # MODIFY — accept filtered meetings prop
│   │   │   ├── ViewModeToggle.tsx            # NEW — today/week switch
│   │   │   ├── ContextualGreeting.tsx        # NEW
│   │   │   ├── TodaysRhythmTimeline.tsx      # NEW
│   │   │   ├── WeeklyToneSummary.tsx         # NEW
│   │   │   └── WindDownPanel.tsx             # NEW
│   │   └── wellness/
│   │       └── AmbientBackground.tsx         # NEW (optional wrapper for CSS)
│   ├── hooks/
│   │   ├── useMeetings.ts                    # UNCHANGED (source of truth)
│   │   ├── useTodayMeetings.ts               # NEW — derived selector
│   │   ├── useWindDownState.ts               # NEW — "last meeting ended" detection
│   │   ├── usePushNotifications.ts           # NEW — SW subscription lifecycle
│   │   └── useContextualGreeting.ts          # NEW — greeting string derivation
│   ├── lib/
│   │   ├── rhythm.ts                         # NEW — pure timeline segment derivation
│   │   ├── greetings.ts                      # NEW — time-of-day copy
│   │   └── push.ts                           # NEW — VAPID key, SW registration helper
│   └── main.tsx                              # MODIFY — register SW on load
├── supabase/
│   ├── functions/
│   │   ├── send-push/                        # NEW Edge Function
│   │   │   └── index.ts
│   │   └── schedule-push/                    # NEW — cron-triggered dispatcher
│   │       └── index.ts
│   └── migrations/
│       └── NNNN_push_subscriptions.sql       # NEW — table for endpoints + keys
```

### Structure Rationale

- **Derived hooks (`useTodayMeetings`) instead of a second network call:** `useMeetings` already fetches the full 7-day window. Filtering happens in-memory via `useMemo`, so toggling today/week costs zero requests and stays in sync automatically.
- **`lib/rhythm.ts` as a pure module:** Timeline segment computation must be deterministic, testable, and free of React concerns. Keeping it in `lib/` mirrors the existing pattern (`lib/auth-schemas.ts`, `lib/wellness-quotes.ts`).
- **`public/sw.js` (not `src/`):** Vite serves `public/` as static root with no bundler transformation, which is exactly what Service Workers require (their scope is the serving path). Putting the SW in `src/` would cause it to be bundled and renamed with a hash, breaking scope registration.
- **Edge Functions stay thin:** `send-push` only wraps the Web Push protocol. Scheduling logic lives in `schedule-push` (cron) or is triggered from the existing `google-calendar-sync` flow.

---

## Architectural Patterns

### Pattern 1: Derived State via In-Memory Selectors

**What:** Instead of creating new TanStack Query hooks that re-fetch, derive views from the existing `useMeetings()` cache with `useMemo`.

**When to use:** Any time a new view needs a subset/transformation of meetings that are already in the 7-day window.

**Trade-offs:**
- Pro: Single source of truth; invalidation (e.g., after sync) automatically cascades.
- Pro: Zero extra requests; offline works as-is.
- Con: Doesn't scale past the 7-day window — if we ever need a month view, promote to a new query key.

**Example:**
```typescript
// src/hooks/useTodayMeetings.ts
import { useMemo } from "react";
import { useMeetings } from "./useMeetings";
import { isSameDay } from "date-fns";

export function useTodayMeetings() {
  const query = useMeetings();
  const today = useMemo(() => {
    const now = new Date();
    return (query.data ?? []).filter((m) =>
      isSameDay(new Date(m.start_time), now)
    );
  }, [query.data]);

  return { ...query, data: today };
}
```

### Pattern 2: View Mode as Local State, View Data as Derived

**What:** Keep the `today | week` toggle in `CalendarHub` component state. Render different child components based on the toggle, but all children consume the same upstream `useMeetings` hook (directly or via a derived selector).

**When to use:** Adding a view dimension to an existing component without refactoring routing or global state.

**Trade-offs:**
- Pro: No URL change required, no routing refactor, no provider plumbing.
- Pro: Extends the existing `activeTab` pattern line-for-line — reviewers recognize it.
- Con: View mode doesn't survive reload or deep links. Acceptable for v2.0; can be promoted to `useSearchParams` later (the pattern is already used in `CalendarHub` for `?tab=`).

**Example:**
```typescript
// CalendarHub.tsx (additive diff)
const [viewMode, setViewMode] = useState<"today" | "week">("today");

// In the overview tab render branch:
{activeTab === "overview" && (
  <>
    <ViewModeToggle value={viewMode} onChange={setViewMode} />
    <ContextualGreeting />
    {viewMode === "today" ? (
      <>
        <TodaysRhythmTimeline />
        <MeetingsList scope="today" />
        <WindDownPanel />
      </>
    ) : (
      <>
        <WeeklyToneSummary />
        <MeetingsList scope="week" />
      </>
    )}
  </>
)}
```

### Pattern 3: Pure Segment Derivation for Timeline

**What:** Timeline rendering is split into a pure function (`buildRhythmSegments(meetings, dayStart, dayEnd)`) that returns an array of `{ kind: "meeting" | "breathing-room", start, end, meeting? }` segments, and a dumb presentational component that renders them.

**When to use:** Whenever visual layout depends on a non-trivial transformation of data that you want to unit-test without React.

**Trade-offs:**
- Pro: Testable in isolation (no test framework today, but `rhythm.ts` is small enough to eyeball-verify).
- Pro: Component stays dumb — easy to restyle without logic churn.
- Con: Slight indirection; must remember to memoize the segments array.

**Example:**
```typescript
// src/lib/rhythm.ts
export type RhythmSegment =
  | { kind: "meeting"; start: Date; end: Date; meeting: Meeting }
  | { kind: "breathing-room"; start: Date; end: Date };

export function buildRhythmSegments(
  meetings: Meeting[],
  dayStart: Date,
  dayEnd: Date
): RhythmSegment[] {
  // Sorted by start_time; interleave gaps as breathing-room segments.
  // Pure — no Date.now() reads, no side effects.
}
```

### Pattern 4: Service Worker as a Dumb Receiver

**What:** The SW only knows how to receive a `push` event and call `self.registration.showNotification`. It does NOT know about users, schedules, or meetings. All business logic lives in the Edge Function that *sends* the push.

**When to use:** Web Push integration where the server already has user/meeting context.

**Trade-offs:**
- Pro: SW stays tiny (~30 lines), never needs a rebuild when logic changes.
- Pro: No auth in the SW — it trusts the push payload as signed-at-source by the server.
- Con: Server must pre-compute notification content (title, body, icon) on each dispatch.

**Example:**
```javascript
// public/sw.js
self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "MeeThing", {
      body: payload.body,
      icon: "/favicon.ico",
      tag: payload.tag,
      data: { url: payload.url ?? "/calendar" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## Answers to the Specific Integration Questions

### Q1: Where does the Service Worker live in Vite, and how does it integrate with Supabase Edge Functions?

**File location:** `public/sw.js` — Vite copies `public/` to the build root untouched. Do **not** put the SW in `src/` (Vite would bundle and hash it, breaking scope).

**Registration:** In `src/main.tsx`, after `ReactDOM.createRoot(...).render(...)`:
```typescript
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
```
Using `import.meta.env.BASE_URL` matches the existing pattern in `useBackground.tsx` and `App.tsx`, so the SW works if the app is deployed under a subpath.

**Subscription flow (client):**
1. `usePushNotifications` hook calls `navigator.serviceWorker.ready`.
2. `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`.
3. Insert the returned `PushSubscription` (endpoint + p256dh + auth keys) into a new `push_subscriptions` table via the Supabase client (RLS-guarded by `user_id = auth.uid()`).

**Dispatch flow (server):**
1. A cron-triggered Edge Function (`schedule-push`) or a trigger from `google-calendar-sync` queries upcoming meetings + user push prefs.
2. For each user + scheduled moment, calls a second Edge Function `send-push` (or inlines it).
3. `send-push` uses a Deno-compatible Web Push library (verify current Deno ecosystem at implementation time — **MEDIUM confidence**, flag for phase research).
4. VAPID keys stored as Supabase Function secrets (`supabase secrets set VAPID_PRIVATE_KEY=...`). Public key exposed via `VITE_VAPID_PUBLIC_KEY` env.

**Why not supabase-js Realtime instead?** Realtime requires an open tab. Web Push works when the app is closed, which is a non-negotiable for "wind-down view" and breathing reminders — the whole point is the user isn't staring at MeeThing.

### Q2: How should the today/week toggle integrate with CalendarHub without a refactor?

**Minimum-diff approach (recommended):**
1. Add `const [viewMode, setViewMode] = useState<"today" | "week">("today");` next to the existing `activeTab` state at line 22 of `CalendarHub.tsx`.
2. Inside the `activeTab === "overview"` branch (line 144), insert `<ViewModeToggle value={viewMode} onChange={setViewMode} />` above `<MeetingsList />`.
3. Pass `scope={viewMode}` as a new prop to `MeetingsList`, which internally swaps between `useMeetings()` and `useTodayMeetings()`.
4. Conditionally render the new companion components (`TodaysRhythmTimeline`, `ContextualGreeting`, etc.) based on `viewMode`.

**What you explicitly don't need to do:**
- No routing changes — no `/today` vs `/week` split.
- No provider — view mode is local to `CalendarHub` and its descendants.
- No `useMeetings` signature change — `useTodayMeetings` is additive.
- No MeetingsList rewrite — it accepts a new optional `scope` prop that defaults to existing behavior.

**Future promotion path (defer to after v2.0):** If the toggle needs to survive reload / be deep-linkable, swap `useState` for `useSearchParams` (already imported in `CalendarHub.tsx` for the `?tab=` param). Zero other changes required.

### Q3: How should Today's Rhythm timeline derive its data?

**Data flow:**
```
useMeetings() (existing, 7-day cache)
    │
    ▼
useTodayMeetings() (new, memoized filter)
    │
    ▼
buildRhythmSegments(meetings, dayStart, dayEnd) (pure, in lib/rhythm.ts)
    │
    ▼
TodaysRhythmTimeline (presentational, renders segments)
```

**Key decisions:**
- **Day boundaries:** Compute `dayStart = startOfDay(new Date())` and `dayEnd = endOfDay(new Date())` using `date-fns` (already a dependency — see `MeetingsList.tsx` imports).
- **Segment types:** `meeting` (opaque block, use existing `providerColor`) and `breathing-room` (translucent block, gets the glassmorphism treatment). Sort by `start_time`, walk the list, emit a breathing-room segment whenever there's a gap > 0 minutes.
- **Edge cases to handle in `rhythm.ts`:**
  - First meeting doesn't start at `dayStart` → leading breathing-room segment from `dayStart` to first meeting.
  - Last meeting doesn't end at `dayEnd` → trailing breathing-room segment.
  - Overlapping meetings → do not collapse; render in parallel rows (v2.1 concern, punt in v2.0 with a naive "clip to latest end" behavior and a console.warn).
  - Meetings crossing midnight → clip to `[dayStart, dayEnd]` for the today view.
- **Rendering:** Use CSS Grid with `grid-template-columns: repeat(N, 1fr)` where N is total minutes in the day, and `grid-column: span MINUTES` per segment. Pure CSS, no D3/chart lib.
- **Re-computation:** `useMemo` on `[meetings, dayStart.getTime()]`. The `dayStart` changes across midnight; if the user has the tab open at midnight, the timeline is stale until next render. Acceptable for v2.0 — document as known limitation. Fix later with a `useEffect` that sets a timeout to the next midnight.

### Q4: Where does wind-down state live?

**Recommendation: custom hook (`useWindDownState`) — not component state, not URL param.**

**Why not component state:**
- Multiple components need the same answer ("last meeting ended" is read by `WindDownPanel` *and* possibly by `ContextualGreeting` to switch its copy). Duplicating the logic in each component risks drift.

**Why not URL param:**
- Wind-down is a *derived* state, not a user-selected mode. Putting it in the URL would let the user force-enter wind-down by editing the URL, which is meaningless (the meetings array drives it).
- A URL param would need keeping in sync with the meetings data via `useEffect`, which is exactly the anti-pattern to avoid.

**Why a hook:**
- Derived from `useTodayMeetings()` (already cached).
- Encapsulates the time-sensitivity: the answer changes when the clock passes the last meeting's `end_time`, which requires a timer.
- Returns a simple boolean + the last meeting for display.

**Implementation sketch:**
```typescript
// src/hooks/useWindDownState.ts
export function useWindDownState() {
  const { data: meetings = [] } = useTodayMeetings();
  const [now, setNow] = useState(() => Date.now());

  // Tick every minute so the transition fires without a reload.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const lastMeeting = meetings[meetings.length - 1];
  const isWindDown =
    meetings.length > 0 &&
    lastMeeting &&
    new Date(lastMeeting.end_time).getTime() < now;

  return { isWindDown, lastMeeting };
}
```

**Rendering contract:** `WindDownPanel` returns `null` when `!isWindDown`. `CalendarHub` unconditionally renders `<WindDownPanel />` in the today branch — the panel self-gates.

---

## Data Flow

### Today View Render Path

```
Calendar.tsx
  └─> (wraps in ambient background layer)
      └─> CalendarHub
            ├─ useMeetings()  ─────────────────┐
            │                                   │ (shared cache)
            ├─ useTodayMeetings() ─┐            │
            │                       ▼            │
            │               [filtered meetings]  │
            │                       │            │
            ├─ ContextualGreeting ◄─┤            │
            ├─ TodaysRhythmTimeline ┤            │
            │    └─ buildRhythmSegments()       │
            ├─ MeetingsList (scope="today") ◄───┤
            └─ WindDownPanel ◄──────┘            │
                                                 │
          (viewMode === "week" path) ◄───────────┘
            ├─ WeeklyToneSummary
            └─ MeetingsList (scope="week")
```

### Push Notification Flow

```
[User enables notifications in Settings]
        │
        ▼
usePushNotifications.subscribe()
        │
        ├─> navigator.serviceWorker.register('/sw.js')
        ├─> registration.pushManager.subscribe(VAPID_PUBLIC)
        └─> supabase.from('push_subscriptions').insert({ user_id, endpoint, keys })

[Later — server-initiated]
        │
Cron / Meeting-start trigger
        │
        ▼
Edge Function: schedule-push
        ├─> Read upcoming meetings + user push prefs
        ├─> For each due notification:
        │       └─> Edge Function: send-push
        │               └─> Web Push library → push service → browser
        │                                                      │
        │                                                      ▼
        │                                              sw.js 'push' event
        │                                                      │
        │                                                      ▼
        │                                         showNotification()
```

### State Management

```
TanStack Query (server cache)
   ├─ ["meetings", user.id]  ← useMeetings() — source of truth
   ├─ ["calendar-connections", user.id]
   └─ ["user-settings", user.id]

React Context
   └─ AuthContext (user, profile)

Component State (useState)
   ├─ CalendarHub.activeTab
   ├─ CalendarHub.viewMode  (NEW)
   └─ Local UI state per component

Derived Hooks (in-memory, no network)
   ├─ useTodayMeetings()      → filters useMeetings
   ├─ useWindDownState()      → derives from useTodayMeetings + clock tick
   └─ useContextualGreeting() → derives from AuthContext + useTodayMeetings

localStorage
   └─ calendar-background (existing)

IndexedDB / SW storage
   └─ (not needed for v2.0 — SW is stateless)
```

---

## Recommended Build Order

Ordered to minimize merge conflicts on `CalendarHub.tsx` (the bottleneck file) and to land pure logic first:

1. **`lib/rhythm.ts` + `lib/greetings.ts`** — Pure functions, zero React, no file conflicts with anything. Land first, review in isolation.
2. **`useTodayMeetings` + `useContextualGreeting` + `useWindDownState`** — Hooks, additive files, no existing file touched.
3. **`ContextualGreeting`, `TodaysRhythmTimeline`, `WindDownPanel`, `WeeklyToneSummary` components** — All new files. Can be built against mock data on a scratch route temporarily.
4. **`ViewModeToggle` component** — New file.
5. **`CalendarHub.tsx` integration (one PR)** — Single focused change: add `viewMode` state, wire up new components, add `scope` prop pass-through to `MeetingsList`. This is the one file that must be touched carefully because other in-flight work might collide.
6. **`MeetingsList.tsx` scope prop** — Small additive change. Could be rolled into step 5 if timing is tight.
7. **Ambient breathing background** — CSS-only change in `index.css` + one line in `Calendar.tsx`. Independent of the rest, can ship in parallel at any time.
8. **Second typeface** — `index.html` `<link>` + CSS class additions in `index.css`. Fully independent.
9. **Push notifications (separate track)**
   - 9a. `public/sw.js` + SW registration in `main.tsx`.
   - 9b. `push_subscriptions` migration.
   - 9c. `usePushNotifications` hook + Settings UI wiring.
   - 9d. `send-push` Edge Function + VAPID secret configuration.
   - 9e. `schedule-push` Edge Function / cron trigger.
   - Push work can run in parallel with UI work (different files, different review scopes).

**Critical ordering constraint:** Steps 1–4 and 6 can land independently. Step 5 is the only step that edits `CalendarHub.tsx`; serialize it last to avoid conflicts.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current architecture is sufficient. Derived hooks + Edge Functions scale linearly with user count. |
| 1k–100k users | Push dispatch becomes the bottleneck — `schedule-push` must move from "scan all users per tick" to "indexed query for users with due notifications in next N minutes". Consider a `next_notification_at` indexed column on `push_subscriptions`. |
| 100k+ users | Push dispatch moves to a proper queue (e.g., separate worker reading from a `push_queue` table). Consider sharding by `user_id` hash. |

### Scaling Priorities

1. **First bottleneck:** Edge Function cold starts for push dispatch (Deno cold start ~50-200ms). Mitigate by batching: one invocation handles all due notifications in the next 5-minute window.
2. **Second bottleneck:** The 7-day meetings query once users have 50+ meetings per week. Add a composite index on `(user_id, start_time)` in the `meetings` table if not already present (verify at implementation time).

---

## Anti-Patterns

### Anti-Pattern 1: Creating a Second TanStack Query for Today's Meetings

**What people do:** Write `useTodayMeetings` as a new `useQuery({ queryKey: ["meetings-today"], ... })` that re-fetches with a narrower date range.
**Why it's wrong:** Duplicates the network call, doubles the cache, forces manual invalidation coordination with `useMeetings`, breaks "source of truth" guarantee, and regresses offline behavior.
**Do this instead:** Derive from `useMeetings` with `useMemo`. The full 7-day window is already there — filtering in memory is free.

### Anti-Pattern 2: Putting the Service Worker in `src/`

**What people do:** Create `src/sw.ts` and import it from `main.tsx` expecting Vite to bundle it.
**Why it's wrong:** Vite hashes the output filename and places it under `assets/`, breaking SW scope (which must cover the app's serving path). Even with `vite-plugin-pwa`, the SW must end up at a stable, root-scoped URL.
**Do this instead:** Plain `public/sw.js`, registered with an absolute path. If bundling/typing the SW is desired later, adopt `vite-plugin-pwa` explicitly — but that's a separate decision.

### Anti-Pattern 3: Wind-Down State in URL or Global Context

**What people do:** Add a `?mode=wind-down` param or a `WindDownContext` provider.
**Why it's wrong:** Wind-down is *derived* from meetings + clock, not user-selected. URL/context adds a source of truth that will drift from the data it's supposed to reflect.
**Do this instead:** A hook that computes the boolean on every render based on the current time. Cheap, always correct.

### Anti-Pattern 4: Letting the SW Know About Users or Schedules

**What people do:** Store user auth or meeting data in SW IndexedDB to "schedule notifications client-side."
**Why it's wrong:** Breaks when the browser evicts storage, requires re-auth logic in the SW, and duplicates logic the server already has.
**Do this instead:** Server decides when to push. SW only renders what it receives.

### Anti-Pattern 5: Nesting the Timeline Computation Inside `TodaysRhythmTimeline`

**What people do:** Inline the segment-building loop in the JSX component.
**Why it's wrong:** Component becomes a mix of logic + layout, untestable without mounting React, and re-computes on every render unless carefully memoized.
**Do this instead:** `lib/rhythm.ts` pure function, called once inside `useMemo` at the component top.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Web Push Service (browser vendor) | Via `PushManager.subscribe()` → endpoint URL. Server sends via Web Push protocol with VAPID auth. | Endpoints are per-browser-per-device. Expected to rotate — handle 410 Gone by deleting the row. |
| Supabase Edge Functions (Deno) | Existing pattern — `supabase.functions.invoke('name')`. Already used for `google-calendar-sync`. | Check VAPID/Web Push library availability in Deno ecosystem at implementation time (MEDIUM confidence — flag for phase research). |
| Google Fonts | `<link>` in `index.html`. | Preferred over `@import` in CSS — parallelizable, avoids render-blocking CSS. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `useMeetings` ↔ `useTodayMeetings` | Direct call — `useTodayMeetings` wraps `useMeetings`. | Preserve the entire query result shape; only mutate `data`. |
| `CalendarHub` ↔ new companion components | Props (minimal) + hooks (for data). | Children consume hooks directly; parent passes only UI concerns (e.g., view mode). |
| Client ↔ Service Worker | SW is registered once globally. Hooks interact via `navigator.serviceWorker.ready`. | No message passing needed for v2.0 — SW is fire-and-forget for notifications. |
| Edge Function ↔ PostgreSQL | Supabase service-role client inside Edge Function; RLS bypassed. | Standard pattern — see existing `google-calendar-sync`. |
| `schedule-push` ↔ `send-push` | HTTP call or direct import (inline the push dispatch for v2.0 simplicity). | Resist over-decomposition until there's a real reason. |

---

## Confidence & Open Questions

**HIGH confidence:**
- Service Worker file placement in `public/` for Vite — well-documented Vite behavior.
- Derived state from TanStack Query cache via `useMemo` — standard TanStack pattern.
- View mode as local state pattern — matches existing `activeTab` pattern in the same file.
- Wind-down as a hook — principled derivation from meetings + clock.

**MEDIUM confidence (flag for phase-specific research):**
- Specific Web Push library for Deno Edge Functions. The ecosystem shifted from `npm:web-push` shims to Deno-native packages; verify current options at implementation time.
- VAPID key management in Supabase — specifically whether Function secrets can be rotated without redeploying.
- Behavior of `pushManager.subscribe()` on iOS Safari PWA — iOS supports Web Push as of 16.4+ but only for installed PWAs. Document this limitation in the UI (desktop + Android full support; iOS requires "Add to Home Screen").

**LOW confidence:**
- None — all architectural decisions are derivable from the existing codebase shape.

**Deferred decisions (intentionally not covered in v2.0):**
- Overlapping meeting rendering in the timeline (v2.1).
- Multi-day timeline / week rhythm view (v2.1).
- Notification preference granularity per meeting type (v2.1).

---

## Sources

- Existing codebase: `src/App.tsx`, `src/pages/Calendar.tsx`, `src/components/calendar/CalendarHub.tsx`, `src/components/calendar/MeetingsList.tsx`, `src/hooks/useMeetings.ts`, `src/hooks/useBackground.tsx`, `supabase/functions/` (HIGH confidence — direct read).
- Existing dependency set: `date-fns`, `@tanstack/react-query`, `react-router-dom` v6 — confirmed from existing imports.
- Vite `public/` directory convention — standard Vite behavior.
- Web Push + VAPID protocol — W3C standard, stable since 2018.
- Supabase Edge Functions (Deno runtime) — used elsewhere in project (`google-calendar-sync`).

---
*Architecture research for: MeeThing v2.0 Companion Experience*
*Researched: 2026-04-04*
