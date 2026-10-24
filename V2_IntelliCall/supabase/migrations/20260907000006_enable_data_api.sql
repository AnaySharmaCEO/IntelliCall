-- ============================================================================
-- IntelliCall: 06 Enable Data API (PostgREST) Access & Schema Cache Reload
-- ============================================================================
-- The Supabase JavaScript client (both in the frontend browser and edge functions)
-- interacts with tables via the Data API (PostgREST).
--
-- Security is strictly enforced by Row Level Security (RLS) policies created
-- in migration 03. Granting access to the 'authenticated' and 'anon' roles allows
-- PostgREST to expose the routes, while RLS ensures users can only access data
-- within their own organization.
-- ============================================================================

-- 1. Ensure schema usage
grant usage on schema public to anon, authenticated, service_role;

-- 2. Grant table permissions to authenticated users and service_role
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to postgres, service_role;

-- 3. Grant sequence permissions for auto-incrementing / identity columns
grant usage, select on all sequences in schema public to authenticated;
grant all on all sequences in schema public to postgres, service_role;

-- 4. Enable Realtime for live call status updates (used by AIStateBanner & Live Call Drawer)
do $$ begin
  alter publication supabase_realtime add table calls;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table decisions;
exception when duplicate_object then null; end $$;

-- 5. Force PostgREST to reload its schema cache immediately
notify pgrst, 'reload schema';
