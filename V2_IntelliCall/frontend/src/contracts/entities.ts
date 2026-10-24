import { z } from "zod";
import {
  LeadStageEnum,
  QualificationStatusEnum,
  CallStatusEnum,
  AnalysisStatusEnum,
  CampaignStatusEnum,
  AppointmentStatusEnum,
  TaskStatusEnum,
  ReviewItemStatusEnum,
  ActionTypeEnum,
  ActionStatusEnum,
  ComplianceStatusEnum,
  LangEnum,
} from "./enums";
import { ConversationAnalysisSchema, DecisionSchema, EvidenceSpanSchema } from "./analysis";

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  industry: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
  locale: z.string().default("en-IN"),
  plan: z.string().default("demo"),
  onboardingCompleted: z.boolean().default(false),
  onboardingProgress: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarInitials: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const MembershipSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(["owner", "admin", "manager", "agent_operator", "viewer"]),
  status: z.enum(["active", "invited", "deactivated"]).default("active"),
  createdAt: z.string(),
});
export type Membership = z.infer<typeof MembershipSchema>;

export const LeadSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string().optional(),
  company: z.string().default(""),
  title: z.string().default(""),
  phone: z.string(),
  email: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("IN"),
  source: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  stage: LeadStageEnum.default("new"),
  qualification: QualificationStatusEnum.default("unknown"),
  languagePref: LangEnum.default("auto"),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.string(), z.unknown()).default({}),
  compliance: z
    .object({
      dndStatus: ComplianceStatusEnum.default("unknown"),
      dndCheckedAt: z.string().optional(),
      consentType: z.enum(["explicit", "inferred", "imported", "none"]).default("none"),
      consentExpiresAt: z.string().optional(),
      suppressed: z.boolean().default(false),
    })
    .default({
      dndStatus: "unknown",
      consentType: "none",
      suppressed: false,
    }),
  // Pipeline / Kanban fields (added in migration 20261022000001)
  estimatedValue: z.number().default(0),
  nextAction: z.string().optional(),
  stageEnteredAt: z.string().optional(),
  // Computed client-side from stageEnteredAt (not stored)
  daysInStage: z.number().optional(),
  lastCallAt: z.string().optional(),
  lastOutcome: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const QualificationCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().default(true),
  ruleType: z.enum(["yesno", "numeric_min", "choice", "text"]),
  targetValue: z.unknown().optional(),
});
export type QualificationCriterion = z.infer<typeof QualificationCriterionSchema>;

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  objective: z.string(),
  status: CampaignStatusEnum.default("draft"),
  agentId: z.string().uuid(),
  agentVersion: z.string().default("v1"),
  languages: z.array(LangEnum).default(["en-IN"]),
  autoSwitchLanguage: z.boolean().default(true),
  criteria: z.array(QualificationCriterionSchema).default([]),
  rules: z.object({
    windowStart: z.string().default("10:00"),
    windowEnd: z.string().default("19:00"),
    timezone: z.string().default("Asia/Kolkata"),
    concurrency: z.number().default(3),
    maxAttempts: z.number().default(2),
    retryGapMinutes: z.number().default(60),
    budgetCapPaise: z.number().optional(),
  }),
  metrics: z
    .object({
      leadsTargeted: z.number().default(0),
      callsAttempted: z.number().default(0),
      callsConnected: z.number().default(0),
      leadsQualified: z.number().default(0),
      appointmentsBooked: z.number().default(0),
    })
    .default({
      leadsTargeted: 0,
      callsAttempted: 0,
      callsConnected: 0,
      leadsQualified: 0,
      appointmentsBooked: 0,
    }),
  createdAt: z.string(),
  launchedAt: z.string().optional(),
  strategy: z.string().default("direct_qualification"),
  strategyConfig: z
    .object({
      companyName: z.string().optional(),
      company_name: z.string().optional(),
      motto: z.string().optional(),
      offer: z.string().optional(),
      targetAudience: z.string().optional(),
      target_audience: z.string().optional(),
      primaryPainPoint: z.string().optional(),
      primary_pain_point: z.string().optional(),
      valueGap: z.string().optional(),
      value_gap: z.string().optional(),
      qualifyingQuestions: z.array(z.string()).default([]),
      qualifying_questions: z.array(z.string()).optional(),
      objectionPlaybook: z.record(z.string(), z.string()).default({}),
      objection_playbook: z.record(z.string(), z.string()).optional(),
    })
    .default({}),
  companyName: z.string().default("FinEdge Capital"),
  company_name: z.string().optional(),
  motto: z.string().default("reducing vehicle financing rates from 14% down to 8.4%"),
  offer: z.string().default("a complimentary 5-minute portfolio interest audit this Thursday"),
  primaryPainPoint: z.string().default("Paying predatory double-digit interest rates on vehicle loans"),
  primary_pain_point: z.string().optional(),
  valueGap: z.string().default("₹4,200/month in avoidable interest overpayments"),
  value_gap: z.string().optional(),
  qualificationQuestions: z.array(z.string()).default([
    "What interest rate are you currently paying on your primary vehicle loan?",
    "Has your vehicle been registered for over 12 months with clean repayment?",
  ]),
  qualification_questions: z.array(z.string()).optional(),
  objectionPlaybook: z.record(z.string(), z.string()).default({
    busy: "Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?",
    skeptical: "Aapne hamare partner network par rate comparison browse kiya tha. Main bas verify kar raha tha ki aapko fair rate mila ya nahi.",
    not_interested: "Totally understand! Would you be opposed to keeping our contact handy for when your loan renewal comes up?",
  }),
  objection_playbook: z.record(z.string(), z.string()).optional(),
  targetAudience: z.string().default("Vehicle loan holders with >12% interest"),
  target_audience: z.string().optional(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const AgentTacticsSchema = z.object({
  vossEmpathy: z.boolean().default(true),
  law4Brevity: z.boolean().default(true),
  noOrientedClose: z.boolean().default(true),
  linguisticMirroring: z.boolean().default(true),
});
export type AgentTactics = z.infer<typeof AgentTacticsSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string(),
  description: z.string().default(""),
  status: z.enum(["draft", "published", "active", "inactive", "archived"]).default("active"),
  activeVersion: z.string().default("v1.0.0"),
  primaryLanguage: LangEnum.default("en-IN"),
  language: z.string().default("en-IN"),
  voiceId: z.string().default("Aoede"),
  voice: z.string().default("Aoede"),
  voice_model: z.string().optional(),
  voiceModel: z.string().default("Aoede"),
  roleTitle: z.string().default("Senior Growth Consultant"),
  role_title: z.string().optional(),
  brevityWords: z.number().default(25),
  brevity_words: z.number().optional(),
  tactics: AgentTacticsSchema.default({
    vossEmpathy: true,
    law4Brevity: true,
    noOrientedClose: true,
    linguisticMirroring: true,
  }),
  systemPrompt: z.string().default("You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct."),
  system_prompt: z.string().optional(),
  greeting: z.string().default("Namaste, this is {{agent_name}} calling. Do you have a quick minute?"),
  voiceSpeed: z.number().default(1.0),
  voice_speed: z.number().optional(),
  voiceTemperature: z.number().default(0.7),
  voice_temperature: z.number().optional(),
  communicationStyle: z.string().default("consultative"),
  communication_style: z.string().optional(),
  createdAt: z.string(),
});
export type Agent = z.infer<typeof AgentSchema>;

export const TranscriptSegmentSchema = z.object({
  id: z.string(),
  callId: z.string().uuid(),
  speaker: z.enum(["agent", "lead", "system"]),
  startMs: z.number(),
  endMs: z.number(),
  language: LangEnum.default("en-IN"),
  text: z.string(),
  textRoman: z.string().optional(),
  isFinal: z.boolean().default(true),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

export const CallSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  leadId: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid(),
  agentVersion: z.string().default("v1"),
  channel: z.enum(["web_demo", "pstn"]).default("web_demo"),
  leadMode: z.enum(["human_in_browser", "scripted_replay", "simulated_persona", "phone"]).default("human_in_browser"),
  language: LangEnum.default("en-IN"),
  status: CallStatusEnum.default("queued"),
  analysisStatus: AnalysisStatusEnum.default("pending"),
  durationSeconds: z.number().default(0),
  recordingUrl: z.string().nullable().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  attempt: z.number().default(1),
  analysis: ConversationAnalysisSchema.optional(),
  createdAt: z.string(),
});
export type Call = z.infer<typeof CallSchema>;

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  leadId: z.string().uuid(),
  callId: z.string().uuid().nullable().optional(),
  title: z.string(),
  scheduledFor: z.string(),
  durationMinutes: z.number().default(30),
  status: AppointmentStatusEnum.default("proposed"),
  hostName: z.string().default("Sales Representative"),
  source: z.string().default("AI Agent"),
  meetingUrl: z.string().optional(),
  createdAt: z.string(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  leadId: z.string().uuid(),
  title: z.string(),
  type: z.enum(["callback", "manual_review", "document_send", "custom"]).default("callback"),
  dueAt: z.string(),
  status: TaskStatusEnum.default("open"),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const ReviewItemSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  callId: z.string().uuid(),
  leadId: z.string().uuid(),
  reason: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: ReviewItemStatusEnum.default("open"),
  decisions: z.array(DecisionSchema).default([]),
  evidence: z.array(EvidenceSpanSchema).default([]),
  assignedTo: z.string().optional(),
  resolutionNote: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["info", "warning", "error", "success"]).default("info"),
  link: z.string().optional(),
  read: z.boolean().default(false),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  actorName: z.string(),
  actorRole: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export interface CallAnalysis {
  id: string;
  call_id: string;
  summary: string;
  sentiment_overall: string;
  intent_primary: string;
  intent_confidence: number;
  resolution_status: string;
  satisfaction_score: number;
  compliance_score: number;
  action_items?: Array<{ text: string; owner: string; status: string; due_date?: string }>;
  risk_signals?: Array<{ signal: string; severity: string; evidence: string; timestamp_seconds: number }>;
  entities_extracted?: Record<string, string>;
  created_at: string;
}
