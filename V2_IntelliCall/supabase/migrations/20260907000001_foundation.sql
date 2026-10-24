-- ============================================================================
-- IntelliCall: 01 Foundation (Auth, Profiles, Organizations, Members & Core RLS)
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('owner', 'admin', 'member');
create type member_status as enum ('active', 'invited');

-- ----------------------------------------------------------------------------
-- 1. Profiles (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  avatar_initials text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Organizations
-- ----------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_slug on organizations(slug);

-- ----------------------------------------------------------------------------
-- 3. Organization Members
-- ----------------------------------------------------------------------------
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null default 'member',
  status member_status not null default 'active',
  invited_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint unique_org_user unique (organization_id, user_id)
);

create index if not exists idx_org_members_org_user on organization_members(organization_id, user_id);
create index if not exists idx_org_members_user on organization_members(user_id);

-- ----------------------------------------------------------------------------
-- 4. RLS Helper Functions (Security Definer)
-- ----------------------------------------------------------------------------
create or replace function is_org_member(org_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function has_org_role(org_id uuid, min_role user_role)
returns boolean
language plpgsql security definer stable set search_path = public as $$
declare
  user_actual_role user_role;
begin
  select role into user_actual_role
  from organization_members
  where organization_id = org_id
    and user_id = auth.uid()
    and status = 'active';

  if user_actual_role is null then
    return false;
  end if;

  if min_role = 'member' then
    return true;
  elsif min_role = 'admin' then
    return user_actual_role in ('owner', 'admin');
  elsif min_role = 'owner' then
    return user_actual_role = 'owner';
  end if;

  return false;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Foundation RLS Policies
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can view org-mate profiles"
  on profiles for select
  using (
    exists (
      select 1 from organization_members om1
      join organization_members om2 on om1.organization_id = om2.organization_id
      where om1.user_id = auth.uid()
        and om2.user_id = profiles.id
        and om1.status = 'active'
        and om2.status = 'active'
    )
  );

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service role has full access to profiles"
  on profiles for all
  using (auth.jwt()->>'role' = 'service_role');

-- Organizations policies
create policy "Org members can view their organization"
  on organizations for select
  using (is_org_member(id));

create policy "Authenticated users can create an organization"
  on organizations for insert
  with check (auth.role() = 'authenticated');

create policy "Org admins/owners can update their organization"
  on organizations for update
  using (has_org_role(id, 'admin'))
  with check (has_org_role(id, 'admin'));

create policy "Org owners can delete their organization"
  on organizations for delete
  using (has_org_role(id, 'owner'));

create policy "Service role has full access to organizations"
  on organizations for all
  using (auth.jwt()->>'role' = 'service_role');

-- Organization Members policies
create policy "Org members can view membership in their organization"
  on organization_members for select
  using (is_org_member(organization_id));

create policy "Authenticated users can create initial org membership for self"
  on organization_members for insert
  with check (
    auth.uid() = user_id
    or has_org_role(organization_id, 'admin')
  );

create policy "Admins/owners can update org members"
  on organization_members for update
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

create policy "Admins/owners can delete org members"
  on organization_members for delete
  using (has_org_role(organization_id, 'admin'));

create policy "Service role has full access to organization_members"
  on organization_members for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 6. Trigger: Automatic Profile on Signup
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  raw_name text;
  initials text;
begin
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  initials := upper(substring(raw_name from 1 for 2));

  insert into public.profiles (id, name, email, avatar_initials, avatar_url)
  values (
    new.id,
    raw_name,
    new.email,
    initials,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
