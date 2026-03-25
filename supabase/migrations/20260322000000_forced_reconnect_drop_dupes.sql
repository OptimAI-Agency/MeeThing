-- Phase 1: Forced reconnect — delete all existing calendar connections (plaintext tokens)
-- Users must reconnect Google Calendar after this migration.
-- Also drops duplicate encrypted_* columns from the second migration.

DELETE FROM public.meetings;
DELETE FROM public.calendar_connections;

ALTER TABLE public.calendar_connections
  DROP COLUMN IF EXISTS encrypted_access_token,
  DROP COLUMN IF EXISTS encrypted_refresh_token;
