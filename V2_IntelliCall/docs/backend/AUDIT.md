# AUDIT.md: Supabase Cloud & Backend Audit

**Author:** Anay Sharma  
**Date:** 2026-10-19  
**Phase:** B0 (Backend Audit)  
**Status:** Approved Baseline

---

## 1. Cloud Supabase Infrastructure Baseline

| Attribute | State | Notes |
|---|---|---|
| **Hosting Model** | **Supabase Cloud** | Confirmed via `.supabase/.temp/project-ref`. No local Docker dependencies for dev. |
| **Connection Method** | API Keys + Project URL | Client uses Anon Key; server jobs and Edge Functions use Service Role Key. |
| **Applied Migrations** | **7 Migrations** | `20260907000001` through `20260907000007` applied to remote project. |
| **Existing Functions** | **4 Edge Functions** | `trigger-scheduled-calls`, `handle-call-webhook`, `process-ai-decision`, `handle-appointment-webhook`. |
| **Storage Buckets** | 1 Private Bucket | `call-recordings` (50MB limit, RLS enabled). |
| **Realtime Tables** | `calls`, `decisions` | Configured in `supabase_realtime` publication. |

---

## 2. Existing Database Inventory

### 2.1 Enums
* `user_role`: `'owner'`, `'admin'`, `'member'`
* `member_status`: `'active'`, `'invited'`
* `lead_status`: `'new'`, `'queued'`, `'contacted'`, `'qualified'`, `'not_qualified'`, `'meeting_booked'`, `'meeting_attended'`, `'opportunity'`, `'converted'`, `'stalled'`
* `agent_status`: `'draft'`, `'active'`, `'inactive'`, `'archived'`
* `campaign_status`: `'draft'`, `'active'`, `'paused'`, `'completed'`, `'archived'`
* `campaign_lead_status`: `'queued'`, `'in_progress'`, `'completed'`, `'excluded'`
* `call_status`: `'scheduled'`, `'calling'`, `'connected'`, `'processing'`, `'completed'`, `'failed'`, `'cancelled'`, `'no_answer'`, `'voicemail'`
* `speaker_type`: `'agent'`, `'prospect'`
* `confidence_tier`: `'high'`, `'medium'`, `'low'`
* `decision_outcome`: `'qualified'`, `'not_qualified'`, `'review_required'`
* `action_type`: `'book_meeting'`, `'send_followup'`, `'update_status'`, `'escalate'`
* `action_status`: `'pending'`, `'executed'`, `'dismissed'`, `'failed'`
* `outcome_stage`: `'qualified'`, `'meeting_booked'`, `'meeting_attended'`, `'opportunity'`, `'converted'`, `'stalled'`, `'lost'`
* `appointment_status`: `'scheduled'`, `'completed'`, `'cancelled'`, `'no_show'`
* `booking_source`: `'calendly'`, `'manual'`, `'ai_booked'`
* `followup_status`: `'pending'`, `'done'`, `'dismissed'`

### 2.2 Tables Already Created & Deployed
1. `profiles`: `id` (PK, references auth.users), `name`, `email`, `avatar_initials`, `avatar_url`, `created_at`, `updated_at`.
2. `organizations`: `id` (PK), `name`, `slug`, `created_by`, `onboarding_completed`, `onboarding_progress`, `created_at`, `updated_at`.
3. `organization_members`: `id` (PK), `organization_id`, `user_id`, `role` (`user_role`), `status` (`member_status`), `invited_by`, `created_at`.
4. `agents`: `id` (PK), `organization_id`, `name`, `objective`, `language`, `voice`, `qualification_goal`, `permitted_actions`, `status`, `voice_config`, `script_config`, `created_at`, `updated_at`.
5. `campaigns`: `id` (PK), `organization_id`, `agent_id`, `name`, `status`, `confidence_threshold`, `strategy`, `strategy_config`, `leads_targeted`, `qualification_rate`, `meetings_booked`, `created_by`, `launched_at`, `created_at`, `updated_at`.
6. `leads`: `id` (PK), `organization_id`, `campaign_id`, `owner_id`, `name`, `company`, `title`, `email`, `phone`, `status`, `source`, `confidence_score`, `confidence_tier`, `notes`, `last_activity_at`, `created_by`, `created_at`, `updated_at`.
7. `campaign_leads`: `id` (PK), `campaign_id`, `lead_id`, `status`, `added_at`.
8. `lead_status_history`: `id` (PK), `lead_id`, `old_status`, `new_status`, `changed_by`, `note`, `changed_at`.
9. `calls`: `id` (PK), `organization_id`, `campaign_id`, `lead_id`, `agent_id`, `status`, `duration_seconds`, `decision_id`, `recording_path`, `scheduled_for`, `started_at`, `ended_at`, `created_at`.
10. `transcripts`: `id` (PK), `call_id` (unique FK), `created_at`.
11. `transcript_turns`: `id` (PK), `transcript_id`, `speaker`, `turn_index`, `text`, `timestamp_seconds`, `signals`, `started_at_ms`, `ended_at_ms`.
12. `decisions`: `id` (PK), `organization_id`, `call_id` (unique FK), `lead_id`, `campaign_id`, `outcome`, `confidence_score`, `confidence_tier`, `reason`, `recommended_action`, `actual_action`, `action_status`, `trace`, `overridden_by`, `reviewed_by`, `reviewed_at`, `created_at`.
13. `evidence_signals`: `id` (PK), `call_id`, `decision_id`, `transcript_turn_id`, `quote`, `signal`, `weight`, `timestamp_seconds`, `created_at`.
14. `actions`: `id` (PK), `organization_id`, `decision_id`, `lead_id`, `type`, `status`, `executed_at`, `created_at`.
15. `outcomes`: `id` (PK), `organization_id`, `decision_id`, `lead_id`, `campaign_id`, `stage`, `stalled`, `meeting_booked_at`, `meeting_attended_at`, `opportunity_created_at`, `converted_at`, `occurred_at`, `created_at`.
16. `appointments`: `id` (PK), `organization_id`, `lead_id`, `call_id`, `decision_id`, `scheduled_for`, `status`, `booking_source`, `external_event_id`, `created_at`.
17. `follow_ups`: `id` (PK), `organization_id`, `lead_id`, `campaign_id`, `type`, `due_at`, `status`, `assigned_to`, `created_at`.
18. `audit_log`: `id` (PK), `organization_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`.

### 2.3 RLS Functions & Policies Already in Place
- `is_org_member(org_id uuid) returns boolean`
- `has_org_role(org_id uuid, min_role user_role) returns boolean`
- `touch_updated_at()` trigger function attached to profiles, organizations, agents, etc.
- Profile auto-creation trigger: `handle_new_user()` on `auth.users`.
- First-member owner claim policy on `organization_members`.

---

## 3. Schema Reconciliation Plan (Binding Decisions)

To avoid breaking existing data and functionality, the following reconciliation decisions are adopted:

### 3.1 Membership Table
* **Decision:** We **keep `organization_members`** (do not rename to `memberships`). All code, contracts, and Edge Functions will query `organization_members`.
* **Roles:** Extend `user_role` enum via `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager'`, `'agent_operator'`, `'viewer'` so it supports all 5 roles in the RBAC matrix.

### 3.2 Call & Transcript Structures
* **Decision:** Keep `calls` table and add missing Next Phase columns:
  * `lead_mode`: `'human_in_browser' | 'scripted_replay' | 'simulated_persona' | 'phone'`
  * `channel`: `'web_demo' | 'pstn'`
  * `language`: `'en-IN' | 'hi-IN' | 'mixed'`
  * `analysis_status`: `'pending' | 'analyzing' | 'complete' | 'failed'`
  * `compliance_snapshot`: `jsonb default '{}'::jsonb`
  * `cost_breakdown`: `jsonb default '{}'::jsonb`
* **Transcripts:** Maintain `transcripts` + `transcript_turns` table structure (it already supports `started_at_ms`, `ended_at_ms`, `signals`, and `speaker`). Add a convenient SQL view `transcript_segments` aliasing `transcript_turns` to maintain zero-friction parity with the Next Phase contracts.

### 3.3 Evidence & Decision Tables
* **Decision:** Keep `decisions` and `evidence_signals` tables.
* Add `conversation_analyses` table to hold the validated top-level `ConversationAnalysisSchema` output.
* Add `human_corrections` table for tracking review resolutions and model accuracy calibration.
* Add `review_items` table representing items queued in the Review Queue.

### 3.4 New Operational Tables to Create in Next Migrations
* `idempotency_keys`: For mutation deduplication.
* `jobs`: Async worker queue with `claim_jobs()` RPC.
* `compliance_blocks` & `suppression_entries`: For India DND / calling window compliance logs.
* `availability_rules`: Weekly host availability ranges.
* `api_keys`: Hashed customer API keys.
* `notifications`: User notification queue.

---

## 4. Edge Functions Audit & Modernization Mapping

| Existing Function | State | Target Role in Next Phase | Modernization Action |
|---|---|---|---|
| `trigger-scheduled-calls` | Functional | `dialer-tick` | Rewrite to run on 1-minute cron; call `claim_dialable_leads` RPC; dispatch to LiveKit worker with `lead_mode`. |
| `handle-call-webhook` | Functional | `voice-events` | Add HMAC signature validation; handle turn deduplication; enqueue `analysis` job on `call.ended`. |
| `process-ai-decision` | Functional | `analysis-run` | Update to claim jobs from `public.jobs`; use `InlineGeminiProvider` (calling Gemini 2.0 Flash) with Zod validation. |
| `handle-appointment-webhook` | Functional | `voice-tools` / Calendly adapter | Integrate with internal `CalendarProvider` seam; update lead stage atomically. |
| *(None)* | **Missing** | **`api`** | Create main Hono REST function for all browser frontend CRUD traffic. |

### Security Issues Identified to Fix in B1:
1. `_shared/cors.ts`: Currently permits `"Access-Control-Allow-Origin": "*"`. Must be restricted to `ALLOWED_ORIGINS` environment variable.
2. `_shared/supabase.ts`: All existing functions use `getAdminClient()` (service role). In `api`, we must instantiate Supabase with caller's `Authorization` header so RLS applies.

---

## 5. B0 Audit Approval & Next Action
- Audit confirms the database foundation is sound, RLS is active on all tables, and existing entities are directly reusable.
- **Next Step:** Commit B0 audit, log entry, and proceed to Phase F0 (Frontend Audit & Migration Map).
