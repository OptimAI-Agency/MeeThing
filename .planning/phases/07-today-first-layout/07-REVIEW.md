---
phase: 07-today-first-layout
reviewed: 2026-04-07T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/hooks/useViewMode.ts
  - src/hooks/useTodayMeetings.ts
  - src/components/calendar/ViewToggle.tsx
  - src/copy/glossary.ts
  - src/components/calendar/CalendarHub.tsx
  - src/components/calendar/MeetingsList.tsx
  - src/components/calendar/EmptyStates.tsx
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-04-07
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Seven files from the today-first layout phase were reviewed. The new hook infrastructure (`useViewMode`, `useTodayMeetings`) and `ViewToggle` component are clean. The main concerns are: one critical unguarded `javascript:` injection vector in `MeetingsList`, an uninterpolated placeholder string in the glossary that will render raw `{count}` tokens to users, and a complete component duplication in `EmptyStates`. `CalendarHub` also has a minor exhaustive-deps lint suppression and a redundant data subscription.

---

## Critical Issues

### CR-01: Unvalidated `htmlLink` used as anchor `href` — potential `javascript:` injection

**File:** `src/components/calendar/MeetingsList.tsx:129`

**Issue:** `meeting.metadata` is cast to `Record<string, unknown>`, making `htmlLink` typed as `unknown`. This value is passed directly as the `href` attribute of an `<a>` tag without any protocol validation. If a synced calendar event contains a `htmlLink` value beginning with `javascript:`, clicking "Open" will execute arbitrary JavaScript in the user's browser. Because this data originates from an external OAuth source (Google Calendar API), a malicious or misconfigured event could supply such a value.

```tsx
// Current — unsafe
<a href={(meeting.metadata as Record<string, unknown> | null).htmlLink} ...>
```

**Fix:** Validate that the URL uses a safe protocol before rendering the link, and narrow the type:

```tsx
function getSafeHref(metadata: Record<string, unknown> | null): string | null {
  const link = metadata?.htmlLink;
  if (typeof link !== "string") return null;
  try {
    const url = new URL(link);
    if (url.protocol === "https:" || url.protocol === "http:") return link;
  } catch {
    // not a valid URL
  }
  return null;
}

// In the render:
const safeHref = getSafeHref(meeting.metadata as Record<string, unknown> | null);
// ...
{safeHref && (
  <Button variant="outline" size="sm" asChild ...>
    <a href={safeHref} target="_blank" rel="noopener noreferrer">Open</a>
  </Button>
)}
```

---

## Warnings

### WR-01: Uninterpolated `{count}` placeholder in glossary copy

**File:** `src/copy/glossary.ts:62`

**Issue:** `COPY.view.todayEmptyWithWeek` is defined as the string `"You have {count} meetings later this week"`. This is a plain TypeScript string constant — the `{count}` token is not a template literal and is never interpolated. Any component that renders this value directly will show the raw token `{count}` to the user.

```ts
// Current — renders literal "{count}" to the user
todayEmptyWithWeek: "You have {count} meetings later this week",
```

**Fix:** Either use a function to accept the count and return an interpolated string, or document explicitly that callers must perform substitution — and add a type that enforces it:

```ts
// Option A — function (preferred, type-safe)
todayEmptyWithWeek: (count: number) =>
  `You have ${count} meeting${count !== 1 ? "s" : ""} later this week`,

// Option B — keep as template and document the substitution contract
// todayEmptyWithWeek: (count: number) => `You have ${count} meetings later this week`,
```

If no component currently consumes this key, it is dead copy and should be removed to prevent accidental use.

### WR-02: Unguarded `new Date(meeting.start_time)` — silent invalid date on bad data

**File:** `src/hooks/useTodayMeetings.ts:8`

**Issue:** `new Date(meeting.start_time)` is called without guarding against null, undefined, or malformed values. If `start_time` is null or an invalid ISO string, `new Date(...)` returns an `Invalid Date` object. `isToday(Invalid Date)` returns `false`, silently dropping the meeting from the today view with no error surfaced to the user or developer.

```ts
// Current — silent data loss on bad start_time
const todayMeetings = (query.data ?? []).filter((meeting) =>
  isToday(new Date(meeting.start_time))
);
```

**Fix:** Guard the filter to skip entries with missing or unparseable timestamps, and optionally log them in development:

```ts
const todayMeetings = (query.data ?? []).filter((meeting) => {
  if (!meeting.start_time) return false;
  const d = new Date(meeting.start_time);
  if (isNaN(d.getTime())) {
    if (import.meta.env.DEV) {
      console.warn("useTodayMeetings: invalid start_time", meeting.id, meeting.start_time);
    }
    return false;
  }
  return isToday(d);
});
```

### WR-03: `useEffect` missing `searchParams` in dependency array

**File:** `src/components/calendar/CalendarHub.tsx:41-45`

**Issue:** The `useEffect` reads `searchParams` but declares an empty `[]` dependency array. ESLint's `react-hooks/exhaustive-deps` rule will flag this. While the intent (run only on mount) is deliberate and commented, the correct pattern for one-time effects that read from reactive state is either to use a ref or to suppress the lint rule explicitly with a comment explaining why.

```ts
// Current — triggers exhaustive-deps lint warning
useEffect(() => {
  if (searchParams.get("tab")) {
    setSearchParams({}, { replace: true });
  }
}, []);
```

**Fix:** Suppress the lint warning intentionally, or use the initializer pattern with a ref:

```ts
// Option A — explicit suppression with rationale
useEffect(() => {
  if (searchParams.get("tab")) {
    setSearchParams({}, { replace: true });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Intentionally run once on mount to consume the ?tab param and clear it.
}, []);

// Option B — read param from a ref so the effect has no reactive dependency
const initialTab = useRef(searchParams.get("tab"));
useEffect(() => {
  if (initialTab.current) setSearchParams({}, { replace: true });
}, [setSearchParams]);
```

---

## Info

### IN-01: Duplicate components `NoCalendarEmpty` and `NoConnectionsEmpty`

**File:** `src/components/calendar/EmptyStates.tsx:23-69`

**Issue:** `NoCalendarEmpty` (lines 23–43) and `NoConnectionsEmpty` (lines 49–69) are byte-for-byte identical in JSX, props interface shape, copy, and button behavior. Both render the same heading, body, and optional connect button using `COPY.empty.noConnectionTitle` / `COPY.empty.noConnectionBody`. Maintaining two copies means any future copy or style change must be made twice.

**Fix:** Remove one component and re-export the other under both names if backward compatibility is needed, or consolidate to a single `NoCalendarEmpty`:

```ts
// Re-export for backward compatibility
export { NoCalendarEmpty as NoConnectionsEmpty };
```

### IN-02: Hardcoded copy in `MeetingsList` header and wellness tip bypasses glossary

**File:** `src/components/calendar/MeetingsList.tsx:34,36,155,157`

**Issue:** Four user-facing strings are hardcoded outside the `COPY` glossary:
- Line 34: `"Upcoming Meetings"`
- Line 36: `"Your next 7 days of events"`
- Line 155: `"Wellness Tip"`
- Line 157: The full wellness tip body

This breaks the single-source-of-truth pattern established in phase 06 and makes future copy changes inconsistent.

**Fix:** Move these strings into `COPY` (e.g., `COPY.view.weekHeading`, `COPY.wellness.tipTitle`, `COPY.wellness.tipBody`) and reference them from the component.

### IN-03: Redundant `useMeetings()` subscription in `CalendarHub`

**File:** `src/components/calendar/CalendarHub.tsx:34`

**Issue:** `CalendarHub` calls `useMeetings()` at line 34 solely to pass `meetings` to `useBreathingReminder`. `MeetingsList` (rendered as a child) also calls `useMeetings()` independently. TanStack Query deduplicates these into a single network request, so there is no performance bug. However, it creates two reactive subscriptions that re-render independently on cache updates, and makes the data flow harder to trace.

**Fix:** Pass meetings down as a prop to `MeetingsList`, or move the `useBreathingReminder` call into a dedicated hook/component that co-locates with the meetings data. This is a low-priority refactor — no correctness impact.

---

_Reviewed: 2026-04-07_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
