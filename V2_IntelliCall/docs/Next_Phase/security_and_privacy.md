# security_and_privacy.md

**Audience:** everyone who writes code, configures infrastructure, or demos the product.
**Scope:** the Supabase backend, the frontend, the voice worker, the AI service, and the demo.
**Not legal advice.** Calling and personal-data rules in India change. Have a lawyer or qualified compliance person review the product before real customers or real calls.

---

## 1. What we protect

| Class | Examples | Where it lives | Handling |
|---|---|---|---|
| Secrets | Supabase service key, Gemini key, LiveKit secret, HMAC secrets, webhook signing secrets, API keys | Edge Function secrets, Vault, worker environment | Never in the browser, git, logs, or docs |
| Personal data | Lead name, phone, email, city, company, consent records | `leads`, `lead_imports` | RLS per org, masked for roles without `pii.read`, deletable on request |
| Conversation data | Transcripts, recordings, summaries, extracted facts | `transcript_segments`, Storage `recordings`, `conversation_analyses` | Private buckets, signed URLs, retention policy, not in logs |
| Business data | Campaigns, agent scripts, pricing statements | Postgres | RLS per org |
| Operational data | Audit log, usage, job queue | Postgres | Append-only audit, no PII in job payloads beyond ids |

---

## 2. Identity, org isolation, and roles

1. **Supabase Auth** handles sign-up, login, sessions. Enforce email verification before an organization can launch a campaign.
2. **Three layers of access control**, all required:
   - Edge Function `api` checks the JWT, the `X-Org-Id` membership, and the permission for the route.
   - **RLS** on every table restricts rows to the caller's organizations and roles. `api` uses the caller's JWT so RLS applies even if application code has a bug.
   - The frontend hides or disables controls using the same permission keys (convenience only, never security).
3. **Roles** and the matrix are in `docs/frontend/04-data-model-and-metrics.md` §5. The server is the authority.
4. **Service role** is for system functions only (`voice-events`, `voice-tools`, `analysis-run`, `dialer-tick`, `job-runner`). It bypasses RLS, so each use is reviewed and commented.
5. **Admin and owner actions** (role change, API key creation, integration changes, data export, re-run analysis, org delete) always write an audit entry.
6. **Tenant isolation tests** are mandatory: a pgTAP test that proves user A in org 1 cannot select, insert, update, or delete rows of org 2 on every tenant table, for every role.

---

## 3. Secrets

- Secrets are set with `supabase secrets set` for Edge Functions, GitHub Actions secrets for CI, and the host's secret store for the worker and AI service. Per-endpoint webhook signing secrets and the cron secret go in **Vault**.
- The browser receives only public configuration (Supabase URL and public key, API base URL, LiveKit URL).
- **If a secret is ever committed or shared:** rotate it first, then remove it from history, then tell the team. Rotation order: Supabase keys, Gemini key, LiveKit key, HMAC secrets.
- The root `.env` exists and holds real keys. It must be listed in `.gitignore`, must never have been committed (verify with `git log --all --oneline -- .env`, which does not print contents), and must never be read into chat, logs, or docs.
- API keys issued to customers are shown once, stored as a hash plus a short prefix, and revocable.
- Rotate on a schedule and whenever someone leaves the team.

---

## 4. Service-to-service authentication

| Path | Method |
|---|---|
| Browser → `api` | User JWT + `X-Org-Id` |
| Voice worker → `voice-events`, `voice-tools` | HMAC-SHA256 over `timestamp + "." + body` with `X-Timestamp` and `X-Signature`; reject if the timestamp is more than 5 minutes off; dedupe by event id |
| `analysis-run` → AI service | Same HMAC scheme with a different secret |
| pg_cron → functions | Header secret from Vault, compared in constant time |
| Platform → customer webhooks | `X-IntelliCall-Signature` HMAC over the body with the endpoint's secret, plus a timestamp, retries with backoff |

Use constant-time comparison for every signature or secret check.

---

## 5. Input handling

- **Validate everything** at the edge: body, query, headers, and uploaded files, with the Zod contracts. Reject unknown fields.
- **Uploads (CSV, documents):** enforce size and type limits server-side, process in a job, never execute or render uploaded content. Store in private buckets.
- **CSV injection:** when exporting CSV, prefix any cell that starts with `=`, `+`, `-`, or `@` with a single quote.
- **Webhook URLs (customer-supplied):** only `https`, resolve the host and **block private, loopback, link-local, and metadata IP ranges** before every delivery (SSRF). Do not follow redirects blindly.
- **SQL:** use parameterized queries and RPC. No string-built SQL in functions.
- **Output:** the frontend renders transcript and lead text as text, never as HTML.

---

## 6. Calls, consent, and compliance (India first)

These are product requirements, not suggestions. Rules change, so verify current TRAI and DLT requirements before any real calling.

- **Disclosure:** every call begins with a fixed, non-optional line saying the caller is an automated assistant, in the call language. Enforce it in the worker (it speaks the line itself), not only in the prompt. Agents cannot be published without it.
- **Consent and DND:** the dialer must exclude leads that are on the DND registry, have no consent record, are suppressed, or are outside the allowed window. Re-check at dial time. Record every block in `compliance_blocks`.
- **Do-not-call requests:** if a lead asks not to be called, the agent calls `mark_do_not_call`, the lead is suppressed immediately, queued calls are cancelled, and the audit log records it.
- **Recording notice:** if recording is on, the notice plays after the disclosure.
- **Calling window:** default 09:00 to 21:00 IST, editable, enforced server-side. This default is **unverified** against current rules.
- **Telephony:** do not place real calls to real numbers until the number series, entity registration, and consent process have been confirmed with the carrier and counsel. Development, CI, and demos use the web demo channel with `scripted_replay` or a teammate.
- **Personal data law:** India's Digital Personal Data Protection Act, 2023 and its rules apply to processing personal data. Build for notice, purpose limitation, access, correction, and deletion (see §9) and have counsel confirm obligations.

---

## 7. AI-specific risks

- **Prompt injection:** a lead may say anything. Transcripts and uploaded knowledge are untrusted text. Rules:
  - The AI returns **data** that must pass `ConversationAnalysisSchema`; it cannot execute anything.
  - Actions come from a fixed allow-list (`ActionType`) and go through the policy engine and the action ledger.
  - Nothing in a transcript can change permissions, thresholds, tools, or system prompts.
  - Quoted evidence must actually appear in the cited segments; the platform re-verifies.
- **Hallucinated facts on a live call:** the agent may only state approved knowledge (pricing statements, FAQs). Guardrails list forbidden claims. When unsure it says it will confirm and creates a follow-up.
- **Provider data terms:** free or unpaid tiers of some AI APIs may allow the provider to use submitted content to improve their products. **Check the current Gemini API terms.** Until confirmed, use only **fake data** on any free-tier key, and use a billing-enabled project with appropriate terms before processing real customer conversations.
- **Cost abuse:** cap call duration, concurrency, and daily spend per org (budget cap) and per platform. A runaway campaign must stop itself.
- **Model changes:** every analysis stores model name, prompt version, and schema version so results are reproducible and comparable.

---

## 8. Logging, monitoring, and abuse controls

- Structured logs with request IDs. No tokens, phone numbers, emails, transcripts, or signed URLs in logs.
- Alerts (even if just email at first) for: spike in 401/403, failed jobs reaching `dead`, provider outage, budget cap reached, analysis failure rate above a threshold, webhook delivery failures.
- Rate limits on login-adjacent flows, imports, exports, test sessions, and re-run analysis.
- Keep Supabase **Security Advisor** clean before each release.

---

## 9. Retention, export, and deletion

- Defaults (editable by org admins): recordings 30 days, transcripts and analyses 12 months, audit log 24 months, job and event tables 30 days. A daily cleanup job enforces them.
- **Lead deletion request:** a documented procedure that removes or anonymizes the lead, their transcripts, recordings, and extracted facts, keeps a minimal audit record that a deletion happened, and cascades to Storage.
- **Data export** per org (admin only) is a background job producing a signed, expiring download.
- Backups follow the Supabase plan; document what exists and how to restore, and test a restore before demo day.

---

## 10. Incident basics

1. Contain: revoke or rotate affected keys, pause campaigns (`Pause all` action), disable the affected function if needed.
2. Preserve: do not delete logs; export the audit log for the period.
3. Assess: which orgs and which data classes.
4. Notify: the team lead immediately; affected customers and authorities as counsel advises.
5. Learn: write an ADR or a short post-incident note and add a test.

---

## 11. Pre-release security checklist

- [ ] `git log --all --oneline -- .env` is empty and `.env` is in `.gitignore`
- [ ] No secret strings in the repo (run a secret scanner in CI)
- [ ] Every table: RLS enabled, policies tested per role, no `anon` grants
- [ ] pgTAP isolation tests pass for all tenant tables
- [ ] Service-only functions (`claim_jobs`, internal RPCs) are not callable by `authenticated` (tested)
- [ ] Every Edge Function has one of: user JWT, HMAC, cron secret, verified in a test
- [ ] CORS limited to known origins
- [ ] Storage buckets private; signed URLs expire
- [ ] Webhook delivery blocks private IP ranges
- [ ] CSV export neutralizes formulas
- [ ] Disclosure line enforced in the worker; DND, consent, window checks run at dial time
- [ ] AI outputs validated; evidence quotes verified; no action bypasses the policy engine
- [ ] Budget caps and call duration limits active
- [ ] Gemini data terms confirmed for the key used; fake data only on free tiers
- [ ] Security and Performance advisors reviewed
