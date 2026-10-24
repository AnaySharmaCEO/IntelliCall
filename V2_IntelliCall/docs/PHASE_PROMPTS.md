# Phase Prompts for the IDE Agent (copy one at a time)

Always start a session with:

> Read `docs/docs_index.md` (this is the master index of all docs). If `AGENTS.md` does not exist at the repo root, create it first: it is the agent-facing reading guide — take its content from `docs/engineering_standards.md §12` (working agreements for IDE agents). Then read `docs/FRONTEND_SPEC.md` and the files named below. Work only on this phase. Do not touch `backend/` (voice-agent and resonology-ai), `.env`. When done, run typecheck/lint/tests, summarize done vs stubbed, and append decisions to `docs/frontend/DECISIONS.md`.

**P0 Foundation.** Read spec §1-3 and §9-10. Inspect `frontend/package.json` and the existing `src` tree and tell me what exists (framework, router, styling, any screens). Then set up the folder structure in §3.2, install only the dependencies in §1, create `contracts/` Zod schemas for every entity and enum in `04-data-model-and-metrics.md`, the `ApiClient`/`RealtimeClient`/`VoiceSessionClient`/`AuthAdapter` interfaces with Mock implementations (in-memory, localStorage-persisted, latency + failure injection), the router with every route from `02-screens.md` as a placeholder page, and `lib/format.ts` + `lib/permissions.ts`.

**P1 Design system.** Read `01-design-system-and-shell.md`. Implement tokens (light/dark), the app shell (sidebar, top bar, ⌘K palette, notifications dropdown, background tasks tray, shortcuts sheet), and every component in §4. Create `/__kit` showing each pattern in all states (loading, empty, error, forbidden).

**P2 Auth, onboarding, settings shell.** Read `02-screens.md` §A and §M, `03-modals` W-04/M-13/M-14/M-24, RBAC in `04`. Build login/signup/verify/forgot/accept-invite, 4-step onboarding, org switcher, role-aware navigation, and all Settings pages (roadmap items disabled with tooltips).

**P3 Leads.** Read `02-screens.md` §C, `03-modals` W-02/M-01/M-04/M-05/M-06/D-01, seed per `06`. Table, board, segments, detail page with all tabs, import wizard with validation and compliance scrub preview, bulk actions, saved views.

**P4 Agents.** Read §G, W-03, M-26. List, template gallery, all 8 detail tabs, versioning, publish validation, and Test Console using `MockVoiceSession` (scripted conversation, mic meter, latency, activity stream, dry-run analysis).

**P5 Campaigns.** Read §D, W-01, M-02/M-03. List, 7-step wizard with preflight and live estimates, launch, controls, campaign detail with all 6 tabs.

**P6 Calls and simulator.** Read §E, `05` §3 and §5, `06` §3-4. Calls table with transcript search, Live Calls workspace, full Call detail (audio, transcript with Roman toggle, evidence chips, intelligence, action ledger, audit trail), and the live call simulator that writes decisions/actions/reviews/appointments consistently.

**P7 Review, Appointments, Follow-ups.** Read §F and §H, M-07 to M-10, D-03/D-04/D-06. Review queue + panel (with keyboard shortcuts), FullCalendar (free plugins only) with proposed/confirmed visual distinction, availability, booking errors, tasks list/board.

**P8 Dashboard, Insights, Compliance.** Read §B, §I, §J and metrics in `04` §4. KPI cards with formula tooltips, funnel, trends, insight cards with evidence drill-down, health tiles, AI quality tab (labels + sample-size warnings), compliance center.

**P9 Notifications, audit, search, polish.** Read §K, §L, §N, §O, `01` §5. Notifications inbox, audit log with diff drawer, global search, shortcuts, dark-mode and accessibility pass, responsive pass at 390 px.

**P10 Hardening.** Write the Playwright test that runs the spec §2.5 acceptance script in mock mode; contract tests validating all mock payloads; performance pass; complete the §10 swap-readiness checklist and report any item that fails.
