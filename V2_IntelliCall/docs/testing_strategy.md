# testing_strategy.md

Goal: every promise in the specs is checked by something that runs without a phone, a human, or a paid call. A feature is not done until its checks run in CI.

---

## 1. Layers

| Layer | Tool | Where | What it proves |
|---|---|---|---|
| Unit (frontend) | Vitest | `frontend/src/**/*.test.ts(x)` | `lib/format`, `lib/permissions`, `lib/metrics`, hooks with the mock client, pattern components |
| Contract | Vitest + Zod | `frontend/src/contracts/*.test.ts`, `scripts/check-contracts.ts` | Every mock payload parses against its schema; frontend and backend contract copies are identical; Postgres enums equal `contracts/enums.ts` |
| Database | pgTAP via `supabase test db` | `supabase/tests/*.sql` | RLS per table and role, constraints, state transitions, RPC behavior, metric functions, service-only functions not callable by users |
| Function unit | `deno test` | `supabase/functions/**/*_test.ts` | Policy engine, action executors, calendar provider, HMAC verification, idempotency, mappers |
| Function integration | `deno test` against `supabase functions serve` + local DB | `supabase/functions/**/*.integration_test.ts` | `api` routes end to end with real RLS, standard envelope, errors, pagination, PII masking |
| Python | `pytest` | `backend/*/tests` | Request signing, tool clients, analysis schema validation, evidence verification, replay mode |
| End to end | Playwright | `frontend/e2e`, `tests/` | The acceptance script from `FRONTEND_SPEC.md` §2.5 in mock mode, then in API mode against local Supabase and the replay worker |
| Accessibility | `axe` inside Playwright | `frontend/e2e` | No serious violations on each main route, light and dark |
| Visual | Playwright screenshots | `frontend/e2e/visual` | Nine reference screens stay close to `docs/frontend/reference/screens/*.png` (manual review, not pixel diff gates) |
| AI evaluation | Offline harness | `backend/resonology-ai/eval` | Extraction and qualification quality on labelled calls, baseline vs evidence-grounded (see `voice_and_ai_service.md`) |

---

## 2. Things that must have tests (non-negotiable)

1. **Tenant isolation** on every tenant table, for each role, for select, insert, update, delete.
2. **Policy engine** (`_shared/policy`): every reason code in `docs/frontend/04-data-model-and-metrics.md` §3 (missing evidence, below threshold, always-review, conflicting evidence, ambiguous time, auto-apply).
3. **Proposed vs confirmed:** an appointment becomes `confirmed` only through provider success; a booking failure leaves it `proposed` or `booking_failed` and creates a review item.
4. **Metrics:** a fixture with retries, voicemail, blocked calls, a proposed appointment, and unreviewed decisions proves attempts ≠ unique leads, proposed ≠ confirmed, and that model confidence is never reported as accuracy.
5. **Dialer eligibility:** DND, no consent, suppressed, outside window (in IST), max attempts, retry gap, concurrency, budget cap, and re-check at dial time.
6. **Idempotency:** replaying the same `Idempotency-Key` returns the stored response; replaying the same provider event id does nothing.
7. **HMAC and replay:** wrong signature, old timestamp, and reused event id are rejected.
8. **Evidence integrity:** an analysis that cites an unknown segment id, or a quote that is not in the cited segment, is rejected and creates a review item.
9. **Prompt injection fixture:** a transcript that tries to change permissions or call a forbidden tool produces no forbidden action.
10. **Do-not-call flow:** a "don't call me again" transcript suppresses the lead, cancels queued calls, and writes audit entries.
11. **Permissions in the UI:** each role against each nav item and primary action (generated from the RBAC matrix).
12. **PII masking:** viewer role never receives an unmasked phone or email from `api`.

---

## 3. Fixtures and data

- One set of **scenario definitions S1 to S14** (`docs/frontend/06-mock-data-and-states.md` §3) drives: frontend mock seeds, `scripts/seed-demo.ts`, replay scenarios for the worker, Playwright assertions, and AI evaluation examples. Keep them in one machine-readable file (for example `scripts/scenarios/*.json`) and generate the others from it.
- Factories (`frontend/src/test/factories`, `supabase/functions/_shared/test/factories.ts`) create valid objects by contract. Tests override only what they care about.
- Time is injected. Never depend on the real clock; tests use a fixed "now" so IST windows and "overdue" are deterministic.
- Fake data only: `+91 90000 000xx` numbers and `example.com` emails.

---

## 4. End-to-end flows

**Acceptance script** (spec §2.5), run in two modes:
1. **Mock mode:** `VITE_DATA_SOURCE=mock`. Fast, no services. Runs on every PR.
2. **API mode:** local Supabase, seeded data, the voice worker in replay mode. Runs on every PR once B5 is done, and nightly.

Additional flows: login and role switching; import with invalid, duplicate, and DND rows; agent publish blocked without disclosure; campaign preflight failure then fix; review resolve with correction; booking failure then retry; org switch clears caches; realtime disconnect banner and refetch.

---

## 5. CI gates

A PR merges only when these pass (details in `deployment_and_ci.md`):
- Frontend: lint, typecheck, unit, build.
- Contracts: drift check.
- Supabase: `supabase db lint`, `supabase test db`.
- Functions: `deno fmt --check`, `deno lint`, `deno test`.
- Python (if changed): `ruff`, type check, `pytest`.
- Playwright smoke (mock mode).
- Secret scan.

---

## 6. Manual checks before any demo

1. Run the acceptance script on the **production** project with demo data, from a clean browser profile.
2. Test microphone permission, a headset, and the venue network (WebRTC needs UDP; have a fallback plan).
3. Confirm the Gemini key is billing-enabled and has headroom; confirm LiveKit plan limits for the expected minutes.
4. Switch the demo to `scripted_replay` if live voice misbehaves; keep a recorded screen capture as the last fallback.
5. Check Hindi lines in transcripts with a Hindi speaker.
6. Verify no real personal data appears on screen.
