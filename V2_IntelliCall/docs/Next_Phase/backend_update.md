# backend_update.md: build the IntelliCall backend on Supabase

**Audience:** the IDE agent (Antigravity) working in `supabase/`, `backend/`, and `scripts/`, and the humans who review its work.
**Read first:** `AGENTS.md`, `docs/engineering_standards.md`, `docs/security_and_privacy.md`, `docs/environment_and_secrets.md`, then this file. API shapes are in `docs/frontend/05-api-realtime-and-ai-contracts.md`; entities, enums, metrics, and roles are in `docs/frontend/04-data-model-and-metrics.md`. Voice and AI details are in `docs/voice_and_ai_service.md`.

---

## 0. What changes compared with the earlier plan

The earlier spec assumed a separate Node (Fastify or NestJS) "Business API". The backend is now **Supabase**, so:

| Earlier plan | Now |
|---|---|
| Node/Fastify Business API in `backend/` | **Supabase Edge Functions** (Deno, TypeScript, Hono router). One main function `api` plus a few small internal functions |
| Business rules in Node services | Business rules in `supabase/functions/_shared/*` (pure TypeScript, unit tested) and **SQL functions (RPC)** for anything that must be atomic |
| Separate AI service called by the API | Unchanged in principle: AI stays a separate service that can be swapped. Edge Function `analysis-run` calls it through an `AnalysisProvider` interface, with a built-in Gemini fallback provider so work is not blocked (see §8) |
| Voice runtime | **Cannot run in Edge Functions** (they are short-lived request handlers, not long-lived audio sessions). It stays a separate Python worker (LiveKit Agents + Gemini Live). See `docs/voice_and_ai_service.md` |
| `/api/v1/...` base | `https://<project-ref>.supabase.co/functions/v1/api/v1/...` (set `VITE_API_BASE_URL` to `.../functions/v1/api`) |

Treat `docs/frontend/05-api-realtime-and-ai-contracts.md` as the **contract**. Where it says "Business API (Node/TS)", read "Edge Function `api`". Update that file's wording in the same PR that implements it.

**Edge Function limits matter.** They have limits on CPU time, memory, request duration, and bundle size, and these change. Read the current limits page in the Supabase docs before sizing any function, and write every function to finish quickly: do slow or retryable work through the `jobs` table (§6), not inside a request.

---

## 1. Architecture and responsibilities

```
Browser (React)
  ├─ Supabase Auth (login, session)                  supabase-js, auth only
  ├─ Edge Function `api`  (user JWT + X-Org-Id)      all reads and writes
  └─ Supabase Realtime    (RLS-protected tables)     push events only

Edge Functions
  api              user-facing REST (Hono)             verify user, org, role; call SQL/RPC; audit; idempotency
  voice-events     worker → platform events            HMAC-signed, no user JWT
  voice-tools      worker → platform tool calls        HMAC-signed, scoped to one call
  analysis-run     job runner for analysis + actions   service role; calls AI service; runs policy engine
  dialer-tick      cron every minute                   picks eligible leads, creates calls, dispatches the worker
  job-runner       cron every minute + on demand       claims jobs, runs them (exports, imports, webhooks, retries)
  webhook-dispatch (kind of job; may share job-runner) signs and delivers customer webhooks

Postgres            tables + RLS + SQL functions + pg_cron + pg_net + Vault
Storage             recordings, imports, exports, knowledge documents (all private buckets)

Outside Supabase
  Voice worker (Python)     LiveKit Agents + Gemini Live        see docs/voice_and_ai_service.md
  Resonology AI service     transcript → ConversationAnalysis   same doc
```

**Decisions (record changes as ADRs in `docs/adr/`):**

1. **The frontend reads and writes only through `api`.** It uses `supabase-js` for auth and Realtime subscriptions only. No direct table reads or writes from the browser. Reason: the policy engine, idempotency, audit, metrics, PII masking, and cross-table atomicity all live server-side, and there must be exactly one path.
2. **Use the caller's JWT, not the service role, for user-initiated work.** In `api`, create the Supabase client with the request's `Authorization` header so RLS applies as defense in depth. Use the service role only in `voice-events`, `voice-tools`, `analysis-run`, `dialer-tick`, `job-runner`, and for the audit and ledger writes the user is not allowed to make. Every service-role use must be a deliberate, commented choice.
3. **Anything that touches two or more tables and must be atomic is a SQL function called with `rpc()`**, not several client calls. `supabase-js` has no multi-statement transaction.
4. **Organization is chosen per request** with the `X-Org-Id` header, verified against `memberships`. No custom JWT claims. This supports users in more than one org.
5. **Idempotency is mandatory** on every mutating endpoint (`Idempotency-Key` header) and on every inbound provider event (dedupe by provider and event id).

---

## 2. Repository layout for the backend

```
supabase/
  config.toml                      function settings, auth settings, ports
  migrations/                      forward-only SQL migrations (the source of truth for the schema)
  seed.sql                         minimal static seed (enums lookup rows, nothing personal)
  seed/                            demo data generator (TypeScript, run with scripts/seed-demo.ts)
  tests/                           pgTAP tests (RLS, functions, constraints)
  functions/
    _shared/                       code shared by functions (no HTTP handlers here)
      contracts/                   Zod schemas, copied from the frontend contract source (see §3)
      db/                          generated database types, query helpers
      auth/                        verifyUser, requireRole, hmac verify
      http/                        cors, errors, envelope, requestId, idempotency
      policy/                      policy engine (pure functions)
      actions/                     action executors, one file per ActionType
      calendar/                    CalendarProvider interface + internal provider (+ google later)
      analysis/                    AnalysisProvider interface + http and inline-gemini providers
      metrics/                     metric helpers if any logic cannot live in SQL
      audit.ts  log.ts  time.ts
    api/                           main REST function (routes/ one file per domain)
    voice-events/  voice-tools/  analysis-run/  dialer-tick/  job-runner/
    deno.json                      import map (zod, hono, supabase-js pinned)
backend/
  voice-agent/                     Python LiveKit worker (see docs/voice_and_ai_service.md)
  resonology-ai/                   Python AI service (FastAPI), owned by the AI developer
scripts/
  seed-demo.ts  gen-types.sh  sync-contracts.ts  check-contracts.ts
```

**Existing folders `database/`, `supabase/`, and `backend/` already exist and their contents are unknown.** Phase B0 audits them. Rules until then: do not delete anything; `supabase/migrations` is the only place that defines the schema going forward, so anything useful in `database/` is ported into a migration and the old file is moved to `database/_archive/` (not deleted) with a note.

---

## 3. Contracts: one source, two consumers

The frontend already has Zod contracts in `frontend/src/contracts`. Edge Functions need the same schemas.

- **Source of truth:** `frontend/src/contracts/`. Write them with plain `import { z } from "zod"` and no browser-only code.
- **Copy to the backend** with `scripts/sync-contracts.ts` into `supabase/functions/_shared/contracts/` (Deno import map maps `"zod"` to a pinned `npm:zod@3.x`). The Supabase CLI bundles a function from its own folder tree, so importing across the repo root is fragile. Verify with a deploy before relying on any alternative.
- **CI fails** if the two copies differ (`scripts/check-contracts.ts`).
- **Database types** come from `supabase gen types typescript` into `supabase/functions/_shared/db/database.types.ts`. Mappers in `_shared/db/` convert rows to contract shapes (snake_case rows, camelCase contracts, money in paise, ISO strings). Never return a raw row from `api`.
- **Enums:** Postgres enums must match `contracts/enums.ts`. Add a test that reads both and compares them.

---

## 4. Database

### 4.1 Conventions

- Migration files: `supabase migration new <short_description>` → `YYYYMMDDHHMMSS_<description>.sql`. **Never edit a migration that has been applied anywhere shared.** Fix forward with a new migration.
- Tables: `snake_case`, plural. Columns: `snake_case`. Primary key `id uuid primary key default gen_random_uuid()`. Foreign keys are indexed.
- Every tenant table has `org_id uuid not null references public.organizations(id) on delete cascade`, an index starting with `org_id`, `created_at timestamptz not null default now()`, and `updated_at` maintained by trigger.
- Money: integer **paise** (`bigint`), never floats. Times: `timestamptz`, stored in UTC. Phones: E.164 text.
- Statuses: Postgres enums that mirror `contracts/enums.ts`.
- Soft delete (`deleted_at`) only for `leads`, `agents`, `campaigns`, `organizations`. Everything else is hard-deleted by cascade or retained.
- **RLS is enabled in the same migration that creates the table**, with policies, with grants. A table without RLS is a bug. Revoke default privileges from `anon` on everything.
- Put helper functions in schema `private` (not exposed through the API). Every function sets `search_path = ''` and uses fully qualified names. Wrap `auth.uid()` as `(select auth.uid())` inside policies so it is evaluated once per statement.
- Add `comment on table ...` for each table. Add indexes for every filter and sort the API supports (see the query params in file 05).
- Run `supabase db lint` and the Security and Performance advisors in the dashboard before every release.

### 4.2 Foundation migration (write this first; adapt names to your audit)

```sql
-- 20261101000000_foundation.sql
create schema if not exists private;
create extension if not exists pg_trgm      with schema extensions;
create extension if not exists btree_gist   with schema extensions;
-- pg_cron and pg_net: enable in the dashboard or with `create extension ... ` per current Supabase docs.

create type public.member_role as enum ('owner','admin','manager','agent_operator','viewer');

create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  industry text,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  locale text not null default 'en-IN',
  plan text not null default 'demo',
  compliance_settings jsonb not null default '{}'::jsonb,
  automation_policy  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger organizations_updated before update on public.organizations
  for each row execute function private.set_updated_at();

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id  uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null,
  status text not null default 'active' check (status in ('active','invited','deactivated')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);

create or replace function private.is_org_member(_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org and m.user_id = (select auth.uid()) and m.status = 'active');
$$;

create or replace function private.has_org_role(_org uuid, _roles public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = _org and m.user_id = (select auth.uid())
      and m.status = 'active' and m.role = any(_roles));
$$;

revoke all on function private.is_org_member(uuid), private.has_org_role(uuid, public.member_role[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_org_member(uuid), private.has_org_role(uuid, public.member_role[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;

create policy org_select on public.organizations for select to authenticated
  using ((select private.is_org_member(id)));
create policy org_update on public.organizations for update to authenticated
  using      ((select private.has_org_role(id, array['owner','admin']::public.member_role[])))
  with check ((select private.has_org_role(id, array['owner','admin']::public.member_role[])));
-- No insert policy: organizations are created through rpc create_organization (security definer).

create policy membership_select on public.memberships for select to authenticated
  using (user_id = (select auth.uid())
         or (select private.has_org_role(org_id, array['owner','admin']::public.member_role[])));
-- Membership changes go through api + rpc, never direct writes.
```

### 4.3 Exemplar tenant table (copy this pattern for every tenant table)

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null, last_name text, company text, title text,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  email text, city text, state text, country text not null default 'IN',
  source text, owner_id uuid references auth.users(id),
  stage public.lead_stage not null default 'new',
  qualification public.qualification_status not null default 'unknown',
  language_pref text not null default 'auto' check (language_pref in ('en-IN','hi-IN','auto')),
  tags text[] not null default '{}',
  custom_fields jsonb not null default '{}'::jsonb,
  dnd_status text not null default 'unknown' check (dnd_status in ('clear','dnd','unknown')),
  dnd_checked_at timestamptz,
  consent_type text not null default 'none' check (consent_type in ('explicit','inferred','imported','none')),
  consent_at timestamptz, consent_source text, consent_expires_at timestamptz,
  suppressed boolean not null default false,
  last_call_at timestamptz, last_outcome text, next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index leads_org_phone_uq on public.leads (org_id, phone_e164) where deleted_at is null;
create index leads_org_stage_idx   on public.leads (org_id, stage);
create index leads_org_created_idx on public.leads (org_id, created_at desc);
create index leads_name_trgm_idx   on public.leads using gin ((coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(company,'')) extensions.gin_trgm_ops);

alter table public.leads enable row level security;
create policy leads_select on public.leads for select to authenticated
  using ((select private.is_org_member(org_id)) and deleted_at is null);
create policy leads_insert on public.leads for insert to authenticated
  with check ((select private.has_org_role(org_id, array['owner','admin','manager','agent_operator']::public.member_role[])));
create policy leads_update on public.leads for update to authenticated
  using      ((select private.has_org_role(org_id, array['owner','admin','manager','agent_operator']::public.member_role[])))
  with check ((select private.has_org_role(org_id, array['owner','admin','manager','agent_operator']::public.member_role[])));
-- Hard delete is not allowed. Deleting sets deleted_at via api (roles per RBAC matrix in file 04).
create trigger leads_updated before update on public.leads for each row execute function private.set_updated_at();
```

### 4.4 Table inventory

Build these in the order of the phases in §10. Columns come from `docs/frontend/04-data-model-and-metrics.md`; add the ones below that the UI needs but file 04 did not name.

| Group | Tables | Notes |
|---|---|---|
| Tenancy | `organizations`, `memberships`, `invites`, `profiles` (user id, name, avatar) | `profiles` row is created by a minimal trigger on `auth.users`. Keep the trigger tiny and failure-proof: a failing trigger blocks signup |
| Leads | `leads`, `lead_stage_changes`, `lead_notes`, `segments`, `lead_imports`, `lead_import_rows` | Import rows hold validation errors and the scrub result for the Import wizard |
| Agents | `agents`, `agent_versions` (config as validated `jsonb` plus `version`, `published_at`, `changelog`), `knowledge_documents` | A published `agent_versions` row is immutable (enforce with a trigger). Campaigns pin `agent_version_id` |
| Campaigns | `campaigns`, `campaign_leads`, `campaign_events` | `campaign_leads.status` enum from file 04. Store `rules` and `criteria` as validated `jsonb` |
| Calls | `calls`, `transcript_segments`, `call_events` | `calls.channel` (`web_demo`,`pstn`) and **`calls.lead_mode`** (`human_in_browser`,`simulated_persona`,`scripted_replay`,`phone`). `call_events` stores raw provider events with a unique `(provider, event_id)` for dedupe |
| Intelligence | `conversation_analyses`, `decisions`, `evidence`, `action_attempts`, `human_corrections`, `review_items` | Append-only except status fields. `evidence` references segment ids and has `start_ms`, `end_ms`, `quote` |
| Scheduling | `appointments`, `availability_rules`, `calendar_connections`, `tasks` | `appointments`: exclusion constraint prevents two confirmed appointments overlapping for one host (below) |
| Compliance | `suppression_entries`, `compliance_blocks` (log of blocked attempts) | Org-level rules live in `organizations.compliance_settings` |
| Platform | `notifications`, `audit_logs`, `api_keys` (store only a hash and prefix), `webhook_endpoints`, `webhook_deliveries`, `integrations`, `usage_events`, `idempotency_keys`, `jobs`, `rate_limits` | `audit_logs` is append-only: no update or delete grants for anyone, including `authenticated` |

Use `jsonb` for configuration blobs that already have a Zod schema (agent versions, campaign rules and criteria, org policies). Validate with Zod in `api` before writing and add a basic `check (jsonb_typeof(col) = 'object')`.

**Appointments, no double booking:**
```sql
alter table public.appointments add constraint appointments_no_overlap
  exclude using gist (host_id with =, tstzrange(start_at, end_at) with &&)
  where (status = 'confirmed');
```

**Transcript search:** Postgres has no Hindi text-search dictionary. Index `transcript_segments` with a generated `tsvector` using the `'simple'` configuration plus a trigram index on the text, so English and Hindi (Devanagari and Roman) both match.

**Transcript segments and PII:** transcripts can contain personal data. Do not copy transcript text into logs, notifications, or webhooks beyond what a feature needs.

### 4.5 Idempotency and jobs (SQL sketch)

```sql
create table public.idempotency_keys (
  org_id uuid not null, key text not null, request_hash text not null,
  status_code int, response jsonb, created_at timestamptz not null default now(),
  primary key (org_id, key));

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  kind text not null,                      -- analysis, action_retry, import, export, webhook, scrub, ...
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','dead')),
  run_at timestamptz not null default now(),
  attempts int not null default 0, max_attempts int not null default 5,
  locked_at timestamptz, locked_by text, last_error text,
  created_at timestamptz not null default now());
create index jobs_ready_idx on public.jobs (run_at) where status = 'queued';

create or replace function public.claim_jobs(_kinds text[], _limit int, _worker text)
returns setof public.jobs language sql security definer set search_path = '' as $$
  update public.jobs j
     set status = 'running', locked_at = now(), locked_by = _worker, attempts = j.attempts + 1
   where j.id in (select id from public.jobs
                   where status = 'queued' and run_at <= now() and kind = any(_kinds)
                   order by run_at for update skip locked limit _limit)
  returning j.*;
$$;
revoke all on function public.claim_jobs(text[], int, text) from public, anon, authenticated;
-- Only the service role may call claim_jobs. Add a pgTAP test that authenticated cannot.
```
Retry with exponential backoff by setting `status='queued'` and a later `run_at`; after `max_attempts` set `status='dead'` and create a notification and a review item (`failed_action`) where the job was a business action. A stuck-job sweeper (`locked_at` older than a threshold) re-queues work.

### 4.6 Realtime

```sql
alter publication supabase_realtime add table
  public.calls, public.transcript_segments, public.review_items,
  public.notifications, public.appointments, public.tasks, public.campaigns;
```
- Realtime respects RLS, so the same membership policies protect pushes.
- The browser filters by org and by call id (`call_id=eq.<id>`) in its subscriptions (the `RealtimeClient` adapter hides this).
- Keep payload tables free of PII beyond what the policies already allow. `calls` has no phone number.
- If transcript volume becomes a problem, move to Realtime Broadcast fed by database triggers; the `RealtimeClient` interface does not change.

### 4.7 Storage

Private buckets only: `recordings`, `imports`, `exports`, `knowledge`. Path convention `{org_id}/{yyyy}/{mm}/{uuid}.{ext}`. Add storage policies that allow access only when the first path segment is an org the user belongs to, and only by role. The browser never gets a public URL: `api` returns short-lived signed URLs (`GET /calls/:id/recording`). Validate file type and size server-side for imports and knowledge documents.

### 4.8 Scheduling jobs (pg_cron + pg_net + Vault)

Store the project URL and a cron secret in Vault, never in the migration text.

```sql
select cron.schedule('dialer-tick', '* * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/dialer-tick',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 5000);
$$);
```
Jobs to schedule: `dialer-tick` (every minute), `job-runner` (every minute), `stuck-job-sweeper` (every 5 minutes), `usage-rollup` (hourly), `retention-cleanup` (daily), `follow-up-reminders` (every 15 minutes). Functions called by cron use `verify_jwt = false` and check `x-cron-secret` in constant time.

---

## 5. Edge Functions

### 5.1 Function settings (`supabase/config.toml`)

Set `verify_jwt` per function. Newer Supabase projects may use asymmetric JWT signing keys, and the platform-level `verify_jwt` check may not suit them; **read the current Supabase docs for your project's setup** and, if needed, set `verify_jwt = false` and verify the token in code with the Supabase auth client (`getClaims` or `getUser`). Never leave a function reachable without one of: valid user JWT, valid HMAC signature, or valid cron secret.

| Function | Caller | Auth | Notes |
|---|---|---|---|
| `api` | browser | user JWT + `X-Org-Id` | Hono app, `basePath('/api')` (the base path must equal the function name) |
| `voice-events` | voice worker | HMAC (`X-Signature`, `X-Timestamp`, 5-minute replay window) | Writes call status, transcript segments; enqueues analysis; dedupes by event id |
| `voice-tools` | voice worker during a call | HMAC + `call_id` scope | `check_availability`, `propose_appointment`, `mark_do_not_call`, `end_call` |
| `analysis-run` | job runner | service (cron secret or internal HMAC) | Claims analysis jobs, calls `AnalysisProvider`, stores analysis, runs policy engine, enqueues actions |
| `dialer-tick` | cron | cron secret | See §7 |
| `job-runner` | cron + on demand | cron secret | Claims jobs by kind and dispatches |

### 5.2 `api` skeleton (illustrative; adapt to the real project)

```ts
// supabase/functions/api/index.ts
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { cors } from "../_shared/http/cors.ts";
import { requestId, errorHandler, ok } from "../_shared/http/envelope.ts";
import { idempotency } from "../_shared/http/idempotency.ts";
import { leadsRoutes } from "./routes/leads.ts";
// ...other route modules

type Env = { Variables: { db: ReturnType<typeof createClient>; orgId: string; role: string; userId: string; requestId: string } };

const app = new Hono<Env>().basePath("/api");
app.use("*", requestId(), cors());
app.onError(errorHandler);

app.use("/v1/*", async (c, next) => {
  const auth = c.req.header("Authorization") ?? "";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } });           // RLS applies as the caller
  const { data: { user }, error } = await db.auth.getUser(auth.replace("Bearer ", ""));
  if (error || !user) return c.json({ error: { code: "unauthenticated", message: "Sign in again.", requestId: c.get("requestId") } }, 401);
  const orgId = c.req.header("X-Org-Id");
  const { data: m } = await db.from("memberships").select("role").eq("org_id", orgId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!orgId || !m) return c.json({ error: { code: "forbidden", message: "You do not have access to this organization.", requestId: c.get("requestId") } }, 403);
  c.set("db", db); c.set("orgId", orgId); c.set("role", m.role); c.set("userId", user.id);
  await next();
});
app.use("/v1/*", idempotency());          // applies to POST/PATCH/PUT/DELETE
app.route("/v1/leads", leadsRoutes);
// app.route("/v1/campaigns", campaignsRoutes) ...

Deno.serve(app.fetch);
```
Each route module: validate input with the Zod contract, check permission with `requirePermission()` (same keys as the frontend `lib/permissions.ts`), call the DB or an RPC, map the result to the contract, write an audit entry, and return the standard envelope. Route files stay under about 300 lines; split by sub-resource if they grow.

### 5.3 Standard behaviors for `api`

- **Envelope and errors:** list `{ data, page }`; error `{ error: { code, message, details?, requestId } }`; codes from file 04 §2. Return `x-request-id` on every response.
- **Validation:** unknown fields rejected; strings trimmed; phone normalized to E.164 using the same rules as the frontend (`libphonenumber`-compatible, region IN).
- **Pagination:** cursor-based, stable sort with `id` as tiebreaker; `pageSize` capped (100).
- **PII masking:** if the role lacks `pii.read`, the mapper masks phone and email (`+91 98••• ••210`) before returning.
- **CORS:** allow only origins in `ALLOWED_ORIGINS`; handle `OPTIONS`.
- **Rate limiting:** per user and per org on expensive endpoints (`test-session`, imports, exports, re-run analysis) using the `rate_limits` table and a SQL function. Return `rate_limited`.
- **Audit:** every mutating request writes `audit_logs` (actor, action, entity, before/after, result, request id) through the shared helper. AI and system actions write audit entries too.
- **Logging:** one structured JSON line per request (`requestId`, `orgId`, `userId`, route, status, ms). No tokens, phone numbers, or transcript text in logs.

### 5.4 Endpoint inventory

Implement the endpoints in `docs/frontend/05-api-realtime-and-ai-contracts.md` §2 exactly, under `/v1`. Add these that the screens need:

- `POST /v1/orgs` is an RPC wrapper (`create_organization`) that creates the org, the owner membership, and default settings atomically.
- `GET /v1/me` returns the profile, memberships with roles, and the permission list the frontend uses for gating.
- `POST /v1/campaigns/:id/preflight` returns the checklist with `pass | warn | fail`, message, and fix link for each check in `Campaign.html` (agent published, channel ready, voice engine reachable, analysis reachable, calendar connected, leads clear, window inside org window, budget cap).
- `GET /v1/system/status` aggregates the health tiles (telephony/web demo, voice engine, AI analysis, calendar, queue depth). It reads cached results written by a lightweight health check job, not live probes on every request.
- `POST /v1/agents/:id/test-session` mints a LiveKit token (see `voice_and_ai_service.md`) and creates a `calls` row with `channel=web_demo`, `lead_mode=human_in_browser`, and `dry_run=true` when requested.

---

## 6. Atomic operations as SQL functions (RPC)

Write these in `supabase/migrations`, call from `api` or the job runner, and cover each with pgTAP tests.

| Function | Does, in one transaction |
|---|---|
| `create_organization(name, industry, timezone)` | Insert org, owner membership, default settings, audit row |
| `apply_decision(decision_id, applied_by)` | Mark decision applied, write the lead change (stage or qualification), write `lead_stage_changes`, audit, notify |
| `resolve_review_item(id, kind, correction jsonb, note)` | Update item, write `human_corrections`, update the decision, enqueue the follow-up action job, audit |
| `launch_campaign(id)` | Validate preflight server-side, snapshot audience into `campaign_leads`, set status, audit |
| `claim_dialable_leads(campaign_id, n)` | See §7 |
| `confirm_appointment(id, provider_event_id)` | Set `confirmed`, rely on the exclusion constraint, update lead stage, audit |
| `dashboard_summary(org, from, to, filters)` | Returns the metrics object in file 04 §4 shape |
| `dashboard_funnel`, `dashboard_trends`, `insights_*` | Aggregations for the Dashboard and Insights tabs |

Metric functions must implement the definitions in `docs/frontend/04-data-model-and-metrics.md` §4 exactly and return `{ value, numerator, denominator, sampleSize }`. Test them with a small fixture that contains retries, voicemail, blocked calls, a proposed-but-unconfirmed appointment, and an unreviewed decision, so "attempts vs unique leads", "proposed vs confirmed", and "confidence is not accuracy" are enforced by tests.

---

## 7. Calls, dialer, and the web demo channel

**Call state machine (database enforces valid transitions with a check function or trigger):**
`queued → dialing → ringing → in_progress → completed`, with side exits `no_answer`, `busy`, `voicemail`, `failed`, `blocked_compliance`, `cancelled`. `analysis_status`: `pending → analyzing → complete | failed`.

**Dialer (`dialer-tick`, every minute):**
1. For each running campaign, call `claim_dialable_leads(campaign_id, n)`, which, under `FOR UPDATE SKIP LOCKED`, selects only leads that pass **all** of: inside the campaign window and the org compliance window in the org time zone, DND status clear and checked recently, consent on record and not expired, not suppressed, attempts below max, retry gap elapsed, no other call in progress for that lead, concurrency below the campaign limit, budget cap not reached, and pacing allowance remaining.
2. It inserts a `calls` row (`queued`) and a `compliance_snapshot`, and returns it. Compliance is **re-checked at dial time**, not only at campaign creation. A failed check writes `compliance_blocks` and sets `blocked_compliance`.
3. Dispatch the call to the voice worker (HTTPS to the worker's dispatch endpoint, or the LiveKit dispatch API) with the call id, agent version, language, and `lead_mode`.
4. The worker reports progress through `voice-events`. If no event arrives within a timeout, a sweeper marks the call `failed` and schedules a retry.

**Web demo channel needs a lead.** On `channel = web_demo` nobody picks up a phone, so a campaign cannot call real people. `calls.lead_mode` decides who plays the lead:

| `lead_mode` | Who is the lead | Use for | Cost |
|---|---|---|---|
| `human_in_browser` | A teammate speaking in the browser | Agent Test Console | Live model session |
| `scripted_replay` | A stored scenario (S1 to S14 in `06-mock-data-and-states.md`) replayed turn by turn through the **real** event, analysis, policy, action, and review pipeline | **Default for campaign demos** and CI. Deterministic and free of live-voice cost | Analysis call only |
| `simulated_persona` | A second AI voice playing a lead persona | Stretch goal for a fully live autonomous demo | Two live sessions per call |
| `phone` | A real person on a real number | Production, requires a compliant carrier | Telephony plus live session |

Make `scripted_replay` the first thing that works end to end. It is what makes the acceptance script in `FRONTEND_SPEC.md` §2.5 passable without a phone carrier.

---

## 8. Analysis pipeline, policy, and actions

1. `voice-events` receives `call.ended`, stores the call result, and inserts an `analysis` job. It also nudges `job-runner` immediately using `EdgeRuntime.waitUntil` so the user does not wait for the next cron tick.
2. `analysis-run` claims the job and loads the transcript, agent version, campaign criteria, lead time zone, and call start time.
3. It calls an `AnalysisProvider`:
   - `HttpAnalysisProvider`: `POST` to the Resonology AI service (`AI_SERVICE_URL`), signed with HMAC, timeout and retry per `voice_and_ai_service.md`.
   - `InlineGeminiProvider`: calls the Gemini text model directly from the function with a response schema. Use it until the AI service exists, and as a fallback behind a feature flag.
4. Validate the result against `ConversationAnalysisSchema`. **Reject** claims that cite unknown segment ids or have no evidence where evidence is required. A schema failure marks `analysis_status = failed`, creates a review item (`failed_action`), and notifies; it never half-applies.
5. Store `conversation_analyses`, `decisions`, `evidence`. Run the **policy engine** (`_shared/policy`, pure functions, rules in `04` §3). Output per decision: `auto_apply | needs_review | blocked` with reason codes.
6. For `auto_apply`, create `action_attempts` with idempotency key `hash(decisionId, type, params)` and run the executor. Each executor (`_shared/actions/*`) is idempotent, records success or failure, and on failure schedules a retry with backoff and creates a review item after the last attempt.
7. For `needs_review`, create `review_items` and notifications. Nothing is changed on the lead until a human resolves it.
8. `confirm_appointment` can only succeed if `CalendarProvider.createEvent()` returns success. Until then the appointment stays `proposed`.
9. Emit outbound webhook jobs (`call.analysis_ready`, `lead.qualified`, `appointment.*`).

The model's `confidence` is stored as `model_confidence` and displayed as uncalibrated. Never name a column `accuracy` for it. Measured accuracy is computed only from `human_corrections` and reviewed decisions.

**Prompt injection:** transcripts are untrusted. The AI output is data, validated by schema, and can only propose actions from a fixed allow-list. Nothing the lead says can change policy, permissions, or tool access.

---

## 9. Seeds, local development, and types

- `supabase start` for the local stack (needs Docker). `supabase db reset` rebuilds from migrations and `seed.sql`.
- `scripts/seed-demo.ts` creates the demo orgs ("Sharma Realty Services", "Bright Path Academy"), users for each role, 120 leads, agents, campaigns, scenario calls S1 to S14, decisions, evidence, review items, appointments, and tasks. It uses the **same scenario definitions** as the frontend mock seeds (`06-mock-data-and-states.md`) so the demo looks identical in mock and API mode. Generate dates relative to "today". Use fake numbers and `example.com` addresses only.
- `scripts/gen-types.sh` runs `supabase gen types typescript --local` into the shared types file.
- Never run destructive SQL against the hosted production project. All schema changes go through migrations applied by CI.

---

## 10. Phases

Each phase ends with: migrations applied locally, pgTAP and Deno tests green, `supabase db lint` clean, the matching frontend domain switched to the real API with its Playwright test green, and `docs/backend_update.md` §4.4 and §5.4 ticked off.

| Phase | Deliverable | Frontend domain switched |
|---|---|---|
| **B0 Audit** | Read `supabase/`, `database/`, `backend/`, `docker-compose.yml`, `deployment/`. Write `docs/backend/AUDIT.md`: what exists, what is reusable, conflicts with this plan, what moves where. Show it before changing anything. Check `config.toml`, current migrations, linked project ref | none |
| **B1 Foundation** | §4.2 migration, `create_organization`, profiles trigger, `api` skeleton (auth, org, errors, idempotency, audit, CORS), `GET /v1/me`, pgTAP tenancy tests, CI | auth, org, team, settings shell |
| **B2 Leads** | Leads tables, imports, scrub stub, segments, notes, CSV import job, full-text and trigram search | leads |
| **B3 Agents** | Agents, versions, publish validation, knowledge documents, `test-session` endpoint (mints a LiveKit token; works with a stub worker) | agents (test console in stub mode) |
| **B4 Campaigns and compliance** | Campaigns, preflight, `launch_campaign`, compliance settings, suppression, `dialer-tick` with `scripted_replay` dispatch | campaigns, compliance |
| **B5 Calls** | `calls`, `transcript_segments`, `voice-events`, `voice-tools`, Storage for recordings, Realtime publication | calls list, live calls, call detail |
| **B6 Intelligence** | `AnalysisProvider` (inline Gemini first), policy engine, action executors, review items and `resolve_review_item`, notifications | review queue, call decisions and ledger |
| **B7 Scheduling** | Availability, internal `CalendarProvider`, exclusion constraint, `confirm_appointment`, tasks, follow-up creation | appointments, follow-ups |
| **B8 Analytics and platform** | Dashboard and insights SQL functions, usage metering, audit log endpoints, API keys, webhooks with signed delivery and deliveries log, usage and billing endpoints | dashboard, insights, audit, settings |
| **B9 Hardening** | RLS test sweep across every table and role, Security and Performance advisors, load test of `api` list endpoints with seeded data, secrets rotation check, backup and restore drill, demo rehearsal | all |

### Prompts to give the agent

> **B0:** Read `AGENTS.md`, `docs/backend_update.md`, `docs/engineering_standards.md`. Do §10 B0 only. Do not modify or delete anything. Produce `docs/backend/AUDIT.md` and stop.

> **B1 to B8 (one phase per session):** Read `AGENTS.md`, `docs/backend_update.md`, `docs/security_and_privacy.md`, and the contract files named in the phase. Do only phase **Bn**. Write migrations first, then pgTAP tests, then functions, then run `supabase db reset`, the tests, and `supabase db lint`. Update the contract and the frontend mock in the same PR if you change a shape. Summarize done versus stubbed and append decisions to `docs/frontend/DECISIONS.md` or `docs/adr/`.

---

## 11. Do-not list (backend)

- Do not expose the service role key, the Gemini key, the LiveKit secret, or any HMAC secret to the browser or commit them.
- Do not disable RLS, add `using (true)` policies, or grant table privileges to `anon`.
- Do not edit an applied migration. Do not run `supabase db reset` against a linked remote project.
- Do not return raw database rows from `api`. Do not skip audit entries for mutations.
- Do not let an AI output change a lead, appointment, or setting without going through the policy engine and the action ledger.
- Do not build long-running or streaming work inside an Edge Function request. Use jobs.
- Do not store plaintext webhook secrets or API keys in ordinary columns. Store hashes (API keys) and Vault references (signing secrets).
- Do not call real phone numbers from development or CI. Use `scripted_replay` and the web demo channel.
