# Campaign-Driven AI Architecture & Supabase Backend Connectivity
**Autonomous Voice Platform: Dynamic Multi-Tenant Campaign Strategy Engine**  
**Author:** Anay Sharma | **Date:** 2026-10-22 | **Status:** Technical Specification

---

## 1. System Overview

In IntelliCall, **the AI voice agent is never hardcoded with a static identity, static pitch, or static offer**. An organization utilizing the platform configures distinct **Campaigns** (e.g. *"Auto Loan Refinance Q4"*, *"Inbound SaaS Lead Qualification"*, *"Commercial Real Estate Investor Screening"*).

Each Campaign contains its own:
* Organization / Brand Identity (`company_name`)
* Elevator Hook & Mission (`motto`)
* Compelling Incentive / CTA (`offer`)
* Targeted Diagnostic Questions (`qualifying_questions`)
* Calculated Revenue Bleed (`value_gap_statement`)
* Objection Handling Counter-Strategies (`objection_playbook`)

When an outbound call is dispatched (or an inbound call connected), the voice worker dynamically connects to **Supabase**, fetches the call's associated campaign and lead records, and synthesizes a **custom, context-grounded conversational prompt** before the first audio frame is streamed.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAMPAIGN CONTEXT RESOLUTION DATA FLOW                     │
└─────────────────────────────────────────────────────────────────────────────┘

  [ Operator Dispatches Call (Leads Page / Dashboard) ]
                         │
                         ▼
             Insert row in `calls` table:
             {
               id: "call-uuid-1234",
               organization_id: "org-uuid",
               campaign_id: "campaign-uuid",
               lead_id: "lead-uuid",
               status: "queued"
             }
                         │
                         ▼
        LiveKit Room Created: `call-call-uuid-1234`
                         │
                         ▼
  [ Python Voice Worker: agent.py joins room ]
                         │
                         ▼
       Query Supabase REST API via Service Role Key:
       GET /rest/v1/calls?id=eq.call-uuid-1234&select=*,leads(*),campaigns(*),organizations(*)
                         │
                         ▼
  ┌───────────────────────────────────────────────────────┐
  │ DYNAMIC PROMPT COMPILATION:                           │
  │ • Lead Name: "Vikram Malhotra" -> "Vikram"            │
  │ • Company Name: "FinEdge Capital"                     │
  │ • Motto: "0% balance transfers on high-interest loans"│
  │ • Offer: "Complimentary portfolio rate audit"         │
  │ • Questions: ["What APR are you currently paying?"]   │
  │ • Opening Line: "Namaste Vikram ji, Anay bol raha... "│
  └──────────────────────┬────────────────────────────────┘
                         │
                         ▼
  [ Gemini Multimodal Live API Session Initialized (<300ms) ]
```

---

## 2. Campaign Strategy Schema (`campaigns.strategy_config`)

The `campaigns` table in Supabase already contains a `strategy_config JSONB` column. We standardize its structure as follows:

```json
{
  "company_name": "Resonology AI",
  "motto": "Automating sales qualification within 60 seconds of website enquiry",
  "offer": "14-day zero-risk trial with 100 free qualification calls",
  "target_audience": "Founders, VP of Sales, and Inbound Growth Teams",
  "primary_pain_point": "Sales reps wasting 3-4 hours daily manually dialing dial tones",
  "value_gap_statement": "₹45,000/month in burned payroll per manual dialing SDR",
  "qualifying_questions": [
    "How many inbound leads does your sales team handle per week?",
    "Are you following up manually or using an automated pipeline?"
  ],
  "objection_playbook": {
    "price": "Do not discount. Anchor on saving 2 SDR salaries. Offer 14-day zero-risk trial.",
    "send_email": "Acknowledge busyness. Ask for 1 diagnostic answer before sending tailored PDF.",
    "competitor": "Highlight sub-300ms speech turnaround and native Hinglish fluency vs robotic bots."
  }
}
```

---

## 3. Dynamic Prompt Synthesis Specification

In `backend/voice-agent/agent.py`, the System 1 prompt template is rendered dynamically:

```python
def compile_chameleon_prompt(lead: dict, campaign: dict, organization: dict) -> tuple[str, str]:
    strategy = campaign.get("strategy_config") or {}
    
    company_name = strategy.get("company_name") or organization.get("name") or "IntelliCall"
    motto = strategy.get("motto") or campaign.get("name") or "Enterprise growth and qualification"
    offer = strategy.get("offer") or "a complimentary 10-minute workflow audit"
    pain_point = strategy.get("primary_pain_point") or "manual qualification delays"
    value_gap = strategy.get("value_gap_statement") or "lost revenue from slow response times"
    
    raw_lead_name = lead.get("name") or lead.get("first_name") or "there"
    lead_first_name = raw_lead_name.split()[0]
    
    questions = strategy.get("qualifying_questions") or [
        "What is your current monthly lead volume?",
        "How quickly is your team currently responding to new inquiries?"
    ]
    questions_formatted = "\n   - ".join(questions)
    
    # 1. Non-Slimeball Professional Opening Turn
    greeting_line = (
        f"Namaste {lead_first_name} ji, Anay bol raha hoon {company_name} se. "
        f"Ek quick minute baat ho sakti hai aapse?"
    )
    
    # 2. Dynamic Chameleon System Instructions
    system_instructions = f"""
YOU ARE THE CONVERSATIONAL CHAMELEON representing {company_name}.
You are speaking with {lead_first_name}. You are an elite, high-status human growth consultant.
You do NOT announce yourself as an AI or automated bot.

CONVERSATIONAL OBJECTIVE:
- Company: {company_name}
- Mission/Motto: {motto}
- Diagnostic Value Gap to Expose: {value_gap}
- Core Offer / Next Step: {offer}

MANDATORY TURN-TAKING FLOW:
1. GREETING TURN:
   You have already initiated the call with:
   "{greeting_line}"
   WAIT for the prospect to respond (e.g. "Haan boliye", "Yes, what is this regarding?").

2. HOOK & PERMISSION (TURN 2):
   Once they give permission, deliver the campaign motto honestly and concisely in under 20 words:
   "Actually {company_name} mein hum {motto} par focus karte hain. Wanted to ask—{questions[0]}?"

3. DIAGNOSTIC DISCOVERY:
   Ask the remaining qualifying questions one at a time:
   - {questions_formatted}
   Listen for pain around {pain_point}.

4. STRATEGIC DISCOMFORT & CLOSING:
   Frame the appointment using Chris Voss's 'No'-oriented question:
   "Would you be totally opposed to {offer} with our team this Thursday?"

CORE BEHAVIORAL CONSTRAINTS:
- HARD CAP: Maximum 20 words per response.
- NEVER ARGUE: If challenged, validate their feeling first (Law 9).
- LINGUISTIC CHAMELEON: Match their dialect (Hinglish / English / Hindi). Use respectful honorifics ('Aap', 'Ji', 'Sir').
- BANNED: 'As an AI...', 'Based on what you said...', 'I apologize for disturbing you...'.
"""
    return greeting_line, system_instructions
```

---

## 4. Supabase REST Connectivity in the Voice Worker

Rather than requiring complex local database drivers, `agent.py` connects to Supabase over secure HTTPS using the project service key:

```python
import os
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://wdmensuuqsbnxzecqlwz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

def fetch_call_context(call_id: str) -> dict:
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/calls?id=eq.{call_id}&select=*,leads(*),campaigns(*),organizations(*)"
    response = requests.get(url, headers=headers, timeout=5)
    if response.status_code == 200 and response.json():
        return response.json()[0]
    return {}
```

---

## 5. Live State Updates & System 2 Telemetry

1. **Call Start (`call.started`):**
   * Updates `calls.status = 'in_progress'` and `started_at = now()`.
2. **Transcript Streaming:**
   * Streams turns into `calls.transcript` and invokes `analysis-run` Edge Function upon completion.
3. **Appointment Lock:**
   * When System 2 verifies that the lead agreed to an appointment, it inserts a confirmed record into `appointments` and updates `leads.status = 'meeting_booked'`.
