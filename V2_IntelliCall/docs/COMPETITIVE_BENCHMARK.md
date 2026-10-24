# IntelliCall: Competitive Benchmark (October 2026)

Purpose: decide which UI capabilities are **table stakes** (we must match them to look enterprise-credible) and which are **differentiators** (where IntelliCall should visibly beat the category).

**Read this with caution.** Most public comparison articles are written by competing vendors (Retell's blog compares Vapi/Synthflow, Synthflow's blog compares Vapi alternatives, and so on), so their rankings are biased. Pricing and latency numbers vary across sources and date quickly. Use this document for *feature shape*, not for hard numbers, and re-verify before putting any claim in a pitch or paper.

Research coverage: Retell, Vapi, Bland, Synthflow, Gong, Bolna, Caller Digital, Exotel, LiveKit, Pipecat, Gemini Live API, TRAI rules. **Not researched in this pass:** Regal, Air AI, Outreach, Salesloft, HubSpot, Attio, Linear (design references from general knowledge only, not re-verified).

---

## 1. Landscape in one table

| Product | Category | Audience | Pricing signal (as reported, unverified) | What it does well | Where the gap is for us |
|---|---|---|---|---|---|
| **Retell AI** | Voice-agent platform | Outbound/inbound teams wanting fast launch | ~$0.07-$0.31/min pay-as-you-go, free credits; batch calling, branded caller ID, warm transfer, visual conversation-flow builder, Salesforce/HubSpot sync | Campaign-ready product, low-code flows, CRM sync | Analytics are call-centric; no evidence-linked decisions or human-review loop |
| **Vapi** | Developer voice infrastructure | Engineers | ~$0.05/min platform fee plus STT/LLM/TTS pass-through; agents defined as JSON; ~40 swappable providers; retired its visual Workflows builder in Aug 2026 (per one source) | Flexibility, bring-your-own-everything | Not a business product; no lead pipeline, review queue, or dashboard of outcomes |
| **Bland AI** | Outbound at scale | High-volume campaigns | ~$0.09-$0.14/min tiers; claims very high hourly call capacity at enterprise tier | Scale, developer control, voice cloning | Developer-heavy; light on operator-facing review and QA |
| **Synthflow** | No-code voice platform | Enterprises/agencies | Enterprise contracts from ~$30k/yr (its own pricing page) | No-code builder, many integrations | Enterprise sales motion; opaque to small teams |
| **Gong** | Conversation intelligence / revenue AI | Enterprise sales orgs | Custom, enterprise | Searchable conversations, Smart Trackers, deal board, deal risk warnings, call library, forecasting, AI agents | Analyses *human* sales calls; does not place AI outbound calls |
| **Bolna** | India-first voice agents | Indian businesses | Free trial; telephony via Twilio, Plivo, Exotel, Vobiz, Acefone, Airtel, or any SIP | Hindi/Hinglish, India telephony connectors | Platform-first; limited workflow/outcome layer visible publicly |
| **Caller Digital** | India-first voice agents | Indian BFSI/e-commerce/lead-gen | Not captured | Hindi/Hinglish plus regional languages, integrations with Salesforce, HubSpot, Zoho, LeadSquared, Plivo/Exotel/Knowlarity/Ozonetel/Tata Tele | Same as Bolna |
| **Exotel / Plivo / Twilio** | Telephony rails | Everyone | Per-minute | PSTN access, SIP trunking, compliance plumbing | Not an agent product |
| **LiveKit Agents / Pipecat** | Open-source realtime frameworks | Builders | LiveKit Cloud has a free Build tier; Pipecat is open source | What *we* are building on | n/a |

## 2. What the category treats as table stakes

If a screen for any of these is missing, a reviewer who has seen Retell or Bolna will notice. IntelliCall's UI must include (even if some are "coming soon" in the backend):

| Table-stakes capability | Seen in | IntelliCall surface |
|---|---|---|
| Agent builder with prompt/script, voice and language selection | All | AI Agents → detail tabs |
| **Test call / web call** from the browser before going live | Retell, Vapi, Bolna | Agent → Test Console (also the primary demo path) |
| Batch / campaign dialing with concurrency and schedule | Retell, Bland, Vapi | Campaigns wizard + campaign controls |
| Retry rules, call windows, voicemail / no-answer handling | Category standard | Campaign wizard "Calling rules" step |
| Branded / declared caller ID | Retell | Settings → Calling; campaign step |
| Transcript + recording + summary per call | All | Call detail |
| Per-call cost and latency visibility | Retell, Vapi | Calls table + Call detail |
| Warm transfer to a human | Retell | Disabled-with-tooltip in Agent permissions (deferred) |
| CRM sync (Salesforce/HubSpot/Zoho/LeadSquared) | Retell, Caller Digital | Settings → Integrations (disabled cards, planned) |
| Webhooks + API keys | All developer-facing | Settings → API & Webhooks |
| Hindi/Hinglish support (India) | Bolna, Caller Digital | Agent language config + Devanagari/Roman transcript toggle |
| Role-based access, audit log, SSO (enterprise) | Enterprise tools | Team & Roles, Audit Log (SSO shown as roadmap) |

## 3. Where IntelliCall should visibly win

These come from the project's own core loop (Conversation → Evidence → Decision → Confidence → Action → Outcome → Learning). Competitor docs we read show transcripts, summaries and CRM updates but not this *explicit chain*. **That is an observation from marketing pages, not proof that nobody has it.** Verify hands-on before claiming it externally.

| Differentiator | What the UI must show |
|---|---|
| **Evidence-linked decisions** | Every AI conclusion (intent, qualified, callback date) has a clickable chip that scrolls the transcript to the supporting segment and plays that audio span |
| **Confidence-aware automation** | Each decision shows what the system did automatically vs. what it routed to review, and why (policy rule + threshold) |
| **Review Queue** | A first-class inbox for uncertain/conflicting/failed items with approve / correct / reject and a recorded resolution |
| **Action ledger with real outcomes** | Every business action (update stage, create follow-up, book meeting) shows attempted → succeeded/failed → retried, not just "done" |
| **Proposed vs. confirmed appointments** | Two visibly different states everywhere; only a calendar-provider confirmation flips to Confirmed |
| **Metric honesty** | Attempts vs. unique leads; model confidence labelled "uncalibrated"; measured accuracy shown separately once human-reviewed labels exist |
| **India compliance center** | DND scrub status, consent ledger, call-window enforcement, AI-disclosure setting, A2P/number declaration status |
| **Evidence drill-down on insights** | "18 calls mention pricing" → click → those 18 calls with excerpts |

## 4. Reference products for UI design

Treat these as *design* references, not templates. (From general knowledge; not re-verified.)

- **Linear**: dense, keyboard-first lists, consistent status chips, command palette, calm neutral UI with one accent.
- **Attio**: relational record pages, flexible saved views, inline-editable tables.
- **Gong**: conversation as searchable evidence: trackers on transcripts, call library, deal board with warnings. Features reported on its own pages include Smart Trackers, deal board, deal warnings, call library and talk-track playback.

## 5. India-specific market and compliance notes

Everything here affects UI and defaults. **This is a product-engineering summary, not legal advice. Have it checked against current TRAI text before any real customer calling.**

- TRAI's rules (TCCCPR 2018, amended in 2025) cover promotional/commercial calling and reportedly apply to AI voice agents and auto-dialers the same as human callers. Key concepts: DND registry scrubbing (including category-level preferences), consent, registered number series, DLT registration of entities/headers/templates, and calling-hour limits.
- Reported 2026 changes: automated/A2P calling must be pre-declared with calling line identifiers to the provider, a termination charge for A2P calls (reported up to 5 paise/min, with exemptions), AI-based spam detection by operators, and a consumer complaint/appeal route. TRAI is reportedly also considering AI-disclosure and consent-verification rules.
- Practical consequences for the MVP UI: per-lead DND/consent status, a campaign-level calling window in IST, an AI-disclosure line configurable in the agent greeting, a suppression list, and a clear "demo mode vs. live PSTN" marker so nobody mistakes a classroom demo for a compliant production setup.
- **Default calling window in the UI: 09:00-21:00 IST, editable, and flagged "verify against current rules".** We did not retrieve the exact current hour limits in this research pass.
- Indian telephony providers named in sources: Exotel (SIP trunking for voice-AI platforms, requires static IP for outbound), Plivo, Vobiz, Acefone, Airtel Business SIP, Knowlarity, Ozonetel, Tata Tele, Twilio (mostly for non-India calling). Frameworks we are considering already ship Exotel/Plivo/Twilio serializers (Pipecat) or SIP support (LiveKit).

## 6. Voice infrastructure options for a free demo

| Option | Free-tier facts found | Fit |
|---|---|---|
| **LiveKit Agents (Python) + LiveKit Cloud + Gemini Live API** | LiveKit Build plan lists 1,000 agent-session minutes, 1,000 third-party SIP minutes, 5,000 WebRTC minutes and 1 free (US) number per month; billed per second with a 10-second minimum. Official docs have a Gemini Live guide and mention Antigravity. | **Recommended.** Browser WebRTC "web call" works with no telephony, so the demo does not depend on an Indian carrier. SIP can be added later. |
| **Pipecat (open source) + Gemini Live** | Open-source Python framework; lists Gemini Multimodal Live and serializers for Exotel, Plivo, Twilio, Telnyx, Vonage; has an Exotel example. | Strong alternative, especially if we go straight to Exotel. Slightly more self-hosting. |
| Vapi / Retell hosted | Retell reports free starter credits; Vapi charges a platform fee plus providers. | Fastest to a PSTN call but not free at scale and hides the pipeline we want to demonstrate. |

**Gemini Live API caveats found:**
- Hindi (hi-IN) is in its supported-language list.
- Documented audio sessions have a **15-minute** limit (fine for qualification calls; handle session resumption anyway).
- The Live API **does not support structured JSON output**, so post-call analysis must be a *separate* Gemini text call with a response schema. This shapes the architecture (see FRONTEND_SPEC §4).
- Free-tier Live API limits in the docs we saw were very tight (single session, small daily request counts for preview audio models) and a developer forum thread reports latency spikes on some native-audio preview models. **Plan a paid-tier API key or billing-enabled project for demo day.**
- LiveKit Build plan numbers above are from a pricing page snapshot; re-check before relying on them.

**PSTN reality check for the demo:** A real call to an Indian mobile requires an Indian-compliant SIP trunk (e.g. Exotel), KYC and likely DLT registration, which is not "free and instant". Therefore the **primary demo channel is the browser web-call**, with a recorded or pre-staged PSTN call as a stretch goal. The UI must label every call's channel (`web_demo` or `pstn`).

## 7. Calendar library decision

- Frontend calendar: **FullCalendar (React)**: free core (daygrid, timegrid, list, interaction). The resource-timeline/resource-timegrid views are in its paid Scheduler tier, so do not depend on them. `react-big-calendar` is a fully free alternative but needs more custom work (no native resource views, minimal default styling).
- Backend scheduling: an internal `CalendarProvider` interface with a Postgres-backed internal provider (availability rules, slots, appointments). A Google Calendar adapter (and Cal.com or Outlook later) implements the same interface. Only a provider confirmation moves an appointment from **Proposed** to **Confirmed**.

## 8. Sources

- Retell blog: [Retell vs Bland vs Synthflow vs Vapi](https://www.retellai.com/blog/retell-vs-bland-vs-synthflow-vs-vapi) (vendor-authored)
- CloudTalk: [Retell AI vs Vapi AI](https://www.cloudtalk.io/retell-ai-vs-vapi-ai/)
- Synthflow: [Vapi alternatives](https://synthflow.ai/blog/vapi-ai-alternatives) (vendor-authored)
- Trillet: [Synthflow alternatives](https://trillet.ai/blogs/synthflow-alternative-for-agencies) (vendor-authored)
- Gong features: [ZoomInfo Pipeline breakdown](https://pipeline.zoominfo.com/sales/gong-features), [Gong instant demo](https://gong.io/instant-demo), [Gong llms.txt](https://www.gong.io/llms.txt)
- Bolna: [telephony integrations](https://www.bolna.ai/docs/telephony-integrations.md)
- Caller Digital: [vs Exotel](https://caller.digital/compare/caller-digital-vs-exotel), [TRAI DND/DLT guide](https://caller.digital/blog/trai-dnd-compliance-ai-outbound-calling-india) (vendor-authored)
- Exotel: [vSIP flow for voice AI](https://developer.exotel.com/docs/vsip/flow-api-configuration), [TRAI glossary](https://exotel.com/glossary/trai-compliance-for-contact-centers/)
- TRAI commentary: [Bar & Bench](https://www.barandbench.com/law-firms/view-point/trais-crackdown-on-spam-calls-and-ai-driven-telemarketing), [GKToday: anti-spam rules](https://www.gktoday.in/trai-tightens-anti-spam-rules-with-ai-detection/), [CareerIndia summary](https://www.careerindia.com/news/trai-anti-spam-rules-2026-compliance-guide-ai-voice-agents-startups-011-65835.html)
- LiveKit: [Gemini guide](https://docs.livekit.io/agents/integrations/google), [pricing](https://livekit.com/pricing.md), [quotas](https://docs.livekit.io/cloud/quotas-and-limits), [per-second metering](https://livekit.com/blog/introducing-per-second-metering-for-livekit)
- Pipecat: [GitHub](https://github.com/pipecat-ai/pipecat), [examples](https://github.com/Vonage/pipecat-examples)
- Gemini Live: [limits and specs](https://firebase.google.com/docs/ai-logic/live-api/limits-and-specs), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [forum thread on latency](https://discuss.ai.google.dev/t/gemini-live-api-models-high-latency/108989)
- Calendar libraries: [Bryntum comparison](https://bryntum.com/blog/react-fullcalendar-vs-big-calendar/)
