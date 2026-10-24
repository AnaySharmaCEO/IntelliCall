# 03: Modals, Drawers, Wizards, Panels

Rules: short operations → **modal**; contextual inspection → **right drawer** (keeps list visible); substantial workflows → **full page or wizard**. All dialogs trap focus, close on `Esc`, warn on unsaved changes, and show inline field errors plus a summary on submit. Destructive actions require typed or explicit confirmation and show consequences ("This will cancel 3 scheduled calls").

## Wizards

### W-01 Create Campaign (page `/campaigns/new`)
| Step | Fields | Validation / behaviour |
|---|---|---|
| 1 Objective | Name, objective (Qualify & book meeting, Qualify only, Follow-up, Event invite), description, owner, success definition (what counts as "qualified" in words), tags | Name unique; objective sets defaults below |
| 2 Agent & language | Agent (published only) with version pin, call language (English-IN / Hindi / per-lead preference), auto-switch toggle, greeting preview in selected language, voice preview | Agent must be published; shows agent's disclosure line |
| 3 Audience | Source: segment, saved view, manual selection, upload; table of eligible leads with compliance column; exclusions auto-applied (DND, no consent, suppressed, called in last N days, already in running campaign); counts: total / eligible / excluded with reasons (clickable) | ≥ 1 eligible lead; excluded reasons visible, not hidden |
| 4 Qualification criteria | Criteria rows (field, operator, value, required) prefilled from agent script; "qualified if ALL required / ANY" logic; disqualifiers; appointment goal (book meeting, who hosts, duration, buffer) | At least one criterion for qualify objectives |
| 5 Calling rules | Calling window in IST (default 10:00-19:00, bounded by org compliance window), days, timezone-aware per-lead option, concurrency (≤ org limit), pacing (calls/min), max attempts, retry gap (e.g. 3 h/next day), voicemail action (hang up / leave message / mark), caller ID selection, start now/schedule, end date, budget cap | Window must be inside org compliance window; concurrency ≤ limit |
| 6 Preflight | Automated checks list with pass/warn/fail and "Fix" links: agent published, telephony ready (Web demo OK / PSTN provider connected), voice engine reachable, AI analysis reachable, calendar provider connected (for booking goals), leads compliance-clear, within window now, budget set, estimated cost and duration | Cannot launch on any `fail` |
| 7 Review & launch | Summary of all steps, estimated calls/cost/duration, "what will happen" bullets, **Save as draft**, **Schedule**, **Launch now** → confirm modal M-02 | |
Sidebar (all steps): live estimate (calls, ₹ cost range, time). Autosave draft every change; resume from list.

### W-02 Import Leads (modal wizard, large)
1. **Upload:** drag/drop CSV/XLSX (≤ 10 MB / 10,000 rows), download template, sample file; duplicate handling policy (skip / update / create new).
2. **Map columns:** auto-mapping with confidence, dropdown per column, custom field creation, preview first 5 rows.
3. **Validate:** results table: valid / warnings / errors with row numbers; typical issues: invalid phone (not E.164-parsable for IN), duplicate in file, duplicate in system, missing name, invalid email; inline fix or skip; download error report.
4. **Compliance scrub preview:** per row DND/consent/suppressed status (mock results), counts, option "Import but mark Not callable".
5. **Confirm:** counts, owner assignment, tags, source label, add to segment/campaign optional.
6. **Progress & summary:** background task with progress; summary: created/updated/skipped/failed; links to "View imported leads" and "Download rejected rows".

### W-03 Agent Publish (modal)
Diff between draft and published, validation checklist (disclosure present, greeting set per language, ≥ 1 qualification question, actions policy set), "Used by N campaigns (they keep their pinned version)", changelog note (required), **Publish**.

### W-04 Onboarding (see 02 §A).

## Confirmation and action modals

| ID | Modal | Trigger | Content |
|---|---|---|---|
| M-01 | New / Edit Lead | Leads page, ⌘K | Name, company, phone (IN default, country picker), email, city, source, owner, language preference, tags, consent checkbox + source (required to be callable), notes; duplicate detection live as you type |
| M-02 | Launch Campaign confirmation | Wizard/campaign header | Summary: leads, window, estimated cost, concurrency; checkboxes: "I confirm leads are eligible to be contacted" (compliance attestation); countdown-free; primary **Launch** |
| M-03 | Pause / Resume / Stop Campaign | Campaign controls | Consequence text (in-flight calls finish vs end immediately), reason (stop requires reason), effect on queued leads |
| M-04 | Add to Campaign | Leads bulk | Choose draft/running campaign; shows eligibility results and exclusions |
| M-05 | Change Stage / Assign Owner / Tags | Leads bulk | Reason field for backward stage changes |
| M-06 | Mark Do-Not-Call | Lead, bulk | Reason (requested by lead / compliance / other), propagates to suppression list, cancels queued calls (consequence text) |
| M-07 | Schedule Follow-up | Lead, call, follow-ups | Type (callback by AI, human call, send info, other), due date/time with timezone and quick picks (Tomorrow 10:00, Next Monday), owner, notes, link to evidence, "Let AI attempt the callback" toggle (adds to campaign queue) |
| M-08 | New / Edit Appointment | Appointments | Lead, host, date/time (checks availability, shows conflicts), duration, location/link, notes, reminders, status (Proposed/Confirmed); **Confirm** calls provider and shows result states: `confirming…` → `Confirmed` / `Failed (reason)` |
| M-09 | Reschedule Appointment | Calendar drag, panel | New time, notify lead (roadmap toggle), reason; shows provider result |
| M-10 | Cancel Appointment | Panel | Reason, "mark lead for new proposal" |
| M-11 | Add Note | Lead/call | Markdown-light, @mention, pin |
| M-12 | Flag Segment as Incorrect | Transcript segment | Choose what was wrong (transcription, language, speaker, extraction), corrected text, creates review item |
| M-13 | Invite Member | Team | Emails (multi), role, message; seat info |
| M-14 | Change Role / Deactivate Member | Team | Permission diff shown; owner transfer flow |
| M-15 | Create API Key | API | Name, scopes, expiry; **secret shown once** with copy and acknowledgement |
| M-16 | Add Webhook Endpoint | API | URL, events multiselect, secret generation, "Send test event" |
| M-17 | Add Suppression Number(s) | Compliance | Paste/upload numbers, reason |
| M-18 | Re-run Analysis | Call | Pick analysis version, warns that decisions may change and re-trigger actions policy; requires A |
| M-19 | Export | Tables | Format (CSV/XLSX/PDF where relevant), columns, filters recap, PII included? (permission-gated), run as background task |
| M-20 | Delete (lead/agent/campaign/etc.) | Overflow menus | Soft-delete explanation, dependencies listed, typed confirmation for orgs/agents in use |
| M-21 | Discard Unsaved Changes | Navigation | Save / Discard / Cancel |
| M-22 | Session Expired | Auth | Re-login preserving route |
| M-23 | Keyboard Shortcuts | `?` | Shortcut table |
| M-24 | Create Organization | Org switcher | Name, industry, timezone |
| M-25 | Connect Integration (roadmap) | Integrations | Explains planned capability; "Notify me" captures interest (mock) |
| M-26 | Test Call Pre-flight | Agent test | Mic permission check, language, persona lead, disclosure of recording behaviour |
| M-27 | Budget Cap Reached | System | Shown when a cap pauses campaigns; actions: raise cap, resume, view spend |

## Drawers / side panels

| ID | Drawer | Opens from | Content |
|---|---|---|---|
| D-01 | **Lead drawer** | Table rows, search | Condensed lead record: key facts, stage, last call summary, next action, quick actions; "Open full page" |
| D-02 | **Call drawer** | Calls, lead conversations, campaign calls | Status, summary (with evidence chips), outcome, key facts, mini transcript with play, action ledger summary, "Open full review" |
| D-03 | **Review decision panel** | Review queue, call detail | Original decision, evidence, correction form, approve/reject (described in 02 §F); also usable as drawer from a call |
| D-04 | **Appointment panel** | Calendar/list | Details, status, source call and evidence chip, provider sync info, confirm/reschedule/cancel, history |
| D-05 | **Evidence drawer** | Any `EvidenceChip` in dashboards/insights | Quote(s), speaker, timestamp, audio snippet, link to call; if multiple calls, list |
| D-06 | **Task drawer** | Follow-ups | Details, edit, complete, history |
| D-07 | **Agent version diff drawer** | Versions tab | Side-by-side diff |
| D-08 | **Audit entry drawer** | Audit log | Full payload, before/after diff, linked decision |
| D-09 | **Notification drawer** | Bell → "Open" | Recent notifications list with actions |
| D-10 | **Background tasks tray** | Top bar | Import/export/launch/analysis tasks with progress, retry, dismiss |
| D-11 | **Filter drawer (mobile)** | Lists on narrow screens | Full filter set |
| D-12 | **Provider status drawer** | Health tiles | Incident history, last check, recommended action |

## Popovers and inline controls to implement
Date-range picker with comparison · column picker · saved-view menu (save, rename, share to org, set default) · user/owner picker · tag picker with create · stage selector with reason · language selector · status filter chips · inline-edit fields with undo toast · hover cards on lead names (mini profile) · metric formula tooltip ("How is this calculated?" link to Help).
