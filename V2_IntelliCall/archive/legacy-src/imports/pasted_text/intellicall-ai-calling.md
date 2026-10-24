# IntelliCall — Phase 5: AI Calling & Scheduling

You already built IntelliCall per `INTELLICALL_FRONTEND_DESIGN_SYSTEM.md` and `intellicall_design_system_reference.html`. This phase adds the core action the product has been missing: triggering an AI call on a lead, or scheduling one, from Lead Detail. Frontend/mock only — but structured so the real Supabase job later is a service-layer swap, not a rebuild.

Do not introduce new colors, fonts, spacing, or component visual language. Every new piece must reuse existing components/tokens (drawer pattern, `AIStateBanner`, toast pattern, button/select styles).

---

## 1. Entry points

Add a **"Call with AI"** primary action:
- On **Lead Detail** (`/leads/:id`) — placed in the right pane, above or alongside the `ActionCard` area.
- On the **Leads list** (`/leads`) — as a row-level action in the existing trailing ghost-icon-button column (§ table spec), not a new column.

Both open the same drawer component (§ existing right slide-over drawer pattern — 480px desktop, full-width mobile, `radius.lg` leading edge, `shadow.lg`, opens at `motion.duration.base`).

Disabled/replaced state: if the lead already has a call in `SCHEDULED` or an active live state (`CALLING`/`CONNECTED`/`PROCESSING`), the button is replaced with a status chip reflecting that state instead — never allow a second call to be started on top of one already in flight.

---

## 2. The drawer flow — "Call with AI"

**Step 1 — Select campaign.**
- Dropdown of campaigns eligible for this lead: status `Active`, and either already targeting this lead or open to being applied to it (match existing campaign/lead association logic — do not invent a new targeting concept).
- On selecting a campaign, show its assigned **Agent** underneath as a read-only summary (name + objective, pulled from the campaign's existing agent assignment — do **not** add a second, independent agent picker; per §43 a campaign already owns one agent at creation, and a call inherits it).
- Empty state: no eligible active campaigns → inline message ("No active campaign covers this lead yet") with a link to Campaigns, not a dead-end.

**Step 2 — Choose mode.** Two buttons, not tabs, since only one action is taken:
- **Call now** — starts immediately.
- **Schedule for later** — reveals a simple date/time picker inline (no new calendar component — plain native-feel inputs consistent with existing form field styling).

**Step 3 — Confirm.**
- "Call now" → confirms, closes drawer, shows a toast ("Call started"), and the call immediately appears as a live `AIStateBanner` (live-call subset) in Lead Detail's right pane and as the live status in the Calls list row.
- "Schedule" → confirms, closes drawer, shows a toast ("Call scheduled for [date/time]"), and a new entry appears in the Lead's Timeline and in the Calls list with status `Scheduled`, plus a row-level Cancel/Reschedule action (reuse existing row-action pattern).

---

## 3. Simulated live-call behavior (mock only, no real telephony)

For "Call now," progress the call through the existing named states from §41 on a short mock timer, purely client-side:

```
CALLING → CONNECTED → PROCESSING → COMPLETED
```

- Use the existing `AIStateBanner` component as-is — no new banner variant.
- `CONNECTED`/`PROCESSING` may use the already-permitted subtle pulse motion (§16) — nothing else animated.
- On reaching `COMPLETED`, the call behaves like any other finished call already in the mock data (eligible to produce a `Decision`, appear in Call Detail, etc.) — reuse the existing decision-generation mock logic rather than writing a separate path for calls started this way.
- Scheduled calls do **not** auto-transition into live states when their time arrives in this phase — that requires a real backend trigger and is out of scope. They simply sit as `Scheduled` until manually cancelled/rescheduled or replaced by real backend behavior later.

---

## 4. Data model & service-layer changes (Supabase-ready)

Extend the existing `Call` entity — do not create a parallel entity:

```
Call {
  id
  leadId
  campaignId
  agentId        // derived from campaignId at call-creation time
  status: 'scheduled' | 'calling' | 'connected' | 'processing' | 'completed' | 'failed'
  scheduledFor?: timestamp
  createdAt
  ...existing fields (duration, transcript ref, decision ref, etc.)
}
```

Extend `hooks/useCalls.ts` and `services/callsService.ts` (per the modularity structure — one file per entity, not the shared index files) with:
- `createCall({ leadId, campaignId, mode: 'now' | 'schedule', scheduledFor? })`
- `cancelScheduledCall(callId)`
- `rescheduleCall(callId, newScheduledFor)`

These are the only new functions needed — no new hook file, no new service file. Components (`Lead Detail`, `Leads` list, `Calls` list) call these through the hook only, never the service directly, consistent with the existing `Page → Component → Hook → Service → Provider` rule.

---

## 5. States to cover

- Drawer: loading campaigns, no eligible campaigns (empty state), campaign selected/agent shown, submitting, error (inline, with retry — per §40).
- Lead Detail: no active/scheduled call (button available), call in progress (banner + button replaced by status chip), call scheduled (Timeline entry + button replaced by status chip), call completed (existing decision flow resumes as normal).
- Calls list: new rows for `Scheduled` and live states must sort/display correctly alongside existing completed calls, using the same status badge treatment already defined for calls.

---

## Confirm at the end

```
WHAT EXISTS
WHAT THIS PHASE ADDS
WHAT MUST NOT BREAK
WHAT COMES NEXT
```