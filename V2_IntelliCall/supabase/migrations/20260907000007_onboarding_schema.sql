-- ============================================================================
-- IntelliCall: 07 Onboarding Schema & Creator-Owner RLS Policy
-- ============================================================================

-- 1. Add onboarding columns and created_by to organizations
alter table organizations
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb;

create index if not exists idx_organizations_created_by on organizations(created_by);

-- 2. Organizations RLS: Allow authenticated users to create and view their workspace
drop policy if exists "Org members can view their organization" on organizations;
create policy "Org members can view their organization"
  on organizations for select
  using (
    is_org_member(id)
    or created_by = auth.uid()
  );

drop policy if exists "Authenticated users can create an organization" on organizations;
create policy "Authenticated users can create an organization"
  on organizations for insert
  with check (
    auth.role() = 'authenticated'
    and (created_by is null or created_by = auth.uid())
  );

-- Allow creator or org admins to update organization (including onboarding progress)
drop policy if exists "Org admins/owners can update their organization" on organizations;
create policy "Org admins/owners can update their organization"
  on organizations for update
  using (
    is_org_member(id)
    or created_by = auth.uid()
  )
  with check (
    is_org_member(id)
    or created_by = auth.uid()
  );

-- 3. Organization Members RLS: Strict first member = owner policy
-- Allows a user to insert a row for themselves with role = 'owner' ONLY when:
--  a) They are the authenticated user inserting their own profile (auth.uid() = user_id)
--  b) Role is 'owner'
--  c) They created the organization (or org.created_by is null at creation time)
--  d) NO members exist yet for that organization (first-member claim)
-- Subsequent members can only be added by an existing admin/owner.
drop policy if exists "Authenticated users can create initial org membership for self" on organization_members;
create policy "Authenticated users can create initial org membership for self"
  on organization_members for insert
  with check (
    (
      auth.uid() = user_id
      and role = 'owner'
      and exists (
        select 1 from organizations o
        where o.id = organization_members.organization_id
          and (o.created_by = auth.uid() or o.created_by is null)
      )
      and not exists (
        select 1 from organization_members existing_m
        where existing_m.organization_id = organization_members.organization_id
      )
    )
    or has_org_role(organization_id, 'admin')
  );
