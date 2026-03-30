---
phase: 04-wellness-engine
plan: 02
subsystem: wellness-ui
tags: [wellness, loading-states, empty-states, skeleton, transition-buffer, polish]
dependency_graph:
  requires: [04-01 (wellness-quotes.ts), 03-01 (useUserSettings), 02-01 (useMeetings)]
  provides: [TransitionBufferWarning, MeetingCardSkeleton, EmptyStates, AppLoadingScreen]
  affects: [MeetingsList, CalendarConnections, ProtectedRoute]
tech_stack:
  added: []
  patterns: [skeleton-loading, fragment-gap-detection, conditional-render-by-setting]
key_files:
  created:
    - src/components/wellness/TransitionBufferWarning.tsx
    - src/components/calendar/MeetingCardSkeleton.tsx
    - src/components/calendar/EmptyStates.tsx
    - src/components/loading/AppLoadingScreen.tsx
  modified:
    - src/components/calendar/MeetingsList.tsx
    - src/components/calendar/CalendarConnections.tsx
    - src/components/auth/ProtectedRoute.tsx
decisions:
  - "TransitionBufferWarning renders within Fragment wrapper in meetings map loop; gap detection is pure client-side using differenceInMinutes(nextMeeting.start, currentMeeting.end)"
  - "CalendarConnections reads its own isLoading from useCalendarConnections to avoid CalendarHub file conflict with parallel Plan 01"
  - "MeetingsList always renders NoMeetingsEmpty for the zero-meetings case since CalendarHub already prevents MeetingsList from rendering when no connections exist"
metrics:
  duration_minutes: 20
  completed: "2026-03-30"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
---

# Phase 4 Plan 2: Transition Buffer Warnings and Polish States Summary

**One-liner:** Amber inline transition buffer warnings with wellness quotes, skeleton loading cards, and calm empty/error states replace all bare spinners and empty voids across MeetingsList, CalendarConnections, and ProtectedRoute.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create TransitionBufferWarning, MeetingCardSkeleton, EmptyStates, AppLoadingScreen | 6e4965b | 4 new component files |
| 2 | Wire new components into MeetingsList, CalendarConnections, ProtectedRoute | 3262327 | 3 existing files updated |

## What Was Built

### TransitionBufferWarning (`src/components/wellness/TransitionBufferWarning.tsx`)
Amber inline connector that appears between consecutive meetings when the gap is 5 minutes or fewer. Shows either "No transition time" (0 min gap) or "Only N min between meetings" (1-5 min). Displays a rotating wellness quote from `getQuoteForGap`. Only renders when `transition_buffer_enabled` is true in user settings.

### MeetingCardSkeleton (`src/components/calendar/MeetingCardSkeleton.tsx`)
Skeleton placeholder matching the real meeting card shape: `glass-light rounded-2xl` container with shadcn `<Skeleton>` components for the provider bar, title, time, and provider label. Used for the loading state in MeetingsList (3 cards shown).

### EmptyStates (`src/components/calendar/EmptyStates.tsx`)
Four named exports:
- `NoMeetingsEmpty` — "Your schedule is clear" with green calendar icon
- `NoCalendarEmpty` — "Let's get you connected" with blue calendar icon + optional CTA
- `NoConnectionsEmpty` — "Let's get you connected" with connect CTA (for connections tab)
- `MeetingsError` — "Couldn't refresh your calendar" with "Try again" button

### AppLoadingScreen (`src/components/loading/AppLoadingScreen.tsx`)
Full-page loading screen with nature gradient background (`from-green-600 via-teal-600 to-blue-700`), glassmorphism content card, and breathing-animated circle using the existing `animate-breathe` CSS class.

### MeetingsList wiring
- Loading: 3 MeetingCardSkeleton instances
- Error: MeetingsError with `refetch()` callback
- Empty: NoMeetingsEmpty (calm, calendar connected)
- Map loop: `Fragment` wrapper, gap detection with `differenceInMinutes`, TransitionBufferWarning between back-to-back meetings

### CalendarConnections wiring
- Loading: skeleton header + 3 skeleton provider cards (reads `isLoading` directly from `useCalendarConnections`)
- Empty state banner: "Welcome! Let's get you connected" shown when `connectedProviders.length === 0`

### ProtectedRoute wiring
- Replaced inline spinner with `<AppLoadingScreen />` — no more bare white flash or blue gradient spinner

## Requirements Satisfied

- **WEL-02**: TransitionBufferWarning shows amber connector with gap label and wellness quote between back-to-back meetings, gated by `transition_buffer_enabled`
- **POL-01**: MeetingsList, CalendarConnections, and ProtectedRoute all have explicit loading states with skeletons and error states with recovery actions
- **POL-02**: Empty states show calm, encouraging copy — "Your schedule is clear", "Welcome! Let's get you connected"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] wellness-quotes.ts already existed from parallel Plan 01 execution**
- **Found during:** Task 1 setup
- **Issue:** Plan 02 depends on `src/lib/wellness-quotes.ts` which is created by Plan 01. Both plans are Wave 1 (parallel). The file was already created by Plan 01 before Task 1 started.
- **Fix:** Used the existing file as-is. No creation needed — blocked issue resolved automatically.
- **Files modified:** None

## Known Stubs

None — all components are fully wired to real data sources. TransitionBufferWarning reads `transition_buffer_enabled` from `useUserSettings`, MeetingsList reads from `useMeetings`, CalendarConnections reads loading state from `useCalendarConnections`.

## Self-Check: PASSED

Files created:
- FOUND: src/components/wellness/TransitionBufferWarning.tsx
- FOUND: src/components/calendar/MeetingCardSkeleton.tsx
- FOUND: src/components/calendar/EmptyStates.tsx
- FOUND: src/components/loading/AppLoadingScreen.tsx

Commits:
- FOUND: 6e4965b (Task 1)
- FOUND: 3262327 (Task 2)

Build: passes (0 errors, 0 lint errors)
