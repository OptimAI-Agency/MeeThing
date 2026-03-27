-- Add unique constraint on (user_id, external_id) to support upsert in calendar sync
ALTER TABLE public.meetings
  ADD CONSTRAINT meetings_user_external_id_unique UNIQUE (user_id, external_id);
