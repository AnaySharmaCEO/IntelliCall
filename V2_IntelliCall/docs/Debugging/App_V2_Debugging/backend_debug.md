# Backend & Edge Functions Debugging Report: IntelliCall / Resonology AI (App V2)

**Author:** Anay Sharma  
**Date:** 2026-10-20  
**Environment:** Supabase Edge Functions (Deno / TypeScript) & Backend Microservices (FastAPI / Python)  
**File Location:** `docs/Debugging/App_V2_Debugging/backend_debug.md`  

---

## 1. Executive Summary

This report analyzes the backend architecture supporting IntelliCall / Resonology AI, focusing on the serverless Supabase Edge Functions (`supabase/functions/`), backend services (`backend/resonology-ai/`), and the client-to-backend communication bridge.

### Core Findings:
1. **Edge Function Token & Authentication Scope:**  
   Functions like `analysis-run` run with `--no-verify-jwt` in cloud deployment. While this allows public triggering, it requires the function to validate the caller's organization or handle security-definer queries safely.
2. **Missing Workspace Association in REST API Calls:**  
   The frontend `SupabaseApiClient` acts as a direct backend client via PostgREST. It lacked a central tenant-interceptor to inject `organization_id` into database payloads, causing downstream failures in RLS validation.
3. **Webhook & Telephony Ingestion Vulnerabilities:**  
   `handle-call-webhook` and `handle-appointment-webhook` require strict verification of webhook signatures (e.g., Twilio signature, Calendly HMAC) to prevent spoofed call state injections.
4. **Environment Secret Synchronization:**  
   `GEMINI_API_KEY`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` must be mirrored between local `.env` files and Supabase Cloud project secrets.

---

## 2. Edge Functions Audit & Diagnosis

### BE-01: `analysis-run` (Post-Call Structured Extraction)
* **Path:** `supabase/functions/analysis-run/index.ts`
* **Trigger:** Invoked from `useTriggerAnalysis(callId)` or automatically upon call completion webhook.
* **Mechanism:**
  - Queries `calls` table using `call_id`.
  - Extracts transcript turns.
  - Sends formatted prompt to Google Gemini 2.0 Flash (`gemini-2.0-flash`).
  - Expects structured JSON matching `ConversationAnalysisSchema`.
  - Inserts result into `call_analyses` table.
* **Failure Modes & Debugging Findings:**
  1. **Empty Transcript Handling:** If a call ends abruptly (duration < 5s) with no turns, Gemini cannot perform factual extraction and may return an error or hallucinated facts.
     - *Fix:* Check `if (!call.transcript || call.transcript.trim().length < 10)` &rarr; early return with default neutral analysis (`intent: 'dropped_call'`, `sentiment: 'neutral'`, `compliance_score: 1.0`).
  2. **Secret Availability in Cloud:** If `GEMINI_API_KEY` is missing in Supabase Edge Secrets, the function throws `500 Internal Server Error`.
     - *Fix:* Ensure `supabase secrets set GEMINI_API_KEY=...` is confirmed via deployment script.
  3. **RLS on Insertion:** The Edge Function uses `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`. It must always use `service_role` to bypass RLS when writing to `call_analyses`.

---

### BE-02: `handle-call-webhook` (Telephony Lifecycle & Realtime Ingest)
* **Path:** `supabase/functions/handle-call-webhook/index.ts`
* **Trigger:** Inbound POST from SIP / Twilio / LiveKit webhook on call status change (`in-progress`, `completed`, `failed`).
* **Debugging Findings:**
  - When a call completes, the webhook updates `calls.status = 'completed'` and sets `ended_at = now()`.
  - It must automatically trigger `analysis-run` asynchronously via internal dispatch or database webhook trigger so intelligence is ready as soon as the user opens the call detail screen.

---

### BE-03: `handle-appointment-webhook` (Calendar Synchronization)
* **Path:** `supabase/functions/handle-appointment-webhook/index.ts`
* **Trigger:** Inbound webhook from scheduling systems (Calendly, HubSpot, or internal scheduler).
* **Debugging Findings:**
  - The webhook must insert into `appointments`.
  - The schema update for `appointments` (adding `title`, `host_name`, `duration_minutes`) will allow this function to store meeting details without discarding metadata.

---

## 3. Client-to-Backend Layer: Multi-Tenant Interceptor Pattern

### The Problem:
Frontend views currently construct raw payload objects and call `apiClient.createX(payload)`. Because the views don't know the user's `organization_id`, the payloads reach PostgREST missing `organization_id`, failing constraints and RLS.

### The Solution:
Implement a **Centralized Tenant Resolver & Interceptor** inside `SupabaseApiClient`:
```ts
export class SupabaseApiClient implements ApiClient {
  private cachedOrgId: string | null = null;

  private async getResolvedOrgId(): Promise<string> {
    if (this.cachedOrgId) return this.cachedOrgId;

    // 1. Check active user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated request');

    // 2. Query user's active membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (member?.organization_id) {
      this.cachedOrgId = member.organization_id;
      return this.cachedOrgId;
    }

    // 3. Fallback: Check if user created an organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle();

    if (org?.id) {
      this.cachedOrgId = org.id;
      return this.cachedOrgId;
    }

    // 4. Fallback: First organization in workspace
    const { data: anyOrg } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (anyOrg?.id) {
      this.cachedOrgId = anyOrg.id;
      return this.cachedOrgId;
    }

    throw new Error('No organization context available for this user');
  }
}
```

By having `createLead`, `createCampaign`, `createComplianceRule`, `createAppointment` call `const orgId = await this.getResolvedOrgId();` and inject `{ ...payload, organization_id: orgId }`, zero components will ever trigger a missing `organization_id` error.

---

## 4. Backend Action Plan

1. **Deploy Schema & Grant Fix Migration to Supabase Cloud:**  
   Apply the grant and table updates so PostgREST stops returning 403 and 400.
2. **Implement Multi-Tenant Interceptor in `SupabaseApiClient`:**  
   Ensure all inserts and bulk inserts automatically append `organization_id`.
3. **Verify Edge Function Secrets:**  
   Verify that `analysis-run` has access to `GEMINI_API_KEY` in Supabase Cloud.
