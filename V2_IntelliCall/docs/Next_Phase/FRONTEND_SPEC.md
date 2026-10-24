# IntelliCall Frontend Spec: Master Document

> **For the IDE agent (Antigravity):** this is the source of truth for the IntelliCall frontend. Read this file fully, then read the files in `docs/frontend/` when you reach the matching phase (§9). If something here conflicts with your instinct, this file wins. If something is missing, **make the smallest reasonable choice, record it in `docs/frontend/DECISIONS.md`, and keep going**; do not stop to ask unless a decision is irreversible.

Product: **IntelliCall** (customer-facing). Engine credited in "About" and Settings only: **Resonology AI**. Resonology has no UI identity of its own.

Companion docs:
- `docs/COMPETITIVE_BENCHMARK.md`: why each capability exists.
- `docs/frontend/01-design-system-and-shell.md`: tokens, components, app shell, command palette.
- `docs/frontend/02-screens.md`: **every page, tab and state**.
- `docs/frontend/03-modals-and-panels.md`: every modal, drawer, wizard.
- `docs/frontend/04-data-model-and-metrics.md`: entities, enums, metric formulas, RBAC.
- `docs/frontend/05-api-realtime-and-ai-contracts.md`: REST, realtime events, AI output schema, voice call flow.
- `docs/frontend/06-mock-data-and-states.md`: seed scenarios and state coverage.

---

## 0. Non-negotiable rules

1. **No dead UI.** Every button, tab, filter, menu item and link either (a) works end-to-end against the mock layer, or (b) is rendered `disabled` with a tooltip "Coming soon" and a `data-roadmap` attribute. Nothing may silently do nothing.
2. **All data goes through the API client layer** (§3). No component imports fixtures, calls `fetch`, or touches Supabase directly. Swapping mock → real backend must change **zero** component code.
3. **Contracts first.** Every payload is a Zod schema in `src/contracts/`. TypeScript types are inferred from them. Mock and real responses both parse through the same schemas in dev.
4. **Every AI-derived value shows evidence.** Intent, qualification, objections, callback dates, appointment details, and summary claims render with an `EvidenceChip` linking to transcript segment(s). If there is no evidence, show "No supporting evidence" in warning style; never show an unsupported AI claim as fact.
5. **Proposed ≠ Confirmed.** Appointments and callbacks have distinct visual states everywhere (chip, calendar color, count, KPI).
6. **Attempts ≠ Unique leads.** Metrics label their denominator in a tooltip using the formulas in `04-data-model-and-metrics.md`.
7. **Model confidence is labelled "Model confidence (uncalibrated)".** Never present it as probability or accuracy. "Measured accuracy" appears only when reviewed labels exist.
8. **Every list/detail has loading, empty, error, and permission-denied states.** Empty states are actionable (a CTA to the next step), never decorative.
9. **Organization isolation is assumed in the UI**: every request carries `orgId`; switching org clears all caches.
10. **India-first.** Currency ₹ with `en-IN` grouping (₹1,25,000), IST default timezone, `+91` phone handling, Devanagari rendering. No US-only assumptions baked into components (keep formatters/locales in one place so a US profile can be added later).
11. **Secrets never reach the browser.** Only `VITE_`-style public config (Supabase URL + anon key, API base URL, LiveKit URL). No LLM or telephony keys in frontend code.
12. **No purple gradients, glow effects, or decorative AI imagery.** See design system.

---

## 1. Locked decisions

| Area | Decision | Rationale |
|---|---|---|
| Frontend framework | Existing **React** app in `frontend/`. Inspect `frontend/package.json` first: if Vite → keep Vite + React Router v6/7; if CRA → migrate to Vite; if Next → keep App Router. Do not rewrite to a different framework. | User confirmed "react based". Router and build tool are not known to me; do not guess. |
| Language | TypeScript (strict) | Contracts and refactor safety |
| Styling | Tailwind CSS + shadcn/ui (Radix) + CSS variables for tokens | Fast, accessible, themeable |
| Server state | TanStack Query | Caching, retries, optimistic updates, mock/real parity |
| Tables | TanStack Table (+ virtualization for large tables) | Enterprise-grade tables |
| Forms | React Hook Form + Zod resolvers | Shared schemas |
| Charts | Recharts (or visx if needed) with the design-system palette | Consistent look |
| Calendar | **FullCalendar** free plugins only (`daygrid`, `timegrid`, `list`, `interaction`) | Premium Scheduler views are paid; avoid |
| Audio waveform | `wavesurfer.js` | Playback with segment seeking |
| Command palette | `cmdk` | ⌘K |
| Toasts | `sonner` | |
| Dates | `date-fns` + `date-fns-tz`, default `Asia/Kolkata` | |
| Phone | `libphonenumber-js` (default region `IN`) | Validation + E.164 |
| Realtime audio (browser test call) | `livekit-client` + `@livekit/components-react` | WebRTC to the voice agent |
| Auth + Postgres + Storage + data Realtime | **Supabase** (frontend uses only `supabase.auth` through the API-client layer's auth adapter) | Already in repo; free tier adequate for data |
| Voice runtime | **LiveKit Agents (Python) + Gemini Live API**, provider-agnostic adapter | Free tier, browser web-call, Hindi supported, SIP later |
| AI service | Separate service (Resonology AI), Gemini. Two paths: realtime conversation (Live API) and post-call analysis (Gemini text with JSON schema) | Live API has no structured output |
| Business API | Node.js + TypeScript (**Fastify recommended**, NestJS acceptable) in `backend/`. Owns rules, RBAC, webhooks, action execution | Framework choice belongs to Vishal Kumar |
| Calendar backend | Internal `CalendarProvider` interface; internal provider first, Google Calendar adapter next | Plug-and-play providers |
| Calling direction | **Outbound only.** Inbound appears as one disabled "Coming soon" card in Settings → Calling | |
| Languages on calls | English (en-IN) and Hindi (hi-IN), configurable per agent and per campaign; optional "auto-switch" toggle | |
| App UI language | English only (i18n scaffolding with `react-i18next` so Hindi UI can be added later) | |
| Primary demo channel | **Browser web call** (`channel: "web_demo"`); PSTN (`channel: "pstn"`) via SIP trunk is stretch | PSTN to India needs compliant carrier setup |
| Mock mode | `VITE_DATA_SOURCE=mock\|api` (default `mock`) | Frontend-first development |
| Theme | Light default, dark supported | |

**Why not replace Supabase with the voice library:** LiveKit/Pipecat move real-time audio; they are not a database or auth system. Audio never flows through Supabase, so its bandwidth limits do not apply to calls. Supabase carries auth, rows, storage of recordings/transcripts, and low-volume realtime *events* (call status, new review item).

---

## 2. MVP scope lock

### 2.1 In scope (all must be UI-complete and mock-functional)

Auth + onboarding · Dashboard · Leads (table, board, detail, import) · Campaigns (list, wizard, detail, controls) · Calls (history, detail, **live monitor**) · Review Queue · AI Agents (list, detail, test console) · Appointments (calendar + list + availability) · Follow-ups (tasks) · Insights (objections/intents with drill-down) · Compliance Center · Notifications · Audit Log · Settings (org, team & roles, calling, voice/AI engine, integrations, usage & billing, API & webhooks, data & privacy, preferences, system status) · Command palette · Global search · Org switcher · Dark mode · Error/404/403 pages.

### 2.2 UI-complete, backend later (render with realistic mock data; marked `data-roadmap` where the action is not wired)

Warm transfer to human · live human takeover · inbound calls · external CRM sync · Google Calendar connection · SMS/WhatsApp/email channels · SSO/SAML · agent A/B testing · learning/strategy recommendations · custom dashboards · billing payment (invoices list is mock) · voice cloning.

### 2.3 Out of scope (do not build)

Full CRM (deals, products, quotes) · multi-agent orchestration UI · forecasting · marketing automation · custom report builder · mobile app. (A responsive layout is required; a native app is not.)

### 2.4 Contract definitions (frozen, used everywhere)

| Term | Definition |
|---|---|
| **Call attempt** | One dial of a lead by a campaign. Retries are separate attempts. |
| **Connected call** | Attempt that reached an answered state (human or voicemail). |
| **Answered by human** | Connected and classified `answered_by = human`. Voicemail/IVR/unknown are separate values. |
| **Completed call** | Human-answered call that reached an agent-defined conclusion (not dropped in first 10 s, not technical failure). |
| **Qualified lead** | Lead whose latest *completed* qualification meets the campaign's criteria **and** whose qualification decision is either auto-accepted by policy or human-approved. |
| **Proposed appointment** | Date/time discussed or requested; not yet confirmed by a CalendarProvider. |
| **Confirmed appointment** | Created in and acknowledged by a CalendarProvider (internal provider counts). |
| **Successful follow-up** | Task completed by a human or an automated callback attempt that connected. |
| **Needs review** | Decision below policy threshold, conflicting evidence, missing required field, or failed action. |

### 2.5 Acceptance script (the demo must pass this without a developer touching anything)

1. Sign up → create organization "Sharma Realty" → pick India defaults.
2. Import `leads_demo.csv` (10 leads) via Import modal; see validation (1 invalid phone, 1 duplicate, 1 on DND) and fix/skip.
3. Open an agent ("Property Qualifier", Hindi + English), edit script, run **Test Console** web call.
4. Create campaign via wizard (select 8 eligible leads, window 10:00-19:00 IST, 2 retries), pass **Preflight**, launch.
5. Watch **Live Calls**: status changes, live transcript streams.
6. Open a finished **Call detail**: evidence chips, extracted facts, action ledger.
7. Review Queue shows 2 items (ambiguous callback date; failed booking). Resolve one with a correction.
8. Appointments shows 1 **Confirmed** and 1 **Proposed** appointment.
9. Dashboard KPIs, funnel, insights reflect the above; click any metric to reach the underlying records.
10. Audit Log shows each automatic and human action.

---

## 3. Architecture and integration seams (the part that makes "plug and play" true)

### 3.1 Layered picture

```
React UI (pages, components)
   │  hooks only: useLeads(), useCampaign(id), useCallLive(id) ...
   ▼
Query layer (TanStack Query)  ← src/api/hooks/*
   │
   ▼
ApiClient interface  ← src/api/client.ts   (the ONLY seam)
   ├── MockApiClient   (src/api/mock/*)    VITE_DATA_SOURCE=mock
   └── HttpApiClient   (src/api/http/*)    VITE_DATA_SOURCE=api
RealtimeClient interface ← src/realtime/client.ts
   ├── MockRealtime (timers + scripted call simulator)
   └── SupabaseRealtime (+ SSE/WebSocket to business API)
VoiceSessionClient interface ← src/voice/client.ts
   ├── MockVoiceSession (plays a scripted conversation, simulates mic UI)
   └── LiveKitVoiceSession (token from API → livekit-client room)
AuthAdapter ← src/auth/adapter.ts
   ├── MockAuth
   └── SupabaseAuth
```

Backend side (for orientation; not built by this task):

```
Frontend ──REST/JSON──▶ Business API (Node/TS) ──▶ Postgres (Supabase)
    │                         │  ▲                      ▲
    │ WebRTC (browser call)   │  │ webhooks/events      │ rows + realtime events
    ▼                         ▼  │                      │
 LiveKit Cloud ◀──▶ Voice agent worker (Python, LiveKit Agents) ◀──▶ Gemini Live API
                                │
                                ▼ transcript + audio ref
                     Resonology AI service (post-call analysis, Gemini + JSON schema)
                                │
                                ▼ structured Decision/Evidence/Action proposals
                        Business API validates → executes actions → writes ledger
```

### 3.2 Folder structure (create inside `frontend/src`)

```
src/
  app/            router, providers, layouts, guards
  api/
    client.ts     ApiClient interface + factory by env
    hooks/        one file per domain (leads.ts, campaigns.ts, calls.ts ...)
    mock/         MockApiClient, in-memory store, seeds, latency/error simulation
    http/         HttpApiClient (fetch wrapper, auth header, error mapping)
  contracts/      Zod schemas + inferred types (the shared contract)
  realtime/       RealtimeClient + mock simulator
  voice/          VoiceSessionClient + mock + livekit stub
  auth/           AuthAdapter + mock + supabase stub
  features/       leads/ campaigns/ calls/ review/ agents/ appointments/ followups/
                  insights/ compliance/ settings/ dashboard/ notifications/ audit/
  components/
    ui/           shadcn primitives
    patterns/     KPICard, FunnelChart, InsightCard, ActionQueue, EvidencePanel,
                  EvidenceChip, StatusChip, ConfidenceMeter, DataTable, FilterBar,
                  EmptyState, ErrorState, PermissionGate, EntityDrawer, Timeline
  lib/            format.ts (₹, dates, phone), i18n, permissions.ts, metrics.ts
  styles/         tokens.css, globals.css
```

### 3.3 Mock layer requirements

- In-memory store seeded from `06-mock-data-and-states.md`, persisted to `localStorage` so refresh keeps state; a "Reset demo data" action in Settings → Developer.
- **Mutations are real within the mock**: creating a lead adds a row; launching a campaign starts a **call simulator** that emits events on a timer (queued → dialing → ringing → answered → in_progress with streamed transcript segments → ended → analyzing → completed), then writes insights, decisions, evidence, actions, review items and appointments consistent with the seed scenarios.
- Simulate latency (150-600 ms) and **injectable failures** (a dev toolbar toggles: slow network, 500s, empty data, permission denied, provider outage) so every error state is testable.
- Pagination, sorting, filtering and search are executed in the mock with the same query params the real API will take (`page`, `pageSize`, `sort`, `filter[...]`, `q`). Do not filter in components.
- A dev-only floating **Demo Controls** panel (hidden in production build): switch role, trigger a simulated call, fail the next action, jump to scenario.

### 3.4 Where AI and backend plug in (explicit slots)

| UI area | Mock behaviour now | Real source later | Contract |
|---|---|---|---|
| Agent Test Console | `MockVoiceSession` plays scripted turns, shows mic level | `LiveKitVoiceSession`: `POST /agents/:id/test-session` → LiveKit token + room; agent worker joins | `VoiceSessionClient`, events in file 05 |
| Live Calls monitor | Simulator emits `call.*` events | Business API relays voice-worker events (SSE/WebSocket) or Supabase Realtime on `calls`/`transcript_segments` | `RealtimeClient` channels in file 05 |
| Transcript | Seeded segments with speaker, start/end ms, language, text (+ Roman transliteration) | `transcript_segments` rows written by worker | `TranscriptSegment` |
| Summary, intent, objections, facts | Seeded `ConversationAnalysis` | Resonology AI post-call job (Gemini, JSON schema) validated by API | `ConversationAnalysisSchema` (file 05 §5) |
| Decisions + Evidence + Confidence | Seeded `Decision[]` each with `evidence[]` | Same job; API stores as linked records | `Decision`, `Evidence` |
| Actions + outcomes | Mock executes and can fail on demand | Business API action executor with idempotency keys | `ActionAttempt` |
| Review Queue | Items created by mock policy engine | Created by API policy engine (thresholds in org settings) | `ReviewItem` |
| Insights (aggregate) | Computed from mock data | SQL aggregation endpoints | `/insights/*` |
| Appointments | Internal mock provider | `CalendarProvider` (internal → Google adapter) | `Appointment`, provider status |
| Compliance | Mock DND scrub results | DND/consent services; call-window enforced server-side | `ComplianceCheck` |
| Usage/cost | Mock per-call cost breakdown | Metering from voice/AI provider usage | `CostBreakdown` |

**Rule for AI developers (Shubham):** you are given a JSON Schema equal to `ConversationAnalysisSchema`. Your service must produce exactly that. The frontend renders only that.

**Rule for backend developers (Vishal Kumar):** implement `docs/frontend/05-api-realtime-and-ai-contracts.md` endpoints; if a contract must change, change the Zod schema and notify the frontend owner in the same PR.

---

## 4. The architectural consequence of Gemini Live API (read this)

- The **realtime conversation** runs on Gemini Live (speech-to-speech) inside the LiveKit agent worker. It produces audio plus transcription.
- **Structured extraction cannot come from that session** (the Live API does not support JSON-schema output). So IntelliCall runs a **post-call analysis** step: transcript → Gemini text model with a response schema → `ConversationAnalysis`.
- Consequence for UI: a call has two phases with different data readiness. Always render the intermediate state **"Analyzing"** after the call ends and before insights arrive, and never block the transcript on analysis.
- Mid-call tool use (e.g. "check availability slots") is a function call from the agent to the Business API; the UI shows it as an entry in the live **Activity** stream ("Checked availability: 3 slots found").

---

## 5. Roles (summary; matrix in file 04)

`owner` · `admin` · `manager` · `agent_operator` (runs campaigns, reviews) · `viewer`. The UI uses a `<PermissionGate permission="...">` and a `can(user, permission)` helper from `lib/permissions.ts`. Hidden = no access to the area at all; disabled-with-tooltip = visible but forbidden action. Mock mode lets you switch role from Demo Controls.

---

## 6. Responsive and accessibility bar

- Breakpoints: ≥1280 full layout with detail panels; 768-1279 collapsible sidebar and stacked panels; <768 bottom sheet drawers and card lists (tables become cards). All core flows usable at 390 px width.
- WCAG 2.1 AA contrast, full keyboard navigation, visible focus, `aria-live` for live transcript and toasts, reduced-motion support.
- Tables: sticky header, column visibility, density toggle (comfortable/compact), keyboard row navigation (`j/k`, `Enter`).

## 7. Performance bar

- Route-level code splitting; calendar, charts, wavesurfer, livekit lazy-loaded.
- Virtualized tables above 200 rows; transcript virtualized above 500 segments.
- Initial dashboard interactive < 2 s on mock data.

## 8. Testing bar

- Vitest for lib/format/permissions/metrics; React Testing Library for patterns; **Playwright smoke test that runs the §2.5 acceptance script in mock mode**; contract tests that validate every mock payload against its Zod schema.
- Storybook (optional but preferred) for `components/patterns`.

---

## 9. Build order (give the agent one phase at a time)

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **P0: Foundation** | Inspect existing `frontend/`, set up folders (§3.2), tokens, shell, router, providers, `ApiClient` + mock skeleton, Zod contracts for all entities, `DECISIONS.md` | App boots; shell navigates all routes (placeholders allowed); contracts compile |
| **P1: Design system + patterns** | All `components/patterns/*`, DataTable, FilterBar, drawers, wizard scaffold, empty/error/loading kits, theme toggle | Storybook/gallery page `/__kit` shows every pattern in all states |
| **P2: Auth, onboarding, settings shell** | Login/signup/onboarding, org switcher, roles, Settings pages | Acceptance step 1; role switching hides/disables correctly |
| **P3: Leads** | List, board, detail, import modal, bulk actions, saved views | Step 2 |
| **P4: Agents** | List, templates, detail tabs, versions, **Test Console** with mock voice | Step 3 |
| **P5: Campaigns** | List, wizard, preflight, launch, controls, campaign detail | Step 4 |
| **P6: Calls + simulator** | Call history, **Live Calls**, Call detail with transcript, evidence, ledger, audit trail; simulator running | Steps 5-6 |
| **P7: Review + Appointments + Follow-ups** | Review Queue and panel, calendar/list/availability, tasks | Steps 7-8 |
| **P8: Dashboard + Insights + Compliance** | KPI cards, funnel, insights with drill-down, health, compliance center | Step 9 |
| **P9: Notifications, Audit, Search, polish** | Notifications center, audit log, ⌘K, global search, keyboard shortcuts, dark mode pass, a11y pass | Step 10 |
| **P10: Hardening** | Playwright acceptance test, contract tests, performance pass, **swap-readiness checklist** (§10) | All green |

## 10. Swap-readiness checklist (done = backend can be plugged in without UI edits)

- [ ] No file under `features/` or `components/` imports from `api/mock/*`, `localStorage` data, or fixtures.
- [ ] Every mutation uses an idempotency key header (`Idempotency-Key`) generated in the HTTP client.
- [ ] Every list endpoint call uses the standard query params and cursor/page response envelope.
- [ ] All timestamps are ISO-8601 UTC strings; display-time conversion happens only in `lib/format.ts`.
- [ ] All enums come from `contracts/enums.ts`.
- [ ] Error shape is `{ error: { code, message, details?, requestId } }`; the UI maps `code` to messages.
- [ ] Realtime subscriptions are made only via `RealtimeClient` and are cleaned up on unmount.
- [ ] Setting `VITE_DATA_SOURCE=api` with a stub server returning schema-valid data renders every screen.

## 11. Definition of done (per screen)

Matches `02-screens.md` (layout, data, actions, states) · uses only patterns from the kit · permission-gated · responsive · keyboard accessible · mock data exercises every state · linked from the place users expect (metric → records) · no console errors/warnings · covered by the acceptance test where relevant.

## 12. Open items (not blockers; record decisions in `DECISIONS.md`)

1. Exact TRAI calling-hour limits and AI-disclosure wording (UI defaults to 09:00-21:00 IST, editable, flagged to verify).
2. Business API framework final choice (Fastify vs NestJS).
3. Whether PSTN is demonstrated live or recorded.
4. Research question approval (affects the Insights/Evaluation page; see file 02 §Insights).
5. Whether to add Hinglish as a named third language option in the agent config (currently "auto-switch" toggle).
