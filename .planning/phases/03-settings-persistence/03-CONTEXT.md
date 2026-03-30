# Phase 3: Settings Persistence - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the existing `CalendarSettings` UI to the `user_settings` table in Supabase. All settings fields the UI exposes must read their initial values from the database on load and write back to the database on save. Settings must survive page refresh and logout/login.

Three categories of settings are in scope:
1. **Sync preferences** — sync frequency (5/15/30/60 min)
2. **Notification preferences** — notifications enabled, reminder lead time
3. **Wellness toggles** — wellness tips enabled, auto-breaks enabled (requires a schema migration to add columns)

The wellness engine (breathing animations, transition buffer) is NOT built in this phase — only the persistence layer for the toggles Phase 4 will read.

</domain>

<decisions>
## Implementation Decisions

### Data fetching and persistence pattern
- **D-01:** Create a `useUserSettings` hook (`src/hooks/useUserSettings.ts`) that reads from and writes to `user_settings` using TanStack Query — consistent with `useCalendarConnections` and `useMeetings` patterns in the codebase
- **D-02:** The hook provides: current settings (with loading/error state), and a `saveSettings` mutation
- **D-03:** The Supabase client is used directly from the frontend (no edge function needed — `user_settings` has RLS policies that already scope reads/writes to the authenticated user)

### Save behavior
- **D-04:** Keep the existing explicit **Save Settings** button — no auto-save on change. This matches the intentional/calm design philosophy and avoids surprise writes.
- **D-05:** On successful save, show a success toast (matching the existing "Settings Saved" toast message already in `CalendarSettings.tsx`)
- **D-06:** On save failure, show a destructive toast with "Try again" messaging — matches the error pattern established in Phase 2 (CalendarHub sync errors)

### Loading state
- **D-07:** While settings are loading on mount, render the settings panels in a disabled/skeleton state — not a full-page spinner. Settings are a secondary tab and a lightweight treatment is appropriate.
- **D-08:** If settings fail to load, show an inline error message with a retry action inside the settings panel

### Schema gap — wellness columns
- **D-09:** Add a migration to extend `user_settings` with the wellness columns Phase 4 will need:
  - `wellness_tips_enabled BOOLEAN NOT NULL DEFAULT true`
  - `auto_breaks_enabled BOOLEAN NOT NULL DEFAULT false`
  - `breathing_reminder_enabled BOOLEAN NOT NULL DEFAULT false`
  - `breathing_reminder_minutes INTEGER NOT NULL DEFAULT 10` (minutes before meeting, valid values: 5, 10, 15)
  - `transition_buffer_enabled BOOLEAN NOT NULL DEFAULT false`
- **D-10:** These columns are persisted by Phase 3 and read by Phase 4 — Phase 3 does not implement the wellness engine behaviour, only the storage
- **D-11:** Update `src/integrations/supabase/types.ts` to reflect the new columns after migration

### Settings fields mapping (UI → DB)
- **D-12:** `syncFrequency` (string) → `sync_frequency_minutes` (integer) — cast on read/write
- **D-13:** `notifications` (bool) → `notifications_enabled` (bool) — direct mapping
- **D-14:** `reminderTime` (string) → `reminder_minutes` (integer) — cast on read/write
- **D-15:** `wellnessTips` (bool) → `wellness_tips_enabled` (bool) — new column (D-09)
- **D-16:** `autoBreaks` (bool) → `auto_breaks_enabled` (bool) — new column (D-09)
- **D-17:** `background_preference` field in DB is already handled by the existing `useBackground` hook — do not duplicate; leave `BackgroundSettings.tsx` wired to its existing hook

### What is NOT wired in this phase
- **D-18:** `email_notifications` column exists in DB but has no UI control — leave unwired; do not add UI for it in this phase
- **D-19:** `theme` column exists in DB but is handled by `next-themes` — leave as-is; do not override theme persistence

### Claude's Discretion
- Exact skeleton/disabled treatment while settings load (e.g., opacity reduction, disabled prop on Switch/Select, or shadcn Skeleton components)
- Debounce strategy if any (none expected given explicit-save pattern)
- Whether to use `upsert` or `update` for the save mutation (upsert is safer — handles edge case where trigger failed to create the row)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Settings — SET-01, SET-02 define the acceptance criteria
- `.planning/ROADMAP.md` §Phase 3 — Success criteria 1–3 define what must be TRUE after this phase

### Existing code to wire up
- `src/components/calendar/CalendarSettings.tsx` — top-level settings component; currently holds all state in local `useState`; needs to be replaced with `useUserSettings` hook state
- `src/components/calendar/settings/SyncSettings.tsx` — renders sync frequency select; no changes needed to props interface
- `src/components/calendar/settings/NotificationSettings.tsx` — renders notifications + wellness toggles + reminder time; no changes needed to props interface
- `src/components/calendar/settings/WellnessSection.tsx` — currently a static marketing panel (no interactive controls); leave as-is in this phase
- `src/components/calendar/settings/BackgroundSettings.tsx` — already wired to `useBackground` hook; do not touch

### Existing hooks (patterns to follow)
- `src/hooks/useCalendarConnections.ts` — canonical pattern for a TanStack Query hook with Supabase; new `useUserSettings` hook follows this structure
- `src/hooks/useMeetings.ts` — secondary reference for hook patterns

### Database
- `supabase/migrations/20251124004329_a016b882-49d5-45c2-a0a7-fa7bfeb153dd.sql` — defines `user_settings` table and RLS policies; new migration extends this schema
- `src/integrations/supabase/types.ts` — generated types; must be updated after migration to include new wellness columns

### Shared infrastructure
- `src/integrations/supabase/client.ts` — Supabase singleton used in all hooks
- `src/hooks/use-toast.ts` — toast hook used for save success/error feedback

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useCalendarConnections` hook: Uses `useQuery` + `supabase.from(...).select(...)` scoped to `auth.uid()` — `useUserSettings` follows this exact structure for the read path
- `useToast` + `toast({ variant: "success" | "destructive" })`: Already used in `CalendarSettings.tsx` for the save confirmation — extend to cover error case
- `useQueryClient` + `queryClient.invalidateQueries()`: Established pattern from Phase 2 for cache invalidation after mutations — use for settings mutation
- All shadcn `Switch`, `Select` components: Already present in `NotificationSettings.tsx` and `SyncSettings.tsx` — no new UI components needed

### Established Patterns
- TanStack Query for all data fetching (not raw `useEffect` + `useState`)
- Supabase direct client calls from hooks (no edge function for user-scoped data with RLS)
- `toast({ variant: "destructive" })` for errors with a descriptive message
- `toast({ variant: "success" })` for save confirmations

### Integration Points
- `CalendarSettings.tsx` `handleSave`: Replace the stub toast-only handler with `saveSettings` mutation call from `useUserSettings`
- `CalendarSettings.tsx` `useState` for settings: Replace with settings object from `useUserSettings` hook
- `updateSetting` function: Wire to a local draft-state pattern that feeds the explicit save (read from DB → local draft on change → write on save)
- New migration file: Add to `supabase/migrations/` with timestamp prefix following existing naming convention

### Schema gap summary
The current `user_settings` table (8 columns) is missing 5 wellness columns needed to fully satisfy Phase 3 SC-3 and to unblock Phase 4. A migration is required before the hook can be written.

</code_context>

<specifics>
## Specific Ideas

- The `user_settings` row is auto-created by the `handle_new_user` trigger on signup — the hook should `upsert` (not `insert`) on save to handle any edge case where the trigger failed, rather than assuming the row always exists
- The UI already has all the controls needed; this phase is purely plumbing — no new UI components, no redesign
- Phase 3 success criterion 3 explicitly names `breathing_enabled`, `minutes_before`, and `transition_buffer` as fields that must persist. These map to `breathing_reminder_enabled`, `breathing_reminder_minutes`, and `transition_buffer_enabled` in the proposed schema extension

</specifics>

<deferred>
## Deferred Ideas

- Email notifications toggle in UI — `email_notifications` column exists in DB but there is no UI for it; adding the toggle is a separate concern deferred to polish pass or Phase 4
- Theme persistence — `theme` column exists in DB; wiring `next-themes` to persist theme choice to DB is out of scope for this phase
- Sync scheduling (triggering auto-sync at the configured interval) — `sync_frequency_minutes` is persisted in this phase but the scheduling mechanism is a v2 concern; Phase 3 only stores the preference
- Sync frequency used as a display hint — Phase 4 can read this setting to inform users how stale their data might be, without needing to implement actual auto-sync

</deferred>

---

*Phase: 03-settings-persistence*
*Context gathered: 2026-03-28*
