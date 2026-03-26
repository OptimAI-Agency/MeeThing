---
phase: 02-google-calendar-reliability
plan: "02"
subsystem: frontend-calendar-ui
tags: [google-calendar, sync-errors, disconnect-dialog, toast-actions, date-fns]
dependency_graph:
  requires: [02-01]
  provides: [structured-sync-error-toasts, disconnect-confirmation-dialog, last-synced-display]
  affects: [CalendarHub, CalendarConnections]
tech_stack:
  added: [date-fns/formatDistanceToNow]
  patterns: [structured-error-type-check, toast-with-action, alert-dialog-confirmation, query-invalidation-on-success]
key_files:
  created: []
  modified:
    - src/components/calendar/CalendarHub.tsx
    - src/components/calendar/CalendarConnections.tsx
decisions:
  - "Sync->disconnect mutual exclusion handled via syncing prop passed from CalendarHub to CalendarConnections; disconnect->sync direction is acceptable risk since disconnect completes quickly"
  - "Use unknown catch type instead of any to satisfy ESLint no-explicit-any rule"
  - "Remove pre-existing `as any` cast on activeTab by simplifying always-overview initialTab logic (ternary was always 'overview')"
metrics:
  duration_seconds: 123
  completed_date: "2026-03-26"
  tasks_completed: 1
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 02 Plan 02: Frontend Sync Error Handling and Disconnect Dialog Summary

**One-liner:** Structured sync error toasts (auth expiry with Reconnect action, API failure, network failure), AlertDialog disconnect confirmation calling edge function, and "Last synced X ago" display via date-fns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire sync error handling and disconnect UI in CalendarHub and CalendarConnections | 2b1b640 | src/components/calendar/CalendarHub.tsx, src/components/calendar/CalendarConnections.tsx |

## Task 2 — Checkpoint (Awaiting Human Verification)

Task 2 is a `checkpoint:human-verify` gate. The implementation from Task 1 is complete and committed. Human verification of the following is required before this plan is marked complete:

1. Sync success path: "Synced" toast appears and last-synced timestamp updates on Connections tab
2. Last-synced display: Connected Google Calendar card shows "Last synced X ago" or "Never synced"
3. Disconnect confirmation: AlertDialog appears with "Disconnect Google Calendar?" and "This will remove all synced meetings from MeeThing"
4. Disconnect execution: Meetings removed from Overview, connection removed from Connections tab
5. Button disabling: Disconnect button disabled while sync is running
6. (Optional) Auth error toast: "Your Google Calendar session expired" with "Reconnect" action button

## What Was Built

### Task 1: CalendarHub.tsx Changes

1. **ToastAction import** — Added `import { ToastAction } from "@/components/ui/toast"` for interactive toast buttons.

2. **Structured handleSync error handling** — Replaced the single-path catch with a three-tier approach:
   - Network-level failure (`error` from `supabase.functions.invoke`): "Sync failed — check your connection and try again."
   - Auth expiry structured error (`data.error_type === "auth_expired"`): "Your Google Calendar session expired — please reconnect." with a `ToastAction` Reconnect button that calls `setActiveTab("connections")`
   - Other API errors (`data.error` with other `error_type`): "Google Calendar sync failed — try again."
   - Success: invalidates both `["meetings"]` and `["calendar-connections"]` queries, then shows "Synced" toast

3. **`syncing` prop passed to CalendarConnections** — enables the disconnect button to be disabled while sync is in progress.

4. **Pre-existing `as any` fix** — Removed the `initialTab as any` cast on the `activeTab` useState. The ternary expression was always `"overview"` (both branches returned `"overview"`), so the simplification is safe and eliminates the ESLint error.

### Task 1: CalendarConnections.tsx Changes

1. **New imports** — `formatDistanceToNow` from `date-fns`, full `AlertDialog` component family from `@/components/ui/alert-dialog`, `useCalendarConnections` hook.

2. **Props update** — Added `syncing?: boolean` to the Props interface; destructured in component signature.

3. **`connections` data** — `useCalendarConnections()` hook called inside CalendarConnections to access `last_synced_at` for each provider without lifting that state to CalendarHub.

4. **Edge function disconnect** — `handleDisconnect` now calls `supabase.functions.invoke("google-calendar-disconnect")` instead of the direct Supabase `.update({ is_active: false })` DB call. Uses `unknown` catch type with `instanceof Error` guard for ESLint compliance.

5. **AlertDialog confirmation** — Disconnect button wrapped in `<AlertDialog>`. The trigger button is disabled when `isDisconnecting || syncing`. Dialog content: "Disconnect Google Calendar?" / "This will remove all synced meetings from MeeThing. You can reconnect at any time." with Cancel and Disconnect actions.

6. **Last-synced display** — IIFE inside the provider card renders "Last synced X ago" using `formatDistanceToNow(new Date(lastSynced), { addSuffix: true })` when `last_synced_at` is present, or "Never synced" as fallback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed pre-existing `as any` cast on activeTab useState**
- **Found during:** Task 1 (lint check of modified files revealed error in CalendarHub.tsx)
- **Issue:** `useState<"overview" | "connections" | "settings">(initialTab as any)` triggered `@typescript-eslint/no-explicit-any`. The `initialTab` variable evaluated a ternary where both branches returned `"overview"` — the cast was both incorrect and unnecessary.
- **Fix:** Removed `initialTab` variable entirely and initialized state directly with `"overview"`.
- **Files modified:** src/components/calendar/CalendarHub.tsx
- **Commit:** 2b1b640

**2. [Rule 1 - Bug] Used `unknown` instead of `any` in catch blocks**
- **Found during:** Task 1 implementation (applying ESLint compliance learned from 02-01)
- **Issue:** Plan code snippets used `catch (err: any)` which triggers `@typescript-eslint/no-explicit-any`.
- **Fix:** Used `catch (err: unknown)` with `instanceof Error` type guard for message access in CalendarConnections; used `catch (err: unknown)` in CalendarHub (message not used in catch toast).
- **Files modified:** src/components/calendar/CalendarConnections.tsx, src/components/calendar/CalendarHub.tsx
- **Commit:** 2b1b640

**Note on overall lint status:** `npm run lint` across the full project exits non-zero due to pre-existing errors in UI components (textarea.tsx, sidebar.tsx), page components (Login.tsx, Signup.tsx, AuthCallback.tsx), and tailwind.config.ts. These are out of scope and pre-date this plan. Both modified files (`CalendarHub.tsx`, `CalendarConnections.tsx`) lint clean with 0 errors individually.

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| Auth expiry error shows toast with "Reconnect" action navigating to Connections tab | PASS — code implementation complete |
| API error shows "Google Calendar sync failed" toast | PASS — code implementation complete |
| Network error shows "check your connection" toast | PASS — code implementation complete |
| Disconnect requires confirmation dialog (AlertDialog) | PASS — code implementation complete |
| Disconnect calls edge function (not direct DB update) | PASS — google-calendar-disconnect invoked |
| Connected provider card shows "Last synced X ago" | PASS — formatDistanceToNow wired |
| Successful sync refreshes last-synced timestamp | PASS — calendar-connections query invalidated |
| Lint (modified files) passes with 0 errors | PASS — 0 errors in both files |
| Build passes | PASS — vite build exits 0 |

## Known Stubs

None — all logic is wired to real data sources and edge functions. The `last_synced_at` field is populated by the sync edge function (Plan 01) and displayed live.

## Self-Check: PASSED

Files exist:
- src/components/calendar/CalendarHub.tsx — FOUND
- src/components/calendar/CalendarConnections.tsx — FOUND

Commits exist:
- 2b1b640 — FOUND (feat(02-02): wire structured sync errors, disconnect dialog, and last-synced display)
