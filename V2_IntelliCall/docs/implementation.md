# implementation.md: How We Implement the Next Phase Plan

**Read after:** `docs_index.md`, `FRONTEND_SPEC.md`, `frontend_update.md`, `backend_update.md`, `ai_llm_architecture.md`  
**Audience:** The development team and IDE agents.  
**Purpose:** Actionable, step-by-step master roadmap answering "how do we implement this plan in code on our actual stack?"

---

## 0. Current Project Baseline & Architecture Truths

| Layer | Actual Current State | Target Next Phase State |
|---|---|---|
| **Git Working Branch** | Active branch: **`phase_2_dev`** (branched from `main`). | All phase work and intermediate steps are developed and pushed as checkpoints on `phase_2_dev`. Merged to `main` only after complete verification. |
| **Backend & Database** | **Supabase Cloud** (linked via `.supabase/.temp/project-ref`). 7 live migrations applied. 4 existing Edge Functions. Connected via API Key & project URL. | Remains 100% on Supabase Cloud. Extended with forward-only SQL migrations via `supabase db push`. Unified REST API Edge Function (`api` via Hono), robust RLS, and async job queues. |
| **Frontend** | React 19 + Vite 8 + React Router v7 + Tailwind 4. Custom design system in `frontend/src/index.css` with IBM Plex Sans / Mono, `--color-*` token system. Existing custom components (`Button`, `Badge`, `Drawer`, `Modal`, `Tabs`, `FilterBar`, etc.). | Translated & extended into the new Next Phase screens, adopting the four seam interfaces (`ApiClient`, `RealtimeClient`, `VoiceSessionClient`, `AuthAdapter`), TanStack Query, and complete mock layer. |
| **AI & Voice Services** | Currently stubbed in edge functions. | **Late-stage integration** after frontend & backend are AI-ready. Two-tier architecture: Gemini Live API (<500ms voice conversation) via LiveKit Agents + Gemini 2.0 Flash (post-call structured extraction). |

---

## 1. Core Implementation Principles

### 1.1 Strict Design Translation & Extension Rule
> [!IMPORTANT]
> **Every new screen, modal, drawer, panel, card, and element introduced by the Next Phase specification MUST be translated directly into our current design spec and color schema.**
> - **Primary Font Stack:** `IBM Plex Sans` for all UI text, `IBM Plex Mono` for metrics, timestamps, and numbers (`--font-ui`, `--font-data`). Add `Noto Sans Devanagari` only for Hindi transcript text.
> - **Primary Color Palette:** `--color-action-primary: #2B4C8C` (our navy brand blue), `--color-bg-primary: #F7F8FA`, `--color-bg-surface: #FFFFFF`, `--color-text-primary: #171B24`, and semantic status tokens (`--color-success`, `--color-warning`, `--color-error`, `--color-info`).
> - **Dark Mode:** Governed strictly by `[data-theme="dark"]` in `index.css`.
> - **Never introduce unaligned styling:** Do not copy raw external hex colors or foreign UI styles.
> - **Extend when needed:** If a newly introduced feature requires a specific state, outline, or badge not currently in `index.css` (e.g. proposed dashed border, confidence level meter, audio seek region):
>   1. Add new semantic variables to `frontend/src/index.css` under `:root` and `[data-theme="dark"]` following our `--color-*` convention.
>   2. Extend existing custom components (`Button`, `Badge`, `Drawer`, `Modal`, `Tabs`) with new variants/props rather than building duplicate components.

### 1.2 Git Checkpoint & Push Strategy
All development takes place on the **`phase_2_dev`** branch with regular checkpoint pushes:
- **Phase-Level Checkpoints:** Pushed to GitHub at the conclusion of every phase (e.g. `B0`, `F0`, `F1`, `B1`, etc.).
- **Step-Level Checkpoints:** Pushed to GitHub after every major milestone or step *within* a phase (e.g., after Zod contracts compiled, after App Shell built, after Dashboard screen ported, after Migration applied).
- **Verification Rule:** Before pushing any checkpoint commit, run typecheck, lint, and build:
  ```bash
  # Verification suite
  npm run typecheck --prefix frontend
  npm run build --prefix frontend
  git add .
  git commit -m "feat(<scope>): <concise checkpoint description>"
  git push origin phase_2_dev
  ```

### 1.3 Staged AI Integration: "Frontend & Backend Ready for AI Before It"
To avoid costly LLM usage and brittle development dependencies:
1. **Frontend & Backend are built first with a complete AI-Ready Mock Simulator:**
   - Database tables for calls, transcript segments, conversation analyses, decisions, evidence, and actions are created.
   - Frontend components (Evidence Chips, Evidence Panel, Confidence Meter, Live Transcript View, Audio Waveform) are fully functional.
   - The mock call simulator emits realistic events (dialing $\rightarrow$ ringing $\rightarrow$ in-progress audio turns $\rightarrow$ analyzing $\rightarrow$ completed analysis with citations).
2. **Real AI & LLM Connection occurs in the LATE STAGE (Phase 11):**
   - Connecting Google Gemini Live API and Gemini 2.0 Flash is executed only after the application UI and backend pipelines are 100% verified and stable.

---

## 2. High-Level Execution Flow

```
[ B0: Backend Audit ] (Cloud Supabase Inspection) ──► Checkpoint Push
         │
         ▼
[ F0: Frontend Audit & Branching ] (MIGRATION_MAP.md) ──► Checkpoint Push
         │
         ├────────────────────────────────────────┬────────────────────────────────────────┐
         ▼                                        ▼                                        ▼
[ F1: Foundation & Design System ]        [ B1: Backend Foundation ]              [ F0-F3 Prep ]
(Seams, Zod Contracts, Tokens in index.css) (api Hono Function, RLS, Orgs)         (Contracts Shared)
         │                                        │
         ▼ (Step Checkpoints)                     ▼ (Step Checkpoints)
[ F2: Port 9 Reference Screens ]          [ B2: Leads API & Tables ]
(Dashboard, Leads, Calls, Review, etc.)           │
         │                                        ▼
         ▼                                [ B3: Agents API & Versions ]
[ F3: Remaining Screens & Modals ]                │
(Auth, Onboarding, Campaigns, Settings)           ▼
         │                                [ B4: Campaigns & Dialer Tick ]
         │                                        │
         │                                        ▼
         │                                [ B5: Calls, Transcripts & Storage ]
         │                                        │
         │                                        ▼
         │                                [ B6: Intelligence & Policy Engine ]
         │                                        │
         │                                        ▼
         │                                [ B7: Scheduling & Appointments ]
         │                                        │
         │                                        ▼
         │                                [ B8: Analytics & System Status ]
         │                                        │
         └───────────────────┬────────────────────┘
                             │
                             ▼
              [ F4: Retire Legacy Code ] ──► Checkpoint Push
                             │
                             ▼
              [ F5: Switch Domains to Real Supabase Cloud API ] ──► Checkpoint Push
                             │
                             ▼
        [ PHASE 11: LATE STAGE — AI LLM & VOICE INTEGRATION ]
        - LiveKit Agents Python Worker (Gemini Live API <500ms)
        - Resonology AI Service (Gemini 2.0 Flash Structured JSON)
        - InlineGeminiProvider Edge Function Fallback
        - Live Web Call Testing in Browser
                             │
                             ▼
              [ Final Hardening & Production Push to main ]
```

---

## 3. Detailed Phase Roadmap & Checkpoints

### Phase B0: Cloud Supabase Backend Audit
- **Goal:** Formally audit the 7 existing cloud migrations and 4 Edge Functions. Output `docs/backend/AUDIT.md`.
- **Checkpoint Commit:** `docs(backend): complete B0 cloud supabase and schema audit` $\rightarrow$ `git push origin phase_2_dev`

### Phase F0: Frontend Audit & Migration Map
- **Goal:** Document stack facts (React 19, Vite 8, React Router v7, Tailwind 4), map existing routes to Next Phase screens, catalogue Supabase calls. Output `docs/frontend/MIGRATION_MAP.md`.
- **Checkpoint Commit:** `docs(frontend): complete F0 migration map and route audit` $\rightarrow$ `git push origin phase_2_dev`

### Phase F1: Foundation, Seams & Design System Extension
- **Step F1.1 (Scaffold):** Move `frontend/src` $\rightarrow$ `frontend/legacy-src`. Create fresh `src/` directory tree per `FRONTEND_SPEC.md §3.2`.  
  *Checkpoint:* `chore(frontend): scaffold clean src directory structure`
- **Step F1.2 (Dependencies):** Install `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `sonner`, `cmdk`, `@fullcalendar/*`, `wavesurfer.js`, `date-fns`, `libphonenumber-js`.  
  *Checkpoint:* `chore(frontend): install core dependencies for phase 2`
- **Step F1.3 (Design System Extension):** Extend `frontend/src/index.css` with missing tokens while preserving existing IBM Plex typography and `--color-*` palette.  
  *Checkpoint:* `feat(design): extend index.css tokens and component styles`
- **Step F1.4 (Contracts):** Implement Zod schemas in `src/contracts/` (`entities.ts`, `enums.ts`, `voice.ts`, `analysis.ts`).  
  *Checkpoint:* `feat(contracts): define zod schemas for entities and enums`
- **Step F1.5 (Seams & Auth):** Implement `AuthAdapter` (wrapping existing `AuthContext` logic with `organization_members` table), `ApiClient` interface with mock store, `RealtimeClient`, and `VoiceSessionClient`.  
  *Checkpoint:* `feat(seams): implement auth, api client, and realtime seam interfaces`
- **Step F1.6 (App Shell & Kit):** Build `AppLayout`, `Sidebar`, `Topbar`, command palette (`cmdk`), and create `/__kit` preview page for all pattern components.  
  *Checkpoint:* `feat(shell): build app shell, command palette, and pattern component kit` $\rightarrow$ `git push origin phase_2_dev`

### Phase F2: Port 9 Reference Screens (Using Existing Design Specs)
Each screen translates visual layouts from `IntelliCall Screens.html` into our IBM Plex + `#2B4C8C` design system:
- **Step F2.1:** Dashboard (`/dashboard`) — KPI cards, outcome funnel, trend charts, action queue, health tiles.  
  *Checkpoint:* `feat(screens): port dashboard with existing design tokens`
- **Step F2.2:** Leads & Lead Drawer (`/leads`) — TanStack DataTable, filter bar, bulk action bar, right-hand lead drawer.  
  *Checkpoint:* `feat(screens): port leads table and entity drawer`
- **Step F2.3:** Review Queue (`/review`) — Split-pane review interface, evidence signals, keyboard shortcuts (`a`, `e`, `r`, `j`, `k`).  
  *Checkpoint:* `feat(screens): port review queue and approval panel`
- **Step F2.4:** Calls & Live Monitor (`/calls`, `/calls/live`, `/calls/:id`) — 3-pane live call monitor, transcript stream, audio player with evidence seeks, action ledger.  
  *Checkpoint:* `feat(screens): port calls history, live monitor, and call detail`
- **Step F2.5:** AI Agents & Test Console (`/agents`, `/agents/:id`) — Agent detail tabs and interactive voice test console with mock audio level meter.  
  *Checkpoint:* `feat(screens): port agent management and test console`
- **Step F2.6:** Campaign Wizard (`/campaigns/new`) — 7-step campaign creation wizard with preflight validation checklist.  
  *Checkpoint:* `feat(screens): port 7-step campaign wizard and preflight`
- **Step F2.7:** Appointments (`/appointments`) — FullCalendar (free views) with proposed vs confirmed visual distinction.  
  *Checkpoint:* `feat(screens): port appointments calendar and list view`
- **Step F2.8:** Compliance Center (`/compliance`) — Overview tab, DND status checks, calling windows, and suppression rules.  
  *Checkpoint:* `feat(screens): port compliance center and rules manager` $\rightarrow$ `git push origin phase_2_dev`

### Phase F3: Remaining Screens, Modals & Polish
- Port Auth pages (login, signup, OTP verification, password reset).
- Port 4-step Onboarding flow (`/onboarding`).
- Port Campaigns list & Campaign detail tabs.
- Port Follow-ups tasks board & list.
- Port Insights & conversation intelligence drill-downs.
- Port all Settings pages (organization, team & roles, calling, API keys, webhooks, audit log).
- Build all modals and drawers from `docs/frontend/03-modals-and-panels.md`.  
*Checkpoint:* `feat(screens): complete remaining screens, settings, and modal dialogs` $\rightarrow$ `git push origin phase_2_dev`

---

## 4. Backend Cloud Phases (B1 – B8)

All backend schema updates are created as forward-only migrations and pushed directly to **Supabase Cloud**:

```bash
# Workflow for every backend phase
supabase migration new <phase_name>
# Edit supabase/migrations/<timestamp>_<phase_name>.sql
supabase db push
supabase gen types typescript --linked > supabase/functions/_shared/db/database.types.ts
supabase functions deploy <function_name>
```

- **B1 (Foundation):** `api` Edge Function with Hono router; `create_organization` RPC; tenancy validation; CORS restricted to `ALLOWED_ORIGINS`.  
  *Checkpoint:* `feat(backend): deploy api edge function and foundation tenancy rpc`
- **B2 (Leads):** Migration for compliance fields, consent history, DND flags; CSV import job runner.  
  *Checkpoint:* `feat(backend): deploy leads schema extensions and import pipeline`
- **B3 (Agents):** Migration for `agent_versions` (immutable snapshots) and knowledge documents.  
  *Checkpoint:* `feat(backend): deploy agent versioning and knowledge tables`
- **B4 (Campaigns & Dialer):** Campaign rules, audience snapshots; `dialer-tick` cron function with `claim_dialable_leads` RPC.  
  *Checkpoint:* `feat(backend): deploy campaign engine and dialer tick function`
- **B5 (Calls & Transcripts):** `calls` status transitions, `transcript_segments`, Supabase Storage policies for private recordings, Supabase Realtime publication.  
  *Checkpoint:* `feat(backend): deploy calls, realtime transcripts, and storage buckets`
- **B6 (Intelligence & Review):** `conversation_analyses`, `decisions`, `evidence`, `review_items`; `analysis-run` Edge Function with policy engine.  
  *Checkpoint:* `feat(backend): deploy conversation analysis and policy engine`
- **B7 (Scheduling):** `appointments` with exclusion constraint against double booking; `availability_rules`; `confirm_appointment` RPC.  
  *Checkpoint:* `feat(backend): deploy appointment booking and exclusion constraints`
- **B8 (Analytics & Platform):** Dashboard metric summary RPCs, audit log queries, system status health probes.  
  *Checkpoint:* `feat(backend): deploy analytics rpc functions and platform services` $\rightarrow$ `git push origin phase_2_dev`

---

## 5. Phase F4 & F5: Retirement & Domain Switching

- **F4 (Retire Legacy):** Verify all routes in `MIGRATION_MAP.md` are resolved. Delete `frontend/legacy-src/`. Clean up unused dependencies.  
  *Checkpoint:* `chore(frontend): remove legacy-src and finalize phase 2 codebase`
- **F5 (Real Data Swap):** Switch domains one by one in `frontend/.env.local`:
  ```bash
  VITE_DATA_SOURCE=api
  VITE_API_BASE_URL="https://<project-ref>.supabase.co/functions/v1/api"
  ```
  *Checkpoint:* `feat(integration): connect frontend to live cloud supabase edge api` $\rightarrow$ `git push origin phase_2_dev`

---

## 6. Phase 11: Late-Stage AI LLM & Voice Integration

Executed **only after** Phases F1–F5 and B1–B8 are verified and working end-to-end on Supabase Cloud.

### 6.1 Sub-Steps & Architecture Setup
Detailed specifications in `docs/ai_llm_architecture.md`:
1. **Tier 1 (Realtime Voice Worker in `backend/voice-agent`):**
   - Implement Python worker with `livekit-agents` and `livekit-plugins-google`.
   - Configure model: `gemini-2.0-flash-exp` (Gemini Live API) with bidirectional audio streaming.
   - Configure Silero VAD (220ms end-of-speech silence detection).
   - Configure instantaneous (<50ms) barge-in / interruption cut-off.
   - Enforce mandatory automated disclosure line before conversation begins.
   - Connect HMAC-signed webhooks to Supabase `voice-events` and `voice-tools`.
   *Checkpoint:* `feat(ai): implement livekit gemini live speech-to-speech voice agent`
2. **Tier 2 (Post-Call Analysis in `backend/resonology-ai`):**
   - Implement FastAPI service with `gemini-2.0-flash`.
   - Enforce structured JSON extraction using `response_schema = ConversationAnalysisSchema`.
   - Ground all extracted facts, qualification answers, and objections with cited `segmentIds` and literal `quotes`.
   *Checkpoint:* `feat(ai): implement resonology-ai gemini 2.0 flash structured analysis service`
3. **Tier 1.5 (Cloud Fallback in Supabase Edge Functions):**
   - Implement `InlineGeminiProvider` directly in `supabase/functions/analysis-run/`.
   - Enables serverless analysis execution directly within Supabase Cloud using `GEMINI_API_KEY`.
   *Checkpoint:* `feat(ai): implement inline gemini fallback in analysis-run edge function`
4. **End-to-End Verification:**
   - Run browser web demo call from the Agent Test Console (`/agents/:id`).
   - Verify speech latency <500ms, transcript streaming, and automatic post-call analysis generation.
   *Checkpoint:* `feat(ai): verify end-to-end low-latency voice call and structured intelligence` $\rightarrow$ `git push origin phase_2_dev`

---

## 7. Final Hardening & Merge to Main

- [ ] All Playwright acceptance tests passing in mock mode and API mode.
- [ ] TypeScript strict check passes across frontend and Edge Functions with 0 errors.
- [ ] Supabase Cloud Security Advisor reviewed and clean (0 RLS or permission warnings).
- [ ] Code review completed.
- [ ] Merge `phase_2_dev` into `main` via PR.
