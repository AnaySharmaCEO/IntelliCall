# 02: Screens (every page, tab, and state)

Notation: **Route** · **Purpose** · **Layout** · **Data shown** · **Actions** · **States** · **Perm** (minimum role) · **Slot** (where backend/AI plugs in).
Roles: V=viewer, O=operator, M=manager, A=admin, W=owner. A permission is the minimum role unless noted.
Universal states for every screen: `loading` (skeleton, not spinner), `empty` (actionable), `error` (retry + request ID), `forbidden` (lock + "ask an admin"), `offline/stale` (banner).

---

## A. Public and auth

| Route | Contents |
|---|---|
| `/login` | Email + password, "Continue with Google" (disabled/roadmap), magic link option, forgot password, error states (invalid, locked, unverified), demo-credentials hint in mock mode |
| `/signup` | Name, work email, password with strength meter, terms checkbox, existing-invite detection |
| `/verify-email` | "Check your inbox", resend with cooldown, change email |
| `/forgot-password`, `/reset-password` | Request + set new password, token-expired state |
| `/accept-invite/:token` | Shows org name, inviter, role; accept/decline |
| `/onboarding` (4 steps, resumable) | **1 Organization**: name, industry (Real estate, Education, Insurance, Healthcare clinic, Financial services, Agency, Other), size, timezone (default Asia/Kolkata), currency ₹. **2 Calling setup**: choose *Web demo* (default) or *PSTN (requires provider)*; call languages (English, Hindi); calling window; compliance acknowledgement checkbox. **3 Team**: invite by email with role. **4 First agent**: pick a template (Lead Qualifier, Appointment Setter, Follow-up Caller) → creates draft agent → "Run a test call". Skippable with "Do later"; checklist persists on Dashboard |
| `/403`, `/404`, `/500`, `/maintenance`, session-expired modal | Plain pages with route back |

---

## B. Dashboard `/dashboard` (Perm: V)

**Purpose:** answer *what happened, why, what next*. Outcomes first.

**Layout (top → bottom):**
1. **Header row:** title, date-range picker (Today, 7d, 30d, This month, Custom), campaign filter (All / specific), agent filter, language filter, channel filter (Web demo/PSTN), "Compare to previous period" toggle, Export.
2. **Primary KPI strip (5 cards):** Completed calls · Qualified leads · Confirmed meetings · Follow-ups due/overdue (attention) · Items needing review (attention). Each has delta, sparkline, formula tooltip, click-through.
3. **Row 2:** *Conversion funnel* (Leads in campaign → Attempted → Connected → Human answered → Completed → Qualified → Meeting proposed → Meeting confirmed) · *Campaign trends* (calls/day vs qualified/day, toggle metric, per-campaign lines).
4. **Row 3:** *Action queue* (top 8: reviews, overdue follow-ups, failed actions, booking errors, compliance blocks) · *Insights* (3 InsightCards: top objection, rising intent, biggest drop-off, each with evidence excerpts).
5. **Row 4:** *Campaign comparison table* (name, status, leads, attempts, answer rate, qualification rate, meetings, cost/qualified lead, cost/meeting) · *Language comparison* (English vs Hindi: answer rate, completion rate, qualification rate, avg duration).
6. **Row 5:** *Operational health* (provider status tiles: Telephony, Voice engine, AI analysis, Calendar; processing completion rate, p50/p95 response latency, failed initiations, delayed jobs) · *Spend* (₹ this period, cost split: telephony / voice engine / analysis, projected month-end, budget bar).
7. **Secondary KPI groups (collapsible tabs):** Calling · Pipeline · Conversation Intelligence · Reliability: each shows the metrics listed in `04` §4 in a compact grid.
8. **Getting-started checklist** card (only until complete): org ✓ · import leads · create agent · test call · launch first campaign.

**States:** new org (checklist + sample-data offer "Load demo data" in mock only), no calls yet (funnel empty state), period with zero data, partial data (analysis pending banner: "6 calls are still being analyzed").
**Slot:** `GET /dashboard/summary?from&to&campaignId...` (server-aggregated).

---

## C. Leads

### C1. `/leads` (Perm: V view, O edit)
- **Views toggle:** Table · Board (pipeline kanban) · Segments.
- **Table columns (all toggleable):** select, Name + company, Phone (masked by role), Email, City, Source, **Stage**, **Qualification**, **Compliance** (DND/consent), Owner, Last call (relative + outcome), Next follow-up, Campaigns (count), Language preference, Tags, Created, Last activity.
- **Filters:** stage, qualification, compliance status, campaign, owner, source, city/state, language, tags, last-call outcome, date ranges, "No consent", "On DND", "Never called", "Has overdue follow-up", "Needs review".
- **Saved views:** "All leads", "Ready to call", "Callbacks due", "Qualified", "Needs review", plus user-created.
- **Bulk bar (on selection):** Add to campaign · Change stage · Assign owner · Add/remove tags · Mark Do-not-call · Export selected · Delete (admin, soft-delete) .
- **Board:** columns = pipeline stages with count and conversion %, cards (name, company, phone, last outcome, next action, compliance dot), drag to change stage (writes to history with actor), WIP-free.
- **Segments:** saved filter sets with live count, "Use in campaign".
- **Actions:** `+ New lead`, `Import leads`, `Export`, column picker, density.
- **States:** empty (CTA Import / Add), filtered-empty (Clear filters), import in progress (tray).

### C2. `/leads/:id`
**Header:** name, company, stage chip (editable), qualification chip, compliance badge, owner, quick actions: *Call now (test)*, *Add to campaign*, *Schedule follow-up*, *Add note*, *Mark do-not-call*, overflow (edit, merge duplicate, delete).
**Left/main tabs:**
1. **Overview:** timeline summary, latest qualification answers (question → answer + EvidenceChip + capture date), latest intent, objections, next best action (AI-proposed, with Approve/Dismiss).
2. **Conversations:** list of calls (date, campaign, agent, language, duration, outcome, cost) → opens Call detail drawer. Aggregated "what we know" across calls with evidence.
3. **Qualification:** per-campaign criteria checklist with satisfied/unsatisfied/unknown, evidence, decision history (who/what changed it).
4. **Appointments & follow-ups:** proposed vs confirmed, tasks, history.
5. **Activity:** unified timeline of stage changes, calls, AI decisions, human corrections, imports, notes, consent changes.
6. **Notes & files:** notes (markdown-light, @mention), attachments (mock upload).
**Right rail:** contact fields (inline edit with validation), custom fields, tags, source, consent record (type, timestamp, source), DND scrub result (date, source), preferred language/time, timezone, duplicate warnings, campaign membership.
**States:** lead blocked by compliance (call actions disabled with explanation), merged lead redirect, deleted lead (read-only archive).
**Slot:** `GET /leads/:id`, `GET /leads/:id/timeline`.

### C3. `/leads/import` (also modal from list)
See `03-modals` M-01 (wizard in modal: upload → map → validate → compliance scrub preview → confirm → progress → summary).

---

## D. Campaigns

### D1. `/campaigns` (Perm: V)
**Table:** name, objective, status, agent, language(s), schedule/window, progress bar (attempted/target), leads, answer rate, qualification rate, meetings (confirmed/proposed), cost, owner, created. **Row quick actions:** pause/resume, duplicate, open. Filters: status, agent, owner, date. Card view toggle with mini funnel. **Actions:** `+ New campaign`.
**Empty:** explains the loop and CTA "Create your first campaign".

### D2. `/campaigns/new` (wizard, Perm: O)
Steps (details in `03-modals` W-01): 1 Objective · 2 Agent & language · 3 Audience · 4 Qualification criteria · 5 Calling rules (window, concurrency, retries, voicemail, caller ID) · 6 Compliance preflight · 7 Review & launch. Autosave draft, resumable, validation per step, estimated cost/duration summary sidebar.

### D3. `/campaigns/:id` (record page)
**Header:** name, status, objective, agent (link), controls: **Launch/Resume · Pause · Stop · Duplicate · Edit** (confirmation modals), live "calls now" indicator, last-updated.
**Tabs:**
1. **Overview:** KPI strip (attempted, connected, human-answered, completed, qualified, meetings proposed/confirmed, cost, cost per qualified lead), progress, funnel, calls-per-hour chart, outcome distribution, best/worst hours, language split, "needs attention" list.
2. **Leads:** table of campaign leads with per-lead status (`pending`, `in_queue`, `attempted`, `connected`, `completed`, `retry_scheduled`, `exhausted`, `blocked`), attempts count, last outcome, next attempt time; actions: skip, retry now, remove, add leads.
3. **Calls:** campaign-scoped calls table (same as Calls page).
4. **Insights:** objections, intents, common questions, drop-off moments in script (which question lost people), with evidence drill-down.
5. **Failures & cost:** failure reasons (no answer, busy, voicemail, provider error, blocked by compliance, analysis failed) with counts and retry actions; cost breakdown (telephony/voice/analysis), per-call cost distribution, budget cap setting.
6. **Settings:** read-only configuration summary when running, editable when draft/paused; change log.
**States:** draft, preflight failed (list of failed checks with fix links), running with provider outage (banner + auto-pause policy), completed (summary report with "Export PDF/CSV").

---

## E. Calls

### E1. `/calls` (Perm: V)
**Table:** time, lead (link), campaign, agent, **channel**, language, status, **answered by** (human/voicemail/unknown), duration, outcome, qualification result, intent, sentiment (optional), **analysis status**, cost, flags (needs review, compliance, low confidence). Filters: date, status, outcome, campaign, agent, language, channel, duration range, has-review, analysis status, **full-text transcript search** (`q`, shows matching snippet in row). Saved views: "Needs review", "Qualified", "Failed", "Long calls". Bulk: export, send to review, re-run analysis (admin).
**Row click:** opens Call drawer (summary, quick facts, play button) with "Open full review" → `/calls/:id`.

### E2. `/calls/live` (Perm: V)
**Workspace layout:** left = live calls list (lead, campaign, agent, elapsed time, phase, language); center = selected call **live transcript** (auto-scroll with "Follow live" toggle, speaker bubbles, language chips, interim text greyed); right = **Live Activity** (tool calls like "Checked availability", detected signals as they appear *marked provisional*, compliance checks, latency per turn).
Top strip: concurrency gauge (live / limit), queue size, calls/min, provider status.
Controls: *Listen in* (roadmap/disabled), *Take over* (roadmap/disabled), *Stop call* (confirm, O+), *Flag for review*.
States: none live (shows next scheduled launches + "Start test call"), realtime disconnected, call ended (auto-transitions to "Analyzing" panel → link to Call detail).

### E3. `/calls/:id` (full call review)
**Header:** lead, campaign, agent + version, channel, language, start time, duration, cost, status chips (call, analysis), compliance snapshot, actions: *Re-run analysis* (A+), *Flag for review*, *Export transcript*, *Share link* (internal), *Next/Prev call* arrows.
**Layout (3 columns on desktop):**
- **Left: Audio + Transcript.** AudioPlayer (waveform with evidence markers, speed, skip), TranscriptView (search, Roman/Devanagari toggle, speaker filter, highlighted evidence, per-segment "Copy", "Flag as incorrect" → opens correction).
- **Center: Intelligence.**
  - *Summary* (3-5 lines, each sentence has evidence chips).
  - *Outcome & next action* (decision cards).
  - *Qualification answers* (question → answer → evidence → status → editable by human).
  - *Extracted facts*: needs/pain points, budget, timing, competitors, objections, questions, commitments, callback date/time (with parsed absolute time and original phrase), appointment details.
  - *Intent & sentiment* with ConfidenceMeter.
  - Each item has **Approve / Edit / Reject** (O+) → creates HumanCorrection.
- **Right: Actions & Audit.**
  - **Action ledger:** each proposed/performed action (update stage, create follow-up, propose/confirm appointment, update qualification, send webhook) with status, attempts, idempotency key, error text, "Retry" (when failed), policy result ("auto-applied: confidence ≥ threshold and evidence present" / "sent to review: ambiguous date").
  - **Audit trail:** timeline of AI decisions, human corrections, system events.
  - **Technical:** latency per turn (p50/p95), interruptions count, audio quality note, provider call IDs, model/version, prompt/agent version, cost breakdown.
**States:** analyzing (skeleton panels with progress text), analysis failed (retry), no audio (transcript only), no transcript (provider failure), voicemail (voicemail summary template), compliance-blocked attempt (no audio, reason only).
**Slot:** `GET /calls/:id`, `/calls/:id/transcript`, `/calls/:id/analysis`, `/calls/:id/actions`, `/calls/:id/audit`.

---

## F. Review Queue `/review` (Perm: O)

**Purpose:** inbox for everything the system should not decide alone.
**Layout:** list (left) + review panel (right).
- **Tabs / filters:** All · Uncertain classification · Conflicting evidence · Missing data · Failed actions · Booking errors · Compliance · Assigned to me. Sort by age/severity. Bulk assign.
- **List item:** type icon, one-line issue ("Callback date ambiguous: 'next Tuesday-ish'"), lead + call, severity, age, assignee.
- **Review panel:** *What the model decided* (original output) · *Why it was flagged* (rule/threshold) · *Evidence* (transcript excerpts with play span) · *Proposed correction* (editable structured fields) · buttons **Approve as is**, **Apply correction**, **Reject (no action)**, **Escalate/Assign**, "Open full call" · resolution note (required on reject/correct) · after resolve: result of re-executed actions.
- **Keyboard:** `a` approve, `e` edit, `r` reject, `j/k` navigate.
- **Stats strip:** open count, median age, resolution rate, % corrections that changed outcome (feeds Insights).
**States:** empty ("Nothing needs review" + stat recap), item already resolved by someone else (conflict notice), action re-execution failed (stays open with error).

---

## G. AI Agents

### G1. `/agents` (Perm: V)
Cards/table: name, description, status (draft/published/archived), languages, voice, active version, campaigns using it, calls (30d), qualification rate, avg duration, last edited. Actions: `+ New agent` (template gallery or blank), duplicate, archive. Template gallery: Lead Qualifier, Appointment Setter, Follow-up Caller, Event Invitation, Survey Caller (some marked "template only").

### G2. `/agents/:id` (Perm: O to edit; publish needs M)
Header: name, status, version selector, **Test call** button, **Publish** (diff summary → confirm), **Discard draft**.
**Tabs:**
1. **Persona & Prompt:** agent name spoken to leads, company name, role, **greeting** with required **AI-disclosure line** (toggle "Identify as automated assistant", editable text, default on), tone (formal/friendly/concise), system instructions (editor with variables `{{lead.first_name}}`, `{{company}}`, `{{offer}}`), do/don't lists, conversation limits (max duration, max silence, interruption sensitivity).
2. **Languages & Voice:** primary language (English-IN / Hindi), secondary, **auto-switch** toggle, voice picker with sample playback (provider voices; "Clone voice" roadmap), speech pace, Hindi script display preference. Per-language greeting variants.
3. **Knowledge:** approved business info: FAQs (Q/A list), offer details, pricing statements allowed, locations/hours, uploaded documents/links (mock: file list with status `processed`), "Things the agent must not claim". Coverage hint: questions from past calls the knowledge couldn't answer (from Insights).
4. **Qualification script:** ordered questions (text, type: yes/no, choice, number, free text, required?, qualifying rule e.g. "budget ≥ ₹50L"), objection-handling snippets, success definition, disqualification reasons list. Drag to reorder, rule builder UI.
5. **Actions & Permissions:** table of allowed actions: *Update lead stage*, *Update qualification*, *Create follow-up*, *Propose appointment*, *Confirm appointment (requires calendar provider)*, *Mark do-not-call*, *Send webhook*, *Transfer to human* (roadmap). Each row: allowed / needs-review / forbidden, with threshold override.
6. **Guardrails & Escalation:** topics to refuse, compliance phrases, when to end call, escalate-to-review triggers (e.g. lead asks for human, anger detected, legal question), voicemail behaviour, DND-request behaviour (must mark DNC immediately).
7. **Test Console:** big start-call control (web call), language selector, lead persona simulator (pick a seeded lead for variable substitution), live transcript, mic/speaker meter, latency per turn, "What the agent did" activity stream, end-of-call **dry-run analysis** (shows what decisions/actions *would* be produced; does not write to production leads). Checklist for first-time users (mic permission, headset tip). Error states: mic denied, connection failed, provider quota exceeded.
8. **Versions & Changes:** immutable versions (v1, v2…), diff viewer, who/when, rollback, "used by campaigns" list.
**States:** unpublished changes banner, validation errors (e.g. no greeting disclosure → publish blocked), agent in use by running campaign (edit creates new draft version, running campaigns keep the old version).

---

## H. Appointments and Follow-ups

### H1. `/appointments` (Perm: V)
**Tabs:** Calendar · List · Availability · Booking errors.
- **Calendar:** FullCalendar day/week/month/agenda. Color + pattern: **Confirmed** (solid accent), **Proposed** (dashed outline), **Completed** (muted), **No-show** (danger-muted), **Booking failed** (danger). Filters: owner, campaign, status. Click → **Appointment panel**. Drag to reschedule (confirm modal, writes provider call). Timezone display with IST default.
- **List:** table: lead, time, owner, campaign, status, source call (link + evidence chip for requested time), reminders, provider sync status.
- **Availability:** weekly working hours per team member/host, buffers, slot duration, holidays (India holiday preset), booking horizon, **Calendar provider card** (Internal ✓ connected; Google Calendar, Outlook = "Connect" disabled/roadmap with explanation).
- **Booking errors:** appointments where `booking_failed` or provider sync failed; retry/resolve.
Actions: `+ New appointment`, bulk reschedule (roadmap).

### H2. `/follow-ups` (Perm: V)
Tabs: **My tasks** · **All** · **Callbacks** · **Overdue** · **Completed**. Table/Board toggle. Columns: lead, type (callback, human call, send info, review), due (absolute + relative), owner, source (AI-created vs human), campaign, status, evidence chip (e.g. "call me next Tuesday"), priority. Row actions: complete, snooze, reassign, reschedule, create AI callback (adds to campaign queue). Callbacks created by AI with ambiguous dates show a **warning chip linking to the Review item**. Metrics header: due today, overdue, completion rate, median time to complete.
Modal: M-07 Schedule follow-up.

---

## I. Insights `/insights` (Perm: V)
**Purpose:** aggregate conversation intelligence with evidence; the differentiator.
**Tabs:**
1. **Objections:** ranked list (category, count, % of conversations, trend, outcome impact) → click opens **Evidence list**: calls with excerpts, "What this does and doesn't establish" note (sample size caveat), "Review these calls" (adds to review), "Add to agent knowledge" (prefills objection-handling snippet).
2. **Intent & Needs:** intent distribution, common pain points, questions asked that the agent couldn't answer, competitor mentions.
3. **Script performance:** per qualification question: reach rate, answer rate, drop-off rate → find where leads hang up.
4. **Language & timing:** answer/qualification by hour-of-day, day-of-week, language, city tier.
5. **AI quality & evaluation:** *model confidence distribution*, **review rate**, **correction rate**, and, where reviewed labels exist, **measured accuracy** (precision/recall/F1 for qualification and extraction), false-positive/false-negative qualification, appropriate-action rate, action success rate. Clear banner when sample is below a minimum ("12 reviewed calls: too few for reliable rates"). Export labelled set (CSV) for research. This tab doubles as evidence for the research paper.
6. **Learning (preview):** locked "Coming soon" card describing how verified outcomes will inform strategies; no fake numbers.
Rules: every number links to records; every chart shows sample size.

---

## J. Compliance Center `/compliance` (Perm: V view, M manage)
Tabs:
1. **Overview:** compliance posture checklist (calling window set ✓, AI disclosure enabled ✓, DND scrub up to date ✓/✗, consent coverage %, provider number declared for automated calls ✓/✗ (manual attestation), recording consent notice ✓), blocked-call counts, recent violations prevented.
2. **DND & Consent ledger:** per-lead table: DND status (checked at, source), consent type (explicit/inferred/imported), consent timestamp/source, expiry, category preferences; bulk re-scrub (mock), upload consent evidence.
3. **Calling rules:** org defaults: calling window (default 09:00-21:00 IST, flagged *"Verify against current TRAI rules"*), days of week, per-state/holiday blackouts, max attempts per lead per day/week, cooling-off period, enforce-server-side toggle (locked on).
4. **Suppression list:** numbers never to call (add/import/remove with reason, who/when); automatically populated when a lead says "don't call".
5. **Disclosures & scripts:** AI-disclosure wording per language, recording notice wording, opt-out phrase handling.
6. **Blocked attempts log:** call attempts prevented by rule (reason, lead, campaign, time).
Disclaimer footer: "Informational controls; not legal advice."

---

## K. Notifications `/notifications` (Perm: V)
Inbox with filters (All, Needs action, Mentions, System), types: review assigned, campaign finished/paused/failed, provider outage, follow-up due/overdue, booking failed, import finished, usage threshold, compliance block, agent published, member joined. Mark read/all, snooze, deep link. Preferences link (per-type channel: in-app, email (roadmap)).

## L. Audit Log `/audit-log` (Perm: A)
Table: time, actor (human/AI/system), role, action, entity (type + link), before → after diff, result, IP/user-agent (human), request ID. Filters: actor, action type, entity, date, result (success/failure), **AI-initiated only**, **human-correction only**. Export CSV. Row → drawer with full payload and linked decision/evidence.

---

## M. Settings `/settings/*` (left sub-nav)

| Route | Contents | Perm |
|---|---|---|
| `/settings/organization` | Name, logo, industry, timezone, currency, locale (en-IN), business hours, default language, data region note | A |
| `/settings/team` | Members table (name, email, role, status, last active), invite modal, change role, deactivate, pending invites with resend/revoke, **role permission matrix viewer**, SSO card (roadmap) | A |
| `/settings/calling` | Calling mode (Web demo / PSTN), numbers & caller IDs (list with status, verification, declared-for-automated-calls flag), provider connection status + test connection, concurrency limit, default retry rules, voicemail policy, recording on/off + consent notice, **Inbound calling** card (roadmap) | A |
| `/settings/engine` | **Resonology AI engine** status, voice runtime (LiveKit) status, LLM provider (Gemini) status, model names/versions, default voice, analysis settings, **automation policy**: per-decision-type auto-apply threshold, require-evidence toggle, actions that always need review (booking, DNC, stage → disqualified), retry policy for failed actions, "Test connection" buttons. Labelled "Thresholds are uncalibrated until validated against reviewed examples" | A |
| `/settings/integrations` | Cards: Calendar (Internal ✓, Google, Outlook), CRM (HubSpot, Zoho, Salesforce, LeadSquared), Messaging (WhatsApp, SMS), Webhooks, Zapier/Make: unconnected ones are roadmap-disabled with "Notify me" | A |
| `/settings/usage-billing` | Plan card, usage meters (call minutes, analysis count, storage), cost by campaign/agent/day, budget cap with alert thresholds, invoices table (mock), payment method (roadmap), GST details fields | W |
| `/settings/api` | API keys (create/revoke, scopes, last used, shown once), webhook endpoints (URL, events, secret, status, recent deliveries with retry), event catalogue | A |
| `/settings/data-privacy` | Retention (recordings, transcripts), PII masking per role, export all data, delete lead data request, consent policy text, data region | A |
| `/settings/preferences` | Theme, density, timezone override, date/number format preview, notification preferences, keyboard shortcuts toggle | all |
| `/settings/system-status` | Provider health tiles, recent incidents, queue depth, delayed jobs, webhook failures, "Run diagnostics" | A |
| `/settings/developer` (mock only) | Data source indicator, Reset demo data, simulate scenarios, failure injection, role switcher | dev |

---

## N. Global search results `/search?q=` (also in ⌘K)
Grouped results: Leads, Calls (transcript snippet matches), Campaigns, Agents, Appointments, Follow-ups, Help. Filters by type. Recent searches.

## O. Help
`/help` lightweight: keyboard shortcuts, glossary (definitions from master spec §2.4), "How metrics are calculated" (links from KPI tooltips), contact/feedback form (mock).
