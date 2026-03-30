---
phase: 04-wellness-engine
plan: 01
subsystem: ui
tags: [react, css-animations, page-visibility-api, portals, date-fns, wellness]

# Dependency graph
requires:
  - phase: 03-settings-persistence
    provides: breathing_reminder_enabled and breathing_reminder_minutes persisted in user_settings table via useUserSettings hook
provides:
  - Breathing reminder system: useBreathingReminder hook, BreathingOverlay portal, MissedReminderBanner, BreathingCircle
  - CSS keyframes for asymmetric breathing cycle (inhale 4s / hold 4s / exhale 6s)
  - Wellness quotes module with getQuoteForGap selector
affects: [04-02-wellness-engine, 05-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React Portal for overlay: createPortal at document.body for z-index correctness"
    - "useRef for latest props in setInterval callbacks (stale closure avoidance)"
    - "shownIds Set in ref to prevent re-triggering shown reminders (Pitfall 6)"
    - "Page Visibility API with hasBeenVisible guard to skip initial mount events"
    - "Phase state machine with sequential setTimeout chain for breathing cycle"

key-files:
  created:
    - src/hooks/useBreathingReminder.ts
    - src/components/wellness/BreathingCircle.tsx
    - src/components/wellness/BreathingOverlay.tsx
    - src/components/wellness/MissedReminderBanner.tsx
    - src/lib/wellness-quotes.ts
  modified:
    - src/index.css
    - src/components/calendar/CalendarHub.tsx

key-decisions:
  - "BreathingOverlay rendered via React Portal at document.body -- ensures z-index correctness regardless of CalendarHub tab state"
  - "useRef holds latest meetings/settings for setInterval to avoid stale closures (Pitfall 1)"
  - "shownIds Set in ref prevents re-triggering overlay for same meeting after dismissal (Pitfall 6)"
  - "hasBeenVisibleRef guard skips initial visibilitychange mount events (Pitfall 3)"
  - "Banner auto-dismiss timeout cleared on explicit dismiss to prevent race conditions"

patterns-established:
  - "Breathing state machine: inhale -> hold -> exhale -> complete via sequential setTimeout with cleanup"
  - "Wellness component directory: src/components/wellness/ for all wellness UI"
  - "Portal overlay pattern: createPortal(content, document.body) in BreathingOverlay"

requirements-completed: [WEL-01]

# Metrics
duration: 10min
completed: 2026-03-30
---

# Phase 4 Plan 1: Wellness Engine Summary

**Guided breathing overlay system with 30s polling, Page Visibility API missed-reminder recovery, and React Portal rendering -- the core wellness differentiator for MeeThing**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-30T16:53:44Z
- **Completed:** 2026-03-30T17:03:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Built `useBreathingReminder` hook with 30s setInterval polling, shownIds Set for re-trigger prevention, and Page Visibility API for missed-reminder detection with 8s auto-dismissing banner
- Created `BreathingOverlay` React Portal with glassmorphism inner card, ESC key handler, meeting context text, and always-visible Dismiss button
- Created `BreathingCircle` with sequential setTimeout state machine (inhale 4s -> hold 4s -> exhale 6s -> complete) and fade-transitioning affirmation text per phase
- Created `MissedReminderBanner` with slide-in animation and "Take a moment now" CTA to reopen full overlay
- Added breathing-inhale/hold/exhale CSS keyframes with correct asymmetric durations (4s/4s/6s = 14s cycle) to index.css
- Wired everything through CalendarHub with useMeetings + useUserSettings feeding the hook

## Task Commits

1. **Task 1: Breathing infrastructure -- CSS keyframes, wellness quotes, and useBreathingReminder hook** - `a11ddaf` (feat)
2. **Task 2: Breathing overlay components and mount in CalendarHub** - `8efd026` (feat)

## Files Created/Modified

- `src/hooks/useBreathingReminder.ts` - Timer polling (30s setInterval), Page Visibility API missed-reminder detection, showOverlay/showBanner state machine with shownIds Set
- `src/components/wellness/BreathingCircle.tsx` - Phase state machine with sequential timeouts and fade-transitioning affirmation text
- `src/components/wellness/BreathingOverlay.tsx` - Full-screen Portal overlay with glassmorphism, ESC handler, meeting context, always-visible Dismiss button
- `src/components/wellness/MissedReminderBanner.tsx` - Slide-in banner with "Take a moment now" CTA, auto-dismissed after 8s
- `src/lib/wellness-quotes.ts` - 8 curated wellness quotes and getQuoteForGap(meetingIndex, dayOfWeek) selector
- `src/index.css` - Added breathing-inhale (4s), breathing-hold (4s), breathing-exhale (6s) keyframes and utility classes
- `src/components/calendar/CalendarHub.tsx` - Added useMeetings + useUserSettings + useBreathingReminder; mounts BreathingOverlay portal and MissedReminderBanner conditionally

## Decisions Made

- BreathingOverlay rendered via React Portal at document.body -- ensures z-index correctness regardless of CalendarHub tab state
- useRef holds latest meetings/settings for setInterval callbacks to avoid stale closures (Pitfall 1 from RESEARCH.md)
- shownIds Set in ref prevents re-triggering overlay for same meeting after dismissal (Pitfall 6 from RESEARCH.md)
- hasBeenVisibleRef guard skips visibilitychange events at initial mount (Pitfall 3 from RESEARCH.md)
- Also run tick() immediately on mount in addition to the interval to catch meetings in window at load time

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Breathing overlay system fully wired and build-verified
- WEL-01 (breathing reminders) complete -- ready for Phase 4 Plan 2 (transition buffer warnings + loading/empty state polish)
- No blockers

---
*Phase: 04-wellness-engine*
*Completed: 2026-03-30*
