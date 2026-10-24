import { z } from "zod";
import { ActionTypeEnum } from "./enums";

export const EvidenceSpanSchema = z.object({
  segmentId: z.string(),
  quote: z.string(),
  startMs: z.number().optional(),
  endMs: z.number().optional(),
  speaker: z.enum(["agent", "lead", "system"]).optional(),
});
export type EvidenceSpan = z.infer<typeof EvidenceSpanSchema>;

export const QualificationAnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  answer: z.string(),
  isQualified: z.boolean(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(EvidenceSpanSchema).default([]),
});
export type QualificationAnswer = z.infer<typeof QualificationAnswerSchema>;

export const ExtractedFactSchema = z.object({
  key: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(100),
  evidence: z.array(EvidenceSpanSchema).default([]),
});
export type ExtractedFact = z.infer<typeof ExtractedFactSchema>;

export const ExtractedObjectionSchema = z.object({
  category: z.string(),
  objection: z.string(),
  agentResponse: z.string().optional(),
  resolved: z.boolean().default(false),
  evidence: z.array(EvidenceSpanSchema).default([]),
});
export type ExtractedObjection = z.infer<typeof ExtractedObjectionSchema>;

export const ProposedActionSchema = z.object({
  type: ActionTypeEnum,
  params: z.record(z.string(), z.unknown()).default({}),
  confidence: z.number().min(0).max(100),
  reason: z.string(),
  evidence: z.array(EvidenceSpanSchema).default([]),
});
export type ProposedAction = z.infer<typeof ProposedActionSchema>;

export const DecisionSchema = z.object({
  id: z.string(),
  type: z.string(),
  value: z.string(),
  modelConfidence: z.number().min(0).max(100),
  policyOutcome: z.enum(["auto_applied", "needs_review", "blocked"]),
  policyReason: z.string().optional(),
  evidence: z.array(EvidenceSpanSchema).default([]),
  recommendedAction: ActionTypeEnum.optional(),
  appliedAt: z.string().optional(),
});
export type Decision = z.infer<typeof DecisionSchema>;

export const ConversationAnalysisSchema = z.object({
  callId: z.string(),
  version: z.string().default("v1.0.0"),
  model: z.string().default("gemini-2.0-flash"),
  createdAt: z.string(),
  summary: z.array(z.string()),
  outcome: z.string(),
  intent: z.string(),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]).default("neutral"),
  qualificationScore: z.number().min(0).max(100).default(0),
  qualificationAnswers: z.array(QualificationAnswerSchema).default([]),
  facts: z.array(ExtractedFactSchema).default([]),
  objections: z.array(ExtractedObjectionSchema).default([]),
  proposedActions: z.array(ProposedActionSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
});
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;
