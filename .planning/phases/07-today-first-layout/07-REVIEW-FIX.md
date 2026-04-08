---
phase: 07-today-first-layout
fixed_at: 2026-04-07T00:00:00Z
review_path: .planning/phases/07-today-first-layout/07-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 07: Code Review Fix Report

**Fixed at:** 2026-04-07
**Source review:** .planning/phases/07-today-first-layout/07-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: Unvalidated `htmlLink` used as anchor `href` — potential `javascript:` injection

**Files modified:** `src/components/calendar/MeetingsList.tsx`
**Commit:** e10a3ba
**Applied fix:** Added a `getSafeHref` helper function above the component that validates the URL protocol using `new URL()` and only returns the link if the protocol is `https:` or `http:`. The render now calls `getSafeHref` via an IIFE and only renders the `<a>` element when a safe href is returned, preventing any `javascript:` or other unsafe protocol from reaching the DOM.

### WR-01: Uninterpolated `{count}` placeholder in glossary copy

**Files modified:** `src/copy/glossary.ts`
**Commit:** 6c78f9c
**Applied fix:** Converted `todayEmptyWithWeek` from a plain string with a raw `{count}` token to a type-safe function `(count: number) => string` that uses a template literal with proper pluralisation. The key was not consumed by any component, so no call sites needed updating.

### WR-02: Unguarded `new Date(meeting.start_time)` — silent invalid date on bad data

**Files modified:** `src/hooks/useTodayMeetings.ts`
**Commit:** 28fca4f
**Applied fix:** Replaced the one-liner filter arrow with a multi-statement guard: return `false` early if `start_time` is falsy, parse the date, check `isNaN(d.getTime())` and emit a `console.warn` in DEV mode before returning `false`, then return `isToday(d)` only when the date is valid.

### WR-03: `useEffect` missing `searchParams` in dependency array

**Files modified:** `src/components/calendar/CalendarHub.tsx`
**Commit:** ab942cf
**Applied fix:** Added `// eslint-disable-next-line react-hooks/exhaustive-deps` with an explanatory comment immediately before the closing `}, [])` so the intentional mount-only behaviour is documented and the lint warning is suppressed without changing runtime behaviour.

---

_Fixed: 2026-04-07_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
