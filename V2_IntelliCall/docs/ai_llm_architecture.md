# ai_llm_architecture.md: AI, LLM Connection, Model Selection & Low-Latency Architecture

**Status:** Binding specification for AI and Voice integration.  
**Audience:** AI developers, backend engineers, and IDE agents.  
**Companion docs:** `voice_and_ai_service.md`, `FRONTEND_SPEC.md`, `backend_update.md`, `implementation.md`.

---

## 0. Executive Summary & Staging Strategy

The AI architecture is intentionally decoupled into two distinct operational tiers:
1. **Tier 1: Real-Time Multimodal Voice Agent (Live Conversation)** — ultra-low latency (<500ms voice turnaround), native Hindi/English speech-to-speech, tool calling, and barge-in handling.
2. **Tier 2: Post-Call Deep Analysis & Extraction (Conversation Intelligence)** — structured JSON extraction with deterministic schema validation (`ConversationAnalysisSchema`), citation-grounded evidence linking, and decision verification.

### Mandatory Staging Rule: "Make Frontend & Backend Ready Before AI"
> [!IMPORTANT]
> **The real AI LLM services are connected in the LATE STAGE of the implementation roadmap.**  
> Before connecting real Gemini APIs and LiveKit voice workers:
> - The database schema (`calls`, `transcript_segments`, `conversation_analyses`, `decisions`, `evidence`, `action_attempts`, `review_items`) must be deployed and verified on Supabase Cloud.
> - The Edge Functions (`voice-events`, `voice-tools`, `analysis-run`) must be functional with mocked payloads and HMAC verification.
> - The frontend UI (evidence chips, waveform playback, transcript viewer with Devanagari/Roman toggle, confidence meters, live monitor, review queue) must be 100% working against the mock/simulator layer.
> - Only once the end-to-end data pipelines and UI surfaces are proven will the live LLM keys and LiveKit agent worker be activated.

---

## 1. Model Selection Matrix

| Function | Primary Model | Provider / Protocol | Input / Output | Justification |
|---|---|---|---|---|
| **Realtime Conversation** | `gemini-2.0-flash-exp` (or current `gemini-2.0-flash-realtime`) | Google Gemini Live API via **LiveKit Agents** (WebSockets / WebRTC) | Bidirectional Audio (PCM 16kHz/24kHz) | Direct speech-to-speech eliminates STT and TTS serialization latency. Natively understands Indian English accents and conversational Hindi (`hi-IN`), respects barge-in, and supports asynchronous function calling. |
| **Post-Call Analysis & Structured JSON** | `gemini-2.0-flash` | Google Gemini API (REST / SDK with `response_schema`) | Text Transcript + Context $\rightarrow$ Strict JSON Schema | Live API does not guarantee strict JSON schema compliance. Gemini 2.0 Flash provides sub-1.5s completion for 10-minute call transcripts, high instruction-following adherence, and native structured outputs. |
| **Edge Function Fallback Analysis** | `gemini-2.0-flash` | Direct HTTPS call from Supabase Edge Function `analysis-run` | Text $\rightarrow$ JSON | Embedded fallback in Deno Edge Function (`InlineGeminiProvider`) ensuring the platform processes calls even if the separate Python AI service container is unreachable. |
| **Tool Calling Mid-Call** | Gemini Live Function Calling | LiveKit Agent $\rightarrow$ Supabase `voice-tools` | Function declarations in Live session | Asynchronous tools for checking calendar availability, proposing appointments, setting callback times, and registering DND suppression. |

---

## 2. Low-Latency Engineering (<500ms Voice Turnaround)

Traditional voice bot pipelines suffer from severe latency accumulation:
$$\text{Latency} = \text{STT} \ (400\text{ms}) + \text{LLM TTFT} \ (800\text{ms}) + \text{TTS First Chunk} \ (600\text{ms}) + \text{Transport} \ (200\text{ms}) \approx 2000\text{ms}-2500\text{ms}$$

IntelliCall collapses this latency stack to **350ms – 550ms** end-to-end using the following architectural optimizations:

```
[ Lead Audio (Browser / PSTN) ]
               │
               ▼ WebRTC (Sub-50ms UDP via LiveKit Cloud / Edge)
[ LiveKit Media Server (Mumbai Region: GCP asia-south1 / AWS ap-south-1) ]
               │
               ▼ Direct Audio Frames
[ LiveKit Python Agent Worker (Colocated) ]
               │
               ▼ Bidirectional WebSocket (PCM Audio Streaming)
[ Google Gemini Live API (Multimodal Speech-to-Speech) ]
```

### 2.1 Direct Audio-to-Audio Streaming (Zero Cascade Overhead)
- The voice agent does not transcribe audio to text, send text to an LLM, and synthesize speech from text.
- Continuous audio frames (PCM 16kHz/24kHz) flow directly from the user's mic to Gemini Live via LiveKit's `livekit-plugins-google`.
- The model outputs native audio chunks directly to the caller, bypassing text-to-speech buffering completely.

### 2.2 Regional Colocation & WebRTC Edge Transport
- **Media Edge:** Audio moves over WebRTC (UDP) with jitter buffering and packet loss concealment, not TCP/HTTP.
- **Region:** Deploy voice worker nodes in **Mumbai** (GCP `asia-south1` or AWS `ap-south-1`), maintaining <25ms network ping to Indian callers.
- **Browser Web Demo:** The frontend connects directly to LiveKit Cloud via `@livekit/components-react`, streaming audio directly to the agent room with sub-40ms browser latency.

### 2.3 Turn Detection & Voice Activity Detection (VAD) Tuning
- LiveKit agents use **Silero VAD** combined with Gemini's server-side endpointing.
- **End-of-speech silence threshold:** Configured to **200ms – 240ms** (conversational sweet spot). A higher threshold (>400ms) causes noticeable awkward silence; a lower threshold (<150ms) cuts off natural speech pauses.
- **Prefix padding:** 100ms audio buffer prepended to captured speech so the initial syllable of words is never clipped.

### 2.4 Instant Interruption & Barge-In Truncation (<50ms)
- When the lead speaks while the agent is talking, LiveKit's client-side / server-side turn detector triggers an instant interruption signal.
- The playback stream is immediately cancelled, audio queues are flushed, and an interruption frame is transmitted to Gemini Live to cease generation.
- Perceptual latency for interruption is <50ms.

### 2.5 Sliding Context Window & Prompt Optimization
- Long conversational history increases Gemini's internal processing time.
- **System Prompt Caching:** Keep the system prompt static and cached; do not dynamically reconstruct system prompts on each turn.
- **Sliding Window:** Keep the system prompt, campaign objectives, FAQs, and the last 10 conversation turns in the active live context. Older turns are summarized into a compact rolling state to maintain consistent time-to-first-audio-chunk.

### 2.6 Speculative Tool Execution
- When an agent is navigating an appointment booking flow, availability slots for the host are speculatively pre-fetched from Supabase `voice-tools` at the moment the intent is first detected, rather than waiting for the user to specify their date/time preference. When the user says "Thursday 4 PM", the verification is instant.

---

## 3. Post-Call Analysis Pipeline & Structured Schema Output

The Live API does not output strict JSON schemas. Therefore, structured business extraction runs immediately post-call:

```
Call Ends (call.ended event from worker)
   │
   ▼
Edge Function `voice-events` marks call ended, enqueues `analysis` job in `public.jobs`
   │
   ▼ (Instant notification via EdgeRuntime.waitUntil)
Edge Function `analysis-run` claims job
   │
   ├─► Calls Resonology AI Service (POST /v1/analyze, HMAC signed)
   │       │
   │       ▼
   │   Gemini 2.0 Flash (`response_schema = ConversationAnalysisSchema`)
   │   Validates evidence segment IDs exist in transcript
   │
   └─► (Fallback: InlineGeminiProvider inside Edge Function if service offline)
   │
   ▼
Store `conversation_analyses`, `decisions`, `evidence`
   │
   ▼
Run Policy Engine (`_shared/policy`) ──► Auto-apply OR create `review_items`
   │
   ▼
Execute Action Attempts (`action_attempts` ledger)
```

### 3.1 Strict Schema Adherence
The output schema is locked to `ConversationAnalysisSchema` (defined in `frontend/src/contracts/analysis.ts` and synced to backend):
- **Outcome classification:** (`qualified`, `not_qualified`, `callback_requested`, `meeting_proposed`, `meeting_booked`, `wrong_contact`, `dnd_requested`, `unclear`).
- **Qualification answers:** Each question from the agent version's script mapped with value, confidence, and supporting evidence quotes.
- **Evidence grounding:** Every derived fact, objection, and decision MUST reference exact `segmentIds` and provide a literal `quote`. If no segment supports a claim, it is flagged as `unsupported`.

### 3.2 Prompt Injection Defense
- Lead speech is untrusted user input.
- In `prompts/analysis/v1.md`, transcripts are passed inside explicit XML demarcation tags (`<untrusted_transcript>...</untrusted_transcript>`).
- The system instructions explicitly enforce that instructions inside the transcript cannot modify policy, change extracted roles, alter thresholds, or grant unauthorized actions.
- The server-side policy engine evaluates decisions against an allow-list; the LLM never directly executes actions.

---

## 4. Environment Variables & Secret Configuration

### Voice Worker (`backend/voice-agent/.env`)
```bash
LIVEKIT_URL="wss://<project>.livekit.cloud"
LIVEKIT_API_KEY="APKey..."
LIVEKIT_API_SECRET="APSecret..."
GOOGLE_API_KEY="AIzaSy..."
GEMINI_LIVE_MODEL="gemini-2.0-flash-exp"
PLATFORM_EVENTS_URL="https://<project-ref>.supabase.co/functions/v1/voice-events"
PLATFORM_TOOLS_URL="https://<project-ref>.supabase.co/functions/v1/voice-tools"
VOICE_WORKER_SHARED_SECRET="hmac_shared_secret_hex..."
```

### Resonology AI Service (`backend/resonology-ai/.env`)
```bash
GOOGLE_API_KEY="AIzaSy..."
GEMINI_ANALYSIS_MODEL="gemini-2.0-flash"
AI_SERVICE_SHARED_SECRET="hmac_shared_secret_hex..."
ANALYSIS_VERSION="v1.0.0"
REQUEST_TIMEOUT_SECONDS=30
```

### Supabase Cloud Edge Functions (`supabase secrets set`)
```bash
GEMINI_API_KEY="AIzaSy..."
GEMINI_ANALYSIS_MODEL="gemini-2.0-flash"
AI_SERVICE_URL="https://ai.resonology.yourdomain.com"
AI_SERVICE_SHARED_SECRET="hmac_shared_secret_hex..."
VOICE_WORKER_SHARED_SECRET="hmac_shared_secret_hex..."
LIVEKIT_URL="wss://<project>.livekit.cloud"
LIVEKIT_API_KEY="APKey..."
LIVEKIT_API_SECRET="APSecret..."
ANALYSIS_PROVIDER="http" # or "inline_gemini" for fallback
```

---

## 5. Late-Stage Activation Checklist (Phase 11)

Before turning on live AI calling:
- [ ] Supabase migrations applied on cloud; `calls` and `transcript_segments` tables ready.
- [ ] Edge Function `api` test-session generates valid LiveKit token.
- [ ] Edge Function `voice-events` successfully processes scripted replay events.
- [ ] Edge Function `analysis-run` validates JSON against `ConversationAnalysisSchema`.
- [ ] Frontend Live Calls monitor and Call Detail screens tested with mock simulator.
- [ ] Hindi pronunciation and prompt greeting checked with native speaker.
- [ ] Mandatory disclosure line verified as first spoken turn before agent conversation begins.
- [ ] Google Gemini API billing enabled and quota limits verified.
- [ ] LiveKit Cloud bandwidth and concurrent session limits configured.
