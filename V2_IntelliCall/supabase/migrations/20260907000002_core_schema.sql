-- ============================================================================
-- IntelliCall: 02 Core MVP Schema (Leads, Agents, Campaigns, Calls, AI, Outcomes)
-- ============================================================================

-- Core Enums
create type lead_status as enum (
  'new',
  'queued',
  'contacted',
  'qualified',
  'not_qualified',
  'meeting_booked',
  'meeting_attended',
  'opportunity',
  'converted',
  'stalled'
);

create type agent_status as enum ('draft', 'active', 'inactive', 'archived');
create type campaign_status as enum ('draft', 'active', 'paused', 'completed', 'archived');
create type campaign_lead_status as enum ('queued', 'in_progress', 'completed', 'excluded');

create type call_status as enum (
  'scheduled',
  'calling',
  'connected',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'no_answer',
  'voicemail'
);

create type speaker_type as enum ('agent', 'prospect');
create type confidence_tier as enum ('high', 'medium', 'low');
create type decision_outcome as enum ('qualified', 'not_qualified', 'review_required');
create type action_type as enum ('book_meeting', 'send_followup', 'update_status', 'escalate');
create type action_status as enum ('pending', 'executed', 'dismissed', 'failed');

create type outcome_stage as enum (
  'qualified',
  'meeting_booked',
  'meeting_attended',
  'opportunity',
  'converted',
  'stalled',
  'lost'
);

create type appointment_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type booking_source as enum ('calendly', 'manual', 'ai_booked');
create type followup_status as enum ('pending', 'done', 'dismissed');

-- ----------------------------------------------------------------------------
-- 1. Agents
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 2. Campaigns (One Agent per Campaign)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 3. Leads
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. Campaign Leads (Join: targeting & progress within campaign)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 5. Lead Status History
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. Calls
-- ----------------------------------------------------------------------------
create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  status call_status not null default 'scheduled',
  duration_seconds integer,
  decision_id uuid, -- FK added after decisions table
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

-- ----------------------------------------------------------------------------
-- 7. Transcripts & Turns
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 8. Decisions
-- ----------------------------------------------------------------------------
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

-- Foreign key back from calls.decision_id to decisions.id
alter table calls
  add constraint fk_calls_decision
  foreign key (decision_id)
  references decisions(id)
  on delete set null;

-- ----------------------------------------------------------------------------
-- 9. Evidence Signals
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. Actions
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 11. Outcomes
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 12. Appointments
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 13. Follow Ups
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 14. Audit Log
-- ----------------------------------------------------------------------------
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
