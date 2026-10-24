# frontend_update.md: replace the old frontend with the new IntelliCall screens

**Audience:** the IDE agent (Antigravity) working in `frontend/`.
**Goal:** the app in `frontend/` ends up matching the new design in `docs/frontend/reference/`, built on the architecture in `docs/FRONTEND_SPEC.md`, with no leftover old screens and no mixed styling.
**Read first:** `AGENTS.md`, `docs/FRONTEND_SPEC.md`, `docs/engineering_standards.md`, then this file.

---

## 0. What you have and what you do not have

| Thing | Status |
|---|---|
| New design, all screens | Done. One combined reference file: `docs/frontend/reference/IntelliCall Screens.html` (open in a browser; all screens are in one scrollable document). Shared styles inline in the HTML. No individual screen HTMLs. No pre-existing PNG screenshots — Playwright screenshots will be taken during F2 and compared to the running HTML reference side-by-side in the browser. |
| Every other screen, modal, drawer, state | Described in `docs/frontend/02-screens.md` and `03-modals-and-panels.md`. Build them with the same look. |
| Old frontend | **Partially known.** The existing frontend (React 19, Vite 8, React Router v7, Tailwind 4, Recharts) has these pages: Dashboard, Leads, LeadDetail, Campaigns, CampaignDetail, CreateCampaign, Agents, AgentDetail, Calls, CallDetail, Decisions, DecisionDetail, Outcomes, Strategies, Settings, AccountSettings, Auth (sign in/up/OTP), Onboarding, Landing. It has custom components: Button, Tabs, Modal, Drawer, Sidebar, Topbar, FilterBar, Skeleton, EmptyState, ErrorInline, Badge, Toast, and shared components (AIStateBanner, CallWithAIDrawer, EvidenceChip family, Timeline, etc.). It uses `AuthContext` (full Supabase auth) and hook-based data fetching (custom hooks calling Supabase directly). F0 catalogues all of this formally. |
| Backend | **Already exists** on cloud Supabase (7 migrations applied, 4 Edge Functions). The frontend must keep working on mock data until each domain is switched over. Auth already works against the cloud project. |

**How to use the reference files:**
- They are **visual and content references**, not code to copy. They use plain CSS classes and hard-coded sample data. Rebuild every screen as React components using the tokens and patterns from `docs/frontend/01-design-system-and-shell.md`.
- Layout, spacing, hierarchy, colors, status vocabulary, and copy tone must match. Pixel-perfect is not required.
- Where a reference screen and the spec disagree about **behavior**, the spec wins. Where they disagree about **look**, the reference wins. Record every such conflict in `docs/frontend/DECISIONS.md`.
- The reference shows light mode only, at 1440 px only, with data present. You must also deliver dark mode, narrow screens, and loading / empty / error / forbidden states (spec §0 rule 8 and §6).

---

## 1. Reference screens and where they live in the app

| Reference file | Route | Spec section | Notes |
|---|---|---|---|
| `Main.html` | `/dashboard` | `02-screens` §B | KPI strip, funnel, trend chart, action queue, insight cards, comparison tables, health tiles |
| `Leads.html` | `/leads` | §C1, drawer D-01 | Table with bulk bar and saved-view tabs. The right card is the **lead drawer** (D-01), not a separate page |
| `Campaign.html` | `/campaigns/new` step 6 | §D2, wizard W-01 | Shows the wizard shell (step list, summary sidebar) and the preflight step. Build all 7 steps in this shell |
| `LiveCalls.html` | `/calls/live` | §E2 | Three-pane workspace |
| `CallDetail.html` | `/calls/:id` | §E3 | Audio, transcript, decisions with evidence, action ledger, audit trail |
| `Review.html` | `/review` | §F | List plus review panel (D-03) |
| `Agent.html` | `/agents/:id` (Test console tab) | §G2 | Other 7 tabs follow the same page frame |
| `Appointments.html` | `/appointments` | §H1 | Calendar must use FullCalendar free plugins (see §5 below) |
| `Compliance.html` | `/compliance` | §J | Overview tab; build the other 5 tabs |

**Screens with no reference file** (build from the spec using the same patterns): auth pages and onboarding, campaigns list and campaign detail, calls list, agents list, follow-ups, insights, notifications, audit log, global search, every settings page, help, error pages, and all modals and drawers in `03-modals-and-panels.md`.

---

## 2. Map the reference CSS to React patterns

The reference file `ic.css` is a throwaway prototype stylesheet. Do not import it into the app. Use this table to find the pattern component for each class, and take colors, radii, and spacing from it when you write `tokens.css` and the Tailwind theme.

| Reference class | Becomes | Defined in |
|---|---|---|
| `.app`, `.side`, `.main`, `.top`, `.page` | `AppShell`, `Sidebar`, `TopBar`, `PageContainer` | `01` §5 |
| `.nv`, `.nvh`, `.bd` | `NavItem`, `NavSection`, `CountBadge` | `01` §5 |
| `.org`, `.av` | `OrgSwitcher`, `Avatar` | `01` §5 |
| `.ph`, `.acts` | `PageHeader` with `actions` slot | `01` §6 |
| `.btn`, `.btn.p`, `.btn.d`, `.btn.s`, `.btn.off` | `Button` variants: default, primary, destructive, small, disabled-roadmap | shadcn Button |
| `.ch` (+ `.ok .wn .er .in .live .nd`) | `StatusChip` (tone + optional pulse + dot) | `01` §3, §4 |
| `.chd` | `StatusChip` variant `proposed` (dashed outline) | `01` §3 |
| `.card`, `.cp`, `.ct` | `Card`, `CardBody`, `CardTitle` | shadcn Card |
| `.kpi`, `.kpis` | `KPICard`, `KPIGrid` | `01` §4 |
| `.fun`, `.fr` | `FunnelChart` | `01` §4 |
| `.ins`, `.q` | `InsightCard`, `Quote` | `01` §4 |
| `.aq`, `.sev` | `ActionQueue`, `ActionQueueItem`, `SeverityDot` | `01` §4 |
| `.tiles`, `.tile` | `StatTile`, `HealthTile` | `01` §4 |
| `.kv` | `DescriptionList` | new, small |
| `.tabs`, `.tab` | `Tabs` (real `role="tablist"`) | shadcn Tabs |
| `.fb`, `.fi` | `FilterBar`, `FilterChip` | `01` §4 |
| `table`, `.tw` | `DataTable` (TanStack) | `01` §4 |
| `.bar` | `ProgressBar` | new, small |
| `.ev` | `EvidenceChip` | `01` §4 |
| `.conf` | `ConfidenceMeter` (always labelled "Model confidence (uncalibrated)" nearby) | `01` §4 |
| `.ai` | `AiBadge` | `01` §1 |
| `.tr`, `.tm`, `.sp`, `.hl`, `.lv` | `TranscriptRow`, evidence-highlight state, interim state | `TranscriptView` |
| `.wave` | `AudioPlayer` (wavesurfer.js) with evidence markers | `01` §4 |
| `.tl`, `.tle`, `.dt` | `Timeline`, `AuditTrail` | `01` §4 |
| `.ck`, `.ic` | `ChecklistRow` (pass / warn / fail) | new, used by Preflight and Compliance |
| `.note`, `.note.in` | `Callout` (warning, info) | new, small |
| `.step` | `Stepper` | `01` §4 |
| `.fld` | `FormField` | React Hook Form + shadcn |
| `.cal`, `.ev2` | **Not reproduced.** Use FullCalendar and style its events with the same colors | §5 below |
| `.mic`, `.big` | `LevelMeter`, `CallControlButton` | Test console |
| `.tg` | `Switch` | shadcn |
| `.sec`, `.sep`, `.mu`, `.sm`, `.b6` | `SectionLabel`, `Divider`, text utilities | Tailwind |

---

## 3. Things the reference does that you must **not** copy

The reference is a fast static mockup. Fix these in the real app:

1. **Buttons and tabs are `<span>`s.** Use real `<button>` and `<a>`. Tabs need `role="tablist"`, arrow-key navigation, `aria-selected`.
2. **Colors are hard-coded hex in one stylesheet, light mode only.** Move them to CSS variables (`01` §2), add the dark values, and check contrast.
3. **Data is hard-coded** (names, numbers, times). Move it all to the mock seeds (`06-mock-data-and-states.md`). No component may contain demo text. The reference dates are written as if today were **15 Oct 2026**; the mock layer must generate dates relative to "today" so the demo never looks stale.
4. **Numbers are static.** Percentages, deltas, and funnel widths must be computed from API data via the metric definitions in `04` §4. Tooltips must show the formula and sample size.
5. **Calendar grid is hand-built.** Use FullCalendar.
6. **Single-hour calendar events clip their text** in the reference. Make short events show title only and move details to a hover card.
7. **Charts are hand-drawn SVG.** Use Recharts, with chart text colored from tokens and a sample size on every chart (spec rule in `02-screens` §I).
8. **Keyboard hint says "Ctrl K".** Show `⌘K` on macOS and `Ctrl K` elsewhere.
9. **No states.** Add loading skeletons, empty states with a next step, error states with Retry and request ID, and forbidden states.
10. **Desktop only.** Below 768 px: sidebar becomes a drawer, tables become card lists, detail panels become bottom sheets (spec §6).

---

## 4. Phases

Work one phase at a time. At the end of each phase run typecheck, lint, tests, and build; list what is done and what is stubbed; append decisions to `docs/frontend/DECISIONS.md`; commit.

These phases **replace P0 and P1 in `docs/frontend/PHASE_PROMPTS.md`** for this repository, because a frontend already exists. After F2 the remaining phases continue as P2 onward, with the reference screens already done.

### F0. Audit and branch (no UI changes yet)

> **Note:** Much of F0 is already known. The following is a formal audit pass to produce `MIGRATION_MAP.md`.

1. Create a branch `feat/frontend-v2` and tag the current commit `legacy-frontend-final`.
2. Read `frontend/package.json`, `App.tsx`, `index.css`, and the `src/` tree. Write `docs/frontend/MIGRATION_MAP.md` with:
   - **Stack facts** (verified — not guessed):
     - Framework: React 19
     - Bundler: Vite 8
     - Router: React Router v7 (BrowserRouter, file-based component routes)
     - Language: TypeScript (strict mode TBD — check tsconfig)
     - Styling: Tailwind 4 + CSS variables (custom token system in `index.css`)
     - State management: custom React Context (`AuthContext`), hooks for data fetching
     - Test setup: none currently (add Vitest + Playwright)
     - Package manager: npm (check if pnpm or bun is in lockfile)
     - Fonts: IBM Plex Sans + IBM Plex Mono (Google Fonts CDN import)
   - **Old screens table:** one row per existing route:

     | Old route / file | What it shows | Data source | New screen | Action |
     |---|---|---|---|---|
     | `/` | Landing page | none | n/a | `delete` |
     | `/auth`, `/signin`, `/signup` | Auth (sign in / sign up / OTP) | Supabase Auth | Auth pages §A | `merge into` |
     | `/onboarding` | Onboarding wizard | Supabase `organizations`, `organization_members` | Onboarding §A | `replace` |
     | `/dashboard` | Dashboard KPIs + funnel | Supabase hooks | Dashboard §B | `replace` |
     | `/leads` | Leads table | Supabase `leads` | Leads §C1 | `replace` |
     | `/leads/:id` | Lead detail page | Supabase | Lead drawer D-01 (moved to drawer) | `replace` |
     | `/campaigns` | Campaign list | Supabase | Campaigns §D1 | `replace` |
     | `/campaigns/new` | Create campaign | Supabase | Campaign wizard W-01 | `replace` |
     | `/campaigns/:id` | Campaign detail | Supabase | Campaign detail §D3 | `replace` |
     | `/agents` | Agent list | Supabase | Agents §G1 | `replace` |
     | `/agents/:id` | Agent detail | Supabase | Agent detail §G2 | `replace` |
     | `/calls` | Calls history | Supabase | Calls list §E1 | `replace` |
     | `/calls/:id` | Call detail | Supabase | Call detail §E3 | `replace` |
     | `/decisions`, `/decisions/:id` | Decisions list/detail | Supabase | → merged into Call detail §E3 (decisions tab) and Review Queue §F | `delete` |
     | `/outcomes` | Outcomes page | Supabase | → merged into Insights §I | `delete` |
     | `/strategies` | Strategies page | Supabase | → merged into Insights §I | `delete` |
     | `/settings` | Settings | Supabase | Settings §M | `replace` |
     | `/settings/account` | Account settings | Supabase | Settings > Profile §M | `merge into` |

   - **Reusable logic:**
     - `src/lib/supabase.ts` → becomes `src/auth/supabase.ts` (the `SupabaseAuth` adapter)
     - `src/contexts/AuthContext.tsx` → refactor into `src/auth/supabase.ts`; the auth seam interface comes from `src/auth/adapter.ts`. **Do not rewrite** auth — it's working. The `organization_members` table query (not `memberships`) is the correct one for our schema.
     - `src/components/ui/` — evaluate each component: keep and integrate into `src/components/patterns/` or replace with a shadcn/ui equivalent where it's simpler
     - `src/components/shared/` — `EvidenceChip`, `Timeline`, `DecisionCard`, `AIStateBanner`, etc. — these map to spec patterns; integrate or refactor rather than rewrite
     - `src/hooks/` — rewrite as TanStack Query hooks in `src/api/hooks/`; the existing hooks call Supabase directly (violates spec rule 2) — keep the domain knowledge, move the transport
   - **Dependencies to add:** `@tanstack/react-query`, `@tanstack/react-table`, `react-hook-form`, `zod`, `sonner`, `cmdk`, `@fullcalendar/*` (free plugins), `wavesurfer.js`, `livekit-client`, `@livekit/components-react`, `date-fns`, `date-fns-tz`, `libphonenumber-js`, shadcn/ui init
   - **Dependencies to keep:** `@supabase/supabase-js`, `react`, `react-dom`, `react-router-dom` v7, `recharts`, `tailwindcss` v4, Vite, TypeScript
   - **Direct Supabase calls in components:** list every `supabase.from(...)` in `src/hooks/` and `src/services/` — these all move to `src/api/http/*` in F5
3. **Stop and show the migration map before deleting or moving anything.** This is the one place to pause; everything after follows the plan.

### F1. Foundation and design system

1. `git mv frontend/src frontend/legacy-src`. Exclude `legacy-src` from `tsconfig`, ESLint, and tests so it cannot break CI. Create a fresh `frontend/src` with the structure in spec §3.2 and `docs/engineering_standards.md` §3.
2. Vite 8 and TypeScript are already set up — keep them. Do not downgrade. Record any version decisions in `DECISIONS.md`.
3. Install the new dependencies listed in spec §1 (see F0 audit). Run `npx shadcn@latest init` to set up shadcn/ui with Tailwind 4 (check the shadcn docs for the Tailwind 4 setup — it differs from v3). Record the init choices in `DECISIONS.md`.
4. Build tokens (`styles/tokens.css`) — **extend and rename the existing token system** from `index.css` (see `01-design-system-and-shell.md` §2 for the mapping). Keep IBM Plex Sans + IBM Plex Mono. Add Noto Sans Devanagari. Keep `[data-theme="dark"]` as the dark mode selector (do not switch to `.dark`). Build Tailwind theme (`tailwind.config.ts`) referencing the CSS tokens. Build `lib/format.ts` and `lib/permissions.ts`.
5. Build `contracts/` (Zod, per `docs/frontend/04-data-model-and-metrics.md`), the four seam interfaces (`ApiClient`, `RealtimeClient`, `VoiceSessionClient`, `AuthAdapter`) with mock implementations (in-memory, localStorage-persisted, latency + failure injection).
   - **Auth seam:** the `SupabaseAuth` adapter wraps the existing `AuthContext` logic. It uses `organization_members` (not `memberships`) as the membership table — this matches our actual schema.
6. Build the app shell and every pattern in `01` §4. Create the kit page `/__kit` showing each pattern in every state, in light and dark.
7. **Exit check:** `/__kit` matches the visual language from `docs/frontend/reference/IntelliCall Screens.html` — open the reference HTML in a browser and compare side-by-side at 1440 px.

### F2. Port the nine reference screens

For each screen, in this order: Dashboard, Leads (+ lead drawer), Review Queue, Calls (live + detail), Agents (test console), Campaign wizard (all 7 steps), Appointments, Compliance.

Per screen:
1. Open `docs/frontend/reference/IntelliCall Screens.html` in a browser and navigate to that screen section. Read the matching section of `02-screens.md`.
2. Add the data hooks in `src/api/hooks/` and the mock endpoints with seed data that produces the reference content (scenario IDs S1 to S14 in `06`).
3. Build the screen from patterns only. Add all states.
4. Take a Playwright screenshot at 1440 px and 390 px, light and dark. Compare the 1440 px light screenshot to the reference HTML open at the same size in a browser — fix visible differences in layout, spacing, hierarchy, or color.
5. Write down, in the commit message, what is still stubbed.

### F3. Remaining screens and modals

Build everything listed as "no reference file" in §1 above, plus every modal and drawer in `03-modals-and-panels.md`, following the build order P2 to P9 in `PHASE_PROMPTS.md`.

### F4. Retire the old code

1. Open `MIGRATION_MAP.md` and confirm every row is resolved. Any `keep logic only` row has been moved to the right seam.
2. Search the app for imports from `legacy-src`. There must be none.
3. Delete `frontend/legacy-src`. Remove unused dependencies. Run the full check suite.
4. Update `frontend/README` with how to run mock mode and API mode.

### F5. Switch to real data, one domain at a time

This phase runs in parallel with the backend work in `docs/backend_update.md`.

1. Support `VITE_DATA_SOURCE=mock|api` **and** a per-domain override `VITE_API_DOMAINS=leads,agents,...` so a domain can use the real API while others stay on mocks. The `ApiClient` factory picks per call.
2. For each domain, in the order the backend delivers it: switch it, run the Playwright acceptance test for that domain in API mode, fix contract mismatches **in the contract and the backend together** (never by patching around them in a component), and then update the checklist in spec §10.
3. When every domain is on `api`, default `VITE_DATA_SOURCE` to `api`, keep mock mode for demos and tests.

---

## 5. Specific build notes

- **Calendar:** FullCalendar with `daygrid`, `timegrid`, `list`, `interaction` only. Event colors: confirmed solid accent; proposed dashed warning outline; completed muted; failed or no-show danger tint. Apply them with `eventClassNames`, not inline per-event styles. Do not use resource or timeline views (paid).
- **Transcript:** virtualize above 500 segments. Evidence highlighting comes from `Decision.evidence[].segmentIds`; do not search text to find it. Hindi text uses `lang="hi"` and Noto Sans Devanagari; the Roman toggle uses `textRoman` from the segment.
- **Audio:** wavesurfer with regions for evidence spans. When there is no recording, hide the player and keep the transcript.
- **Live calls:** the transcript list subscribes through `RealtimeClient`. Show interim segments greyed until final. Respect `prefers-reduced-motion` for the live pulse.
- **Review queue:** keyboard shortcuts `a`, `e`, `r`, `j`, `k` must not fire while typing in an input.
- **Tables:** use `DataTable` everywhere, including the small tables on the dashboard, so column behavior and states are consistent.
- **Labels that matter:** "Model confidence (uncalibrated)", "Proposed" vs "Confirmed", "attempts" vs "unique leads", and every "Coming soon" roadmap control must be present exactly as the spec says.

---

## 6. Acceptance for this whole migration

- `frontend/legacy-src` no longer exists and nothing imports from it.
- Every route in `02-screens.md` renders in mock mode, in light and dark, at 1440 px and 390 px, with loading, empty, error, and forbidden states reachable from Demo Controls.
- The nine reference screens are visually faithful to `docs/frontend/reference/screens/*.png`.
- The Playwright acceptance script in spec §2.5 passes in mock mode.
- The swap-readiness checklist in spec §10 is fully ticked.
- `npm run typecheck`, `lint`, `test`, and `build` pass (use the project's actual package manager).
- No file under `features/` or `components/` imports Supabase, `fetch`, mock data, or `localStorage` data.

## 7. If you get stuck

Choose the smallest reasonable option, write it in `DECISIONS.md`, continue. Ask a human only when the choice cannot be undone (deleting data, changing a published contract used by the backend, or removing a dependency another team member's work depends on).
