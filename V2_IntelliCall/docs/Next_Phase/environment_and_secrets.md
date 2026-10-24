# environment_and_secrets.md

**Rule zero:** this file lists variable **names and purposes**. It never contains values. Nobody, human or agent, reads, prints, or pastes the contents of `.env`. Use `.env.example` for names.

---

## 1. Environments

| Environment | Supabase | Frontend | Voice worker and AI service | Data |
|---|---|---|---|---|
| **local** | `supabase start` (Docker) | `npm run dev` | `docker compose up` or run directly | Seeded fake data |
| **dev** (shared) | Separate Supabase project | Preview or dev static host | Dev deployment | Fake data only |
| **prod** (demo and real use) | Separate Supabase project | Production static host | Production deployment | Real only after compliance review |

Never point local or dev at the prod project. Keep three sets of secrets. Use different Gemini and LiveKit keys per environment where possible, so a leak is contained.

---

## 2. Variables

Names below follow the legacy Supabase key names (`anon`, `service role`). If your project uses the newer publishable and secret keys, rename consistently across code, CI, and this file.

### 2.1 Browser (public; compiled into the bundle; prefix `VITE_`)

| Name | Purpose |
|---|---|
| `VITE_APP_ENV` | `local`, `dev`, or `prod`. Shows the environment chip |
| `VITE_DATA_SOURCE` | `mock` or `api` |
| `VITE_API_DOMAINS` | Comma list of domains forced to `api` while the rest stay on mock (migration only) |
| `VITE_API_BASE_URL` | `https://<project-ref>.supabase.co/functions/v1/api` (local: from `supabase status`) |
| `VITE_SUPABASE_URL` | Supabase project URL (auth and realtime only) |
| `VITE_SUPABASE_ANON_KEY` | Public anon (or publishable) key. Safe to expose; RLS protects data |
| `VITE_LIVEKIT_URL` | LiveKit server URL for browser test calls |
| `VITE_DEFAULT_TIMEZONE` | Default `Asia/Kolkata` |

**Never** put the service role key, Gemini key, LiveKit secret, or any HMAC secret in a `VITE_` variable. If the frontend bundler is not Vite, use that bundler's public prefix and update this table.

### 2.2 Edge Functions (set with `supabase secrets set`; local file `supabase/functions/.env`, gitignored)

| Name | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | all | Injected automatically by Supabase. Do not set by hand. Check current names in the docs |
| `ALLOWED_ORIGINS` | `api` | Comma list of allowed browser origins (CORS) |
| `VOICE_WORKER_SHARED_SECRET` | `voice-events`, `voice-tools`, `dialer-tick` | HMAC secret shared with the voice worker |
| `AI_SERVICE_URL` | `analysis-run` | Base URL of the Resonology AI service |
| `AI_SERVICE_SHARED_SECRET` | `analysis-run` | HMAC secret shared with the AI service |
| `ANALYSIS_PROVIDER` | `analysis-run` | `http` or `inline_gemini` |
| `GEMINI_API_KEY` | `analysis-run` (inline provider only) | Gemini key for the fallback provider |
| `GEMINI_ANALYSIS_MODEL` | `analysis-run` | Model name for text analysis (pinned, not hard-coded) |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | `api` (test-session), `dialer-tick` | Token minting and dispatch |
| `WORKER_DISPATCH_URL` | `dialer-tick` | Where to dispatch campaign calls to the worker |
| `CRON_SECRET` | cron-called functions | Also stored in Vault for `pg_cron` |
| `APP_ENV`, `LOG_LEVEL` | all | `local/dev/prod`, `debug/info/warn/error` |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | calendar adapter (later) | Google Calendar connection |

### 2.3 Database Vault (not environment variables)

`project_url`, `cron_secret`, per-endpoint webhook signing secrets, and per-org calendar tokens. Read through `vault.decrypted_secrets` inside trusted SQL or service-role code only.

### 2.4 Voice worker (`backend/voice-agent`)

| Name | Purpose |
|---|---|
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Connect and receive jobs |
| `GOOGLE_API_KEY` | Gemini Live API key (the name LiveKit's Google plugin expects) |
| `GEMINI_LIVE_MODEL` | Pinned live model name from current docs |
| `PLATFORM_EVENTS_URL` | URL of the `voice-events` function |
| `PLATFORM_TOOLS_URL` | URL of the `voice-tools` function |
| `VOICE_WORKER_SHARED_SECRET` | HMAC secret (same value as in 2.2) |
| `RECORDING_ENABLED` | `true` or `false` |
| `SIP_OUTBOUND_TRUNK_ID` | Only when PSTN is enabled |

### 2.5 AI service (`backend/resonology-ai`)

| Name | Purpose |
|---|---|
| `GOOGLE_API_KEY` | Gemini key |
| `GEMINI_ANALYSIS_MODEL` | Pinned model name |
| `AI_SERVICE_SHARED_SECRET` | HMAC secret (same value as in 2.2) |
| `ANALYSIS_VERSION` | Prompt and schema version label stored with every result |
| `REQUEST_TIMEOUT_SECONDS` | Upper bound per analysis |

### 2.6 CI and deployment (GitHub Actions secrets)

`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD_DEV`, `SUPABASE_DB_PASSWORD_PROD`, `SUPABASE_PROJECT_REF_DEV`, `SUPABASE_PROJECT_REF_PROD`, and host tokens for the frontend and the worker.

---

## 3. Files and where they live

| File | Committed? | Holds |
|---|---|---|
| `.env.example` | Yes | Names only, with a one-line comment each |
| `.env` | **No** | Real values for local scripts and containers |
| `supabase/functions/.env` | **No** | Real values for local function serving |
| `frontend/.env.local` | **No** | Local overrides for browser variables |
| `frontend/.env.example` | Yes | Browser variable names only |

Required `.gitignore` lines:
```
.env
.env.*
!.env.example
**/.env.local
supabase/functions/.env
supabase/.temp/
*.pem
service-account*.json
```

---

## 4. Procedures

**Set up a new machine:** copy `.env.example` to `.env` and fill values from the team's password manager; run `supabase start`; copy the local URL and keys that `supabase status` prints into `frontend/.env.local`; run `npm run dev`.

**Add a variable:** add the name and purpose here and to `.env.example`, add it to the validated config module of the service that uses it (fail at startup if missing), set it in each environment, and mention it in the PR.

**Rotate a secret:** create the new value, set it in the environment, deploy, confirm health, revoke the old value, record the date. For HMAC secrets shared between two services, support both old and new for a short overlap.

**Check that `.env` was never committed** without printing it: `git ls-files .env` should print nothing, and `git log --all --oneline -- .env` should print nothing. If either prints something, follow the incident steps in `docs/security_and_privacy.md`.
