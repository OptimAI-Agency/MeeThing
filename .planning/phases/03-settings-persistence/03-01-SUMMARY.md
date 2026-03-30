---
phase: 03-settings-persistence
plan: 01
subsystem: settings-data-layer
tags: [database, migration, typescript, hooks, tanstack-query]
dependency_graph:
  requires: [supabase-schema, auth-context]
  provides: [useUserSettings-hook, wellness-columns, field-mappers]
  affects: [CalendarSettings-UI, wellness-engine]
tech_stack:
  added: []
  patterns: [tanstack-query-hook, db-ui-field-mapping]
key_files:
  created:
    - supabase/migrations/20260329000000_add_wellness_columns.sql
    - src/hooks/useUserSettings.ts
  modified:
    - src/integrations/supabase/types.ts
decisions:
  - "Use .update() not .upsert() since trigger guarantees row exists; INSERT policy added as safety net"
  - "Field mappers (mapDbToUi/mapUiToDb) exported separately for CalendarSettings to consume"
  - "breathing_reminder_* and transition_buffer_enabled exist in schema but not in mutation payload -- reserved for Phase 4"
metrics:
  duration_seconds: 108
  completed: "2026-03-30T10:11:00Z"
  tasks: 3
  files: 3
---

# Phase 03 Plan 01: Settings Data Layer Summary

Database migration, TypeScript types, and TanStack Query hook for settings persistence -- the read/write plumbing that Plan 02 wires into the UI.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration to add wellness columns and fix CHECK constraint | 8d41e7f | supabase/migrations/20260329000000_add_wellness_columns.sql |
| 2 | Update TypeScript types for new wellness columns | a8f4732 | src/integrations/supabase/types.ts |
| 3 | Create useUserSettings hook with read and save mutation | 5c34cb4 | src/hooks/useUserSettings.ts |

## What Was Built

**Migration (Task 1):** Added 5 wellness columns to `user_settings` table (`wellness_tips_enabled`, `auto_breaks_enabled`, `breathing_reminder_enabled`, `breathing_reminder_minutes`, `transition_buffer_enabled`). Fixed the `reminder_minutes` CHECK constraint to include value 10 (previously missing, causing UI/DB mismatch). Added `breathing_reminder_minutes` CHECK constraint (5, 10, 15). Added INSERT RLS policy as upsert safety net.

**TypeScript Types (Task 2):** Added all 5 wellness columns to the `user_settings` Row, Insert, and Update sub-types in the generated types file.

**useUserSettings Hook (Task 3):** TanStack Query hook following the established `useCalendarConnections` pattern. Exports `useUserSettings` (read query + save mutation), `mapDbToUi`/`mapUiToDb` field mapping helpers, and `UiSettings` interface. The mutation uses `.update()` with query invalidation on success. Does not touch `background_preference`, `email_notifications`, or `theme` columns (out of scope for settings persistence).

## Decisions Made

1. **update() over upsert():** The DB trigger guarantees a `user_settings` row exists per user, so `.update()` is sufficient. The INSERT RLS policy is a safety net only.
2. **Exported field mappers:** `mapDbToUi` and `mapUiToDb` are exported functions (not internal to the hook) so CalendarSettings can use them directly in Plan 02.
3. **Phase 4 columns in schema only:** `breathing_reminder_enabled`, `breathing_reminder_minutes`, and `transition_buffer_enabled` are in the migration and types but NOT in the mutation payload -- Phase 4 will add write support when the wellness UI is built.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `npm run lint` exits 0 (no errors, only pre-existing warnings)
- Migration file contains all 5 wellness columns, both CHECK constraints, and INSERT policy
- TypeScript types compile with the 5 new columns in Row, Insert, and Update
- Hook file exports useUserSettings, mapDbToUi, mapUiToDb, UiSettings
- Hook does not contain background_preference, email_notifications, or theme

## Known Stubs

None -- all code is fully functional. The hook reads and writes to real Supabase tables. The mutation payload intentionally excludes Phase 4 wellness columns (documented in Decisions).

## Self-Check: PASSED

All 3 created/modified files exist. All 3 task commits verified (8d41e7f, a8f4732, 5c34cb4).
