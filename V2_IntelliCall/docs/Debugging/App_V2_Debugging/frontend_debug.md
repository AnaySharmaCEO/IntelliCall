# Frontend Debugging Report: IntelliCall / Resonology AI (App V2)

**Author:** Anay Sharma  
**Date:** 2026-10-20  
**Environment:** Frontend (React 19, Vite, TanStack Query, React Router v7, Tailwind 4)  
**File Location:** `docs/Debugging/App_V2_Debugging/frontend_debug.md`  

---

## 1. Executive Summary

During initial testing of the Phase 2 frontend application against Cloud Supabase (`wdmensuuqsbnxzecqlwz`), multiple blocking UI and runtime issues were identified:
1. **Misleading Empty / Zero-Data States:** KPI metric cards show positive/negative delta trend indicators (e.g., `+12.4% vs last week`, `+4.2% vs yesterday`) even when the primary metric count is `0`.
2. **Mock Data Leakage on Zero Metrics:** The Analytics page renders synthetic metrics (`Outbound Leads Dialed: 120`, velocity rows with `12, 18, 24, 30, 36` calls) when the database has zero calls recorded.
3. **Payload / Contract Incompatibilities (HTTP 400 Bad Request):** Create Lead and Create Appointment forms submit camelCase or non-existent columns (`first_name`, `last_name`, `title`, `hostName`, `scheduledFor`) that do not match the database relations.
4. **Missing Multi-Tenant Context (HTTP 403 Forbidden):** Create Campaign and Create Compliance Rule forms omit `organization_id`, triggering database constraint and Row-Level Security (RLS) rejections.

This document details the root causes and outlines a cohesive architectural solution for every screen.

---

## 2. Issue Breakdown & Root Cause Analysis

### Issue F-01: Empty & Zero-Data State on Dashboard (`/dashboard`)
* **Symptom:**
  ```text
  Total Calls Completed: 0 | 12.4% vs last week • Inbound & Outbound
  Avg Conversation Length: 0:00 | 4.2% vs yesterday • Target: 3m 30s
  Lead Conversions: 0 | 18% vs last 7 days • High intent qualified
  ```
* **Root Cause (`frontend/src/features/dashboard/DashboardPage.tsx` lines 105–125):**
  The `delta` prop is statically hardcoded on the `<KPICard>` component:
  ```tsx
  <KPICard
    label="Total Calls Completed"
    value={analytics?.totalCalls ?? 0}
    delta={{ value: 12.4, period: 'last week' }} // <-- HARDCODED
    icon={<PhoneCall size={18} />}
    hint="Inbound & Outbound"
  />
  ```
  When `analytics?.totalCalls === 0` (or before any historical call baseline is established), displaying a comparative delta is misleading and illogical.
* **Proposed Solution:**
  1. Add conditional delta evaluation: `delta={analytics?.totalCalls ? { value: 12.4, period: 'last week' } : undefined}`.
  2. If `value === 0`, display neutral hint: `"No calls recorded yet"` or link to `"Launch your first campaign"`.

---

### Issue F-02: Analytics Zero-State Mock Fallback Leakage (`/analytics`)
* **Symptom:**
  ```text
  Turnaround Latency (TTFB): 280 ms | 14% vs last week
  Audio Roundtrip: 410 ms | 9.5% vs yesterday
  Call Disconnect Rate: 3.2% | 1.1% vs last month
  Average Sentiment Score: 88% | 5.2% vs last week

  End-to-End Pipeline Funnel: Outbound Leads Dialed: 120, Live Connected: 0
  Daily Velocity Trend: 2026-10-16 (12 calls), 2026-10-17 (18 calls), 2026-10-18 (24 calls)...
  ```
* **Root Cause:**
  1. **HTTP Client Fallback Leak (`frontend/src/api/http/index.ts` lines 248–262):**
     ```ts
     const recentTrends = Array.from({ length: 5 }).map((_, idx) => {
       ...
       return {
         date: dateStr,
         calls: dayTotal > 0 ? dayTotal : 12 + idx * 6,       // <-- LEAKS FAKE 12, 18, 24...
         conversions: dayTotal > 0 ? Math.round(dayTotal * 0.25) : 3 + idx * 2, // <-- LEAKS FAKE 3, 5, 7...
         avgSentimentScore: daySentiment,
       };
     });
     ```
  2. **Funnel Chart Fallback Leak (`frontend/src/features/analytics/AnalyticsPage.tsx` line 97):**
     ```tsx
     steps={[
       { label: 'Outbound Leads Dialed', count: (analytics?.funnelMetrics.connected || 0) + (analytics?.funnelMetrics.dropped || 0) || 120 }, // <-- LEAKS || 120!
       ...
     ]}
     ```
  3. **Telemetry Card Defaults (`AnalyticsPage.tsx` lines 46–74):**
     Cards default to `280 ms`, `410 ms`, `3.2%`, `88%` with hardcoded delta percentages even when total calls is 0.
* **Proposed Solution:**
  1. Remove all synthetic ternary operators in `http/index.ts`. Return true numbers: `calls: dayTotal`, `conversions: 0`.
  2. Remove `|| 120` fallback in `AnalyticsPage.tsx`. If count is 0, render 0.
  3. For telemetry cards: when `analytics?.totalCalls === 0`, display `'--'` or `'No Data'` with no comparative delta.

---

### Issue F-03: Add New Lead Form (`POST /leads` 400 Bad Request)
* **Symptom:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/leads?select=* 400 (Bad Request)
  ```
* **Root Cause (`frontend/src/features/leads/LeadsPage.tsx` lines 87–94 & `frontend/src/api/http/index.ts` line 174):**
  The modal submits:
  ```ts
  await createLead.mutateAsync({
    first_name: firstName,
    last_name: lastName || undefined,
    phone,
    email: email || undefined,
    campaign_id: campaignId || undefined,
    status: 'pending',
  });
  ```
  **Mismatches against Database Schema (`leads` table in `20260907000002_core_schema.sql`):**
  1. `first_name` and `last_name` DO NOT EXIST on the `leads` table. The column is `name text not null`.
  2. `status: 'pending'` violates the `lead_status` PostgreSQL enum (`'new'`, `'contacted'`, `'qualified'`, `'not_qualified'`, `'meeting_booked'`, `'meeting_attended'`, `'opportunity'`, `'converted'`, `'stalled'`). `'pending'` is not a valid enum member.
  3. `organization_id uuid not null` is completely missing from the payload.
* **Proposed Solution:**
  1. In `SupabaseApiClient.createLead`:
     - Resolve the user's active `organization_id` automatically from the session/organization context.
     - Transform `{ first_name, last_name }` to `name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'`.
     - Map `status: 'pending'` to valid database enum `'new'`.
     - Attach `organization_id: org.id`.

---

### Issue F-04: Create Campaign Form (`POST /campaigns` 403 Forbidden)
* **Symptom:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/campaigns?select=* 403 (Forbidden)
  ```
* **Root Cause (`frontend/src/features/campaigns/CampaignsPage.tsx` lines 94–102):**
  The form submits:
  ```ts
  await createCampaign.mutateAsync({
    name,
    agent_id: agentId || undefined,
    daily_budget: dailyBudget,
    concurrency_limit: concurrencyLimit,
    calling_hours_start: callingStart,
    calling_hours_end: callingEnd,
    status: 'active',
  });
  ```
  **Mismatches:**
  1. `organization_id` is missing from the submitted payload.
  2. RLS policy on `campaigns` (`20260907000003_rls_policies.sql` line 45) requires:
     ```sql
     create policy "Org admins can manage campaigns"
       on campaigns for all
       using (has_org_role(organization_id, 'admin'))
       with check (has_org_role(organization_id, 'admin'));
     ```
     When `organization_id` is null, `has_org_role(null, 'admin')` evaluates to FALSE, causing PostgREST to reject the request with `403 Forbidden`.
* **Proposed Solution:**
  Inject `organization_id` automatically inside `SupabaseApiClient.createCampaign` using the resolved workspace identity.

---

### Issue F-05: Schedule Appointment Form (`POST /appointments` 400 Bad Request)
* **Symptom:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/appointments?select=* 400 (Bad Request)
  ```
* **Root Cause (`frontend/src/features/appointments/AppointmentsPage.tsx` lines 35–42):**
  The modal submits:
  ```ts
  await createAppointment.mutateAsync({
    title,
    hostName,
    scheduledFor: new Date(dateTime).toISOString(),
    durationMinutes: Number(durationMinutes),
    status: 'confirmed',
    source: 'Dashboard Manual',
  });
  ```
  **Mismatches against Database Schema (`appointments` in `20260907000002_core_schema.sql` line 303):**
  1. Columns `title`, `hostName`, `durationMinutes` DO NOT EXIST on the database table.
  2. Property `scheduledFor` is camelCase; database column is `scheduled_for`.
  3. `status: 'confirmed'` is invalid; `appointment_status` enum allows `('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show')`.
  4. `organization_id` (not null) and `lead_id` (not null) are omitted.
* **Proposed Solution:**
  1. Add necessary columns (`title`, `host_name`, `duration_minutes`) to `appointments` table via migration, or store extended fields in metadata.
  2. Map frontend payload fields to snake_case (`scheduled_for`).
  3. Provide a fallback lead selection or create a placeholder lead for ad-hoc manual appointments.
  4. Map status to `'scheduled'`.

---

### Issue F-06: Create Compliance Rule Form (`POST /compliance_rules` 403 Forbidden)
* **Symptom:**
  ```text
  POST https://wdmensuuqsbnxzecqlwz.supabase.co/rest/v1/compliance_rules?select=* 403 (Forbidden)
  ```
* **Root Cause (`frontend/src/features/compliance/CompliancePage.tsx` lines 48–55):**
  1. Form payload omits `organization_id`.
  2. Database table `compliance_rules` lacks table-level GRANTs for role `authenticated` (see `database_debug.md`).
  3. RLS policy requires `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`. Without `organization_id`, the check fails.
* **Proposed Solution:**
  Auto-inject `organization_id` inside `SupabaseApiClient.createComplianceRule` and run database grant migration.

---

## 3. Comprehensive Global Empty State Architecture

To deliver an enterprise-grade SaaS experience, all frontend pages must adhere to a standardized **3-Tier Empty State Design System**:

### Tier 1: Zero-Data Page Level (`EmptyState` Component)
When an entire table or domain resource has zero rows (e.g., zero campaigns, zero calls, zero leads):
* **Do NOT display:** Broken tables, static mock values, or arbitrary percentage increases.
* **DO display:** An illustration/icon, clear informative title, 1-sentence description explaining why it's empty, and a prominent primary Action Button.
* **Example across pages:**
  | Page | Empty Condition | Header / Message | Primary Call to Action |
  | :--- | :--- | :--- | :--- |
  | **Dashboard** | `totalCalls === 0 && leads === 0` | "Your Intelligence Engine is Ready" / "No calls or leads recorded yet." | "Import Leads" / "Launch Campaign" |
  | **Calls** | `calls.length === 0` | "No call records found" / "Outbound calls initiated by campaigns will stream here." | "Launch Campaign" |
  | **Agents** | `agents.length === 0` | "No voice personas configured" / "Create an agent to begin dialing." | "Create Persona" |
  | **Campaigns**| `campaigns.length === 0`| "No campaigns created" / "Set calling hours and pacing to start outbound runs." | "Create Campaign" |
  | **Leads** | `leads.length === 0` | "Your pipeline is empty" / "Upload a CSV lead list or add prospect records." | "Import CSV" / "Add Lead" |
  | **Compliance**| `rules.length === 0` | "No compliance audit rules active" / "Protect calls by configuring required disclosures."| "Add Rule" |
  | **Analytics** | `totalCalls === 0` | "Telemetry standby" / "Metrics will populate once your first live call finishes." | "Start Live Demo" |
  | **Appointments**| `appointments.length === 0` | "No scheduled callbacks" / "Calls resulting in booked meetings appear here." | "Schedule Appointment" |
  | **Review Queue**| `items.length === 0` | "Queue is clear" / "All high-risk or low-confidence calls have been audited." | None (Green check badge) |

### Tier 2: Metric / KPI Card Level (`KPICard`)
For metric cards on Dashboard and Analytics:
* If `value === 0` or baseline period is unavailable:
  - `delta` MUST be `undefined` (hiding the pill badge).
  - `hint` should transition from comparative prose (`"vs last week"`) to contextual operational hints (`"No baseline comparison"` or `"Awaiting first call"`).

### Tier 3: Chart & Funnel Level (`FunnelChart`, `VelocityTable`)
* If Funnel metrics are all 0:
  - Render an honest empty pipeline state: `0 Outbound`, `0 Connected`, `0 Converted`.
  - Do NOT fall back to dummy placeholder numbers (`|| 120`).
* If Daily Velocity table has 0 calls for the rolling dates:
  - Render rows with `0 calls`, `0 conversions`, and `"—"` sentiment score, or display an inline empty indicator: `"No call activity recorded in this 5-day window."`

---

## 4. Implementation Plan for Frontend Fixes

1. **Auto-Inject Organization Context in `SupabaseApiClient` (`frontend/src/api/http/index.ts`):**
   - Create private helper `private async getResolvedOrgId(): Promise<string>` that queries `organizations` or reads the active user's `organization_members` row.
   - Inject `organization_id` into all mutations: `createLead`, `createCampaign`, `createComplianceRule`, `createAppointment`.
2. **Normalize Schema Mappings in Client Seams:**
   - Map `first_name` + `last_name` &rarr; `name`.
   - Map `lead.status: 'pending'` &rarr; `'new'`.
   - Map `appointment.scheduledFor` &rarr; `scheduled_for`.
   - Map `appointment.status: 'confirmed'` &rarr; `'scheduled'`.
3. **Purge All Hardcoded Fallbacks & Fix KPI Deltas:**
   - In `AnalyticsPage.tsx`: remove `|| 120`, make delta optional, display `--` when count is 0.
   - In `DashboardPage.tsx`: render `delta` only when `totalCalls > 0`.
   - In `http/index.ts`: return genuine zeros in `recentTrends`.
4. **Verification:**
   - Validate full create workflows in browser.
   - Verify `npm run build` passes with zero errors.
