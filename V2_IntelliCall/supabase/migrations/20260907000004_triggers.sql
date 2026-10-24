-- ============================================================================
-- IntelliCall: 04 Database Functions & Triggers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. updated_at Maintenance Trigger Function
-- ----------------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Attach updated_at triggers
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

-- ----------------------------------------------------------------------------
-- 2. Lead Status History Trigger Function
-- ----------------------------------------------------------------------------
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
