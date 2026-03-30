# Phase 3: Settings Persistence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 03-settings-persistence
**Mode:** --auto (all decisions auto-selected)
**Areas discussed:** Schema gap handling, Save behavior, Data fetching pattern, Loading state, Error handling, Wellness fields scope

---

## Data Fetching Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Custom `useUserSettings` hook | Follows `useCalendarConnections` / `useMeetings` pattern; TanStack Query + Supabase direct client | ✓ |
| Inline Supabase calls in CalendarSettings | Simpler but violates established hook pattern | |
| Edge function | Unnecessary — `user_settings` has RLS; no server-side logic needed | |

**Auto-selected:** Custom `useUserSettings` hook (recommended — consistent with established codebase hook pattern)
**Notes:** Supabase client used directly from the hook; no edge function required since RLS already scopes reads/writes to the authenticated user.

---

## Save Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Keep explicit Save button | Preserves existing UI; intentional/calm design; no surprise writes | ✓ |
| Auto-save on change | Faster feedback but introduces surprise DB writes and conflicts with calm UX principle | |
| Debounced auto-save | Middle ground but adds complexity without clear benefit | |

**Auto-selected:** Keep explicit Save button (recommended — existing UI has the button; matches calm/intentional design principle)
**Notes:** On success: show existing "Settings Saved" success toast. On failure: show destructive toast with "Try again" message.

---

## Loading State

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled/skeleton panels while loading | Lightweight; appropriate for a secondary tab | ✓ |
| Full-page spinner | Overkill for settings tab | |
| Render with hardcoded defaults until loaded | Risk of user seeing stale/wrong initial state | |

**Auto-selected:** Disabled/skeleton panels while loading (recommended — settings are a secondary tab; lightweight treatment is appropriate)
**Notes:** Inline error with retry if load fails.

---

## Schema Gap Handling (Wellness Columns)

| Option | Description | Selected |
|--------|-------------|----------|
| Add migration with wellness columns | Satisfies Phase 3 SC-3 and unblocks Phase 4; adds 5 columns to user_settings | ✓ |
| Store wellness settings in JSONB metadata column | Avoids migration but loses typed columns and CHECK constraints | |
| Defer wellness columns to Phase 4 | Phase 3 SC-3 explicitly requires them; deferring violates the roadmap | |

**Auto-selected:** Add migration with wellness columns (recommended — Phase 3 success criterion 3 explicitly requires wellness settings to persist for Phase 4)
**Notes:** 5 new columns: `wellness_tips_enabled`, `auto_breaks_enabled`, `breathing_reminder_enabled`, `breathing_reminder_minutes`, `transition_buffer_enabled`. Phase 3 stores values; Phase 4 reads and acts on them.

---

## UI Fields to DB Columns Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Map all UI fields to DB, including background and theme | Comprehensive but touches already-wired hooks | |
| Map only the disconnected fields; leave background/theme hooks alone | Targeted; avoids breaking existing wiring | ✓ |

**Auto-selected:** Map only disconnected fields (recommended — `useBackground` hook already handles `background_preference`; `theme` handled by `next-themes`; touching them risks regressions)
**Notes:** `email_notifications` DB column has no UI control — leave unwired; not in scope.

---

## Claude's Discretion

- Exact skeleton/disabled treatment while settings load
- Whether to use `upsert` or `update` for the save mutation (upsert recommended — handles edge case of missing row)

## Deferred Ideas

- Email notifications UI toggle — column exists but no UI; deferred
- Theme persistence to DB — next-themes handles theme; DB persistence is a separate concern
- Sync scheduling / auto-sync at configured interval — v2 concern; only storing the preference in Phase 3
