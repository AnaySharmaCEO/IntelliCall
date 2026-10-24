# frontend_update.md: replace the old frontend with the new IntelliCall screens

**Audience:** the IDE agent (Antigravity) working in `frontend/`.
**Goal:** the app in `frontend/` ends up matching the new design in `docs/frontend/reference/`, built on the architecture in `docs/FRONTEND_SPEC.md`, with no leftover old screens and no mixed styling.
**Read first:** `AGENTS.md`, `docs/FRONTEND_SPEC.md`, `docs/engineering_standards.md`, then this file.

---

## 0. What you have and what you do not have

| Thing | Status |
|---|---|
| New design, 9 screens | Done. Static files in `docs/frontend/reference/*.html` (open in a browser) and screenshots in `docs/frontend/reference/screens/*.png` (1440 px wide). Shared styles in `reference/ic.css`. |
| Every other screen, modal, drawer, state | Described in `docs/frontend/02-screens.md` and `03-modals-and-panels.md`. Build them with the same look. |
| Old frontend | **Unknown to the person who wrote this file.** Nobody has listed its screens. Your first job is to audit it (Phase F0). Do not assume anything about it. |
| Backend | Being rebuilt on Supabase (see `docs/backend_update.md`). The frontend must keep working on mock data until each domain is switched over. |

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

1. Create a branch `feat/frontend-v2` and tag the current commit `legacy-frontend-final`.
2. Read `frontend/package.json`, the router, the entry file, and the `src` tree. Write `docs/frontend/MIGRATION_MAP.md` with:
   - **Stack facts:** framework, bundler, router, language (JS or TS), styling approach, state management, test setup, package manager, Node version. All verified from files, not guessed.
   - **Old screens table:** one row per existing route or page.

     | Old route / file | What it shows | Data source (Supabase table, hard-coded, none) | New screen | Action (`replace` / `merge into` / `delete` / `keep logic only`) |
     |---|---|---|---|---|

   - **Reusable logic:** auth wiring, Supabase client setup, helpers, hooks, assets (logo, favicon). For each, say whether it is moved into the new seams (`AuthAdapter`, `HttpApiClient`) or dropped.
   - **Dependencies:** list each current dependency as `keep`, `replace`, or `remove`, with a reason. Flag anything that conflicts with spec §1 (for example another router, another UI kit, another calendar).
   - **Direct Supabase calls found in components:** list every file and call. These must all disappear into `src/api/http/*` and `src/auth/*`.
3. **Stop and show me the migration map before deleting or moving anything.** This is the one place to pause; everything after follows the plan.

### F1. Foundation and design system

1. `git mv frontend/src frontend/legacy-src`. Exclude `legacy-src` from `tsconfig`, ESLint, and tests so it cannot break CI. Create a fresh `frontend/src` with the structure in spec §3.2 and `docs/engineering_standards.md` §3.
2. Keep or upgrade existing build config only as needed (Vite is expected; if the project is on another bundler, record the decision before changing it).
3. Install the dependencies named in spec §1. Record any extra in `DECISIONS.md`.
4. Build tokens (`styles/tokens.css`, light and dark), Tailwind theme, fonts (Inter and Noto Sans Devanagari), `lib/format.ts`, `lib/permissions.ts`.
5. Build `contracts/` (Zod, per `docs/frontend/04-data-model-and-metrics.md`), the four seam interfaces with mock implementations, and the in-memory mock store with latency and failure injection.
6. Build the app shell and every pattern in `01` §4. Create the kit page `/__kit` showing each pattern in every state, in light and dark.
7. **Exit check:** `/__kit` matches the visual language of `reference/screens/*.png` side by side.

### F2. Port the nine reference screens

For each screen, in this order: Dashboard, Leads (+ lead drawer), Review Queue, Calls (live + detail), Agents (test console), Campaign wizard (all 7 steps), Appointments, Compliance.

Per screen:
1. Open the reference `.html` and `.png`. Read the matching section of `02-screens.md`.
2. Add the data hooks in `src/api/hooks/` and the mock endpoints with seed data that produces the reference content (scenario IDs S1 to S14 in `06`).
3. Build the screen from patterns only. Add all states.
4. Take a Playwright screenshot at 1440 px and 390 px, light and dark. Put the 1440 light one next to the reference PNG and fix visible differences in layout, spacing, hierarchy, or color.
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
