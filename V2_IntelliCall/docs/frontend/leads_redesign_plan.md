# Leads Page Redesign Plan
**IntelliCall — Resonology AI Voice Platform**
**Author:** Anay Sharma | **Date:** 2026-10-22 | **Branch:** `phase_2_dev`

---

## 1. Executive Summary

The current `LeadsPage.tsx` is a basic flat table. This plan translates the reference design (Kanban CRM pipeline) into IntelliCall's voice-AI outbound-calling context with the following additions:

- **Kanban Board View** — stage-based columns for the voice AI pipeline
- **Compact List View** — feature-rich table with sortable columns
- **Pipeline Metrics Tiles** — live pipeline value, active opportunities, stuck leads
- **Lead Detail Page** — full panel with notes, activity timeline, AI call scheduling, stage progression
- **AI Call Scheduling** — IntelliCall's core differentiator: schedule an AI agent call directly from any lead card/row/detail view
- **Zero mock data** — all data from Supabase via existing hooks
- **Proper empty states** — on all views, no phantom metrics when data is 0

---

## 2. IntelliCall Pipeline Stage Mapping

| Stage (DB value) | Display Label | Color | Meaning |
|---|---|---|---|
| `new` | New Lead | slate | Freshly imported, not yet called |
| `contacted` | AI Called | blue | AI has placed at least one call |
| `qualified` | Interested | green | Lead showed positive intent |
| `meeting_booked` | Appointment Booked | teal | Meeting/callback scheduled |
| `opportunity` | Proposal Stage | amber | High-intent, being nurtured |
| `converted` | Converted | emerald | Deal closed / onboarded |
| `stalled` | Lost / Stalled | red | DNC / disqualified / dropped |

> These map directly to the existing `lead_status` DB enum with no new enum values needed. The UI will treat `status` as the pipeline stage.

---

## 3. New Fields Required on `leads` Table

The pipeline UI needs 4 new fields (no destructive changes):

| Column | Type | Purpose |
|---|---|---|
| `estimated_value` | `NUMERIC DEFAULT 0` | Deal value for pipeline sum |
| `next_action` | `TEXT` | Free text next step for sales team |
| `stage_entered_at` | `TIMESTAMPTZ` | When lead entered current stage (for "days in stage") |

> `days_in_stage` is **computed** on the frontend as `now() - stage_entered_at` (no DB column needed).  
> `source` already exists in the DB.  
> The existing `notes` column will store the latest note. A separate `lead_notes` table is NOT being created in this phase to minimize migration scope.

---

## 4. Database Migration Spec

**File:** `supabase/migrations/20261022000001_leads_pipeline_fields.sql`

```sql
-- Add pipeline-specific fields to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now();

-- Backfill stage_entered_at for existing leads using last_activity_at
UPDATE public.leads
SET stage_entered_at = COALESCE(last_activity_at, created_at)
WHERE stage_entered_at IS NULL;
```

> The RLS on `leads` already grants members SELECT and owners/admins INSERT/UPDATE/DELETE. No new policies needed.

---

## 5. Frontend Component Breakdown

### 5.1 New Files

| File | Purpose |
|---|---|
| `features/leads/LeadsPage.tsx` | **Replace** existing — Board + List toggle, pipeline metrics |
| `features/leads/LeadDetailPage.tsx` | **New** — Full detail view with all panels |
| `features/leads/components/LeadKanbanBoard.tsx` | Kanban board with stage columns |
| `features/leads/components/LeadCompactTable.tsx` | Compact table view |
| `features/leads/components/LeadCard.tsx` | Individual Kanban card |
| `features/leads/components/PipelineMetricTiles.tsx` | 3 summary tiles (Pipeline Value, Active, Stuck) |
| `features/leads/components/ScheduleAICallModal.tsx` | AI Call scheduler modal |
| `features/leads/components/MoveStageModal.tsx` | Change stage modal |
| `features/leads/components/AddLeadModal.tsx` | Extracted from existing page |

### 5.2 Modified Files

| File | Change |
|---|---|
| `app/App.tsx` | Add route `/leads/:id` → `LeadDetailPage` |
| `api/http/index.ts` | Add `estimated_value`, `next_action`, `stage_entered_at` to `mapLeadRecord`, and add `updateLeadStage()` method |
| `contracts/entities.ts` | Add `estimatedValue`, `nextAction`, `stageEnteredAt` optional fields to `LeadSchema` |

---

## 6. Pipeline Metrics Tiles

Three tiles computed client-side from the full leads list (no extra API call):

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│  Pipeline Value     │  Active Opps        │  Stuck / At Risk    │
│  ₹ 4,20,000         │  12                 │  3                  │
│  (sum estimated_val)│  (new+contacted+    │  (stage_entered_at  │
│                     │   qualified+booking)│   > 5 days ago AND  │
│                     │                     │   not converted/lost│
└─────────────────────┴─────────────────────┴─────────────────────┘
```

Empty state: all zeros shown as `₹0`, `0`, `0` without percentage deltas.

---

## 7. AI Call Scheduling Feature

**Trigger points:**
1. Kanban card → "Schedule AI Call" button (phone icon)
2. Compact table row → "Schedule AI Call" in action column
3. Lead detail page → "Schedule AI Call" primary CTA button

**Modal fields:**
- Agent selector (from `useAgents()` hook — existing)
- Campaign selector (from `useCampaigns()` hook — existing, filtered to `running`/`draft`)
- Scheduled time (datetime-local input)
- Optional notes

**On Submit:**
```ts
await apiClient.createCall({
  lead_id: lead.id,
  agent_id: selectedAgentId,
  campaign_id: selectedCampaignId,
  status: 'scheduled',
  scheduled_for: scheduledTime,
})
```

Uses existing `createCall` method in `SupabaseApiClient` (must be added if not present, or uses existing pattern). Invalidates `queryKeys.calls.all` on success.

---

## 8. Lead Detail Page Layout

```
/leads/:id
┌────────────────────────────────────────────────────────────┐
│ ← Back to Leads Pipeline                                   │
├────────────────────────────────────────────────────────────┤
│ HEADER CARD                                                │
│  John Doe  [AI Called]           Estimated Value: ₹50,000  │
│  Acme Corp · john@acme.com       Next: Follow up on demo  │
│  ⚠️ Stuck in AI Called for 7 days without activity         │
├──────────────────────────────────┬─────────────────────────┤
│ LEFT COL (2/3)                   │ RIGHT COL (1/3)         │
│                                  │                         │
│ Activity Timeline                │ Opportunity Summary     │
│  - AI call placed (4 days ago)   │  Last Contact: 4d ago   │
│  - Lead imported (7 days ago)    │  Deal size: ₹50,000     │
│                                  │  Source: manual         │
│ Notes & Key Details              │                         │
│  [+ Add note]                    │ Quick Actions           │
│  Note 1 · 3 days ago             │  [📞 Schedule AI Call]  │
│  Note 2 · 5 days ago             │  [→ Move Stage]         │
│                                  │  [🗑 Delete Lead]       │
│ Recent AI Calls                  │                         │
│  Call #1 · completed · 2 min     │                         │
│  Call #2 · no_answer             │                         │
└──────────────────────────────────┴─────────────────────────┘
```

**Activity Timeline** — derived from `useLeadCalls(leadId)` (filtered calls for this lead). Each call record becomes an activity entry showing status, duration, outcome.

**Notes** — stored in `leads.notes` field (single text) displayed as a single note block. If we want multi-note, we use `lead_status_history` as an activity log proxy.

---

## 9. State Management & Caching Strategy

- **React Query** with `staleTime: 5 minutes` (already configured in `main.tsx`)
- All list fetches are cached under `queryKeys.leads.list(params)`
- Lead detail fetched under `queryKeys.leads.detail(id)`
- On any mutation (create/update/delete/stage-change), invalidate `queryKeys.leads.all` and `queryKeys.leads.detail(id)`
- View toggle (Board/List) persisted to `localStorage` key `intellicall_leads_view`
- No additional cache beyond React Query — the existing setup is industry-standard

---

## 10. Empty State Handling

| Component | Empty State Behavior |
|---|---|
| Kanban column | Column shows empty state card "No leads in this stage" |
| Compact table | Existing `EmptyState` component |
| Pipeline tiles | Show `0`, no percentage delta, no comparison text |
| Lead detail calls section | "No AI calls placed yet for this lead" message |
| Lead detail activity | "No activity recorded yet" message |

---

## 11. High Cohesion / Low Coupling Principles

- `LeadKanbanBoard` takes `leads` prop + callbacks — no direct API calls inside
- `LeadCard` takes `lead` prop + `onScheduleCall` + `onMoveStage` callbacks
- `ScheduleAICallModal` is standalone — can be opened from anywhere
- `LeadDetailPage` fetches its own data via `useLead(id)` + `useLeadCalls(leadId)`
- No component imports another feature's page — only shared `api/hooks` and `components/ui`

---

## 12. Implementation Order

1. ✅ Write this plan document
2. ⬜ Write DB migration `20261022000001_leads_pipeline_fields.sql`
3. ⬜ Update `LeadSchema` in `contracts/entities.ts` with new optional fields
4. ⬜ Update `mapLeadRecord` in `api/http/index.ts` to map new fields
5. ⬜ Add `createCall` to `SupabaseApiClient` if missing + `useCreateCall` hook
6. ⬜ Create `ScheduleAICallModal.tsx`
7. ⬜ Create `MoveStageModal.tsx`
8. ⬜ Create `PipelineMetricTiles.tsx`
9. ⬜ Create `LeadCard.tsx`
10. ⬜ Create `LeadKanbanBoard.tsx`
11. ⬜ Create `LeadCompactTable.tsx`
12. ⬜ Replace `LeadsPage.tsx` with full Board+List implementation
13. ⬜ Create `LeadDetailPage.tsx`
14. ⬜ Add `/leads/:id` route to `App.tsx`
15. ⬜ Update `work_log.md`
16. ⬜ `npm run build` → 0 errors → commit → push
