# voice_and_ai_service.md

The two Python services next to Supabase. Contracts are defined once in `frontend/src/contracts` and exported as JSON Schema by `scripts/export-json-schema.ts`. Do not hand-write second copies. Check current LiveKit Agents and Gemini Live docs for exact API names before coding; they change quickly.

---

## 1. Voice worker (`backend/voice-agent`)

**Job:** run one agent session per call: speak to the lead (or the web demo participant), use tools, stream events to the platform.

### 1.1 Lifecycle
1. `dialer-tick` (or `api` test-session) creates a `calls` row and dispatches a job to the worker with `call_id`, `agent_version_id`, `lead_mode`, `language`.
2. Worker fetches the call context (agent prompt, knowledge, guardrails, lead fields it may use) from the platform with a signed request. It never reads the database directly.
3. Worker joins the room, **speaks the mandatory disclosure line itself**, then (if recording) the recording notice, then starts the conversation.
4. Worker sends events (§1.2) and handles tool calls (§1.3).
5. On end, worker sends `call.ended` with the reason, uploads the recording if enabled, and exits.

### 1.2 Events to `voice-events` (HMAC signed, idempotent by `event_id`)
`call.dispatched`, `call.ringing`, `call.answered`, `call.disclosure_played`, `transcript.segment` (speaker, text, language, start/end ms, segment id), `tool.called`, `tool.result`, `call.ended` (reason: completed, no_answer, voicemail, failed, hung_up, timeout, blocked), `error`. Payload shapes live in `contracts/voice.ts`.

### 1.3 Tools to `voice-tools` (HMAC signed)
Allow-listed, validated, and permission-checked per call:
`get_available_slots`, `propose_appointment`, `schedule_callback`, `mark_do_not_call`, `lookup_faq`, `transfer_to_human` (roadmap), `end_call`.
Tools return small structured results. A tool failure is spoken as a graceful fallback and logged. **The worker cannot confirm an appointment**; it can only propose one, and the platform decides.

### 1.4 Lead modes (`calls.lead_mode`)
| Mode | Behavior | Use |
|---|---|---|
| `human_in_browser` | A person speaks in the browser | Live demo, agent testing |
| `scripted_replay` | Worker plays a scripted lead (text-to-speech or injected text) from a scenario file | Campaign demos, CI, load checks. **Default for campaigns without phones** |
| `simulated_persona` | A second model plays the lead from a persona prompt | Exploratory testing only; non-deterministic |
| `phone` | Real PSTN via SIP | Only after telephony and compliance are cleared |

Scenario files come from `scripts/scenarios/*.json` (S1 to S14) so seeds, replay, tests and AI evaluation share one source.

### 1.5 Session limits and failure handling
- Live audio sessions have time limits; the worker enforces a hard maximum call duration below the provider limit, says a graceful closing line, and ends.
- Handle disconnects: retry the model session once; if it fails, end with reason `failed` and let the dialer's retry policy decide.
- Detect voicemail and silence; end quickly and record the reason.
- Barge-in and interruption handling use the framework's turn detection. Test with Hindi and English.
- No transcript text at INFO logs.

### 1.6 Voice and language
Voice name, language (`hi-IN`, `en-IN`), and speaking style come from the agent version. Mixed Hindi-English speech is common; transcripts keep the original script (Devanagari or Latin) and tag the segment language. Validate Hindi quality with a Hindi speaker before any demo.

---

## 2. Resonology AI service (`backend/resonology-ai`)

**Job:** turn a finished transcript into a validated `ConversationAnalysis`. It does not write to the database and does not take actions.

### 2.1 API
`POST /v1/analyze` (HMAC signed) with the call, transcript segments (ids, speaker, text, language), agent and campaign context (qualification criteria, allowed actions, language), and `analysis_version`.
Returns `ConversationAnalysis`: outcome, summary, extracted facts, qualification (status, **model confidence labelled uncalibrated**), proposed actions with parameters, objections, sentiment, and **evidence** (segment ids plus quote) for every derived value.
`GET /healthz`, `GET /v1/version` (model, prompt version, schema version).

### 2.2 Implementation
- Gemini **text** call with structured output (JSON schema) because the live audio API does not return structured JSON. Pin the model name in config.
- Prompts are files in the repo, versioned (`prompts/analysis/v1.md`) and the version is returned with every result.
- Validate the model output against the schema; on failure retry once with the validation error; then return a typed failure so the platform creates a review item.
- Mark any fact without valid evidence as unsupported. Never invent evidence.
- Treat transcript text as untrusted data inside the prompt (delimit it; instruct the model to ignore instructions within it). The platform still enforces the allow-list and policy engine.

### 2.3 Platform side (`analysis-run`)
Provider interface `AnalysisProvider` with `HttpAnalysisProvider` (this service) and `InlineGeminiProvider` (fallback so the demo works if this service is down). The function then: re-verifies evidence quotes against the transcript, stores the analysis, runs the **policy engine**, executes auto-allowed actions through the **action ledger**, and creates review items for the rest.

---

## 3. Prompt and model management

- Prompts live in git, change by PR, and have an evaluation run attached to the PR.
- Store with each analysis: model name, prompt version, schema version, latency, token counts.
- Changing a model name or prompt version is a release event, not a config tweak.

---

## 4. Evaluation harness (`backend/resonology-ai/eval`)

- Labelled set: transcripts with expected outcome, facts, and appointment intent, covering S1 to S14, Hindi, English and mixed speech, objections, ambiguous times, do-not-call requests, voicemail, and prompt-injection attempts.
- Metrics: outcome accuracy, fact extraction precision and recall, evidence validity rate, false auto-action rate (must be zero in the fixtures), latency, cost per call.
- Report model confidence against actual correctness as a calibration chart. Until calibrated, the UI says "uncalibrated".
- Run on every prompt or model change; keep the last results in `eval/results/` as small summary files.

---

## 5. Local development

`docker compose up voice-agent resonology-ai` with Supabase running through its CLI. Replay mode needs no microphone and no paid calls. Use fake data only with any free-tier key.
