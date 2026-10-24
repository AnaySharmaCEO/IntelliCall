# Voice AI & Telemetry Debugging Report: IntelliCall / Resonology AI (App V2)

**Author:** Anay Sharma  
**Date:** 2026-10-20  
**Environment:** Voice Agent (LiveKit Agents, Google Gemini Live API, Silero VAD) & Realtime Telemetry  
**File Location:** `docs/Debugging/App_V2_Debugging/voiceAI_debug.md`  

---

## 1. Executive Summary

The IntelliCall / Resonology AI conversational engine operates on a two-tier voice intelligence architecture:
1. **Tier 1 (Sub-500ms Real-Time Voice):** Bidirectional streaming between customer audio and the Google Gemini Live Multimodal API (`gemini-2.0-flash-exp`) orchestrated through LiveKit Agents with Silero VAD and sub-50ms instant barge-in cutoff.
2. **Tier 2 (Post-Call Structured Extraction):** Structured JSON intelligence extraction powered by Gemini 2.0 Flash (`gemini-2.0-flash`) with schema validation against `ConversationAnalysisSchema`.

This report addresses runtime findings in acoustic telemetry, standby monitor states, and live streaming metrics.

---

## 2. Issues & Technical Diagnoses

### VAI-01: Acoustic Waveform Animation on Zero Active Calls
* **Symptom (`LiveCallMonitorPage.tsx`):**
  When there are no active calls or when active call status is `'completed'` / null, the waveform visualization in Pane 2 continues to pulse with an animated CSS waveform, giving the false impression of an active 24 kHz audio stream.
* **Root Cause (`LiveCallMonitorPage.tsx` lines 145–157):**
  ```tsx
  <div className="flex items-center gap-1 h-12 px-4 py-2 bg-[var(--color-bg-sunken)] rounded">
    {[40, 65, 80, 45, 90, 75, 60, 85, 50, 70, 95, 60, 40, 80, 55, 30].map((h, i) => (
      <span
        key={i}
        className="w-1.5 rounded-full bg-[var(--color-action-primary)] animate-pulse"
        style={{ height: `${h * 0.28}px`, animationDelay: `${i * 0.08}s` }}
      />
    ))}
  </div>
  ```
  The animated pulse is rendered unconditionally, regardless of whether `activeCall?.status === 'in_progress'`.
* **Proposed Solution:**
  1. Inspect `activeCall?.status === 'in_progress'`.
  2. If inactive: render a quiet, flat baseline with an overlay status:
     `"Audio channel standby • Waiting for connection"`.
  3. If active: render the pulsing waveform synchronized to WebRTC audio energy levels.

---

### VAI-02: Telemetry Metrics Source & Measurement Methodology
* **Symptom:**
  Turnaround Latency (TTFB) and Audio Roundtrip metrics displayed static placeholder strings (`280 ms`, `410 ms`) on the Analytics screen because live telemetric recording from the voice worker was not piped into the database.
* **Acoustic Telemetry Measurement Architecture:**
  To provide legitimate, honest metrics:
  1. **Time-to-First-Byte (TTFB):**
     - Measured by `backend/voice-agent/agent.py`:
     - $T_0$: Silero VAD detects end of prospect utterance (`VADEventType.END_OF_SPEECH`).
     - $T_1$: First PCM audio chunk arrives from Gemini Live WebSocket.
     - $\text{TTFB} = T_1 - T_0$.
     - Expected range: $220\text{ ms} - 420\text{ ms}$.
  2. **Audio Roundtrip (RTT):**
     - LiveKit WebRTC peer connection RTT metric from client stats (`RTCIceCandidatePairStats.currentRoundTripTime`).
     - Expected range: $30\text{ ms} - 80\text{ ms}$ on broadband, $120\text{ ms} - 250\text{ ms}$ on cellular.
  3. **Call Disconnect Rate:**
     - Computed as: $\frac{\text{Calls with duration} < 10\text{s or status} = \text{'failed'}}{\text{Total calls attempted}} \times 100\%$.
* **Proposed Solution:**
  1. Have the voice worker record `ttfb_ms` and `roundtrip_ms` into `calls.metadata` upon call teardown.
  2. In `frontend/src/api/http/index.ts`, compute the average TTFB and roundtrip from `calls.metadata->>'ttfb_ms'`.
  3. When zero calls exist, display `"Standby"` or `"—"` rather than an arbitrary default number.

---

### VAI-03: Regulatory Compliance Opening Turn Enforcement
* **Requirement:**
  Regulatory standards in India (TRAI / DoT) require conversational voice bots to explicitly disclose their AI identity and state the company name within the first turn.
* **Worker Enforcement (`backend/voice-agent/agent.py`):**
  ```python
  # Initial greeting must be dispatched immediately upon session establishment
  # before listening to customer microphone.
  mandatory_disclosure = (
      f"Hello, this is {agent_name} from {org_name}. "
      "Please note this is an automated AI assistant powered by Resonology AI."
  )
  ```
* **Frontend Verification:**
  - Compliance engine rules must include `rule_type: 'required_phrase'` with phrase: `"automated AI assistant"`.
  - When verified, the call receives a 100% compliance score in `call_analyses`.

---

## 3. Voice AI Deployment & Environment Checklist

| Component | Variable | Purpose | Status |
| :--- | :--- | :--- | :--- |
| **LiveKit Server** | `LIVEKIT_URL` | WebRTC signaling endpoint (wss://...) | Configured in `.env` |
| **LiveKit Auth** | `LIVEKIT_API_KEY` | Room token minting key | Configured in `.env` |
| **LiveKit Secret** | `LIVEKIT_API_SECRET`| HMAC token signing secret | Configured in `.env` |
| **Google AI** | `GEMINI_API_KEY` | Gemini Live multimodal bidirectional stream | Configured in `.env` & Supabase Secrets |
| **VAD Engine** | `Silero VAD` | Local neural voice activity detection | Packaged in `backend/voice-agent` |
| **Audio Format** | `24 kHz PCM / Opus` | Low-latency audio transport | Standardized across client and worker |

---

## 4. Proposed Fixes Summary

1. Update `LiveCallMonitorPage.tsx` to conditionally render the acoustic waveform only when an active call is `in_progress`.
2. Update `http/index.ts` to compute acoustic telemetry dynamically from `calls.metadata`, falling back to `"—"` when no calls exist.
3. Keep supervisor barge-in toggle functional, displaying active/inactive status badges clearly.
