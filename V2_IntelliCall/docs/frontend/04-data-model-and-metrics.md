# 04: Data Model, Enums, Metrics, RBAC

All shapes are authoritative as **Zod schemas in `src/contracts/`** (TypeScript below is illustrative). IDs are UUID strings. Timestamps are ISO-8601 UTC. Money is integer **paise** (₹1 = 100 paise) plus `currency: "INR"`. Phones are E.164.

## 1. Entities

```ts
Organization { id, name, industry, timezone, currency, locale, logoUrl?, plan, createdAt,
  complianceDefaults: { windowStart: "09:00", windowEnd: "21:00", days: number[], maxAttemptsPerDay, coolingOffHours },
  automationPolicy: { autoApplyThresholds: Record<DecisionType, number>, requireEvidence: boolean,
                      alwaysReview: ActionType[], retry: { maxAttempts, backoffSeconds } } }

User { id, name, email, avatarUrl?, lastActiveAt }
Membership { id, orgId, userId, role: Role, status: "active"|"invited"|"deactivated", invitedBy? }

Lead { id, orgId, firstName, lastName?, company?, title?, phone, email?, city?, state?, country: "IN",
  source, ownerId?, stage: LeadStage, qualification: QualificationStatus,
  languagePref: "en-IN"|"hi-IN"|"auto", timezone?, tags: string[], customFields: Record<string,unknown>,
  compliance: { dnd: "clear"|"dnd"|"unknown", dndCheckedAt?, consent: { type: "explicit"|"inferred"|"imported"|"none", at?, source?, expiresAt? }, suppressed: boolean },
  lastCallAt?, lastOutcome?, nextFollowUpAt?, createdAt, updatedAt }

LeadStageChange { id, leadId, from, to, actor: Actor, reason?, decisionId?, at }

Pipeline { id, orgId, stages: [{ id, key, label, order, isTerminal }] }   // MVP: one default pipeline

Campaign { id, orgId, name, objective, status, agentId, agentVersion, languages: Lang[], autoSwitch,
  audience: { source, segmentId?, leadIds?, totalLeads, eligibleLeads, excluded: [{reason, count}] },
  criteria: QualificationCriterion[], criteriaLogic: "all"|"any", appointmentGoal?: {...},
  rules: { windowStart, windowEnd, days, concurrency, pacingPerMin, maxAttempts, retryGapMinutes, voicemailAction, callerIdId },
  schedule: { startAt?, endAt? }, budgetCapPaise?, ownerId, createdAt, launchedAt? }

CampaignLead { campaignId, leadId, status: "pending"|"in_queue"|"attempted"|"connected"|"completed"|"retry_scheduled"|"exhausted"|"blocked"|"skipped",
  attempts, lastCallId?, nextAttemptAt? }

Agent { id, orgId, name, description, status: "draft"|"published"|"archived", activeVersion, createdAt }
AgentVersion { id, agentId, version, publishedAt?, publishedBy?, changelog?,
  persona: { speakName, companyName, role, tone, greeting: Record<Lang,string>, disclosureEnabled, disclosureText: Record<Lang,string> },
  instructions: string, limits: { maxDurationSec, maxSilenceSec, interruptionSensitivity },
  languages: { primary: Lang, secondary?: Lang, autoSwitch, voiceId: Record<Lang,string>, pace },
  knowledge: { faqs: [{q,a}], offerDetails, allowedPricingStatements, mustNotClaim: string[], documents: [{id,name,status}] },
  script: QualificationQuestion[], objectionSnippets: [{category, text}],
  permissions: Record<ActionType, "allowed"|"needs_review"|"forbidden"> & { thresholdOverrides? },
  guardrails: { refuseTopics: string[], escalateTriggers: string[], endCallRules: string[], voicemailBehavior, dndRequestBehavior } }
QualificationQuestion { id, order, text, type: "yesno"|"choice"|"number"|"text", options?, required, rule?: {op, value} }

Call { id, orgId, leadId, campaignId?, agentId, agentVersion, channel: "web_demo"|"pstn", language: Lang|"mixed",
  status: CallStatus, answeredBy?: "human"|"voicemail"|"ivr"|"unknown", startedAt?, answeredAt?, endedAt?, durationSec?,
  endReason?: "completed"|"lead_hung_up"|"agent_ended"|"silence_timeout"|"max_duration"|"provider_error"|"compliance_blocked",
  attempt: number, recordingUrl?, analysisStatus: AnalysisStatus,
  cost: CostBreakdown, metrics: { turnLatencyP50Ms?, turnLatencyP95Ms?, interruptions?, audioQuality?: "good"|"fair"|"poor" },
  providerRefs: { room?, sipCallId?, providerCallId? }, complianceSnapshot: ComplianceCheck, flags: string[] }

CostBreakdown { currency: "INR", telephonyPaise, voiceEnginePaise, analysisPaise, totalPaise }

TranscriptSegment { id, callId, idx, speaker: "agent"|"lead"|"system", startMs, endMs, language: Lang, text, textRoman?, isFinal }

ConversationAnalysis { callId, version, model, createdAt, summary: SummarySentence[], outcome, intent, sentiment?,
  qualificationAnswers: QualificationAnswer[], facts: Fact[], objections: Objection[], questions: LeadQuestion[],
  commitments: Commitment[], callback?: CallbackRequest, appointment?: AppointmentRequest, nextBestAction, decisions: Decision[] }

Decision { id, callId, leadId, type: DecisionType, statement, value, confidence: number /*0-1, model self-reported, uncalibrated*/,
  evidence: Evidence[], policy: { outcome: "auto_apply"|"needs_review"|"blocked", reasons: string[] }, createdAt, analysisVersion }
Evidence { id, callId, segmentIds: string[], startMs, endMs, quote, speaker }
ActionAttempt { id, decisionId?, callId?, leadId, type: ActionType, payload, status: ActionStatus, attempts, idempotencyKey,
  error?: { code, message }, executedAt?, createdBy: Actor }
HumanCorrection { id, targetType: "decision"|"fact"|"answer"|"segment"|"action", targetId, before, after, reason?, correctedBy, at }
ReviewItem { id, orgId, type: ReviewType, severity: "low"|"medium"|"high", status: ReviewStatus, title, reasonCode, decisionId?, actionId?, callId?, leadId?,
  assignedTo?, createdAt, resolvedAt?, resolution?: { kind: "approved"|"corrected"|"rejected", note?, correctionId?, by } }

Appointment { id, orgId, leadId, hostId, campaignId?, sourceCallId?, evidenceId?, status: AppointmentStatus,
  startAt, endAt, timezone, location?, meetingLink?, provider: "internal"|"google"|"outlook", providerEventId?, providerSyncStatus: "synced"|"pending"|"failed",
  failureReason?, remindersSent, createdAt }
AvailabilityRule { id, hostId, weekday, start, end, bufferMin, slotMin }
Task { id, orgId, leadId, type: "callback"|"human_call"|"send_info"|"review"|"other", dueAt, ownerId?, status: TaskStatus, source: "ai"|"human",
  campaignId?, sourceCallId?, evidenceId?, priority, notes?, completedAt? }

Notification { id, userId, type, title, body, entityRef?, readAt?, createdAt }
AuditLog { id, orgId, at, actor: Actor, action, entityType, entityId, before?, after?, result: "success"|"failure", requestId, ip?, userAgent? }
Actor { kind: "human"|"ai"|"system", id?, name }

ApiKey { id, name, prefix, scopes, createdAt, lastUsedAt?, expiresAt?, revokedAt? }
WebhookEndpoint { id, url, events: string[], status, secretLast4, createdAt }
WebhookDelivery { id, endpointId, event, status, httpStatus?, attempt, at }
Integration { id, kind, provider, status: "connected"|"not_connected"|"error"|"roadmap", config? }
SuppressionEntry { id, phone, reason, addedBy, at, source: "manual"|"lead_request"|"import" }
ComplianceCheck { windowOk, dnd, consent, suppressed, checkedAt, blockedReason? }
UsageSummary { period, callMinutes, callCount, analysisCount, storageMb, costPaise, budgetCapPaise? }
```

## 2. Enumerations (`contracts/enums.ts`)

- `Role`: `owner|admin|manager|agent_operator|viewer`
- `Lang`: `en-IN|hi-IN`
- `LeadStage`: `new|contacted|qualifying|qualified|meeting_proposed|meeting_booked|nurture|disqualified|do_not_call`
- `QualificationStatus`: `unknown|in_progress|qualified|not_qualified|needs_review`
- `CallStatus`: `queued|dialing|ringing|in_progress|completed|no_answer|busy|voicemail|failed|blocked_compliance|cancelled`
- `AnalysisStatus`: `pending|analyzing|complete|failed|not_applicable`
- `DecisionType`: `lead_intent|qualification_result|stage_change|callback_request|appointment_request|do_not_call_request|objection_category|escalation_needed`
- `ActionType`: `update_lead_stage|update_qualification|create_follow_up|propose_appointment|confirm_appointment|mark_do_not_call|send_webhook|transfer_to_human`
- `ActionStatus`: `proposed|executing|succeeded|failed|retrying|skipped_by_policy`
- `ReviewType`: `uncertain_classification|conflicting_evidence|missing_data|failed_action|booking_error|compliance|user_flag`
- `ReviewStatus`: `open|in_review|approved|corrected|rejected|auto_resolved`
- `AppointmentStatus`: `proposed|confirmed|rescheduled|completed|no_show|cancelled|booking_failed`
- `TaskStatus`: `open|completed|cancelled` (due_soon/overdue are computed from `dueAt`)
- `Intent`: `interested|interested_later|needs_info|not_interested|wrong_person|callback_requested|do_not_call|unclear`
- `ObjectionCategory`: `price|timing|trust|already_has_provider|need_to_consult|not_relevant|competitor|other`
- `CampaignStatus`: `draft|scheduled|running|paused|completed|stopped|failed_preflight`
- Error codes (`api error.code`): `unauthenticated|forbidden|not_found|validation_failed|conflict|rate_limited|provider_unavailable|compliance_blocked|idempotency_replay|internal`

## 3. Policy engine semantics (UI must display what the backend decided)

For each `Decision`:
1. If `evidence.length === 0` and `requireEvidence` → `needs_review` (reason `missing_evidence`).
2. If `confidence < threshold[type]` → `needs_review` (`below_threshold`).
3. If decision type is in `alwaysReview` → `needs_review` (`policy_always_review`).
4. If conflicting decisions for the same field exist → `needs_review` (`conflicting_evidence`).
5. If callback/appointment time is ambiguous (no resolvable absolute time) → `needs_review` (`ambiguous_time`).
6. Else `auto_apply`.
`confirm_appointment` can only succeed if the CalendarProvider acknowledges; otherwise the appointment remains `proposed` or becomes `booking_failed` with a review item.

## 4. Metrics: single definitions (`lib/metrics.ts`, shown in tooltips)

**Rule:** compute in the API; the frontend only formats. Each metric returns `{ value, numerator?, denominator?, deltaPct?, sampleSize }`.

### A. Business outcomes
- **Qualified leads** = count of unique leads with `qualification = qualified` (approved or auto-applied) in period.
- **Confirmed meetings** = appointments with `status ∈ {confirmed, completed}` created in period (attributable to a campaign call).
- **Qualification rate** = qualified unique leads / unique leads with **completed qualification** (`qualified` or `not_qualified`).
- **Meeting booking rate** = confirmed attributable appointments / *qualified unique leads* (denominator is explicit in tooltip; alternative denominators selectable in "Explain").
- **Cost per qualified lead** = (telephony + voice engine + analysis cost of attributable calls) / qualified unique leads.
- **Cost per booked meeting** = same cost / confirmed meetings.
- **Show-up rate** = completed / (completed + no_show) (shown only when data exists).
- **Lead-to-customer conversion**: not available in MVP (needs downstream data); render "Not tracked" card.

### B. Calling
- **Call attempts** = count of calls (retries included). **Unique leads attempted** = distinct leads with ≥ 1 attempt.
- **Human answer rate** = human-answered attempts / eligible attempts (excludes `blocked_compliance`, `cancelled`).
- **Connection rate** = connected attempts (answered by anyone) / eligible attempts.
- **Completion rate** = completed calls / human-answered calls.
- **Avg connected duration** = mean `durationSec` of human-answered calls.
- **No-answer rate** = `no_answer` / eligible attempts. **Technical failure rate** = `failed` / eligible attempts. **Retry rate** = attempts with `attempt > 1` / attempts.

### C. Pipeline
Leads by stage · stage-to-stage conversion (stage N+1 reached / stage N reached, cohort by lead creation or by campaign launch, shown in tooltip) · disqualification reasons · callback backlog (open callback tasks) · lead aging (days in stage) · follow-up completion rate (completed on or before due / due) · time to qualification (first call → qualified) · time to appointment (qualified → confirmed).

### D. Conversation intelligence
Intent distribution · objection frequency (distinct calls, not mentions) · common questions · qualification completeness (answered required questions / required questions, per call) · **Review rate** = decisions routed to review / decisions · **Low-confidence count** · **Evidence coverage** = important decisions with ≥ 1 evidence / important decisions · **AI action success rate** = succeeded / attempted actions · **Human correction rate** = corrected decisions / reviewed decisions · **Measured accuracy** (precision/recall/F1, extraction accuracy) **only** from human-reviewed labelled decisions with sample size; **model confidence** is never labelled accuracy.

### E. Reliability
Failed call initiations · provider errors · missing transcripts/summaries · processing completion rate (analyses complete / calls needing analysis) · response latency p50/p95 (per-turn) · duplicate events or actions detected · booking failures · unprocessed events · delayed jobs (queue age > threshold).

## 5. RBAC matrix (`lib/permissions.ts`)

Legend: ● full · ◐ limited (own records / needs approval) · ○ view only · — none

| Area / action | Owner | Admin | Manager | Operator | Viewer |
|---|---|---|---|---|---|
| Dashboard, Calls, Leads, Campaigns view | ● | ● | ● | ● | ○ |
| PII (unmasked phone/email) | ● | ● | ● | ● | masked |
| Create/edit/import leads, notes | ● | ● | ● | ● | — |
| Delete leads | ● | ● | ◐ | — | — |
| Create/launch/pause campaigns | ● | ● | ● | ◐ (own drafts; launch needs manager) | — |
| Create/edit agent drafts | ● | ● | ● | ◐ | — |
| Publish agent | ● | ● | ● | — | — |
| Run test calls | ● | ● | ● | ● | — |
| Review Queue resolve | ● | ● | ● | ● | — |
| Re-run analysis | ● | ● | — | — | — |
| Appointments/Follow-ups manage | ● | ● | ● | ● | — |
| Insights view | ● | ● | ● | ● | ○ |
| Compliance view / manage | ● / ● | ● / ● | ● / ◐ | ○ / — | ○ / — |
| Audit log | ● | ● | — | — | — |
| Team & roles | ● | ● | — | — | — |
| Calling/engine/integrations settings | ● | ● | — | — | — |
| API keys & webhooks | ● | ● | — | — | — |
| Usage & billing | ● | ◐ view | — | — | — |
| Org delete / ownership transfer | ● | — | — | — | — |

Permission keys are strings like `leads.read`, `leads.write`, `campaigns.launch`, `agents.publish`, `review.resolve`, `analysis.rerun`, `compliance.manage`, `audit.read`, `settings.team`, `settings.billing`, `pii.read`. The server enforces them too; UI gating is convenience, not security.
