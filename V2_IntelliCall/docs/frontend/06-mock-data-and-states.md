# 06: Mock Data and State Coverage

Goal: a demo that looks like a real Indian SMB using IntelliCall, and that exercises **every** state the UI supports. All seeds are fictional; use obviously fake phone numbers (`+91 90000 000xx` style) and example.com emails. Never use real people or real businesses.

## 1. Organization seed

"Sharma Realty Services" (real estate lead qualification, Noida/Ghaziabad/Delhi NCR), timezone Asia/Kolkata, ₹. Team: Owner (Anay), Admin, Manager, two Operators, one Viewer (names fictional).

Additional org "Bright Path Academy" (education counselling) to test org switching and isolation.

## 2. Seed volumes

| Entity | Count | Notes |
|---|---|---|
| Leads | 120 | Mix of stages, cities (Noida, Ghaziabad, Gurugram, Delhi, Lucknow, Jaipur, Pune), sources (Website form, Facebook ad, Referral, Expo list) |
| Agents | 4 | "Property Qualifier" (published v3, Hindi+English), "Site Visit Setter" (published), "Follow-up Caller" (draft), "Event Invite" (archived) |
| Campaigns | 5 | 1 running (live simulator), 1 paused, 1 completed (rich history), 1 draft, 1 failed_preflight |
| Calls | 400 | Over last 45 days, realistic distribution |
| Transcripts | full for ≥ 40 calls; short for rest | Hindi, English, and mixed |
| Decisions/Evidence | for all analyzed calls | |
| Review items | 14 | 2 open from the acceptance script, others resolved with history |
| Appointments | 25 | confirmed, proposed, completed, no-show, booking_failed |
| Tasks | 30 | open, due soon, overdue, completed |
| Notifications | 25 | |
| Audit log | 300+ | AI, human, system actors |

## 3. Scenario calls (must exist, deterministic, referenced by Playwright)

| ID | Language | Scenario | Exercises |
|---|---|---|---|
| S1 | en-IN | Clear qualification; budget ₹80L-1Cr, wants 3BHK; agrees to site visit "Saturday 11 am" → confirmed appointment | Auto-apply decisions, evidence chips, confirmed appointment |
| S2 | hi-IN | "Haan interested hoon, par agle mahine baat karte hain" (interested but next month) → follow-up task | Hindi transcript with Devanagari + Roman toggle; callback date computed; auto follow-up |
| S3 | mixed | Hinglish; callback "mangalvaar shaam ko" (Tuesday evening, ambiguous time) | **Review item** `ambiguous_time`; proposed correction form |
| S4 | en-IN | Price objection ×2, asks competitor comparison, not qualified | Objection insights, `not_qualified`, evidence excerpts |
| S5 | hi-IN | Requests "mujhe dobara call mat karna" (don't call again) | DNC decision → suppression list entry, queued calls cancelled, audit entries |
| S6 | en-IN | Voicemail reached | `voicemail` status, retry scheduled |
| S7 | en-IN | No answer ×3 → exhausted | Attempts vs unique leads metric |
| S8 | en-IN | Qualified, appointment proposed, **calendar provider fails** | `booking_failed`, failed action in ledger, review item, retry flow |
| S9 | hi-IN | Call blocked: outside calling window / DND | `blocked_compliance`, compliance log |
| S10 | en-IN | Analysis failed (AI timeout) | `analysis failed` state, re-run analysis |
| S11 | en-IN | Low-confidence qualification with conflicting statements | `conflicting_evidence` review |
| S12 | hi-IN | Very short call (hang up at 6 s) | Not "completed"; excluded from completion rate numerator |
| S13 | en-IN | Wrong person ("this is not Rahul's number") | Intent `wrong_person`, lead flagged |
| S14 | en-IN | Long call 9+ min with many questions the agent couldn't answer | Knowledge-gap insight |

Write transcripts as realistic two-party conversations (6-30 turns), with timestamps; keep them original and fictional.

## 4. Live simulator script (running campaign)

When the running campaign is active, every 8-15 s start a simulated call that progresses `queued → dialing (2 s) → ringing (4 s) → in_progress (streams 10-20 segments at 2-5 s intervals incl. interim text) → ended → analyzing (6 s) → completed`. Randomly choose scenario S1-S14 weights (e.g. S1 15%, S2 15%, S4 15%, S6 10%, S7 10%, others 5%). At completion, create decisions, actions and (when applicable) review items and notifications, update KPIs, funnel and lead stage so the Dashboard moves visibly. Cap concurrency to the campaign setting.

## 5. Demo Controls (dev only)

Switch role · start a call now (pick scenario) · fail next action · force provider outage (telephony/voice/AI/calendar) · slow network · return empty lists · return forbidden · jump time ±1 day · reset data · export current store as JSON.

## 6. State coverage checklist (each must be reachable in mock)

| Area | States to exercise |
|---|---|
| Any list | loading, empty (first-run), empty (filtered), error, partial page, 10k rows virtualized |
| Lead | new, qualifying, qualified, meeting_proposed, meeting_booked, nurture, disqualified, do_not_call, on DND, no consent, duplicate warning, merged |
| Campaign | draft, preflight failed, scheduled, running, paused (manual), paused (provider outage), paused (budget cap), completed, stopped |
| Call | every `CallStatus`; every `AnalysisStatus`; no audio; no transcript; voicemail; blocked; very short |
| Decision policy | auto-applied, needs review (each reason code), blocked |
| Action ledger | proposed, executing, succeeded, failed, retrying (with attempt count), skipped_by_policy |
| Appointment | proposed, confirmed, rescheduled, completed, no_show, cancelled, booking_failed, sync pending |
| Agent | draft with unpublished changes, published, archived, in use by running campaign, publish blocked by validation |
| Review | each `ReviewType`, assigned/unassigned, resolved as approved/corrected/rejected, conflict (resolved by someone else) |
| Auth | unverified email, invalid credentials, expired session, invite accepted/expired, role-based hiding |
| Realtime | connected, disconnected banner, reconnect refetch |
| Settings | provider connected/not configured/degraded/outage; integration roadmap cards; usage near budget cap |
| Permissions | each role on each nav item and primary action |

## 7. Sample `leads_demo.csv` (to ship in `frontend/public/samples/`)

Columns: `first_name,last_name,company,phone,email,city,source,language,notes`. Include 10 rows: 7 valid, 1 invalid phone (`98765`), 1 duplicate phone, 1 number flagged DND in the mock scrub. Use fake numbers only.

## 8. Content realism guidelines

- Indian names and cities, ₹ amounts in lakh/crore notation, plausible real-estate and education conversation topics, business hours in IST.
- Hindi lines must be correct Devanagari with Roman transliteration (`textRoman`); have a Hindi speaker (team member) proof-read them before demo.
- Do not use brand names of real developers, banks, or telecom operators in scripts.
