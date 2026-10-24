-- ==============================================================================
-- Migration: 20261021000001_phase_2_schema_and_grant_fixes.sql
-- Description:
--   1. Fix PostgreSQL ACL table grants for Phase 2 tables (compliance_rules, phone_numbers, call_analyses).
--   2. Extend leads table with first_name, last_name, sync trigger, and 'pending' enum value.
--   3. Extend appointments table with title, host_name, duration_minutes, nullable lead_id, 'confirmed' enum value.
--   4. Reload schema cache for PostgREST.
-- Author: Anay Sharma
-- ==============================================================================

-- 1. Table Grants & Privileges (Fixes 403 Forbidden on PostgREST for Phase 2 tables)
GRANT ALL ON TABLE public.compliance_rules TO authenticated;
GRANT ALL ON TABLE public.compliance_rules TO service_role;
GRANT SELECT ON TABLE public.compliance_rules TO anon;

GRANT ALL ON TABLE public.phone_numbers TO authenticated;
GRANT ALL ON TABLE public.phone_numbers TO service_role;
GRANT SELECT ON TABLE public.phone_numbers TO anon;

GRANT ALL ON TABLE public.call_analyses TO authenticated;
GRANT ALL ON TABLE public.call_analyses TO service_role;
GRANT SELECT ON TABLE public.call_analyses TO anon;

-- Ensure future tables inherit grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- 2. Extend lead_status enum with 'pending'
DO $$ BEGIN
  ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'pending';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Extend leads table with first_name and last_name
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill first_name / last_name from name where null
UPDATE public.leads
SET
  first_name = split_part(name, ' ', 1),
  last_name = nullif(substr(name, length(split_part(name, ' ', 1)) + 2), '')
WHERE first_name IS NULL AND name IS NOT NULL;

-- Trigger to keep name, first_name, and last_name synchronized
CREATE OR REPLACE FUNCTION public.sync_lead_names()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := trim(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''));
    IF NEW.name = '' THEN NEW.name := 'Lead'; END IF;
  END IF;
  IF NEW.first_name IS NULL THEN
    NEW.first_name := split_part(NEW.name, ' ', 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_lead_names ON public.leads;
CREATE TRIGGER trg_sync_lead_names
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.sync_lead_names();

-- 4. Extend appointment_status enum with 'confirmed'
DO $$ BEGIN
  ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'confirmed';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. Extend appointments table
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Consultation Callback',
  ADD COLUMN IF NOT EXISTS host_name TEXT DEFAULT 'Representative',
  ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30;

ALTER TABLE public.appointments
  ALTER COLUMN lead_id DROP NOT NULL;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
