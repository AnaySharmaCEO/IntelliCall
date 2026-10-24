# Database Debugging Report: IntelliCall / Resonology AI (App V2)

**Author:** Anay Sharma  
**Date:** 2026-10-20  
**Environment:** Supabase Cloud PostgreSQL (`wdmensuuqsbnxzecqlwz`, South Asia Mumbai)  
**File Location:** `docs/Debugging/App_V2_Debugging/database_debug.md`  

---

## 1. Executive Summary

This report analyzes the root database causes for HTTP 403 (Forbidden) and HTTP 400 (Bad Request) errors encountered by the frontend when communicating via the PostgREST Data API on Supabase Cloud.

### Summary of Discovered Database Root Causes:
1. **Missing PostgREST Table Grants on Phase 2 Tables (HTTP 403):**  
   Tables created in `20261019000001_phase_2_schema_extensions.sql` (`compliance_rules`, `phone_numbers`, `call_analyses`) were created *after* the initial grants migration (`20260907000006_enable_data_api.sql`). In PostgreSQL, grants do not apply retroactively to newly created tables without `ALTER DEFAULT PRIVILEGES`. Consequently, PostgREST rejects both `GET` and `POST` queries on these tables with `403 Forbidden` before RLS is even evaluated.
2. **Missing `organization_id` in Incoming Payloads (HTTP 400 & 403):**  
   Tables `leads`, `campaigns`, `appointments`, and `compliance_rules` enforce `organization_id UUID NOT NULL REFERENCES organizations(id)`. When frontend mutations do not supply `organization_id`, PostgREST either fails the `NOT NULL` constraint (400) or fails the RLS membership predicate (403).
3. **Column & Enum Discrepancies (HTTP 400):**  
   - `leads` table has column `name text not null`, but frontend inserts `first_name` and `last_name`.
   - `leads.status` is a custom PostgreSQL enum `lead_status` that lacks member `'pending'`.
   - `appointments` table lacks columns `title`, `host_name`, and `duration_minutes` that the appointments UI submits.
4. **User Organization Membership Isolation (HTTP 403 on RLS):**  
   RLS policies for `campaigns`, `compliance_rules`, and `calls` depend on security-definer helper functions `is_org_member(org_id)` and `has_org_role(org_id, min_role)`. Users who sign up without completing the onboarding sequence lack an active row in `organization_members`, causing all RLS checks to return `false`.

---

## 2. Deep Dive: Errors & Technical Diagnoses

### DB-01: PostgREST Permission Denied on `compliance_rules` and `phone_numbers` (403 Forbidden)
* **Log Signatures:**
  ```text
  GET https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/compliance_rules?select=*&order=created_at.desc 403 (Forbidden)
  GET https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/phone_numbers?select=*&order=created_at.desc 403 (Forbidden)
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/compliance_rules?select=* 403 (Forbidden)
  ```
* **PostgreSQL Root Cause:**
  In Supabase, PostgREST requests arrive as the `anon` or `authenticated` PostgreSQL role.
  In migration `20260907000006_enable_data_api.sql`, permissions were granted:
  ```sql
  grant select, insert, update, delete on all tables in schema public to authenticated;
  ```
  However, `public.compliance_rules`, `public.phone_numbers`, and `public.call_analyses` were created **subsequently** in `20261019000001_phase_2_schema_extensions.sql`. In standard PostgreSQL, `GRANT ON ALL TABLES` only affects tables that exist at the time the command is executed.
  Because no `GRANT ... TO authenticated` was added in the Phase 2 migration, the `authenticated` role has **zero privileges** on these tables.
* **Database Fix:**
  Execute explicit grants and configure default privileges for all future migrations:
  ```sql
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.compliance_rules TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.phone_numbers TO authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.call_analyses TO authenticated;

  -- Ensure all future tables inherit permissions automatically
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
  NOTIFY pgrst, 'reload schema';
  ```

---

### DB-02: `leads` Table Column & Enum Violations (400 Bad Request)
* **Log Signature:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/leads?select=* 400 (Bad Request)
  ```
* **Schema Inspection (`20260907000002_core_schema.sql` lines 103–122):**
  ```sql
  create table if not exists leads (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    campaign_id uuid references campaigns(id) on delete set null,
    owner_id uuid references profiles(id) on delete set null,
    name text not null,
    company text not null default '',
    title text not null default '',
    email text not null default '',
    phone text not null default '',
    status lead_status not null default 'new',
    ...
  );
  ```
* **Violations Detected:**
  1. **Missing Column:** Frontend sends `first_name` and `last_name`. PostgreSQL returns error: `column "first_name" of relation "leads" does not exist`.
  2. **Violated NOT NULL:** Because `name` was not supplied, `name text not null` fails.
  3. **Enum Type Conflict:** Frontend sends `status: 'pending'`. The `lead_status` PostgreSQL enum only contains:
     `'new', 'contacted', 'qualified', 'not_qualified', 'meeting_booked', 'meeting_attended', 'opportunity', 'converted', 'stalled'`.
* **Database Fix:**
  Add forward-compatible columns to `leads` table and extend `lead_status` enum:
  ```sql
  -- Allow first_name and last_name directly
  ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT;

  -- Add 'pending' to lead_status enum if not present
  DO $$ BEGIN
    ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'pending';
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  -- Trigger to automatically synchronize name <=> first_name + last_name
  CREATE OR REPLACE FUNCTION public.sync_lead_names()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.name IS NULL OR NEW.name = '' THEN
      NEW.name := trim(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''));
      IF NEW.name = '' THEN NEW.name := 'Lead'; END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trg_sync_lead_names ON public.leads;
  CREATE TRIGGER trg_sync_lead_names
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.sync_lead_names();
  ```

---

### DB-03: `appointments` Table Missing Fields & Enum Mismatch (400 Bad Request)
* **Log Signature:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/appointments?select=* 400 (Bad Request)
  ```
* **Schema Inspection (`20260907000002_core_schema.sql` lines 303–314):**
  ```sql
  create table if not exists appointments (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    lead_id uuid not null references leads(id) on delete cascade,
    call_id uuid references calls(id) on delete set null,
    decision_id uuid references decisions(id) on delete set null,
    scheduled_for timestamptz not null,
    status appointment_status not null default 'scheduled',
    booking_source booking_source not null default 'calendly',
    external_event_id text,
    created_at timestamptz not null default now()
  );
  ```
* **Violations Detected:**
  1. Frontend submits `title`, `hostName`, `durationMinutes`. None of these columns exist on `appointments`.
  2. `lead_id` is marked `not null`, but manual callback scheduling from the dashboard does not always have a pre-selected lead.
  3. Frontend sends `status: 'confirmed'`. The `appointment_status` enum members are: `'scheduled'`, `'rescheduled'`, `'completed'`, `'cancelled'`, `'no_show'`.
* **Database Fix:**
  Alter `appointments` to accommodate calendar scheduling data:
  ```sql
  ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Consultation Callback',
    ADD COLUMN IF NOT EXISTS host_name TEXT DEFAULT 'Representative',
    ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 30,
    ALTER COLUMN lead_id DROP NOT NULL;

  DO $$ BEGIN
    ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'confirmed';
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  ```

---

### DB-04: Multi-Tenant RLS Policy Failures on `campaigns` & `compliance_rules` (403 Forbidden)
* **Root Cause:**
  RLS on `campaigns` requires:
  ```sql
  using (has_org_role(organization_id, 'admin'))
  ```
  `has_org_role` checks:
  ```sql
  select role into user_actual_role
  from organization_members
  where organization_id = org_id
    and user_id = auth.uid()
    and status = 'active';
  ```
  If:
  1. The insert payload omits `organization_id`, `has_org_role(null, ...)` returns `false`.
  2. The authenticated user does not have a row in `organization_members`, the query returns `null`, and `false` is returned.
* **Database Fix:**
  1. Provide a stored procedure or trigger to ensure that whenever a new user profile is created, they are automatically granted a default organization and marked as `'owner'` in `organization_members`.
  2. Ensure frontend always resolves and passes `organization_id`.

---

## 3. Database Migration Script Specification

Create migration file `supabase/migrations/20261021000001_phase_2_schema_and_grant_fixes.sql`:
1. **Grants & Default Privileges:** Grant `ALL` on `compliance_rules`, `phone_numbers`, `call_analyses` to `authenticated` and `anon`. Configure `ALTER DEFAULT PRIVILEGES`.
2. **Schema Adaptations for Leads:** Add `first_name`, `last_name` columns and trigger `sync_lead_names()`. Add `'pending'` to `lead_status` enum.
3. **Schema Adaptations for Appointments:** Add `title`, `host_name`, `duration_minutes`. Drop `NOT NULL` on `lead_id`. Add `'confirmed'` to `appointment_status`.
4. **Auto-Workspace Provisioning Trigger:** Ensure newly registered users receive an organization and active owner membership immediately upon sign-up.
5. **PostgREST Schema Reload:** `NOTIFY pgrst, 'reload schema'`.
