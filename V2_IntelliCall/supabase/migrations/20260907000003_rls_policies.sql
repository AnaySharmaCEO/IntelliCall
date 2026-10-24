-- ============================================================================
-- IntelliCall: 03 Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
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

-- ----------------------------------------------------------------------------
-- 1. Agents Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view agents"
  on agents for select
  using (is_org_member(organization_id));

create policy "Org admins can manage agents"
  on agents for all
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

create policy "Service role has full access to agents"
  on agents for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 2. Campaigns Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view campaigns"
  on campaigns for select
  using (is_org_member(organization_id));

create policy "Org admins can manage campaigns"
  on campaigns for all
  using (has_org_role(organization_id, 'admin'))
  with check (has_org_role(organization_id, 'admin'));

create policy "Service role has full access to campaigns"
  on campaigns for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 3. Leads Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view leads"
  on leads for select
  using (is_org_member(organization_id));

create policy "Org members can insert leads"
  on leads for insert
  with check (is_org_member(organization_id));

create policy "Org members can update leads"
  on leads for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Org admins can delete leads"
  on leads for delete
  using (has_org_role(organization_id, 'admin'));

create policy "Service role has full access to leads"
  on leads for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. Campaign Leads Policies (Join through campaigns)
-- ----------------------------------------------------------------------------
create policy "Org members can view campaign_leads"
  on campaign_leads for select
  using (
    exists (
      select 1 from campaigns
      where campaigns.id = campaign_leads.campaign_id
        and is_org_member(campaigns.organization_id)
    )
  );

create policy "Org members can manage campaign_leads"
  on campaign_leads for all
  using (
    exists (
      select 1 from campaigns
      where campaigns.id = campaign_leads.campaign_id
        and is_org_member(campaigns.organization_id)
    )
  );

create policy "Service role has full access to campaign_leads"
  on campaign_leads for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 5. Lead Status History Policies (Join through leads)
-- ----------------------------------------------------------------------------
create policy "Org members can view lead_status_history"
  on lead_status_history for select
  using (
    exists (
      select 1 from leads
      where leads.id = lead_status_history.lead_id
        and is_org_member(leads.organization_id)
    )
  );

create policy "Service role has full access to lead_status_history"
  on lead_status_history for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 6. Calls Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view calls"
  on calls for select
  using (is_org_member(organization_id));

create policy "Org members can create calls"
  on calls for insert
  with check (is_org_member(organization_id));

create policy "Org members can update calls"
  on calls for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to calls"
  on calls for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 7. Transcripts & Transcript Turns (Join through calls)
-- ----------------------------------------------------------------------------
create policy "Org members can view transcripts"
  on transcripts for select
  using (
    exists (
      select 1 from calls
      where calls.id = transcripts.call_id
        and is_org_member(calls.organization_id)
    )
  );

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

create policy "Service role has full access to transcripts"
  on transcripts for all
  using (auth.jwt()->>'role' = 'service_role');

create policy "Service role has full access to transcript turns"
  on transcript_turns for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 8. Decisions Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view decisions"
  on decisions for select
  using (is_org_member(organization_id));

create policy "Org members can update decisions"
  on decisions for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to decisions"
  on decisions for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 9. Evidence Signals (Join through calls)
-- ----------------------------------------------------------------------------
create policy "Org members can view evidence signals"
  on evidence_signals for select
  using (
    exists (
      select 1 from calls
      where calls.id = evidence_signals.call_id
        and is_org_member(calls.organization_id)
    )
  );

create policy "Service role has full access to evidence signals"
  on evidence_signals for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 10. Actions Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view actions"
  on actions for select
  using (is_org_member(organization_id));

create policy "Org members can update actions"
  on actions for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to actions"
  on actions for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 11. Outcomes Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view outcomes"
  on outcomes for select
  using (is_org_member(organization_id));

create policy "Org members can update outcomes"
  on outcomes for update
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to outcomes"
  on outcomes for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 12. Appointments Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view appointments"
  on appointments for select
  using (is_org_member(organization_id));

create policy "Org members can manage appointments"
  on appointments for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to appointments"
  on appointments for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 13. Follow Ups Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view follow ups"
  on follow_ups for select
  using (is_org_member(organization_id));

create policy "Org members can manage follow ups"
  on follow_ups for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy "Service role has full access to follow ups"
  on follow_ups for all
  using (auth.jwt()->>'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- 14. Audit Log Policies
-- ----------------------------------------------------------------------------
create policy "Org members can view audit log"
  on audit_log for select
  using (is_org_member(organization_id));

create policy "Org members can insert audit log"
  on audit_log for insert
  with check (is_org_member(organization_id));

create policy "Service role has full access to audit log"
  on audit_log for all
  using (auth.jwt()->>'role' = 'service_role');
