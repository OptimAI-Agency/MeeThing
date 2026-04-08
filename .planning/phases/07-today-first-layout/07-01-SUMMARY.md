---
phase: 07-today-first-layout
plan: 01
subsystem: calendar-view
tags: [hooks, glossary, toggle, url-state]
dependency_graph:
  requires: [src/hooks/useMeetings.ts, src/copy/glossary.ts, src/components/ui/toggle-group.tsx]
  provides: [src/hooks/useViewMode.ts, src/hooks/useTodayMeetings.ts, src/components/calendar/ViewToggle.tsx]
  affects: [src/copy/glossary.ts]
tech_stack:
  added: [date-fns/isToday]
  patterns: [URL-persisted state via useSearchParams, cache-derived filtered hook]
key_files:
  created:
    - src/hooks/useViewMode.ts
    - src/hooks/useTodayMeetings.ts
    - src/components/calendar/ViewToggle.tsx
  modified:
    - src/copy/glossary.ts
decisions:
  - "useViewMode defaults to 'today' with clean URL (no ?view param); only 'week' is explicitly set"
  - "useTodayMeetings is view-mode-independent -- always returns today-only data for companion features"
  - "ViewToggle uses glass-light container with bg-white active state (secondary surface, not accent)"
metrics:
  duration_seconds: 109
  completed: "2026-04-07"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 07 Plan 01: View Mode Hooks and Toggle Component Summary

URL-persisted today/week view mode infrastructure with today-only meeting filter hook and pill-shaped ViewToggle component using shadcn ToggleGroup, all copy from glossary.

## Task Completion

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Add view glossary entries and create useViewMode + useTodayMeetings hooks | aee6c3b | src/copy/glossary.ts, src/hooks/useViewMode.ts, src/hooks/useTodayMeetings.ts |
| 2 | Create ViewToggle component | db47d13 | src/components/calendar/ViewToggle.tsx |

## What Was Built

### Glossary Entries (src/copy/glossary.ts)
Added `COPY.view` with 8 sub-keys: `today`, `week`, `todayHeading`, `todaySubheading`, `weekHeading`, `weekSubheading`, `todayEmptyWithWeek`, `toggleAriaLabel`. All existing keys untouched.

### useViewMode Hook (src/hooks/useViewMode.ts)
- Reads `?view` from URL via `useSearchParams`
- Defaults to `"today"` when param absent (any value other than `"week"` maps to `"today"` -- T-07-01 mitigation)
- Writes via `replace: true` to prevent history pollution
- Callback form of `setSearchParams` preserves other URL params (e.g., `?tab`)
- Exports `ViewMode` type and `useViewMode` function

### useTodayMeetings Hook (src/hooks/useTodayMeetings.ts)
- Filters `useMeetings()` cache to today-only via `isToday` from date-fns
- Always returns today-only data (no viewMode parameter) -- designed for companion features in Phases 9-10
- Exposes `allMeetings` for week-count hints in empty states

### ViewToggle Component (src/components/calendar/ViewToggle.tsx)
- shadcn ToggleGroup with `type="single"` and deselect guard
- Glass-light container with rounded-2xl p-1 per UI-SPEC
- Active: bg-white text-gray-900 shadow-sm; Inactive: text-gray-600 hover:text-gray-900 hover:bg-white/40
- All text from `COPY.view` glossary entries
- `spring-smooth` transition class matching existing CalendarHub motion

## Verification Results

- `npm run lint`: 0 errors (10 pre-existing warnings)
- `npm run build`: Success (2.67s)

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None -- all hooks return real data and the component is fully functional.

## Threat Model Compliance

T-07-01 (URL param tampering) mitigated: `searchParams.get("view") === "week" ? "week" : "today"` whitelist validation implemented in useViewMode.ts.

## Self-Check: PASSED

- All 5 files FOUND on disk
- Both commits (aee6c3b, db47d13) FOUND in git log
