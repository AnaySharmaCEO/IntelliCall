# IntelliCall — Proposed Supabase Schema & Architecture

Grounded in the locked MVP workflow and the entities already defined across the product docs (Leads, Campaigns with one Agent + one confidence threshold, Calls, Decisions with evidence/confidence, Outcomes funnel, Appointments). Nothing here introduces a concept not already implied by the product — no speculative tables.

---

## 1. Core entities and relationships

```
organizations
  └─ organization_members (user_id, role)
  └─ leads
       └─ lead_status_history
  └─ agents
  └─ campaigns (agent_id FK — one agent per campaign, per locked MVP flow)
       └─ campaign_leads (join: which leads are in this campaign, and their state within it)
  └─ calls (campaign_id, lead_id, agent_id)
       └─ transcripts
            └─ transcript_turns
       └─ evidence_signals (quotes/flags pulled from a call, tagged e.g. "Budget uncertain")
       └─ decisions (confidence_score, status, recommended vs actual action)
            └─ outcomes (funnel stage: qualified → meeting_booked → meeting_attended → opportunity → converted)
  └─ appointments (lead_id, call_id?, decision_id?)
  └─ follow_ups (lightweight task queue)
  └─ audit_log
```

`profiles` sits outside `organizations` (1:1 with `auth.users`), since a user can in principle belong to more than one organization even if the MVP UI only surfaces one at a time.

---

## 2. Tables

### `profiles`
1:1 with `auth.users`. `id` (= `auth.users.id`), `full_name`, `avatar_url`, `created_at`, `updated_at`.

### `organizations`
`id`, `name`, `slug` (unique), `created_at`, `updated_at`.

### `organization_members`
`id`, `organization_id` FK, `user_id` FK → `profiles`, `role` enum(`owner`, `admin`, `member`), `status` enum(`active`, `invited`), `invited_by`, `created_at`.
Unique constraint on `(organization_id, user_id)`.

### `leads`
`id`, `organization_id` FK, `name`, `email`, `phone`, `company`, `source`, `status` enum(`new`, `queued`, `contacted`, `qualified`, `disqualified`, `converted`), `created_by`, `created_at`, `updated_at`.
Index on `(organization_id, status)`.

### `lead_status_history`
`id`, `lead_id` FK, `old_status`, `new_status`, `changed_by`, `note`, `changed_at`.
Populated by a trigger on `leads.status` change — cheap, high-value, matches the doc's "use triggers only where they provide a clear benefit."

### `agents`
`id`, `organization_id` FK, `name`, `objective`, `voice_config` jsonb, `script_config` jsonb, `status` enum(`draft`, `active`, `archived`), `created_at`, `updated_at`.
`voice_config`/`script_config` stay jsonb deliberately — this is exactly the seam the later voice-provider integration needs, and locking it into rigid columns now would violate "don't introduce artificial AI-specific concepts" by overfitting to a provider we haven't chosen yet.

### `campaigns`
`id`, `organization_id` FK, `agent_id` FK, `name`, `status` enum(`draft`, `active`, `paused`, `completed`), `confidence_threshold` numeric(5,2), `strategy_config` jsonb, `created_by`, `created_at`, `updated_at`, `launched_at`.
One `agent_id` per campaign — matches the locked Create Campaign flow (Audience → Agent → Strategy → Threshold → Launch). No `campaign_agents` join table; that would be speculative multi-agent support the MVP doesn't have.

### `campaign_leads`
`id`, `campaign_id` FK, `lead_id` FK, `status` enum(`queued`, `in_progress`, `completed`, `excluded`), `added_at`.
Unique `(campaign_id, lead_id)`.

### `calls`
`id`, `organization_id` FK, `campaign_id` FK, `lead_id` FK, `agent_id` FK, `status` enum(`scheduled`, `calling`, `connected`, `processing`, `completed`, `failed`, `cancelled`), `scheduled_for`, `started_at`, `ended_at`, `duration_seconds`, `recording_path` (Storage reference, nullable), `created_at`.
`agent_id` is denormalized from the campaign at call-creation time — matches the frontend's "agent is derived from campaign, stored on the call" decision from the AI-calling feature.

### `transcripts`
`id`, `call_id` FK (unique — one transcript per call), `created_at`.

### `transcript_turns`
`id`, `transcript_id` FK, `speaker` enum(`agent`, `lead`), `turn_index` int, `content` text, `started_at_ms`, `ended_at_ms`.
Index on `(transcript_id, turn_index)`.

### `evidence_signals`
`id`, `call_id` FK, `transcript_turn_id` FK (nullable — a signal can reference the exact line it came from), `decision_id` FK (nullable — attached once a decision is made), `quote_text`, `tag`, `severity` enum(`low`, `medium`, `high`), `created_at`.
This is what powers `EvidenceSnippet`/`EvidenceThread` — one row per quoted piece of evidence, not a jsonb blob, so it's queryable and auditable individually (matches the product's whole "auditable AI" positioning).

### `decisions`
`id`, `organization_id` FK, `call_id` FK, `lead_id` FK, `campaign_id` FK, `decision_type` enum(`book_meeting`, `send_follow_up`, `disqualify`, `escalate`), `confidence_score` numeric(5,2), `status` enum(`auto_executed`, `pending_review`, `approved`, `overridden`), `recommended_action`, `actual_action`, `reasoning_summary`, `reviewed_by`, `reviewed_at`, `created_at`.
Index on `(organization_id, status)` — this is the exact query the Review Queue runs on every load.

### `outcomes`
`id`, `decision_id` FK, `lead_id` FK, `campaign_id` FK, `stage` enum(`qualified`, `meeting_booked`, `meeting_attended`, `opportunity`, `converted`, `lost`), `occurred_at`, `created_at`.
This is the source-of-truth table the Decision → Outcome funnel and the dashboard's decision-accuracy figure derive from — no separate mutable "funnel counts" table; those are always computed from this at query time (matches the doc's "derive analytics from source-of-truth records rather than duplicating mutable numbers").

### `appointments`
`id`, `organization_id` FK, `lead_id` FK, `call_id` FK (nullable), `decision_id` FK (nullable), `scheduled_for`, `status` enum(`scheduled`, `completed`, `cancelled`, `no_show`), `booking_source` enum(`calendly`, `manual`, `ai_booked`), `external_event_id` (nullable), `created_at`.

### `follow_ups`
`id`, `organization_id` FK, `lead_id` FK, `campaign_id` FK (nullable), `type`, `due_at`, `status` enum(`pending`, `done`, `dismissed`), `assigned_to` FK (nullable), `created_at`.

### `audit_log`
`id`, `organization_id` FK, `actor_id` FK (nullable — null for system/AI-initiated actions), `action`, `entity_type`, `entity_id`, `metadata` jsonb, `created_at`.
Populated at the application layer (backend service inserts), not via blanket triggers on every table — matches "avoid unnecessary database-side complexity."

---

## 3. RLS strategy

One helper function, used everywhere:

```sql
create or replace function is_org_member(org_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;
```

Every organization-scoped table gets the same shape of policy:
```sql
create policy "org members can access their org's <table>"
  on <table> for select using (is_org_member(organization_id));
```
with separate, narrower `insert`/`update`/`delete` policies where role matters (e.g., only `owner`/`admin` can delete a campaign or remove a member — a second helper `has_org_role(org_id, min_role)` covers this).

Tables without a direct `organization_id` column (`transcript_turns`, `evidence_signals`) get their policy via a join back to the owning `call`/`transcript`'s `organization_id`, not a duplicated column — avoids denormalization drift.

`profiles`: a user can always read/update their own row; org-mates' profiles are readable only through the `organization_members` join, not directly.

---

## 4. Backend integration layer (contract, not implementation)

- **Browser client**: anon/publishable key, RLS-enforced, used for everything the frontend does directly (reads for dashboard/lists, user-initiated writes like approving a decision).
- **Server client**: service-role key, used only in backend/server code for: AI analysis writing `decisions`/`evidence_signals`/`outcomes` after a call completes, auto-execution of decisions above threshold, webhook processing (voice provider callbacks), and any operation that must bypass RLS because it acts on behalf of the system rather than a specific logged-in user. Service-role key never reaches the browser bundle — enforced by keeping it in server-only env vars, never `NEXT_PUBLIC_`/`VITE_`-prefixed or equivalent.
- **Session verification**: server routes verify the Supabase JWT on every privileged request and independently check `organization_members` for that org before acting — never trust a client-supplied `organization_id` alone.

---

## 5. Storage

Single bucket `call-recordings`, private, path convention `{organization_id}/{call_id}.wav`. Storage RLS policy checks `is_org_member` against the `organization_id` segment of the path. Deferred until voice integration actually produces recordings — the bucket and policy can exist now with nothing in it.

---

## 6. Implemented now vs. intentionally deferred

**Now:**
Auth, profiles, organizations, membership/roles, full core schema above, RLS on every org-scoped table, `updated_at` and lead-status-history triggers, storage bucket contract, backend client separation.

**Deferred (explicitly, not forgotten):**
- Multi-agent-per-campaign — schema note above explains why it's not modeled yet.
- Real audit-log triggers on every table — starting with application-level inserts only.
- Billing/plan tier fields on `organizations` — not part of locked MVP.
- Any voice-provider-specific columns — `agents.voice_config` jsonb is the seam, provider integration fills it later without a schema change.

---

## Before I generate migration files

This proposal assumes a **greenfield** database — no existing Supabase schema to reconcile against. If there's already a Supabase project with tables, migrations, or env vars in your repo, I need to see that first (upload the repo or the `supabase/migrations` folder, or paste `supabase db dump --schema public` output) so I reconcile instead of overwriting. If it's genuinely greenfield, say so and I'll generate the full migration SQL + RLS policies + seed data script next.
