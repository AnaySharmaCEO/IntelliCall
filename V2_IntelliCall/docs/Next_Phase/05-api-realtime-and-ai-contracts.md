# 05: API, Realtime, Voice Flow and AI Contracts

This file is what the backend (Vishal Kumar) and AI (Shubham) build against, and what the mock layer imitates.

## 1. Conventions

- Base: `/api/v1`. JSON. Auth: `Authorization: Bearer <Supabase JWT>`; org context via `X-Org-Id` header (validated against membership).
- Mutations send `Idempotency-Key` (UUID); replays return the original result with header `Idempotent-Replay: true`.
- List envelope: `{ data: T[], page: { cursor?: string, nextCursor?: string, pageSize, total?: number } }`.
- Query params: `q`, `sort=field:asc|desc[,field2:...]`, `pageSize`, `cursor`, `filter[field]=value` (repeat for multi), `from`, `to` (ISO).
- Errors: `{ error: { code, message, details?: [{field, message}], requestId } }` with matching HTTP status.
- All responses validate against `src/contracts/*` in dev/test; reject unknown enum values loudly.

## 2. REST endpoints (MVP)

**Auth & org:** `POST /auth/*` handled by Supabase; `GET /me` · `GET /orgs` · `POST /orgs` · `GET/PATCH /orgs/current` · `GET /orgs/current/members` · `POST /orgs/current/invites` · `PATCH/DELETE /orgs/current/members/:id`

**Leads:** `GET /leads` · `POST /leads` · `GET/PATCH/DELETE /leads/:id` · `GET /leads/:id/timeline` · `GET /leads/:id/calls` · `POST /leads/bulk` (stage/owner/tags/dnc/add-to-campaign) · `POST /leads/imports` (multipart, returns task) · `GET /leads/imports/:id` (progress, row errors) · `POST /leads/imports/:id/confirm` · `GET /segments` · `POST /segments`

**Campaigns:** `GET/POST /campaigns` · `GET/PATCH/DELETE /campaigns/:id` · `POST /campaigns/:id/preflight` · `POST /campaigns/:id/launch|pause|resume|stop` · `GET /campaigns/:id/leads` · `GET /campaigns/:id/summary` · `GET /campaigns/:id/insights` · `GET /campaigns/:id/failures` · `POST /campaigns/:id/leads` (add) · `POST /campaigns/:id/leads/:leadId/retry|skip`

**Calls:** `GET /calls` (supports `q` over transcripts) · `GET /calls/:id` · `GET /calls/:id/transcript` · `GET /calls/:id/analysis` · `GET /calls/:id/actions` · `GET /calls/:id/audit` · `GET /calls/:id/recording` (signed URL) · `POST /calls/:id/rerun-analysis` · `POST /calls/:id/stop` · `POST /calls/:id/flag` · `GET /calls/live` (current live set)

**Decisions, actions, review:** `PATCH /decisions/:id` (human correction → creates HumanCorrection) · `POST /actions/:id/retry` · `GET /review` · `GET /review/:id` · `POST /review/:id/resolve` `{ kind: approved|corrected|rejected, correction?, note? }` · `POST /review/:id/assign`

**Agents:** `GET/POST /agents` · `GET/PATCH/DELETE /agents/:id` · `GET /agents/:id/versions` · `GET /agents/:id/versions/:v` · `POST /agents/:id/publish` · `POST /agents/:id/rollback` · `POST /agents/:id/test-session` → `{ roomName, token, livekitUrl, expiresAt }` · `POST /agents/:id/knowledge/documents` (upload)

**Appointments & tasks:** `GET/POST /appointments` · `GET/PATCH /appointments/:id` · `POST /appointments/:id/confirm|reschedule|cancel` · `GET /availability` · `PUT /availability` · `GET /calendar/providers` · `GET/POST /tasks` · `PATCH /tasks/:id` · `POST /tasks/:id/complete`

**Insights & dashboard:** `GET /dashboard/summary` · `GET /dashboard/funnel` · `GET /dashboard/trends` · `GET /insights/objections` · `GET /insights/objections/:category/evidence` · `GET /insights/intents` · `GET /insights/script-performance` · `GET /insights/timing` · `GET /insights/quality` · `GET /metrics/definitions`

**Compliance:** `GET /compliance/overview` · `GET /compliance/leads` · `POST /compliance/scrub` · `GET/PUT /compliance/rules` · `GET/POST/DELETE /compliance/suppression` · `GET /compliance/blocked-attempts`

**Platform:** `GET /notifications` · `POST /notifications/:id/read` · `GET /audit-logs` · `GET/POST/DELETE /api-keys` · `GET/POST/PATCH/DELETE /webhooks` · `GET /webhooks/:id/deliveries` · `GET /usage` · `GET /system/status` · `GET /search?q=` · `GET /tasks/background` · `POST /exports`

**Webhooks in (from voice worker / AI service to Business API):** `POST /internal/voice/events` · `POST /internal/analysis/result` · `POST /internal/provider/callback` (signed, idempotent; never called from the browser).

## 3. Realtime

Single interface `RealtimeClient.subscribe(channel, handler) → unsubscribe`. Transport is an implementation detail (Supabase Realtime on tables, or SSE/WebSocket from the Business API). Events are the contract:

| Channel | Event | Payload (abridged) |
|---|---|---|
| `org:{id}:calls` | `call.created` `call.status_changed` `call.ended` `call.analysis_status_changed` | `{ callId, status, at, ...changed fields }` |
| `call:{id}:transcript` | `transcript.segment` (interim and final), `transcript.reset` | `TranscriptSegment` (+ `isFinal`) |
| `call:{id}:activity` | `activity.tool_call`, `activity.signal` (provisional), `activity.compliance`, `activity.latency` | `{ at, label, detail?, provisional? }` |
| `org:{id}:review` | `review.created` `review.updated` | `ReviewItem` |
| `org:{id}:campaigns` | `campaign.status_changed` `campaign.progress` | `{ campaignId, status, attempted, connected, completed }` |
| `org:{id}:notifications` | `notification.created` | `Notification` |
| `org:{id}:appointments` | `appointment.updated` | `Appointment` |
| `org:{id}:system` | `provider.status_changed` | `{ provider, status, at }` |
| `org:{id}:tasks` | `task.background.updated` | `{ taskId, kind, progress, status }` |

UI behaviour: on reconnect, refetch affected queries (don't trust missed events); show the connection banner after > 5 s disconnect; dedupe by `(entityId, version/at)`.

## 4. Voice session (browser test call) contract

```
Browser                     Business API              LiveKit Cloud           Voice worker (Python)        Gemini Live
  │ POST /agents/:id/test-session ─▶│ create room, dispatch agent job, mint token │                              │
  │◀── { roomName, token, url } ────│                                             │                              │
  │ livekit-client connect(url, token) ─────────────────────────────────────────▶ │ ── agent joins ─────────────▶│
  │ mic audio ──────────────────────────────────────────────────────────────────▶ │ ── audio ───────────────────▶│
  │◀──────────── agent audio ◀──────────────────────────────────────────────────── │ ◀──── speech + transcript ───│
  │◀──── data channel: transcript segments, activity events, latency ──────────── │                              │
  │ end ───────────────────────────────────────────────────────────────────────▶  │ → writes call + segments → emits analysis job
```

`VoiceSessionClient` interface (frontend):

```ts
interface VoiceSessionClient {
  start(opts: { agentId: string; language: Lang; leadId?: string; dryRun: boolean }): Promise<SessionHandle>;
}
interface SessionHandle {
  state$: Observable<"connecting"|"live"|"ended"|"error">;
  micLevel$: Observable<number>; agentLevel$: Observable<number>;
  transcript$: Observable<TranscriptSegment>;
  activity$: Observable<ActivityEvent>;
  latency$: Observable<{ turn: number; ms: number }>;
  mute(on: boolean): void; end(): Promise<{ callId?: string }>;
}
```
`dryRun: true` means: transcript and analysis are produced but **no production lead/stage/appointment is mutated**; result is shown in the Test Console as "would-have" decisions.

PSTN campaign calls do not involve the browser at all: the Business API's dialer places calls via the voice worker/SIP trunk and the browser only observes via realtime events.

Voice worker responsibilities (for reference): join room/call, enforce agent persona, speak the AI-disclosure line first, handle interruption and silence, call Business API tools (`check_availability`, `propose_appointment`, `mark_do_not_call`, `end_call`) with idempotency keys, persist final transcript segments, capture provider metadata, emit events. Gemini Live sessions have a documented audio-only limit of about 15 minutes, so the worker must handle session resumption or end gracefully before that.

## 5. AI output contract: `ConversationAnalysisSchema`

Produced by the Resonology AI service (Gemini **text** model with response schema) from the final transcript + agent script + campaign criteria. **This is the only structured AI output the UI renders.** Every claim must cite transcript segment ids; the Business API rejects claims with unknown segment ids.

```jsonc
{
  "callId": "uuid",
  "analysisVersion": "2026-10-r1",
  "model": "gemini-…",
  "language": "hi-IN | en-IN | mixed",
  "outcome": "qualified | not_qualified | callback_requested | meeting_proposed | not_interested | wrong_person | voicemail | do_not_call | unclear",
  "intent": { "value": "interested | interested_later | needs_info | not_interested | wrong_person | callback_requested | do_not_call | unclear",
              "confidence": 0.0, "evidence": [{ "segmentIds": ["…"], "quote": "…" }] },
  "summary": [ { "text": "One sentence.", "evidence": [{ "segmentIds": ["…"] }] } ],
  "qualificationAnswers": [ { "questionId": "…", "answer": "…", "normalized": "…", "meetsCriterion": true|false|null,
                              "confidence": 0.0, "evidence": [{ "segmentIds": ["…"], "quote": "…" }] } ],
  "facts": [ { "kind": "need | pain_point | budget | timeline | competitor | other", "text": "…", "confidence": 0.0, "evidence": [ … ] } ],
  "objections": [ { "category": "price | timing | trust | already_has_provider | need_to_consult | not_relevant | competitor | other",
                    "text": "…", "resolved": true|false|null, "evidence": [ … ] } ],
  "questions": [ { "text": "…", "answeredByAgent": true|false, "evidence": [ … ] } ],
  "callback": { "originalPhrase": "next Tuesday after 5", "resolvedStartIso": "2026-10-20T17:00:00+05:30" | null,
                "timezone": "Asia/Kolkata", "ambiguous": true|false, "confidence": 0.0, "evidence": [ … ] } | null,
  "appointment": { "requestedStartIso": "…" | null, "originalPhrase": "…", "ambiguous": true|false, "confidence": 0.0, "evidence": [ … ] } | null,
  "doNotCall": { "requested": true|false, "evidence": [ … ] },
  "escalation": { "needed": true|false, "reason": "…", "evidence": [ … ] },
  "nextBestAction": { "type": "create_follow_up | propose_appointment | update_stage | none", "params": { }, "rationale": "…" },
  "overallConfidence": 0.0,
  "missingInformation": ["questionId", "…"]
}
```

Rules for the AI service:
- Resolve relative dates using the call's start time and the lead's timezone passed in the request; if impossible, set `resolvedStartIso: null` and `ambiguous: true` (this routes to review, never guess).
- Hindi/Hinglish: keep `quote` in the original script; also return `textRoman` per segment when asked (separate transliteration task is fine).
- `confidence` is the model's self-report and is **never** treated as calibrated; calibration happens against reviewed labels (see Insights → AI quality).
- Do not emit actions; emit `nextBestAction` and let the Business API's policy engine decide and execute.

**Evaluation hook (research):** the Business API stores every `analysisVersion` output plus the final human-corrected value so baseline (no evidence) vs evidence-grounded prompts can be compared offline; the frontend exposes the labelled set export in Insights → AI quality.

## 6. Action execution contract (Business API)

`Decision` → policy engine → `ActionAttempt` (with `idempotencyKey = hash(decisionId,type,params)`) → executor → result. Failures create `ReviewItem(type=failed_action)` and notifications; retries use the org's backoff. `confirm_appointment` executes via `CalendarProvider.createEvent()`; only success sets `confirmed`.

```ts
interface CalendarProvider {
  id: "internal" | "google" | "outlook";
  getAvailability(hostId, range): Promise<Slot[]>;
  createEvent(input): Promise<{ providerEventId: string; status: "confirmed" }>;
  updateEvent(id, input): Promise<void>;
  cancelEvent(id): Promise<void>;
}
```

## 7. Outbound webhook events (customers subscribe in Settings → API)

`lead.created` `lead.updated` `lead.stage_changed` `call.started` `call.completed` `call.analysis_ready` `lead.qualified` `appointment.proposed` `appointment.confirmed` `appointment.failed` `task.created` `review.created` `campaign.completed`. Signed with HMAC (`X-IntelliCall-Signature`), retried with backoff, deliveries visible in UI.
