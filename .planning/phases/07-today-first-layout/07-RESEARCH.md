# Phase 7: Today-First Layout - Research

**Researched:** 2026-04-07
**Domain:** React SPA view toggling with URL-persisted state (React Router 6 + TanStack Query)
**Confidence:** HIGH

## Summary

Phase 7 transforms MeeThing's calendar view from a 7-day default to a today-first experience. The core change is straightforward: a `?view=today|week` URL search parameter controls which meetings are displayed, defaulting to `today`. The existing `useMeetings` hook fetches a 7-day window from Supabase; the today-only view filters client-side from that same cache, requiring no new API calls. A dedicated `useTodayMeetings` hook provides a stable today-only dataset for all companion features (greeting, rhythm, wind-down in Phases 9-10).

The technical surface is small and well-bounded. React Router 6's `useSearchParams` is already imported in `CalendarHub.tsx` (used for the `?tab` param). The `date-fns` library (already at v3.6.0) provides `isToday`, `startOfDay`, and `endOfDay` for date filtering. No new dependencies are needed.

**Primary recommendation:** Create a `useViewMode` hook that reads/writes `?view` from URL search params, a `useTodayMeetings` hook that filters the existing `useMeetings` cache to today-only, and update `CalendarHub` + `MeetingsList` to render conditionally based on view mode.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TODAY-01 | App defaults to a today-only view when the user opens the calendar; all companion features derive from this today context | `useViewMode` hook defaults to `"today"`; `useTodayMeetings` hook provides stable today-only data for downstream phases |
| TODAY-02 | User can toggle between today-only and full week view; the selected view mode persists in the URL (`?view=today` or `?view=week`) so browser back/forward and sharing work correctly | React Router 6 `useSearchParams` already in use; toggle component writes to URL; `replace: true` for toggle to avoid polluting history |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack:** React 18, React Router 6, TanStack Query, shadcn-ui + Tailwind CSS
- **Path alias:** `@/` maps to `src/`
- **No test framework:** Linting is the only automated quality check
- **Quality command:** `npm run lint`
- **Design system:** Glassmorphism utilities (`.glass-panel`, `.glass-light`), custom animations, wellness/nature color palette
- **Copy glossary:** All new UI text must use `COPY` from `@/copy/glossary` (Phase 6 decision)

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | 6.27.0 | URL search param persistence (`useSearchParams`) | Already in use in CalendarHub for `?tab` param [VERIFIED: node_modules] |
| date-fns | 3.6.0 | Date filtering (`isToday`, `startOfDay`, `endOfDay`) | Already used throughout MeetingsList and useBreathingReminder [VERIFIED: node_modules] |
| @tanstack/react-query | 5.59.16 | Meeting data cache; `useTodayMeetings` derives from same `["meetings"]` query key | Already powers `useMeetings` hook [VERIFIED: node_modules] |

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.462.0 | Icons for the today/week toggle | Already used for Calendar, RefreshCw icons [VERIFIED: package.json] |
| @radix-ui/react-toggle-group | 1.1.0 | Backs shadcn ToggleGroup component for view toggle | `src/components/ui/toggle-group.tsx` already exists [VERIFIED: glob] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL search params (`?view=`) | localStorage | URL params are better: survives refresh, supports sharing, works with back/forward. localStorage is invisible and unshareable |
| Client-side filter of 7-day cache | Separate Supabase query for today | Unnecessary network call; the 7-day window is already fetched and small |
| `react-router` `useSearchParams` | Manual `window.location` manipulation | useSearchParams integrates with React lifecycle and history stack |

**Installation:** None needed -- all dependencies already present.

## Architecture Patterns

### New Files

```
src/
├── hooks/
│   ├── useViewMode.ts          # NEW: reads/writes ?view param, defaults to "today"
│   └── useTodayMeetings.ts     # NEW: filters useMeetings to today-only
├── components/calendar/
│   └── ViewToggle.tsx           # NEW: today/week toggle button group
└── copy/
    └── glossary.ts              # MODIFIED: add view toggle labels
```

### Modified Files

```
src/
├── components/calendar/
│   ├── CalendarHub.tsx          # MODIFIED: integrate ViewToggle, pass viewMode
│   └── MeetingsList.tsx         # MODIFIED: accept viewMode prop, filter display
└── copy/
    └── glossary.ts              # MODIFIED: add toggle copy keys
```

### Pattern 1: useViewMode Hook (URL-Persisted View State)

**What:** A custom hook that encapsulates `useSearchParams` for the `?view` parameter with a default of `"today"`.
**When to use:** Any component that needs to read or change the current view mode.

```typescript
// Source: React Router 6 useSearchParams API [VERIFIED: codebase already uses this pattern in CalendarHub.tsx]
import { useSearchParams } from "react-router-dom";

type ViewMode = "today" | "week";

export function useViewMode() {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode: ViewMode =
    searchParams.get("view") === "week" ? "week" : "today";

  const setViewMode = (mode: ViewMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === "today") {
          next.delete("view"); // "today" is default, keep URL clean
        } else {
          next.set("view", mode);
        }
        return next;
      },
      { replace: true } // toggle should replace, not push new history entries
    );
  };

  return { viewMode, setViewMode } as const;
}
```

**Key design decision:** `?view=today` is the default, so we can omit it from the URL entirely (clean URLs). Only `?view=week` appears in the URL. When the param is absent or any value other than `"week"`, it resolves to `"today"`. [ASSUMED]

### Pattern 2: useTodayMeetings Hook (Derived Today-Only Data)

**What:** A hook that filters the existing `useMeetings` 7-day cache to today-only meetings. This hook exists independently of the view toggle so companion features (greeting, rhythm, wind-down) always have today-only data.
**When to use:** Phase 9 greeting, Phase 9 rhythm timeline, Phase 10 wind-down -- all consume this hook regardless of whether the user is viewing today or week.

```typescript
// Source: date-fns isToday [VERIFIED: date-fns 3.6.0 installed]
import { useMeetings } from "./useMeetings";
import { isToday } from "date-fns";

export function useTodayMeetings() {
  const query = useMeetings();

  const todayMeetings = (query.data ?? []).filter((meeting) =>
    isToday(new Date(meeting.start_time))
  );

  return {
    ...query,
    data: todayMeetings,
    allMeetings: query.data, // preserve access to full week if needed
  };
}
```

**Critical constraint (SUCCESS CRITERION 3):** This hook is ALWAYS filtered to today. It does not accept a viewMode parameter. The greeting, rhythm, and wind-down features consume `useTodayMeetings`, never `useMeetings` directly. [VERIFIED: requirement TODAY-01 and success criterion 3]

### Pattern 3: ViewToggle Component (shadcn Toggle Group)

**What:** A small toggle UI for switching between today and week views.
**When to use:** Rendered in CalendarHub's header area.

The project has `@radix-ui/react-toggle-group` (v1.1.0) installed and the shadcn `ToggleGroup` component already exists at `src/components/ui/toggle-group.tsx`. [VERIFIED: package.json + glob]

```typescript
// Using shadcn ToggleGroup pattern [VERIFIED: src/components/ui/toggle-group.tsx exists]
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Compact two-option toggle inside a glass pill
<ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
  <ToggleGroupItem value="today">{COPY.view.today}</ToggleGroupItem>
  <ToggleGroupItem value="week">{COPY.view.week}</ToggleGroupItem>
</ToggleGroup>
```

### Pattern 4: MeetingsList View-Aware Rendering

**What:** MeetingsList accepts a `viewMode` prop and filters its display accordingly. The header text changes ("Today's meetings" vs "This week's meetings").
**When to use:** CalendarHub passes `viewMode` down to MeetingsList.

```typescript
// MeetingsList receives viewMode and filters display
interface MeetingsListProps {
  viewMode: "today" | "week";
}

const MeetingsList = ({ viewMode }: MeetingsListProps) => {
  const { data: meetings = [], isLoading, error, refetch } = useMeetings();

  const displayMeetings = viewMode === "today"
    ? meetings.filter((m) => isToday(new Date(m.start_time)))
    : meetings;
  // ... render displayMeetings
};
```

### Anti-Patterns to Avoid

- **Separate API calls for today vs. week:** The 7-day window is already fetched. Filtering client-side from the same cache is cheaper and avoids cache invalidation complexity. [VERIFIED: useMeetings already fetches 7-day window]
- **Storing viewMode in React state instead of URL:** Breaks back/forward, refresh, and link sharing. The URL IS the state. [VERIFIED: requirement TODAY-02 specifies URL persistence]
- **Using `push` instead of `replace` for toggle changes:** Toggling back and forth would pollute the browser history stack. Use `{ replace: true }`. [ASSUMED -- standard UX practice]
- **Coupling useTodayMeetings to viewMode:** The today hook must always return today-only data regardless of which view is active. This is critical for Phases 9-10.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL state management | Custom URL parser/writer | `useSearchParams` from react-router-dom | Already in use, handles encoding, integrates with React lifecycle [VERIFIED: CalendarHub.tsx line 28] |
| Date "is today" check | Manual date comparison | `isToday()` from date-fns | Handles timezone edge cases, midnight boundaries [VERIFIED: date-fns 3.6.0 installed] |
| Toggle UI | Custom radio buttons | shadcn ToggleGroup (Radix) | Already installed and component exists at `src/components/ui/toggle-group.tsx` [VERIFIED: glob] |

**Key insight:** This phase adds zero new dependencies. Everything needed is already in the project.

## Common Pitfalls

### Pitfall 1: searchParams.get("view") Conflict with Existing ?tab Param
**What goes wrong:** CalendarHub already uses `useSearchParams` for a `?tab` parameter (line 28, 42-44). Setting `?view` could accidentally clear `?tab` or vice versa.
**Why it happens:** `setSearchParams({})` replaces ALL params. The existing code does `setSearchParams({}, { replace: true })` on mount which would wipe `?view`.
**How to avoid:** Use the callback form of `setSearchParams` that receives `prev` params and only modifies the target key. The existing `?tab` cleanup in `useEffect` (lines 41-45) must be updated to preserve `?view`.
**Warning signs:** View mode resets to today after first render; `?view=week` disappears from URL on mount.

### Pitfall 2: isToday Timezone Edge Case
**What goes wrong:** `isToday()` from date-fns uses the browser's local timezone. Meetings stored in UTC could appear as "tomorrow" near midnight.
**Why it happens:** `meeting.start_time` is stored as ISO 8601 UTC in Supabase. `isToday(new Date("2026-04-07T23:30:00Z"))` returns false in UTC-5 at 7 PM but true in UTC+0.
**How to avoid:** This is actually correct behavior -- `isToday` comparing against the user's local time is what users expect. A meeting at 11:30 PM UTC that is 7:30 PM local time SHOULD show as today. No special handling needed.
**Warning signs:** Only a concern if the app ever switches to server-side rendering with a fixed timezone.

### Pitfall 3: Layout Shift on View Toggle (CLS)
**What goes wrong:** Switching from week (many meetings) to today (fewer meetings) causes the content area to jump/resize, which is jarring.
**Why it happens:** The glass-panel container resizes based on content height.
**How to avoid:** Use `min-height` on the content container so switching views doesn't cause the panel to collapse. The existing `animate-scale-in` class may need to be conditional (only on initial load, not on toggle).
**Warning signs:** Visual "jump" when toggling, content above the fold shifting.

### Pitfall 4: Scroll Position Loss on Toggle
**What goes wrong:** Success criterion 4 requires scroll position preservation. Switching views remounts the meeting list, losing scroll.
**Why it happens:** React unmounts and remounts when the filtered list changes.
**How to avoid:** Keep a single MeetingsList instance that receives filtered data as a prop, not two conditional branches. Save `scrollY` before toggle and restore after render with `requestAnimationFrame`.
**Warning signs:** Page jumps to top on toggle.

### Pitfall 5: Empty State Confusion -- Today vs. Week
**What goes wrong:** User has meetings this week but none today. In today view, they see "A spacious day" (NoMeetingsEmpty). That's correct. But they might think their calendar is broken.
**Why it happens:** The empty state copy doesn't distinguish between "no meetings today" and "no meetings at all."
**How to avoid:** The today-view empty state should hint that there are meetings later in the week (if there are). Add a subtle "You have X meetings this week" or a link to switch to week view.
**Warning signs:** Users disconnecting and reconnecting their calendar thinking sync is broken.

### Pitfall 6: useBreathingReminder Consuming Full Week Data
**What goes wrong:** The breathing reminder currently receives `meetings` (7-day array) from CalendarHub. This is correct -- breathing reminders should fire for ALL upcoming meetings, not just today's.
**Why it happens:** Not a bug, but a design consideration. The breathing reminder must continue receiving the full `useMeetings()` data.
**How to avoid:** Do NOT pass `useTodayMeetings` to `useBreathingReminder`. It must keep receiving the full week array.
**Warning signs:** Breathing reminders stop firing for tomorrow's first meeting when the user is still awake at 11:50 PM.

## Code Examples

### Existing useSearchParams Usage in CalendarHub (reference for integration)

```typescript
// Source: src/components/calendar/CalendarHub.tsx lines 28, 41-45 [VERIFIED: codebase]
const [searchParams, setSearchParams] = useSearchParams();

// Current ?tab cleanup -- MUST be updated to preserve ?view
useEffect(() => {
  if (searchParams.get("tab")) {
    setSearchParams({}, { replace: true }); // <-- THIS WIPES ALL PARAMS
  }
}, []);
```

The `setSearchParams({}, { replace: true })` on line 43 is a hazard. It must be changed to only delete the `tab` key, preserving `view`:

```typescript
useEffect(() => {
  if (searchParams.get("tab")) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("tab");
      return next;
    }, { replace: true });
  }
}, []);
```

### date-fns isToday for Filtering

```typescript
// Source: date-fns v3 API [VERIFIED: date-fns 3.6.0 installed, isToday is a top-level export]
import { isToday } from "date-fns";

const todayMeetings = meetings.filter((m) => isToday(new Date(m.start_time)));
```

### Existing ToggleGroup Component

```typescript
// src/components/ui/toggle-group.tsx already exists [VERIFIED: glob]
// Import directly -- no generation step needed
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useHistory` + manual URL parsing (React Router 5) | `useSearchParams` (React Router 6) | React Router 6 (2021) | Declarative, integrates with React state |
| `moment.js` isToday | `date-fns` isToday (tree-shakeable) | date-fns v2+ (2019) | Smaller bundle, no mutation |

**Deprecated/outdated:**
- `useHistory()` from React Router 5 -- replaced by `useNavigate` and `useSearchParams` in v6

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Clean URLs: omit `?view` param when value is "today" (the default) | Pattern 1 | Low -- if user shares a URL without `?view`, it defaults to today which is the intended behavior. Can always add explicit `?view=today` instead |
| A2 | Toggle should use `replace: true` not `push` to avoid history pollution | Pattern 1, Anti-Patterns | Low -- standard UX convention; if users want back-button toggle, switch to push |

## Open Questions

1. **Should `?view=today` be explicit or omitted in URLs?**
   - What we know: The default is "today". Omitting keeps URLs clean (`/calendar` vs `/calendar?view=today`).
   - What's unclear: Whether link-sharing UX benefits from an explicit `?view=today` for clarity.
   - Recommendation: Omit for clean URLs. `/calendar` = today, `/calendar?view=week` = week. This is simpler.

2. **Does the MeetingsList header text need glossary entries?**
   - What we know: The current header says "Upcoming Meetings" / "Your next 7 days of events" -- these are Phase 6 leftover inline strings (flagged in P03 audit as borderline).
   - What's unclear: Whether to add today/week header variants to the glossary now or defer to Phase 9.
   - Recommendation: Add to glossary now. Phase 7 needs view-specific headers ("Today's meetings" vs "This week's meetings") and these should go through the glossary.

3. **Should the today-view empty state mention week meetings?**
   - What we know: Success criterion says no layout flicker, but says nothing about contextual empty states.
   - What's unclear: Whether "A spacious day" is sufficient or if "A spacious day -- you have 3 meetings this week" is better UX.
   - Recommendation: Add a subtle week-meeting count to the today-view empty state to prevent confusion.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no test framework configured) |
| Config file | none |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TODAY-01 | Default view is today | manual-only | Visual: open `/calendar`, verify today view | N/A |
| TODAY-02 | Toggle persists in URL, survives refresh/back/forward | manual-only | Visual: toggle, refresh, check URL and view state | N/A |

**Justification for manual-only:** No test framework is configured per CLAUDE.md. Linting validates syntax/type correctness. View behavior requires browser interaction.

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint && npm run build`
- **Phase gate:** Full lint + build green before `/gsd-verify-work`

### Wave 0 Gaps
None -- no test infrastructure to set up. Linting is the only automated check.

## Security Domain

This phase involves no authentication changes, no data access changes, no new API calls, and no user input handling beyond a URL parameter that is validated against a whitelist (`"today"` | `"week"`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | -- |
| V3 Session Management | no | -- |
| V4 Access Control | no | -- |
| V5 Input Validation | yes (minimal) | URL param validated against whitelist; unknown values default to "today" |
| V6 Cryptography | no | -- |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| URL parameter injection (`?view=<script>`) | Tampering | Whitelist validation: only "week" is recognized, everything else defaults to "today" |

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/components/calendar/CalendarHub.tsx`, `src/hooks/useMeetings.ts`, `src/components/calendar/MeetingsList.tsx`, `src/copy/glossary.ts`
- Installed package versions verified via `node_modules/*/package.json`: react-router-dom 6.27.0, date-fns 3.6.0, @tanstack/react-query 5.59.16
- `package.json` dependency list for @radix-ui/react-toggle-group presence
- `src/components/ui/toggle-group.tsx` existence verified via glob

### Secondary (MEDIUM confidence)
- React Router 6 `useSearchParams` API -- well-documented, stable since v6.0 [ASSUMED: API shape from training data, but already verified in use in CalendarHub.tsx]
- date-fns `isToday` -- standard utility, verified installed [VERIFIED: package.json, imported elsewhere in codebase]

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed and in use; zero new packages
- Architecture: HIGH -- patterns derived directly from existing codebase conventions (useSearchParams in CalendarHub, useMeetings hook, date-fns usage)
- Pitfalls: HIGH -- identified through direct codebase inspection (the `setSearchParams({})` wipe on line 43 is a verified real hazard)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable -- no fast-moving dependencies)
