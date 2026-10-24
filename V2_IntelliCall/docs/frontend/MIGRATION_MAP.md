# MIGRATION_MAP.md: Frontend Audit & Route Migration Map

**Author:** Anay Sharma  
**Date:** 2026-10-19  
**Phase:** F0 (Frontend Audit)  
**Status:** Approved Migration Blueprint  

---

## 1. Verified Stack Facts

| Area | Current Reality (Verified) | Target in Phase 2 |
|---|---|---|
| **Framework** | React 19 (`^19.0.0`) | React 19 (kept) |
| **Bundler** | Vite 8 (`^8.0.5`) + `@vitejs/plugin-react` | Vite 8 (kept) |
| **Router** | React Router v7 (`^7.18.3`), `BrowserRouter` | React Router v7 (kept) |
| **Language** | TypeScript 5.7 (`^5.7.0`) | TypeScript 5.7 strict (kept) |
| **Styling** | Tailwind CSS 4 (`^4.0.0`) + CSS Variables in `src/index.css` | Tailwind CSS 4 + Extended tokens in `src/index.css` |
| **Typography** | `IBM Plex Sans` (UI) + `IBM Plex Mono` (data/metrics) | `IBM Plex Sans` + `IBM Plex Mono` + `Noto Sans Devanagari` (Hindi content) |
| **Brand Colors** | `--color-action-primary: #2B4C8C` (Navy brand blue) | Retained as master primary brand color |
| **State Management** | React Context (`AuthContext`) + Direct Hook queries | Seam architecture (`ApiClient`, `RealtimeClient`, `AuthAdapter`) + TanStack Query |
| **Tables & Virtualization** | Custom HTML tables / Skeleton tables | TanStack Table (`@tanstack/react-table`) |
| **Forms & Validation** | Controlled inputs / unvalidated | React Hook Form + Zod resolvers |
| **Testing Setup** | None currently | Vitest + React Testing Library + Playwright |

---

## 2. Old Screens & Routes Migration Table

Every existing route in `frontend/src/App.tsx` has been catalogued below with its target destination and action:

| Existing Route | Component | Current Data Source | Next Phase Target | Action | Notes |
|---|---|---|---|---|---|
| `/` | `LandingPage.tsx` | Static / marketing | Landing Page (`/`) | `keep` | Preserved as public landing page at `/` matching current design spec. |
| `/auth`, `/signin`, `/signup` | `AuthPage.tsx` | Supabase Auth (email, password, OTP) | Auth screens (`FRONTEND_SPEC §A`) | `merge into` | Logic reused inside `AuthAdapter`; UI updated with standard card layouts. |
| `/onboarding` | `OnboardingPage.tsx` | Supabase `organizations` (`onboarding_progress`) | Onboarding wizard (`03-modals W-04`) | `replace` | Modern 4-step onboarding flow (Org setup, team invite, India calling preferences, demo seed). |
| `/dashboard` | `DashboardPage.tsx` | `useDashboard`, `useOutcomeFunnel`, `useDecisions` | Dashboard (`02-screens §B`) | `replace` | Modernized KPI strip, conversion funnel, trend charts (Recharts), action queue, health tiles. |
| `/leads` | `LeadsPage.tsx` | `useLeads` (`leadsService.ts`) | Leads Table & FilterBar (`02-screens §C1`) | `replace` | TanStack table with column picker, density toggle, bulk action bar, and saved views. |
| `/leads/:id` | `LeadDetailPage.tsx` | `useLeads` (`leadsService.get`) | Lead Drawer (`03-modals D-01`) | `replace` | Detail page replaced by persistent right-hand entity drawer to keep list context. |
| `/campaigns` | `CampaignsPage.tsx` | `useCampaigns` (`campaignsService.ts`) | Campaigns list (`02-screens §D1`) | `replace` | Multi-agent campaign list with live status chips, progress bars, and batch controls. |
| `/campaigns/new` | `CreateCampaignPage.tsx` | Custom form | Campaign Wizard (`03-modals W-01`) | `replace` | 7-step wizard (basics, agent, audience, criteria, rules, schedule, preflight). |
| `/campaigns/:id` | `CampaignDetailPage.tsx` | `useCampaigns` | Campaign Detail (`02-screens §D3`) | `replace` | 6 tabs: Overview, Audience & Leads, Script & Questions, Calling Rules, Analytics, Audit. |
| `/agents` | `AgentsPage.tsx` | `useAgents` (`agentsService.ts`) | Agents gallery (`02-screens §G1`) | `replace` | Agent card gallery with template selector and active version badges. |
| `/agents/:id` | `AgentDetailPage.tsx` | `useAgents` | Agent Detail & Test Console (`02-screens §G2`) | `replace` | 8 tabs: Persona, Script, Knowledge, Guardrails, Tools, Versions, Test Console with mock audio. |
| `/calls` | `CallsPage.tsx` | `useCalls` (`callsService.ts`) | Calls History (`02-screens §E1`) | `replace` | Historical calls table with full-text transcript search, language badges, and duration filters. |
| `/calls/:id` | `CallDetailPage.tsx` | `useCalls` | Call Detail Workspace (`02-screens §E3`) | `replace` | Full audio waveform player, synchronized transcript viewer, evidence chips, and action ledger. |
| `/decisions` | `DecisionsPage.tsx` | `useDecisions` (`decisionsService.ts`) | Merged into Review Queue (`/review`) | `delete / merge` | Standalone decisions list replaced by unified Review Queue (`02-screens §F`). |
| `/decisions/:id` | `DecisionDetailPage.tsx` | `useDecisions` | Merged into Review Panel (`D-03`) & Call Detail | `delete / merge` | Replaced by split-pane review panel with keyboard shortcuts (`a`, `e`, `r`). |
| `/outcomes` | `OutcomesPage.tsx` | `useOutcomes` (`outcomesService.ts`) | Merged into Insights (`02-screens §I`) | `delete / merge` | Merged into `/insights` (Objections, Intents, Conversion performance). |
| `/strategies` | `StrategiesPage.tsx` | Static / mock | Merged into Insights (`02-screens §I`) | `delete / merge` | Strategic analysis merged into conversation intelligence views. |
| `/settings` | `SettingsPage.tsx` | `AuthContext` + custom | Settings Shell (`02-screens §M`) | `replace` | Modular settings: Organization, Team & Roles, Calling Windows, Usage & Billing, Compliance. |
| `/settings/account` | `AccountSettingsPage.tsx` | `AuthContext` | Settings > Profile | `merge into` | Sub-page in settings hierarchy. |
| *(New)* `/calls/live` | *(To build)* | Supabase Realtime / Simulator | Live Calls Monitor (`02-screens §E2`) | `create` | 3-pane real-time monitoring workspace showing active calls, live transcript segments, and metrics. |
| *(New)* `/review` | *(To build)* | `useReviewItems` | Review Queue (`02-screens §F`) | `create` | Human-in-the-loop review queue for ambiguous outcomes, failed actions, and booking errors. |
| *(New)* `/appointments` | *(To build)* | `useAppointments` | Appointments Workspace (`02-screens §H1`) | `create` | Calendar view (FullCalendar) distinguishing Proposed vs Confirmed meetings with availability. |
| *(New)* `/follow-ups` | *(To build)* | `useFollowUps` | Tasks Workspace (`02-screens §H2`) | `create` | Follow-up task list and board view for scheduled callbacks and human actions. |
| *(New)* `/insights` | *(To build)* | `useInsights` | Insights & Quality (`02-screens §I`) | `create` | Aggregate intelligence: pricing objections, intent distribution, script performance. |
| *(New)* `/compliance` | *(To build)* | `useCompliance` | Compliance Center (`02-screens §J`) | `create` | India calling hours, DND scrub results, consent records, and suppression management. |
| *(New)* `/audit` | *(To build)* | `useAuditLogs` | Audit Log (`02-screens §L`) | `create` | Immutable system and human activity ledger with JSON diff drawer. |
| *(New)* `/__kit` | *(To build)* | Static / local | Pattern Gallery (`01 §4`) | `create` | Internal component gallery demonstrating all pattern components in light and dark mode. |

---

## 3. Reusable Logic & Seam Mapping

### 3.1 Auth & Supabase Client
* **`frontend/src/lib/supabase.ts`:**
  * Contains the initialized Supabase browser client with session persistence.
  * **Seam Mapping:** Refactored into `src/auth/supabase.ts` as the concrete `SupabaseAuthAdapter` implementing `AuthAdapter`.
* **`frontend/src/contexts/AuthContext.tsx`:**
  * Already implements full Supabase session listeners, sign-in, sign-up, OTP verification, password reset, profile fetching, and `organization_members` query.
  * **Seam Mapping:** Preserved and wrapped inside `src/auth/` so no existing auth functionality is lost.

### 3.2 Existing UI Primitives (`frontend/src/components/ui/`)
The existing custom component library is high-quality and directly follows the project's design tokens:
* `Button.tsx`: Supports variants (primary, secondary, subtle, danger). Retained and extended with `disabled-roadmap` / `data-roadmap` attribute.
* `Badge.tsx`: Supports status colors (success, warning, error, info). Extended into `StatusChip` with dot indicator and `variant="proposed"` dashed border.
* `Drawer.tsx`: Implements right-side slide-over panel. Extended into `EntityDrawer`.
* `Modal.tsx`: Accessible dialog wrapper with backdrop. Reused for all modals in `03-modals-and-panels.md`.
* `Tabs.tsx`: Tab container with indicator. Retained with ARIA role attributes.
* `FilterBar.tsx`: Search bar + filter dropdown wrapper. Reused across Leads, Calls, Campaigns.
* `Sidebar.tsx` & `Topbar.tsx`: Rebuilt in `src/app/` using the exact same CSS tokens and layout structure.
* `Toast.tsx`: Retained during migration, transitioning cleanly to `sonner` in F1.

### 3.3 Existing AI & Shared Components (`frontend/src/components/shared/`)
* `AIStateBanner.tsx`: Shows real-time AI processing state. Retained and integrated into `LiveCalls` workspace.
* `ConfidenceIndicator.tsx`: Visual score display. Refactored into `ConfidenceMeter` with explicit "Model confidence (uncalibrated)" label.
* `EvidenceSnippet.tsx` & `EvidenceThread.tsx`: Formats quoted transcript segments. Refactored into `EvidenceChip` and `EvidencePanel`.
* `Timeline.tsx`: Vertical event trail. Refactored into `AuditTrail` and `Timeline` pattern components.
* `DecisionCard.tsx` & `OutcomeCard.tsx`: Reused inside Call Detail workspace.

---

## 4. Dependencies Strategy

### Dependencies to Keep:
```json
{
  "@supabase/supabase-js": "^2.115.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.18.3",
  "recharts": "^3.10.1",
  "tailwindcss": "^4.0.0",
  "typescript": "^5.7.0",
  "vite": "^8.0.5"
}
```

### Dependencies to Install in Phase F1:
```bash
npm install @tanstack/react-query @tanstack/react-table react-hook-form zod sonner cmdk
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
npm install wavesurfer.js livekit-client @livekit/components-react
npm install date-fns date-fns-tz libphonenumber-js
```

---

## 5. Direct Supabase Calls Catalogue (To Be Extracted)

In the legacy frontend, components called Supabase directly via `services/` and `hooks/`. Under the new architecture, **zero** components touch Supabase directly:
1. `leadsService.ts`: `supabase.from("leads")` $\rightarrow$ Moved to `src/api/http/leads.ts` / `src/api/mock/leads.ts`.
2. `campaignsService.ts`: `supabase.from("campaigns")` $\rightarrow$ Moved to `src/api/http/campaigns.ts`.
3. `agentsService.ts`: `supabase.from("agents")` $\rightarrow$ Moved to `src/api/http/agents.ts`.
4. `callsService.ts`: `supabase.from("calls")` $\rightarrow$ Moved to `src/api/http/calls.ts`.
5. `decisionsService.ts`: `supabase.from("decisions")` $\rightarrow$ Moved to `src/api/http/review.ts`.
6. `outcomesService.ts`: `supabase.from("outcomes")` $\rightarrow$ Moved to `src/api/http/insights.ts`.

All data access will flow strictly through `ApiClient` and TanStack Query hooks in `src/api/hooks/`.

---

## 6. Phase F0 Approval & Next Step
- Frontend audit is complete; every legacy file and component is accounted for.
- **Next Step:** Commit F0 audit, log entry in `work_log.md`, and execute **Phase F1** (Foundation, Seams & Design System Extension).
