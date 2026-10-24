import { z } from "zod";

export const LeadStageEnum = z.enum([
  "new",
  "contacted",
  "qualifying",
  "qualified",
  "meeting_proposed",
  "meeting_booked",
  "nurture",
  "disqualified",
  "do_not_call",
]);
export type LeadStage = z.infer<typeof LeadStageEnum>;

export const QualificationStatusEnum = z.enum([
  "unknown",
  "in_progress",
  "qualified",
  "not_qualified",
  "needs_review",
]);
export type QualificationStatus = z.infer<typeof QualificationStatusEnum>;

export const CallStatusEnum = z.enum([
  "queued",
  "dialing",
  "ringing",
  "in_progress",
  "completed",
  "no_answer",
  "busy",
  "voicemail",
  "failed",
  "blocked_compliance",
  "cancelled",
]);
export type CallStatus = z.infer<typeof CallStatusEnum>;

export const AnalysisStatusEnum = z.enum([
  "pending",
  "analyzing",
  "complete",
  "failed",
]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusEnum>;

export const CampaignStatusEnum = z.enum([
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "stopped",
  "failed_preflight",
]);
export type CampaignStatus = z.infer<typeof CampaignStatusEnum>;

export const AppointmentStatusEnum = z.enum([
  "proposed",
  "confirmed",
  "rescheduled",
  "completed",
  "no_show",
  "cancelled",
  "booking_failed",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

export const TaskStatusEnum = z.enum([
  "open",
  "due_soon",
  "overdue",
  "completed",
  "cancelled",
]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const ReviewItemStatusEnum = z.enum([
  "open",
  "in_review",
  "approved",
  "corrected",
  "rejected",
  "auto_resolved",
]);
export type ReviewItemStatus = z.infer<typeof ReviewItemStatusEnum>;

export const ActionTypeEnum = z.enum([
  "book_meeting",
  "schedule_callback",
  "update_lead_stage",
  "mark_do_not_call",
  "send_followup",
  "escalate_to_human",
]);
export type ActionType = z.infer<typeof ActionTypeEnum>;

export const ActionStatusEnum = z.enum([
  "proposed",
  "executing",
  "succeeded",
  "failed",
  "retrying",
  "skipped_by_policy",
]);
export type ActionStatus = z.infer<typeof ActionStatusEnum>;

export const ComplianceStatusEnum = z.enum([
  "clear",
  "dnd",
  "no_consent",
  "outside_window",
  "suppressed",
  "unknown",
]);
export type ComplianceStatus = z.infer<typeof ComplianceStatusEnum>;

export const LangEnum = z.enum(["en-IN", "hi-IN", "auto"]);
export type Lang = z.infer<typeof LangEnum>;
