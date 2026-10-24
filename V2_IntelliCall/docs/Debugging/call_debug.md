# Forensic Debug Report: Live Calling, Gemini AI Studio Disconnect & Voice Engine
**Document ID:** `docs/Debugging/call_debug.md`  
**Author:** Anay Sharma  
**Date:** 2026-10-22  
**Status:** Complete Forensic Analysis & Strategic Remediation Plan  

---

## 1. Executive Summary & Root Causes

During testing of the phone calling simulator (`/phone-simulator`), three critical problems were identified:

1. **Google AI Studio Shows 0 Requests:** The usage dashboard in Google AI Studio displays 0 requests and 0 token usage.
2. **Robotic Voice:** The audio output sounds mechanical and robotic instead of natural human speech.
3. **Microphone Does Not Respond:** Spoken input into the microphone does not advance or influence the conversation.

---

## 2. In-Depth Root Cause Breakdown

### Problem 1: Why Google AI Studio Shows Zero API Requests
* **The Root Cause:**
  * The `/phone-simulator` page was built as a standalone frontend demonstration with hardcoded conversational turns (`turn1Text`, `turn2Text`, `turn3Text`).
  * At no point did the frontend initiate any HTTP request, WebSocket handshake, or RPC call to `generativelanguage.googleapis.com` or Google AI Studio.
  * The actual Gemini Multimodal Live API integration is located in `backend/voice-agent/agent.py`. However:
    1. `agent.py` was not running as a background worker.
    2. The frontend had no LiveKit WebRTC client (`livekit-client` is not in `frontend/package.json`).
    3. No room connection or token exchange existed between the browser and the backend agent.
  * **Result:** Google AI Studio recorded zero API hits because zero network requests were ever made to Gemini.

---

### Problem 2: Why the Voice is Robotic
* **The Root Cause:**
  * Because the browser was not receiving an audio stream from Gemini, it fell back to local operating system text-to-speech: `window.speechSynthesis.speak(utterance)`.
  * On Windows, `speechSynthesis` uses the legacy SAPI5 desktop speech engine (`Microsoft David Desktop` / `Microsoft Zira Desktop`).
  * These desktop synthesizers are 1990s-era concatenative/formant engines without neural prosody or natural inflection.
  * **Gemini's true voice** (such as `Aoede`, `Puck`, `Charon`, `Kore`) is a **24kHz raw PCM neural stream** produced by Google DeepMind's vocoder. It can only be heard when streaming audio bytes directly from Gemini.

---

### Problem 3: Why Microphone Voice Input Did Not Respond
* **The Root Cause:**
  1. **The Insecure Context (HTTP) Sandbox Block:**
     * When opening the app on a smartphone via a local network IP (e.g., `http://192.168.1.XX:5173/phone-simulator`), `window.isSecureContext` is `false`.
     * Modern mobile browsers (iOS Safari, Android Chrome) strictly block `navigator.mediaDevices.getUserMedia` and `webkitSpeechRecognition` on plain HTTP origins. The microphone is denied permission by the browser.
  2. **Missing Audio Streaming Pipeline:**
     * The simulator did not capture raw PCM audio frames or pipe them to a real-time Voice Activity Detection (VAD) or AI engine.

---

## 3. The Two Concrete Architectural Solutions

### Option A: Direct Browser $\leftrightarrow$ Gemini Multimodal Live API (Recommended for Demo)
* **Architecture:**
  * Phone browser connects directly to Google Gemini's Multimodal Live API via WebSocket using the Google GenAI SDK.
  * Captures 16kHz/24kHz raw PCM audio via Web Audio `AudioWorklet` and streams it directly to Gemini.
  * Gemini streams back 24kHz neural audio (`Aoede` / `Kore`) through device speakers.
  * Gemini tool calling (`book_appointment`) triggers direct Supabase CRM persistence.
* **Benefits:**
  * **100% Direct:** Every spoken word immediately appears on the Google AI Studio dashboard.
  * **Zero Python Worker Dependency:** Runs cleanly within Vite/React.
  * Sub-300ms speech-to-speech latency with genuine Gemini voice.

### Option B: Full-Stack LiveKit Cloud SFU + Python Agent Worker (`agent.py`)
* **Architecture:**
  * Install `livekit-client` in `frontend/package.json`.
  * Run `agent.py` in the background with `livekit-agents` and `livekit-plugins-google`.
  * Set up a token dispatch endpoint to authenticate the phone simulator into a LiveKit WebRTC room.
  * LiveKit SFU routes audio between the phone and `agent.py`, which connects to Gemini.
* **Benefits:**
  * Full enterprise WebRTC multi-participant architecture.

---

## 4. Remediation Steps

1. **HTTPS / Secure Context:** Configure `vite-plugin-basic-ssl` in Vite so mobile phones can connect over `https://` on local LAN and grant microphone access.
2. **Gemini Live Connection:** Connect the voice simulator directly to Gemini Multimodal Live API using `VITE_GOOGLE_API_KEY`.
3. **Live Audio Streaming:** Stream raw PCM audio bidirectionally so Gemini's neural voice plays and Google AI Studio logs all requests in real time.
4. **CRM Tool Binding:** Bind Gemini function calling to write confirmed appointments to Supabase.
