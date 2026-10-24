# IntelliCall Autonomous Voice Agent Architecture Plan
**Engine:** Resonology AI (Dual-Brain System 1 / System 2 Architecture)  
**Author:** Anay Sharma | **Date:** 2026-10-22 | **Status:** Architectural Blueprint  
**Target Turnaround Latency:** Sub-350ms Time-To-First-Audio (TTFA)

---

## 1. Executive Summary & Core Philosophy

Traditional conversational voice bots fail in real-world sales environments because they rely on a **monolithic cascade** ($\text{STT} \rightarrow \text{Large LLM} \rightarrow \text{TTS}$). This cascade creates 2,000ms–3,500ms of latency, clumsy turn-taking, robotic paragraph dumps, and inability to handle human speech rhythms (mid-sentence breathing pauses, interruptions, and backchanneling).

To achieve **human conversational parity**, IntelliCall adopts a **Dual-Brain Architecture**:
* **System 1 (Reflexive Speech-to-Speech Core):** Ultra-fast, bidirectional audio streaming using **Google Gemini Multimodal Live API** orchestrated over **LiveKit WebRTC**. It operates strictly within a **<300ms turnaround window**, managing micro-turn taking, native backchanneling, instant barge-in cutoffs, and 15–20 word concise responses.
* **System 2 (Strategic Deliberate Supervisor):** An asynchronous cognitive process running in the background every 10–15 seconds. It monitors accumulated transcripts, extracts qualification criteria and CRM facts, audits compliance guardrails, and **hot-swaps live instructions** into System 1 without interrupting the ongoing audio stream.
* **Mobile Phone Call Simulator Client:** A mobile-optimized web application (`/phone-simulator`) that turns any smartphone into a live recipient of autonomous AI calls via WebRTC—complete with native ringing, vibration, caller ID, and in-call controls—providing a realistic test and demo bed before provisioning PSTN/Twilio carrier trunks.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTELLICALL DUAL-BRAIN ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────────┘

  [ Mobile Phone Simulator / Web Caller ]
           │                         ▲
           │ WebRTC (Raw PCM 24kHz)   │ Native Audio Stream (<300ms)
           ▼                         │
  ┌──────────────────────────────────────────────┐
  │         LiveKit Media Server (SFU)           │
  └──────────────────────┬───────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│  SYSTEM 1: REFLEXIVE CORE    │  │  SYSTEM 2: DELIBERATE MIND   │
│  (LiveKit Agent: agent.py)   │  │  (thinking_engine.py)        │
├──────────────────────────────┤  ├──────────────────────────────┤
│ • Gemini 2.0 Live Speech     │  │ • Async Background Loop (15s)│
│ • VAD Silence: 220ms         │  │ • Objection Categorization   │
│ • Sub-50ms Barge-in Cutoff   │  │ • CRM Fact Extraction        │
│ • Native Backchanneling      │  │ • Compliance Audit Engine    │
│ • Hard Cap: ≤20 Words/Turn   │  │ • Dynamic Instruction Push   │
└──────────────┬───────────────┘  └──────────────┬───────────────┘
               │                                 │
               │ Hot-Swaps Prompt Updates        │
               ▲─────────────────────────────────┘
```

---

## 2. Speech Architecture & Acoustic Engineering Blueprint

### 2.1 Dynamic Voice Activity Detection (VAD) Tuning
Standard generic VAD thresholds destroy sales calls:
* **Silence Threshold Too Low (<180ms):** The agent interrupts the prospect while they are merely taking a breath or thinking mid-sentence.
* **Silence Threshold Too High (>350ms):** The conversation feels delayed, lifeless, and visibly synthetic.

**IntelliCall Precision VAD Specifications:**
* **End-of-Speech Silence Window (`silence_duration_ms`):** Programmed to **220ms – 250ms**.
* **Pre-Speech Audio Buffer (`prefix_padding_ms`):** **120ms**. Retains the initial consonant or syllable (*"Haan"*, *"No"*, *"Look"*) so words are never clipped.
* **Minimum Speech Duration (`min_speech_duration_ms`):** **80ms** (filters out coughs, mic clicks, or brief throat clearing).
* **Interruption Handling (Barge-In):** When user speech exceeds 100ms during agent playback, the client and SFU immediately invoke `agent.interrupt()`, truncating audio output within **45ms** and rolling back the unsaid token queue.

### 2.2 Audio Ingestion Standards (Zero Re-Encoding Loss)
* **Format:** Raw 24kHz or 16kHz, 16-bit Mono Linear PCM.
* **Network Transport:** WebRTC RTP/SRTP over UDP via LiveKit SFU.
* **Browser Audio Constraints:**
  ```ts
  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      sampleRate: 24000,
    }
  });
  ```
* **Acoustic Echo Cancellation (AEC):** Enforced aggressively client-side to allow open-speaker mobile conversations without agent voice bleeding back into the mic.

---

## 3. Conversational Mechanics & Prompt Guardrails (System 1)

### 3.1 Eliminating "AI Tells" (The Ban List)
The model must sound like a seasoned sales representative, not a customer support bot:
* **Banned Phrases:**
  * ❌ *"Based on what you just said..."*
  * ❌ *"As an AI voice assistant..."*
  * ❌ *"I understand your concern..."*
  * ❌ *"Let me help you with that today..."*
  * ❌ *"Thank you for providing that information..."*
* **Mandatory Replacement:** Direct, punchy conversational pivots:
  * ✅ *"Got it. So what's your current lead volume each month?"*
  * ✅ *"Makes total sense. Are you handling those calls manually right now?"*

### 3.2 Programmatic Response Length Capping
* **Rule:** `RESPONSE_LENGTH_MAX = 20 words`.
* In outbound sales qualification, giving long paragraph explanations triggers an immediate hang-up.
* The agent must deliver **one concise observation and ask exactly one clear question** per turn.

### 3.3 Authentic Verbal Backchanneling & Hinglish Flow
* When the prospect speaks for longer than 3 seconds with a slight inflection pause (120ms–180ms), System 1 delivers soft, natural listening markers natively without taking over the floor:
  * English: *"Right..."*, *"Got it..."*, *"Makes sense..."*
  * Hinglish: *"Hanji..."*, *"Achha..."*, *"Bilkul..."*, *"Theek hai..."*
* Opening Turn: Always begins with the mandatory regulatory disclosure:
  > *"Namaste Vikram ji, Anay bol raha hoon IntelliCall team se. Ek quick question tha regarding your sales pipeline—do you have 30 seconds?"*

---

## 4. System 2 Deliberate Supervisor Engine (`thinking_engine.py`)

While System 1 manages real-time sub-300ms speech flow, System 2 runs concurrently as an asynchronous observer without stalling the live audio pipeline:

```
[System 1 Live Conversation] ──► (Streams Turns to Memory Buffer)
                                              │
                                              ▼ (Every 10-15s / Major Turn Boundary)
                             [SYSTEM 2 SUPERVISOR (Gemini 2.0 Flash)]
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            [Fact Extraction]       [Compliance Check]      [Dynamic Steering]
            - Budget: ₹1.5L/mo      - DND check: Passed     - Detects price pushback
            - Car: Creta 2024       - Disclosure: Given     - Pushes new prompt instruction
            - Decision: Next week   - No abusive phrases    - Injects tailored counter-angle
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              ▼
                             [LiveKit Session Prompt Hot-Swap]
                             `session.update_instructions(new_guidance)`
```

### 4.1 Real-Time Prompt Hot-Swapping
* If the prospect raises a price objection, System 2 synthesizes the optimal counter-strategy from the campaign playbook and pushes an instruction update directly into the active LiveKit session:
  ```python
  new_instruction = (
      "CRITICAL UPDATE: Lead expressed budget concern about ₹50,000. "
      "Do NOT quote lower pricing. Anchor on the 4x ROI of saving 2 sales reps' salaries. "
      "Offer the 14-day zero-risk pilot."
  )
  await session.update_instructions(new_instruction)
  ```
* System 1 incorporates this new guidance in its next immediate turn seamlessly.

### 4.2 Automated CRM Data Sync
* System 2 writes structured extraction outcomes (`qualificationScore`, `extractedFacts`, `sentiment`, `disposition`) directly into Supabase tables `call_analyses` and `leads` as the call is still happening, updating the Live Monitor dashboard in real-time.

---

## 5. Mobile Phone Call Simulator Client (`/phone-simulator`)

### 5.1 Purpose & Value Proposition
* **Zero Carrier Barrier:** Eliminates the immediate need for carrier SIP trunks, DLT registration, or Twilio fees during internal testing, demo presentations, and investor pitches.
* **True Mobile Realism:** Testing on laptop browsers misses real-world acoustic challenges like mobile speakerphone distortion, ambient street noise, and network switching. Running the simulator on a smartphone over Wi-Fi/4G provides 100% authentic testing.

### 5.2 Simulator Architecture & User Journey

```
[ Desktop Dashboard: Leads Page / Kanban / Monitor ]
                         │
                         ▼
        Operator clicks "Dispatch AI Call"
                         │
                         ▼
           Supabase Realtime Broadcast:
           Channel: `phone_simulator_<org_id>`
           Event: `incoming_call`
           Payload: { callId, leadName, callerId, livekitRoom, livekitToken }
                         │
                         ▼ (WebSockets Sub-20ms)
    ┌──────────────────────────────────────────────┐
    │  MOBILE BROWSER: /phone-simulator (on phone) │
    ├──────────────────────────────────────────────┤
    │ 1. Fullscreen Incoming Call UI               │
    │ 2. Rings Audio + Vibrate Pattern             │
    │ 3. Displays: "IntelliCall AI (+91 98765)"    │
    │ 4. Green "Accept" & Red "Decline" Buttons    │
    └──────────────────────┬───────────────────────┘
                           │ User Taps "Accept"
                           ▼
    ┌──────────────────────────────────────────────┐
    │          ACTIVE CALL EXPERIENCE              │
    ├──────────────────────────────────────────────┤
    │ • Joins LiveKit WebRTC Room                  │
    │ • Screen Wake Lock Enabled                   │
    │ • Full-Duplex Mic Pipeline (AEC Enabled)     │
    │ • Live Acoustic Waveform Visualizer          │
    │ • Call Duration Counter (00:01, 00:02...)    │
    │ • Mute, Keypad, Speaker, Hangup Controls     │
    └──────────────────────────────────────────────┘
```

### 5.3 Technical Features of the Mobile Simulator
1. **Ringtone & Vibration:**
   * Uses Web Audio API synthesised ringtone or bundled gentle call chime.
   * `navigator.vibrate([500, 250, 500, 250])` for authentic haptic ring feedback on supported Android devices.
2. **Screen Wake Lock API:**
   * Requests `navigator.wakeLock.request('screen')` on call connection so the phone display never sleeps mid-conversation.
3. **Responsive Mobile Shell:**
   * Styled like an authentic native iOS / OneUI / Pixel incoming call screen with sleek dark theme, blur backdrop, glowing answer slider/button, and contact avatar.
4. **Post-Call Feedback Summary:**
   * Upon hangup, displays call duration, qualification rating, and disposition summary, then resets to standby.

---

## 6. Infrastructure & Deployment Matrix

| Component | Responsibility | Recommended Tech / Host | Latency Target |
|---|---|---|---|
| **LiveKit SFU** | WebRTC packet forwarding | LiveKit Cloud or EC2 `c6i.xlarge` (Mumbai `ap-south-1`) | <40ms network RTT |
| **System 1 Worker** | Real-time speech turn-taking | Python LiveKit Worker (`agent.py`) + Gemini Live API | <250ms processing |
| **System 2 Process** | Async reasoning & supervisor | Python FastAPI service (`thinking_engine.py`) / Celery | 3s–8s async cycles |
| **Mobile Simulator** | Virtual phone client on phone | React (Vite) PWA / Route `/phone-simulator` | 0ms local rendering |
| **Database & Auth** | State persistence & events | Supabase Cloud (PostgreSQL + Realtime Channels) | <80ms broadcast |

---

## 7. Phased Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                           │
└────────────────────────────────────────────────────────────────────────┘

 [Phase A: Phone Call Simulator Frontend]
  • Create `/phone-simulator` route in React with incoming call modal
  • Implement audio synthesizer ringtone, haptic vibration, and wake lock
  • Build realistic in-call screen (timer, waveform, mute, end call)
  • Wire Supabase Realtime trigger to simulate calls from Leads/Monitor pages
                    │
                    ▼
 [Phase B: System 1 Refinement (agent.py)]
  • Configure Gemini Multimodal Live API via LiveKit Google plugin
  • Calibrate Silero VAD to exact 220ms–250ms silence window
  • Enforce prompt guardrails (max 20 words, ban filler phrases, backchanneling)
  • Implement sub-50ms instant barge-in cutoff
                    │
                    ▼
 [Phase C: System 2 Reasoning Engine (thinking_engine.py)]
  • Build async supervisor worker monitoring LiveKit transcript stream
  • Implement 15-second evaluation cycles for qualification fact extraction
  • Connect session dynamic instruction hot-swapping
                    │
                    ▼
 [Phase D: Live Monitor & Supervisory Bridge]
  • Connect `/calls/live` monitor to live audio streams and System 2 telemetry
  • Enable supervisor audio listen-in and barge-in override
```
