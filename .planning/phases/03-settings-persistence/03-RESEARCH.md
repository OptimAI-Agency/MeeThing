# Phase 3: Settings Persistence - Research

**Researched:** 2026-03-29
**Domain:** TanStack Query mutations + Supabase upsert for user settings persistence
**Confidence:** HIGH

## Summary

Phase 3 is a plumbing phase: the UI components already exist with the correct controls, and the database table already exists with RLS policies. The work is (1) a schema migration to add 5 wellness columns, (2) a `useUserSettings` TanStack Query hook for read/write, (3) wiring `CalendarSettings.tsx` to use the hook instead of local `useState`, and (4) updating the generated TypeScript types.

The codebase has two established hook patterns (`useCalendarConnections`, `useMeetings`) that use `useQuery` with the Supabase client. The new hook follows the same pattern but adds a `useMutation` for the save path. The existing `user_settings` table has RLS policies for SELECT and UPDATE scoped to `auth.uid()`, but notably lacks an INSERT policy -- the `upsert` approach (recommended in CONTEXT.md) will need either an INSERT policy or a plain UPDATE (since the trigger creates the row on signup).

**Primary recommendation:** Use `useMutation` with Supabase `.update()` for the save path (not `.upsert()`), because the table has no INSERT RLS policy and the `handle_new_user` trigger guarantees the row exists. If the edge case of a missing row must be handled, add an INSERT policy in the migration.

## Project Constraints (from CLAUDE.md)

- No test framework configured -- linting is the only automated quality check
- Use `@/` path alias for all imports (maps to `src/`)
- Supabase client is singleton at `src/integrations/supabase/client.ts`
- Auth state from `AuthContext` (`src/contexts/AuthContext.tsx`)
- shadcn-ui components in `src/components/ui/`
- Tailwind CSS with custom wellness/nature design system
- React 18 + React Router 6 + TanStack Query + React Hook Form + Zod

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create a `useUserSettings` hook (`src/hooks/useUserSettings.ts`) using TanStack Query -- consistent with `useCalendarConnections` and `useMeetings`
- **D-02:** Hook provides current settings (with loading/error state) and a `saveSettings` mutation
- **D-03:** Supabase client used directly from frontend (no edge function) -- RLS scopes to authenticated user
- **D-04:** Keep explicit Save Settings button -- no auto-save
- **D-05:** Success toast on save (matching existing "Settings Saved" toast)
- **D-06:** Destructive toast on save failure with "Try again" messaging
- **D-07:** Disabled/skeleton state while settings load (not full-page spinner)
- **D-08:** Inline error with retry on load failure
- **D-09:** Migration adds 5 wellness columns: `wellness_tips_enabled`, `auto_breaks_enabled`, `breathing_reminder_enabled`, `breathing_reminder_minutes`, `transition_buffer_enabled`
- **D-10:** Wellness columns are persisted by Phase 3, read by Phase 4
- **D-11:** Update `src/integrations/supabase/types.ts` after migration
- **D-12 to D-16:** Field mappings (syncFrequency<->sync_frequency_minutes, notifications<->notifications_enabled, reminderTime<->reminder_minutes, wellnessTips<->wellness_tips_enabled, autoBreaks<->auto_breaks_enabled)
- **D-17:** `background_preference` handled by existing `useBackground` hook -- do not duplicate
- **D-18:** `email_notifications` column has no UI -- leave unwired
- **D-19:** `theme` column handled by next-themes -- leave as-is

### Claude's Discretion
- Exact skeleton/disabled treatment while settings load
- Debounce strategy (none expected given explicit-save)
- Whether to use `upsert` or `update` for save mutation

### Deferred Ideas (OUT OF SCOPE)
- Email notifications toggle UI
- Theme persistence to DB
- Sync scheduling mechanism
- Sync frequency as display hint
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SET-01 | Sync frequency preference reads from and writes to `user_settings` table | Hook read path fetches `sync_frequency_minutes`, write path updates it via mutation. Field mapping D-12 handles string<->integer cast. |
| SET-02 | Notification preferences read from and writes to `user_settings` table | Hook fetches `notifications_enabled` and `reminder_minutes`, write path updates them. Field mappings D-13, D-14 handle direct bool and string<->integer cast. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.56.2 | Data fetching, caching, mutations | Already in use for all data hooks in this codebase |
| @supabase/supabase-js | ^2.84.0 | Database client with RLS | Already configured as singleton |
| React | ^18.3.1 | UI framework | Existing stack |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Switch | (bundled) | Toggle controls | Already in NotificationSettings |
| shadcn/ui Select | (bundled) | Dropdown selectors | Already in SyncSettings |
| shadcn/ui Skeleton | (bundled) | Loading placeholders | For D-07 loading state |

No new packages need to be installed for this phase.

## Architecture Patterns

### Recommended Project Structure
```
src/
  hooks/
    useUserSettings.ts     # NEW - TanStack Query hook for settings CRUD
  components/
    calendar/
      CalendarSettings.tsx  # MODIFY - wire to useUserSettings instead of useState
      settings/
        SyncSettings.tsx         # NO CHANGE - props interface unchanged
        NotificationSettings.tsx # NO CHANGE - props interface unchanged
        WellnessSection.tsx      # NO CHANGE - static panel
        BackgroundSettings.tsx   # NO CHANGE - uses useBackground
  integrations/
    supabase/
      types.ts              # MODIFY - add wellness columns to user_settings type
supabase/
  migrations/
    YYYYMMDDHHMMSS_add_wellness_columns.sql  # NEW
```

### Pattern 1: TanStack Query Hook with Supabase (Read)
**What:** The established pattern for fetching user-scoped data
**When to use:** All data reads from Supabase
**Example (from codebase):**
```typescript
// Source: src/hooks/useCalendarConnections.ts (existing pattern)
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("sync_frequency_minutes, notifications_enabled, reminder_minutes, wellness_tips_enabled, auto_breaks_enabled, breathing_reminder_enabled, breathing_reminder_minutes, transition_buffer_enabled")
        .eq("user_id", user!.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}
```

### Pattern 2: TanStack Query Mutation with Supabase (Write)
**What:** Mutation pattern for updating data with optimistic UI invalidation
**When to use:** All writes to Supabase
**Example:**
```typescript
// Source: TanStack Query v5 + Supabase pattern
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const saveSettings = useMutation({
  mutationFn: async (settings: SettingsPayload) => {
    const { error } = await supabase
      .from("user_settings")
      .update(settings)
      .eq("user_id", user!.id);

    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    toast({ variant: "success", title: "Settings Saved", ... });
  },
  onError: () => {
    toast({ variant: "destructive", title: "Save Failed", ... });
  },
});
```

### Pattern 3: Draft State (local edits before explicit save)
**What:** Read from DB on mount, copy to local state for editing, write local state on save
**When to use:** When UI has an explicit Save button (D-04)
**Example:**
```typescript
// In CalendarSettings.tsx
const { data: dbSettings, isLoading, isError } = useUserSettings();

// Local draft state initialized from DB
const [draft, setDraft] = useState(defaultSettings);

// Sync DB -> draft when data arrives
useEffect(() => {
  if (dbSettings) {
    setDraft(mapDbToUi(dbSettings));
  }
}, [dbSettings]);

// On save, map draft back to DB shape
const handleSave = () => saveSettings.mutate(mapUiToDb(draft));
```

### Anti-Patterns to Avoid
- **Direct useEffect + useState for data fetching:** The codebase uses TanStack Query exclusively. Do not introduce raw fetch patterns.
- **Auto-save on each toggle change:** D-04 explicitly requires explicit save. Do not add onChange mutations.
- **Duplicating background_preference in the hook:** D-17 says useBackground handles this. Do not read/write it in useUserSettings.
- **Overwriting unrelated columns on save:** Only send the columns the UI controls. Do not null out `email_notifications`, `theme`, or `background_preference`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache invalidation after save | Manual cache update | `queryClient.invalidateQueries()` | TanStack Query handles refetch automatically |
| Loading states | Custom loading boolean + useEffect | `useQuery` `isLoading` / `isPending` | Already built into TanStack Query |
| Error retry | Custom retry logic | TanStack Query built-in retry (3 retries default) | Handles exponential backoff automatically |
| Mutation state tracking | Manual isPending boolean | `useMutation` `isPending` | Prevents double-submit for free |

## Common Pitfalls

### Pitfall 1: RLS Policy Gap for Upsert
**What goes wrong:** Supabase `.upsert()` requires both INSERT and UPDATE RLS policies. The `user_settings` table only has SELECT and UPDATE policies -- no INSERT policy exists.
**Why it happens:** The `handle_new_user` trigger creates the row, so INSERT was never needed from the client.
**How to avoid:** Either (a) use `.update()` instead of `.upsert()` since the trigger guarantees the row exists, or (b) add an INSERT policy in the migration if you want upsert safety.
**Warning signs:** Save fails with RLS violation error for users whose trigger may have failed.
**Recommendation:** Use `.update()` as the primary approach. Add an INSERT policy in the migration as a safety net so `.upsert()` can be used if needed -- this is low-cost insurance.

### Pitfall 2: String/Integer Mismatch
**What goes wrong:** The UI components use string values for Select components ("15", "10"), but the database stores integers (15, 10). Forgetting to cast causes type errors or silent data corruption.
**Why it happens:** HTML select values are always strings; PostgreSQL columns are integers.
**How to avoid:** Create explicit `mapDbToUi` and `mapUiToDb` functions that handle the conversion in one place.
**Warning signs:** TypeScript errors on assignment, or settings saving as "15" (string) instead of 15 (integer).

### Pitfall 3: Stale Draft After Save
**What goes wrong:** After save, the draft state still holds the old values until TanStack Query refetches and the useEffect re-syncs.
**Why it happens:** The `invalidateQueries` triggers a refetch, but there's a brief window.
**How to avoid:** Either (a) trust the invalidation cycle (fast enough for settings), or (b) optimistically update the draft in the `onSuccess` callback.
**Warning signs:** Brief flicker of old values after save.

### Pitfall 4: CHECK Constraint on reminder_minutes
**What goes wrong:** The existing `reminder_minutes` column has `CHECK (reminder_minutes IN (0, 5, 15, 30, 60))` but the UI only offers 5, 10, 15, 30 -- the value 10 is NOT in the CHECK constraint.
**Why it happens:** The UI was built independently of the DB schema.
**How to avoid:** The migration MUST alter the CHECK constraint to include 10, or the default "10 minutes before" will fail to save.
**Warning signs:** Save fails with check constraint violation for reminder_minutes = 10.

### Pitfall 5: Missing .single() on Select
**What goes wrong:** Without `.single()`, Supabase returns an array. The hook returns `[{...}]` instead of `{...}`.
**Why it happens:** `user_settings` has a UNIQUE constraint on `user_id`, but Supabase doesn't know that without `.single()`.
**How to avoid:** Always use `.single()` when fetching `user_settings` (one row per user guaranteed by schema).

## Code Examples

### Migration: Add Wellness Columns
```sql
-- Source: Schema from 03-CONTEXT.md D-09 + existing migration pattern
ALTER TABLE public.user_settings
  ADD COLUMN wellness_tips_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN auto_breaks_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN breathing_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN breathing_reminder_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN transition_buffer_enabled BOOLEAN NOT NULL DEFAULT false;

-- Fix CHECK constraint: reminder_minutes currently allows (0, 5, 15, 30, 60)
-- but UI offers value "10" which is not in the constraint
ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_reminder_minutes_check;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_reminder_minutes_check
  CHECK (reminder_minutes IN (0, 5, 10, 15, 30, 60));

-- Add CHECK constraint for breathing_reminder_minutes
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_breathing_reminder_minutes_check
  CHECK (breathing_reminder_minutes IN (5, 10, 15));

-- Add INSERT policy so upsert works as safety net
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Field Mapping Functions
```typescript
// Maps DB row to UI state shape
function mapDbToUi(db: DbSettings): UiSettings {
  return {
    syncFrequency: String(db.sync_frequency_minutes),
    notifications: db.notifications_enabled,
    reminderTime: String(db.reminder_minutes),
    wellnessTips: db.wellness_tips_enabled,
    autoBreaks: db.auto_breaks_enabled,
  };
}

// Maps UI state back to DB columns for update
function mapUiToDb(ui: UiSettings): DbPayload {
  return {
    sync_frequency_minutes: parseInt(ui.syncFrequency, 10),
    notifications_enabled: ui.notifications,
    reminder_minutes: parseInt(ui.reminderTime, 10),
    wellness_tips_enabled: ui.wellnessTips,
    auto_breaks_enabled: ui.autoBreaks,
  };
}
```

### Loading State (Skeleton Treatment)
```typescript
// Using opacity + disabled as lightweight loading treatment (D-07)
<div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
  <SyncSettings ... />
  <NotificationSettings ... />
</div>

// Alternative: shadcn Skeleton components for individual controls
import { Skeleton } from "@/components/ui/skeleton";
{isLoading ? <Skeleton className="h-14 w-full rounded-2xl" /> : <Select ... />}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| TanStack Query v4 `useQuery({ queryKey, queryFn })` | TanStack Query v5 (same API for basic usage) | 2024 | No breaking changes for this use case |
| Supabase JS v1 `.insert()` with `upsert: true` option | Supabase JS v2 `.upsert()` as separate method | 2023 | Use `.upsert()` or `.update()` directly |

## Open Questions

1. **Should breathing_reminder_enabled/minutes and transition_buffer_enabled have UI controls in this phase?**
   - What we know: D-09 adds the columns, D-10 says Phase 3 persists them. NotificationSettings currently has `wellnessTips` and `autoBreaks` toggles but no breathing/transition controls.
   - What's unclear: The CONTEXT.md does not add new UI controls for the 3 additional wellness columns. The UI only has controls for `wellnessTips` and `autoBreaks`.
   - Recommendation: Persist the default values via the migration. Phase 4 adds the UI controls for breathing/transition. This aligns with D-10: "Phase 3 does not implement the wellness engine behaviour, only the storage."

2. **Update vs Upsert?**
   - What we know: The `handle_new_user` trigger creates the row on signup. The table has no INSERT RLS policy.
   - Recommendation: Use `.upsert()` and add an INSERT policy in the migration. The cost is one extra line of SQL; the benefit is resilience to trigger failures for any edge-case users. This is the safest approach.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured |
| Config file | None |
| Quick run command | `npm run lint` |
| Full suite command | `npm run lint` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SET-01 | Sync frequency reads from and writes to DB | manual | Manual: change sync freq, refresh, verify value persists | N/A |
| SET-02 | Notification prefs read from and writes to DB | manual | Manual: toggle notifications, log out/in, verify values persist | N/A |

### Sampling Rate
- **Per task commit:** `npm run lint`
- **Per wave merge:** `npm run lint`
- **Phase gate:** Lint green + manual verification of success criteria 1-3

### Wave 0 Gaps
None -- no test infrastructure exists and CLAUDE.md explicitly states "No test framework is configured -- linting is the only automated quality check." Manual verification against the 3 success criteria is the quality gate for this phase.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/hooks/useCalendarConnections.ts`, `src/hooks/useMeetings.ts` -- established TanStack Query patterns
- Codebase analysis: `supabase/migrations/20251124004329_*.sql` -- full schema including RLS policies, CHECK constraints, triggers
- Codebase analysis: `src/components/calendar/CalendarSettings.tsx` -- current local state implementation
- Codebase analysis: `src/integrations/supabase/types.ts` -- current TypeScript types for user_settings
- Codebase analysis: `src/components/calendar/settings/NotificationSettings.tsx` -- props interface and UI controls

### Secondary (MEDIUM confidence)
- TanStack Query v5 `useMutation` API -- based on training data for v5 (stable API, low risk of staleness)
- Supabase JS v2 `.upsert()` / `.update()` API -- based on training data for v2 (stable API)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new deps
- Architecture: HIGH - following exact patterns from existing codebase hooks
- Pitfalls: HIGH - discovered via direct schema analysis (CHECK constraint gap is concrete, RLS policy gap is concrete)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- no fast-moving dependencies)
