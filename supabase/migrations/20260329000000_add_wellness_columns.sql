-- Phase 3: Add wellness columns to user_settings (D-09)
-- These columns are persisted by Phase 3 and read by Phase 4 (D-10)

ALTER TABLE public.user_settings
  ADD COLUMN wellness_tips_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN auto_breaks_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN breathing_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN breathing_reminder_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN transition_buffer_enabled BOOLEAN NOT NULL DEFAULT false;

-- Fix CHECK constraint on reminder_minutes: current constraint allows (0, 5, 15, 30, 60)
-- but UI offers value "10" which is NOT in the constraint (Pitfall 4)
ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_reminder_minutes_check;
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_reminder_minutes_check
  CHECK (reminder_minutes IN (0, 5, 10, 15, 30, 60));

-- Add CHECK constraint for breathing_reminder_minutes (valid: 5, 10, 15)
ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_breathing_reminder_minutes_check
  CHECK (breathing_reminder_minutes IN (5, 10, 15));

-- Add INSERT RLS policy so upsert works as safety net (Pitfall 1 from RESEARCH.md)
CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
