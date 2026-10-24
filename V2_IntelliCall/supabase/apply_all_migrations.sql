-- ============================================================================
-- IntelliCall — Consolidated Supabase Cloud Migration
--
-- Instructions:
-- Paste this entire script into your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>/sql/new
-- and click "RUN".
-- ============================================================================

begin;

-- ============================================================================
-- PART 1: Foundation (Auth, Profiles, Organizations, Members & Core RLS)
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type user_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_status as enum ('active', 'invited');
exception when duplicate_object then null; end $$;

-- 1. Profiles (1:1 with auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  avatar_initials text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_slug on organizations(slug);

-- 3. Organization Members
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

-- 4. RLS Helper Functions (Security Definer)
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

-- 5. Foundation RLS Policies
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can view org-mate profiles" on profiles;
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

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Service role has full access to profiles" on profiles;
create policy "Service role has full access to profiles"
  on profiles for all
  using (auth.jwt()->>'role' = 'service_role');

-- Organizations policies
drop policy if exists "Org members can view their organization" on organizations;
create policy "Org members can view their organization"
  on organizations for select
  using (is_org_member(id));

drop policy if exists "Authenticated users can create an organization" on organizations;
create policy "Authenticated users can create an organization"
  on organizations for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Org admins/owners can update their organization" on organizations;
create policy "Org admins/owners can update their organization"
  on organizations for update
  using (has_org_role(id, 'admin'))
  with check (has_org_role(id, 'admin'));

drop policy if exists "Org owners can delete their organization" on organizations;
create policy "Org owners can delete their organization"
  on organizations for delete
  using (has_org_role(id, 'owner'));

drop policy if exists "Service role has full access to organizations" on organizations;
create policy "Service role has full access to organizations"
  on organizations for all
  using (auth.jwt()->>'role' = 'service_role');

-- Organization Members policies
drop policy if exists "Org members can view membership in their organization" on organization_members;
create policy "Org members can view membership in their organization"
  on organization_members for select
  using (is_org_member(organization_id));

drop policy if exists "Authenticated users can create initial org membership for self" on organization_members;
create policy "Authenticated users can create initial org membership for self"
  on organization_members for insert
  with check (
    auth.uid() = user_id
    or has_org_role(organization_id, 'admin')
  );

drop policy if exists "Admins/owners can update org members" on organization_members;
create policy "Admins/owners can update org members"
  on organization_members for update
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

drop policy if exists "Admins/owners can delete org members" on organization_members;
create policy "Admins/owners can delete org members"
  on organization_members for delete
  using (has_org_role(organization_id, 'admin'));

drop policy if exists "Service role has full access to organization_members" on organization_members;
create policy "Service role has full access to organization_members"
  on organization_members for all
  using (auth.jwt()->>'role' = 'service_role');

-- 6. Trigger: Automatic Profile on Signup
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


-- ============================================================================
-- PART 2: Core MVP Schema
-- ============================================================================

do $$ begin
  create type lead_status as enum (
    'new', 'queued', 'contacted', 'qualified', 'not_qualified',
    'meeting_booked', 'meeting_attended', 'opportunity', 'converted', 'stalled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type agent_status as enum ('draft', 'active', 'inactive', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_lead_status as enum ('queued', 'in_progress', 'completed', 'excluded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type call_status as enum (
    'scheduled', 'calling', 'connected', 'processing',
    'completed', 'failed', 'cancelled', 'no_answer', 'voicemail'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type speaker_type as enum ('agent', 'prospect');
exception when duplicate_object then null; end $$;

do $$ begin
  create type confidence_tier as enum ('high', 'medium', 'low');
exception when duplicate_object then null; end $$;

do $$ begin
  create type decision_outcome as enum ('qualified', 'not_qualified', 'review_required');
exception when duplicate_object then null; end $$;

do $$ begin
  create type action_type as enum ('book_meeting', 'send_followup', 'update_status', 'escalate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type action_status as enum ('pending', 'executed', 'dismissed', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type outcome_stage as enum (
    'qualified', 'meeting_booked', 'meeting_attended', 'opportunity', 'converted', 'stalled', 'lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_source as enum ('calendly', 'manual', 'ai_booked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type followup_status as enum ('pending', 'done', 'dismissed');
exception when duplicate_object then null; end $$;

-- 1. Agents
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  objective text not null,
  language text not null default 'English',
  voice text not null default 'Alloy',
  qualification_goal text,
  permitted_actions action_type[] not null default '{book_meeting,send_followup,update_status}',
  status agent_status not null default 'draft',
  voice_config jsonb not null default '{}'::jsonb,
  script_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agents_org on agents(organization_id);

-- 2. Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete restrict,
  name text not null,
  status campaign_status not null default 'draft',
  confidence_threshold numeric(5,2) not null default 80.00,
  strategy text not null default 'direct_qualification',
  strategy_config jsonb not null default '{}'::jsonb,
  leads_targeted integer not null default 0,
  qualification_rate numeric(5,2),
  meetings_booked integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_org on campaigns(organization_id);
create index if not exists idx_campaigns_agent on campaigns(agent_id);

-- 3. Leads
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
  source text,
  confidence_score numeric(5,2),
  confidence_tier confidence_tier,
  notes text,
  last_activity_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_org_status on leads(organization_id, status);
create index if not exists idx_leads_campaign on leads(campaign_id);
create index if not exists idx_leads_owner on leads(owner_id);

-- 4. Campaign Leads
create table if not exists campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  status campaign_lead_status not null default 'queued',
  added_at timestamptz not null default now(),
  constraint unique_campaign_lead unique (campaign_id, lead_id)
);

create index if not exists idx_campaign_leads_camp on campaign_leads(campaign_id);
create index if not exists idx_campaign_leads_lead on campaign_leads(lead_id);

-- 5. Lead Status History
create table if not exists lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  old_status lead_status,
  new_status lead_status not null,
  changed_by uuid references profiles(id) on delete set null,
  note text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_lead_status_history_lead on lead_status_history(lead_id, changed_at desc);

-- 6. Calls
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  status call_status not null default 'scheduled',
  duration_seconds integer,
  decision_id uuid,
  recording_path text,
  scheduled_for timestamptz,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_calls_org_status on calls(organization_id, status);
create index if not exists idx_calls_lead on calls(lead_id);
create index if not exists idx_calls_campaign on calls(campaign_id);
create index if not exists idx_calls_scheduled on calls(status, scheduled_for) where status = 'scheduled';

-- 7. Transcripts & Turns
create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references calls(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_transcripts_call on transcripts(call_id);

create table if not exists transcript_turns (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references transcripts(id) on delete cascade,
  speaker speaker_type not null,
  turn_index integer not null,
  text text not null,
  timestamp_seconds numeric(6,2) not null default 0.0,
  signals text[] not null default '{}',
  started_at_ms integer,
  ended_at_ms integer
);

create index if not exists idx_transcript_turns_order on transcript_turns(transcript_id, turn_index);

-- 8. Decisions
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  call_id uuid not null unique references calls(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  outcome decision_outcome not null default 'review_required',
  confidence_score numeric(5,2) not null default 0.0,
  confidence_tier confidence_tier not null default 'medium',
  reason text not null default '',
  recommended_action action_type not null default 'book_meeting',
  actual_action action_type,
  action_status action_status not null default 'pending',
  trace jsonb not null default '[]'::jsonb,
  overridden_by uuid references profiles(id) on delete set null,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_decisions_org_action on decisions(organization_id, action_status);
create index if not exists idx_decisions_org_outcome on decisions(organization_id, outcome);
create index if not exists idx_decisions_lead on decisions(lead_id);
create index if not exists idx_decisions_call on decisions(call_id);

-- Connect calls.decision_id FK
do $$ begin
  alter table calls
    add constraint fk_calls_decision
    foreign key (decision_id)
    references decisions(id)
    on delete set null;
exception when duplicate_object then null; end $$;

-- 9. Evidence Signals
create table if not exists evidence_signals (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references calls(id) on delete cascade,
  decision_id uuid references decisions(id) on delete cascade,
  transcript_turn_id uuid references transcript_turns(id) on delete set null,
  quote text not null,
  signal text not null,
  weight text not null default 'medium',
  timestamp_seconds numeric(6,2) not null default 0.0,
  created_at timestamptz not null default now()
);

create index if not exists idx_evidence_decision on evidence_signals(decision_id);
create index if not exists idx_evidence_call on evidence_signals(call_id);

-- 10. Actions
create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  decision_id uuid not null references decisions(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  type action_type not null,
  status action_status not null default 'pending',
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_actions_decision on actions(decision_id);
create index if not exists idx_actions_lead on actions(lead_id);

-- 11. Outcomes
create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  decision_id uuid not null references decisions(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  stage outcome_stage not null default 'qualified',
  stalled boolean not null default false,
  meeting_booked_at timestamptz,
  meeting_attended_at timestamptz,
  opportunity_created_at timestamptz,
  converted_at timestamptz,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_outcomes_org_stage on outcomes(organization_id, stage);
create index if not exists idx_outcomes_decision on outcomes(decision_id);
create index if not exists idx_outcomes_lead on outcomes(lead_id);

-- 12. Appointments
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

create index if not exists idx_appointments_org on appointments(organization_id);
create index if not exists idx_appointments_lead on appointments(lead_id);

-- 13. Follow Ups
create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  type text not null default 'email',
  due_at timestamptz not null,
  status followup_status not null default 'pending',
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_follow_ups_org_status on follow_ups(organization_id, status);
create index if not exists idx_follow_ups_due on follow_ups(status, due_at);

-- 14. Audit Log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_org_created on audit_log(organization_id, created_at desc);


-- ============================================================================
-- PART 3: Row Level Security Policies
-- ============================================================================

alter table agents enable row level security;
alter table campaigns enable row level security;
alter table leads enable row level security;
alter table campaign_leads enable row level security;
alter table lead_status_history enable row level security;
alter table calls enable row level security;
alter table transcripts enable row level security;
alter table transcript_turns enable row level security;
alter table decisions enable row level security;
alter table evidence_signals enable row level security;
alter table actions enable row level security;
alter table outcomes enable row level security;
alter table appointments enable row level security;
alter table follow_ups enable row level security;
alter table audit_log enable row level security;

-- Agents Policies
drop policy if exists "Org members can view agents" on agents;
create policy "Org members can view agents"
  on agents for select
  using (is_org_member(organization_id));

drop policy if exists "Org admins can manage agents" on agents;
create policy "Org admins can manage agents"
  on agents for all
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

drop policy if exists "Service role has full access to agents" on agents;
create policy "Service role has full access to agents"
  on agents for all
  using (auth.jwt()->>'role' = 'service_role');

-- Campaigns Policies
drop policy if exists "Org members can view campaigns" on campaigns;
create policy "Org members can view campaigns"
  on campaigns for select
  using (is_org_member(organization_id));

drop policy if exists "Org admins can manage campaigns" on campaigns;
create policy "Org admins can manage campaigns"
  on campaigns for all
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

drop policy if exists "Service role has full access to campaigns" on campaigns;
create policy "Service role has full access to campaigns"
  on campaigns for all
  using (auth.jwt()->>'role' = 'service_role');

-- Leads Policies
drop policy if exists "Org members can view leads" on leads;
create policy "Org members can view leads"
  on leads for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can insert leads" on leads;
create policy "Org members can insert leads"
  on leads for insert
  with check (is_org_member(organization_id));

drop policy if exists "Org members can update leads" on leads;
create policy "Org members can update leads"
  on leads for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Org admins can delete leads" on leads;
create policy "Org admins can delete leads"
  on leads for delete
  using (has_org_role(organization_id, 'admin'));

drop policy if exists "Service role has full access to leads" on leads;
create policy "Service role has full access to leads"
  on leads for all
  using (auth.jwt()->>'role' = 'service_role');

-- Campaign Leads Policies
drop policy if exists "Org members can view campaign_leads" on campaign_leads;
create policy "Org members can view campaign_leads"
  on campaign_leads for select
  using (
    exists (
      select 1 from campaigns
      where campaigns.id = campaign_leads.campaign_id
        and is_org_member(campaigns.organization_id)
    )
  );

drop policy if exists "Org members can manage campaign_leads" on campaign_leads;
create policy "Org members can manage campaign_leads"
  on campaign_leads for all
  using (
    exists (
      select 1 from campaigns
      where campaigns.id = campaign_leads.campaign_id
        and is_org_member(campaigns.organization_id)
    )
  );

drop policy if exists "Service role has full access to campaign_leads" on campaign_leads;
create policy "Service role has full access to campaign_leads"
  on campaign_leads for all
  using (auth.jwt()->>'role' = 'service_role');

-- Lead Status History Policies
drop policy if exists "Org members can view lead_status_history" on lead_status_history;
create policy "Org members can view lead_status_history"
  on lead_status_history for select
  using (
    exists (
      select 1 from leads
      where leads.id = lead_status_history.lead_id
        and is_org_member(leads.organization_id)
    )
  );

drop policy if exists "Service role has full access to lead_status_history" on lead_status_history;
create policy "Service role has full access to lead_status_history"
  on lead_status_history for all
  using (auth.jwt()->>'role' = 'service_role');

-- Calls Policies
drop policy if exists "Org members can view calls" on calls;
create policy "Org members can view calls"
  on calls for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can create calls" on calls;
create policy "Org members can create calls"
  on calls for insert
  with check (is_org_member(organization_id));

drop policy if exists "Org members can update calls" on calls;
create policy "Org members can update calls"
  on calls for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to calls" on calls;
create policy "Service role has full access to calls"
  on calls for all
  using (auth.jwt()->>'role' = 'service_role');

-- Transcripts & Turns Policies
drop policy if exists "Org members can view transcripts" on transcripts;
create policy "Org members can view transcripts"
  on transcripts for select
  using (
    exists (
      select 1 from calls
      where calls.id = transcripts.call_id
        and is_org_member(calls.organization_id)
    )
  );

drop policy if exists "Org members can view transcript turns" on transcript_turns;
create policy "Org members can view transcript turns"
  on transcript_turns for select
  using (
    exists (
      select 1 from transcripts
      join calls on calls.id = transcripts.call_id
      where transcripts.id = transcript_turns.transcript_id
        and is_org_member(calls.organization_id)
    )
  );

drop policy if exists "Service role has full access to transcripts" on transcripts;
create policy "Service role has full access to transcripts"
  on transcripts for all
  using (auth.jwt()->>'role' = 'service_role');

drop policy if exists "Service role has full access to transcript turns" on transcript_turns;
create policy "Service role has full access to transcript turns"
  on transcript_turns for all
  using (auth.jwt()->>'role' = 'service_role');

-- Decisions Policies
drop policy if exists "Org members can view decisions" on decisions;
create policy "Org members can view decisions"
  on decisions for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can update decisions" on decisions;
create policy "Org members can update decisions"
  on decisions for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to decisions" on decisions;
create policy "Service role has full access to decisions"
  on decisions for all
  using (auth.jwt()->>'role' = 'service_role');

-- Evidence Signals Policies
drop policy if exists "Org members can view evidence signals" on evidence_signals;
create policy "Org members can view evidence signals"
  on evidence_signals for select
  using (
    exists (
      select 1 from calls
      where calls.id = evidence_signals.call_id
        and is_org_member(calls.organization_id)
    )
  );

drop policy if exists "Service role has full access to evidence signals" on evidence_signals;
create policy "Service role has full access to evidence signals"
  on evidence_signals for all
  using (auth.jwt()->>'role' = 'service_role');

-- Actions Policies
drop policy if exists "Org members can view actions" on actions;
create policy "Org members can view actions"
  on actions for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can update actions" on actions;
create policy "Org members can update actions"
  on actions for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to actions" on actions;
create policy "Service role has full access to actions"
  on actions for all
  using (auth.jwt()->>'role' = 'service_role');

-- Outcomes Policies
drop policy if exists "Org members can view outcomes" on outcomes;
create policy "Org members can view outcomes"
  on outcomes for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can update outcomes" on outcomes;
create policy "Org members can update outcomes"
  on outcomes for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to outcomes" on outcomes;
create policy "Service role has full access to outcomes"
  on outcomes for all
  using (auth.jwt()->>'role' = 'service_role');

-- Appointments Policies
drop policy if exists "Org members can view appointments" on appointments;
create policy "Org members can view appointments"
  on appointments for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can manage appointments" on appointments;
create policy "Org members can manage appointments"
  on appointments for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to appointments" on appointments;
create policy "Service role has full access to appointments"
  on appointments for all
  using (auth.jwt()->>'role' = 'service_role');

-- Follow Ups Policies
drop policy if exists "Org members can view follow ups" on follow_ups;
create policy "Org members can view follow ups"
  on follow_ups for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can manage follow ups" on follow_ups;
create policy "Org members can manage follow ups"
  on follow_ups for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to follow ups" on follow_ups;
create policy "Service role has full access to follow ups"
  on follow_ups for all
  using (auth.jwt()->>'role' = 'service_role');

-- Audit Log Policies
drop policy if exists "Org members can view audit log" on audit_log;
create policy "Org members can view audit log"
  on audit_log for select
  using (is_org_member(organization_id));

drop policy if exists "Org members can insert audit log" on audit_log;
create policy "Org members can insert audit log"
  on audit_log for insert
  with check (is_org_member(organization_id));

drop policy if exists "Service role has full access to audit log" on audit_log;
create policy "Service role has full access to audit log"
  on audit_log for all
  using (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- PART 4: Triggers & Maintenance
-- ============================================================================

create or replace function touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on profiles;
create trigger touch_profiles_updated_at
  before update on profiles
  for each row execute function touch_updated_at();

drop trigger if exists touch_organizations_updated_at on organizations;
create trigger touch_organizations_updated_at
  before update on organizations
  for each row execute function touch_updated_at();

drop trigger if exists touch_agents_updated_at on agents;
create trigger touch_agents_updated_at
  before update on agents
  for each row execute function touch_updated_at();

drop trigger if exists touch_campaigns_updated_at on campaigns;
create trigger touch_campaigns_updated_at
  before update on campaigns
  for each row execute function touch_updated_at();

drop trigger if exists touch_leads_updated_at on leads;
create trigger touch_leads_updated_at
  before update on leads
  for each row execute function touch_updated_at();

-- Lead Status History Trigger Function
create or replace function record_lead_status_history()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into lead_status_history (
      lead_id,
      old_status,
      new_status,
      changed_by,
      note,
      changed_at
    )
    values (
      new.id,
      old.status,
      new.status,
      auth.uid(),
      null,
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_lead_status_changed on leads;
create trigger on_lead_status_changed
  after update of status on leads
  for each row execute function record_lead_status_history();


-- ============================================================================
-- PART 5: Storage (call-recordings Bucket & Policies)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'call-recordings',
  'call-recordings',
  false,
  52428800,
  array['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 52428800;

drop policy if exists "Org members can read call recordings" on storage.objects;
create policy "Org members can read call recordings"
  on storage.objects for select
  using (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      is_org_member(((regexp_split_to_array(name, '/'))[1])::uuid)
    )
  );

drop policy if exists "Org members can upload call recordings" on storage.objects;
create policy "Org members can upload call recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      is_org_member(((regexp_split_to_array(name, '/'))[1])::uuid)
    )
  );

drop policy if exists "Org admins can delete call recordings" on storage.objects;
create policy "Org admins can delete call recordings"
  on storage.objects for delete
  using (
    bucket_id = 'call-recordings'
    and auth.role() = 'authenticated'
    and (
      has_org_role(((regexp_split_to_array(name, '/'))[1])::uuid, 'admin')
    )
  );

-- ============================================================================
-- PART 6: Enable Data API (PostgREST) Access & Schema Cache Reload
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to authenticated;
grant all on all sequences in schema public to postgres, service_role;

do $$ begin
  alter publication supabase_realtime add table calls;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table decisions;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- PART 7: Onboarding Schema & Creator-Owner RLS Policy
-- ============================================================================

alter table organizations
  add column if not exists created_by uuid references profiles(id) on delete set null,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb;

create index if not exists idx_organizations_created_by on organizations(created_by);

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

notify pgrst, 'reload schema';

commit;


