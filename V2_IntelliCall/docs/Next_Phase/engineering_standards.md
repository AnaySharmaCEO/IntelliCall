# engineering_standards.md: coding practice and repository structure

**Audience:** every human and every IDE agent that writes code in this repository.
**Status:** binding. If this file and a habit disagree, this file wins. If this file is wrong, fix it in a PR, do not work around it.

---

## 1. Principles

1. **One way to do each thing.** One data path (UI → hook → `ApiClient` → Edge Function `api` → Postgres), one place for formatting, one place for permissions, one place for contracts.
2. **Contracts before code.** A shape is defined once as a Zod schema, then used by the frontend, the Edge Functions, and (as JSON Schema) the AI and voice services.
3. **Boring and readable beats clever.** Small functions, clear names, no premature abstraction. Three similar lines are better than a wrong abstraction.
4. **Safe by default.** RLS on, least privilege, validation at every boundary, secrets only server-side, AI output treated as untrusted input.
5. **Everything is testable without a phone call.** Mock mode, `scripted_replay`, and fixtures must let any feature be exercised in CI.
6. **Small, reviewable changes.** One purpose per PR. Docs and tests change in the same PR as the code.
7. **Honest status.** Never say something works unless it was run. Never leave a control that silently does nothing.

---

## 2. Repository structure (target)

```
intellicall/
├─ AGENTS.md                      rules for IDE agents (read first)
├─ README.md                      what this is, how to run it in 5 minutes
├─ .env.example                   variable NAMES only, no values (see docs/environment_and_secrets.md)
├─ .gitignore  .editorconfig  .nvmrc
├─ docker-compose.yml             local helpers: voice worker, AI service (Supabase runs via its CLI)
├─ .github/
│  ├─ workflows/ci.yml            lint, typecheck, test, build, db tests, contract drift check
│  ├─ workflows/deploy.yml        dev auto-deploy, prod manual approval
│  └─ pull_request_template.md
├─ docs/
│  ├─ docs_index.md               map of all documents and who reads what
│  ├─ FRONTEND_SPEC.md  COMPETITIVE_BENCHMARK.md
│  ├─ frontend_update.md  backend_update.md
│  ├─ engineering_standards.md  security_and_privacy.md  environment_and_secrets.md
│  ├─ testing_strategy.md  deployment_and_ci.md  voice_and_ai_service.md
│  ├─ frontend/                   detailed spec files, reference/ (static screens), DECISIONS.md, MIGRATION_MAP.md
│  ├─ backend/                    AUDIT.md and backend notes
│  └─ adr/                        architecture decision records, one short file each
├─ frontend/                      React + TypeScript app (see §3)
├─ supabase/                      database, Edge Functions, tests (see §4)
├─ backend/
│  ├─ voice-agent/                Python LiveKit worker (see docs/voice_and_ai_service.md)
│  └─ resonology-ai/              Python AI service (FastAPI)
├─ scripts/                       seed-demo.ts, gen-types.sh, sync-contracts.ts, check-contracts.ts, export-json-schema.ts
├─ deployment/                    infra notes, container files, hosting config (existing folder, kept)
├─ database/                      LEGACY. Contents are ported to supabase/migrations, then archived in database/_archive/
└─ tests/                         cross-system end-to-end tests (frontend + local Supabase + replay worker)
```

Rules:
- Nothing generated is committed except generated types and the synced contracts, and CI verifies both are current.
- Each top-level folder has a short `README.md` saying what it owns and how to run it.
- Do not create new top-level folders without an ADR.

---

## 3. Frontend (`frontend/`)

### 3.1 Structure

```
frontend/
  index.html  vite.config.ts  tsconfig.json  eslint.config.js  tailwind.config.ts  playwright.config.ts
  public/samples/leads_demo.csv
  e2e/                          Playwright tests (acceptance script from FRONTEND_SPEC §2.5)
  src/
    app/                        router, providers, layouts, route guards
    api/
      client.ts                 ApiClient interface and factory (the one seam)
      hooks/                    one file per domain: leads.ts, campaigns.ts, calls.ts, ...
      mock/                     MockApiClient, in-memory store, seeds, simulator, failure injection
      http/                     HttpApiClient (fetch wrapper, auth header, X-Org-Id, idempotency, error mapping)
    auth/                       AuthAdapter, mock, supabase
    realtime/                   RealtimeClient, mock, supabase
    voice/                      VoiceSessionClient, mock, livekit
    contracts/                  Zod schemas and inferred types (source of truth)
    features/
      <domain>/                 dashboard, leads, campaigns, calls, review, agents, appointments, followups,
                                insights, compliance, settings, notifications, audit
        pages/                  route-level components
        components/             components used only in this feature
        modals/                 dialogs and drawers for this feature
        columns.tsx  filters.ts feature-local table and filter definitions
        index.ts                the only file other features may import
    components/
      ui/                       shadcn primitives (generated, lightly edited)
      patterns/                 KPICard, FunnelChart, EvidenceChip, StatusChip, DataTable, ... (docs/frontend/01)
    lib/                        format.ts, permissions.ts, metrics.ts, time.ts, cn.ts
    styles/                     tokens.css, globals.css
    i18n/                       react-i18next setup, en.json
    test/                       setup, factories, render helpers
  legacy-src/                   TEMPORARY during migration (see docs/frontend_update.md), deleted at the end
```

### 3.2 Rules

- **Imports are enforced by ESLint**, not by good intentions:
  ```js
  // eslint.config.js (excerpt)
  {
    files: ['src/features/**/*', 'src/components/**/*', 'src/app/**/*'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['@supabase/*'],          message: 'Only src/auth, src/realtime and src/api/http may import Supabase.' },
        { group: ['**/api/mock/*'],        message: 'Mocks are reachable only through the ApiClient factory.' },
        { group: ['**/legacy-src/*'],      message: 'Legacy code must not be imported.' },
        { group: ['**/features/*/*'],      message: 'Import a feature only through its index.ts.' },
      ]}],
      'no-restricted-globals': ['error', 'fetch'],
    },
  }
  ```
- **Data fetching only in `src/api/hooks`.** Components call hooks (`useLeads(params)`); they never call `fetch`, never build URLs, never read `localStorage` for data.
- **Server state in TanStack Query.** Local UI state in `useState` or a small store. No server data copied into global stores.
- **Forms:** React Hook Form with a Zod resolver, using the contract schema or a derived one. Show field errors inline and a summary on submit.
- **Components:** function components, named exports, one component per file, props typed with an interface, no inline anonymous components in JSX lists. A component file over about 200 lines gets split. A page over about 300 lines gets split.
- **Styling:** Tailwind utility classes with the design tokens in `tokens.css`. No hex colors in components. No inline `style` except for truly dynamic values (for example a bar width). Use `cn()` for conditional classes.
- **Accessibility:** real `<button>`, `<a>`, `<label>`; visible focus; `aria-live` for live transcript and toasts; respect `prefers-reduced-motion`. Icon-only buttons have `aria-label`. Status never relies on color alone.
- **Formatting:** all currency, dates, durations, phones, and percentages go through `lib/format.ts`.
- **Permissions:** all gating through `can(user, permission)` or `<PermissionGate>`. Never compare role strings in components.
- **Strings:** user-facing strings are plain English literals in components for now, wrapped through `t()` once i18n is wired for a feature. Hindi appears only as content (transcripts, greetings), not as app UI.
- **Performance:** route-level `lazy()` for pages; lazy-load FullCalendar, wavesurfer, livekit-client, charts. Virtualize long tables and transcripts.
- **No dead UI:** every control works against mock data or is disabled with a "Coming soon" tooltip and `data-roadmap`.

### 3.3 Testing in the frontend

Vitest for `lib/*`, hooks with mocks, and patterns (React Testing Library). Playwright for flows. See `docs/testing_strategy.md`.

---

## 4. Supabase and Edge Functions (`supabase/`)

Full detail is in `docs/backend_update.md`. The standards that apply to every contributor:

- **Schema changes only through migrations** (`supabase migration new`). Never edit an applied migration. One concern per migration. Tables, RLS, policies, grants, and indexes ship together.
- **SQL style:** lowercase keywords, snake_case, explicit schema names, no `select *` in functions or views, every function sets `search_path = ''`, comments on tables, constraints named.
- **Edge Functions:** TypeScript on Deno, Hono for routing in `api`. Validate every input with Zod. Return the standard envelope. No business logic inside route handlers beyond orchestration: put rules in `_shared/` as pure functions with unit tests.
- **Service role usage** is allowed only in the functions listed in `backend_update.md` §1, with a comment explaining why.
- **No long work in a request.** Enqueue a job.
- **Deno:** `deno fmt`, `deno lint`, `deno test`. Pin every import to an exact version in `deno.json`.
- **Generated database types** are committed in `supabase/functions/_shared/db/database.types.ts` and regenerated by `scripts/gen-types.sh`.

---

## 5. Python services (`backend/voice-agent`, `backend/resonology-ai`)

- Python 3.11+, managed with `uv`, lockfile committed.
- `ruff` for lint and format, `pyright` or `mypy` for types, `pytest` for tests.
- Request and response models are Pydantic models **generated from the JSON Schema exported from the Zod contracts** (`scripts/export-json-schema.ts`). Do not hand-write a second copy.
- Config only from environment variables, validated at startup. No secrets in code.
- Every outbound call to the platform is signed (HMAC) and idempotent. Every network call has a timeout.
- Structured JSON logs with `call_id`; never log transcripts at INFO level.

---

## 6. TypeScript rules (frontend and Edge Functions)

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- No `any`. Use `unknown` and narrow with Zod at boundaries (network, storage, `JSON.parse`, environment).
- `import type` for type-only imports. Path alias `@/` for `frontend/src`.
- Prefer `type` for unions and `interface` for object shapes that are extended.
- Prefer discriminated unions and exhaustive `switch` with a `never` check over optional flags.
- No default exports except where a framework requires them. Named exports everywhere else.
- No non-null assertion (`!`) without a comment explaining why it cannot be null.
- No `enum` keyword; use `as const` objects or Zod enums from `contracts/enums.ts`.
- Money is integer paise. Time is ISO-8601 UTC strings in contracts and `Date` only inside `lib/time.ts` and `lib/format.ts`.

---

## 7. Naming

| Thing | Convention | Example |
|---|---|---|
| Files (components) | `PascalCase.tsx` | `KPICard.tsx` |
| Files (other TS) | `kebab-case.ts` | `format-currency.ts` |
| Hooks | `useX` | `useCampaignLive` |
| Zod schemas | `XSchema`, type `X` | `LeadSchema`, `Lead` |
| Database tables and columns | `snake_case`, plural tables | `campaign_leads.next_attempt_at` |
| Edge Functions | `kebab-case` | `voice-events` |
| Routes | kebab-case nouns | `/follow-ups`, `/calls/live` |
| Env vars | `UPPER_SNAKE`; browser ones prefixed `VITE_` | `VITE_API_BASE_URL` |
| Branches | `type/short-description` | `feat/leads-import-wizard` |
| Constants | `UPPER_SNAKE` only for true constants | `MAX_PAGE_SIZE` |

Names say what a thing is in the domain's words: `qualified`, `proposed`, `confirmed`, `attempt`, `unique lead`, `model confidence`. Never name a model score `accuracy`.

---

## 8. Errors, logging, and observability

- **Frontend:** map API error codes to user messages in one place. Show what happened and what to do. Include the request ID with a Copy button on error states. An error boundary at route level, plus one at app level.
- **Backend:** throw typed errors that the Hono `onError` handler converts to the envelope. Log one structured line per request. Include `requestId`, `orgId`, `userId` (ids only).
- **Never log:** tokens, API keys, full phone numbers, emails, transcript text, or recordings' URLs.
- **Jobs and webhooks** record attempts, last error, and next run so failures are visible in the UI (system status, review queue, notifications).

---

## 9. Git, commits, and reviews

- **Trunk-based.** `main` is always deployable. Work on short-lived branches (`feat/…`, `fix/…`, `chore/…`, `docs/…`), merged by squash after review. Tag legacy states before migrations (for example `legacy-frontend-final`).
- **Conventional Commits** with a scope: `feat(frontend): …`, `fix(api): …`, `feat(db): …`, `feat(voice): …`, `feat(ai): …`, `docs: …`, `test: …`, `chore: …`.
- **PRs:** one purpose, ideally under 400 changed lines excluding generated files. Fill in `.github/pull_request_template.md`. At least one reviewer who did not write it. CI must pass.
- **Reviewer checklist:** contracts updated on both sides; RLS and policies present for new tables; tests added; no secrets; no `any`; no dead UI; docs updated; screenshots for UI changes (light and dark, desktop and narrow).
- **Never commit** `.env`, keys, service-account files, or recordings. If a secret was committed, rotate it immediately and purge history (see `docs/security_and_privacy.md`).

---

## 10. Definition of done

A change is done when:
1. It works in mock mode **and** (if a backend exists for it) in API mode.
2. Types check, lint passes, tests pass, build passes.
3. New or changed shapes are in `contracts/` and synced to the backend.
4. New tables have RLS, policies, and pgTAP tests for each role.
5. UI changes have loading, empty, error, and forbidden states, light and dark, desktop and narrow.
6. Docs touched by the change are updated (screens, contracts, env vars, ADR if a decision changed).
7. `docs/frontend/DECISIONS.md` or an ADR records any non-obvious choice.

---

## 11. Dependencies

- Add a dependency only if it does substantial work and is maintained. Record why in `DECISIONS.md`.
- Pin versions (lockfile committed; Deno imports pinned exactly).
- Do not add a second library for something we already have (one router, one table library, one form library, one chart library, one date library).
- Do not use paid tiers of libraries (for example FullCalendar Scheduler or premium plugins).
- Review licenses before adding anything with a non-permissive license.

---

## 12. Working agreements for IDE agents

1. **Plan, then do, then verify.** State the plan in a few lines. Make the change. Run the commands (typecheck, lint, tests, build, `supabase db reset`, `supabase test db`). Paste the real result. Do not claim success you did not observe.
2. **Stay in scope.** No unrelated refactors, renames, or formatting sweeps in a feature PR.
3. **Prefer editing to creating,** and small diffs to large ones. If a task needs more than one phase, stop at the phase boundary.
4. **Do not invent facts.** If an API, a Supabase behavior, or a library detail is uncertain, check the current official docs, and write down the source in `DECISIONS.md`.
5. **When something is unspecified,** pick the smallest reasonable option, record it, continue. Ask a human only for irreversible choices (data deletion, published contract changes that another person depends on, production deploys).
6. **Leave the repo runnable.** Every commit builds. If you must leave work half-done, leave it behind a flag and say so in the commit message.
7. **Never read or print `.env`** or any file that may contain secrets. Use `.env.example` for names.

---

## 13. Do-not list (whole repo)

- No secrets in code, docs, issues, logs, or screenshots.
- No Supabase client, `fetch`, mock imports, or `localStorage` data access inside `features/` or `components/`.
- No tables without RLS. No `using (true)` policies. No `anon` table grants.
- No edited applied migrations. No schema changes outside `supabase/migrations`.
- No AI output that changes data without the policy engine and the action ledger.
- No real phone numbers in tests, seeds, screenshots, or docs.
- No dead buttons. No "TODO" left in shipped UI text.
- No `console.log` left in committed frontend code (use the logger).
