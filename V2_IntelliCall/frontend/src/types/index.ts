// ── Core entity types ──
// Shaped to match the future Supabase response contract exactly.

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "not_qualified"
  | "meeting_booked"
  | "meeting_attended"
  | "opportunity"
  | "converted"
  | "stalled";

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";

export type AgentStatus = "active" | "inactive" | "draft";

export type CallStatus =
  | "scheduled"
  | "calling"
  | "connected"
  | "processing"
  | "completed"
  | "failed"
  | "no_answer"
  | "voicemail";

export type DecisionOutcome = "qualified" | "not_qualified" | "review_required";

export type ConfidenceTier = "high" | "medium" | "low";

export type ActionType = "book_meeting" | "send_followup" | "update_status" | "escalate";

export type ActionStatus = "pending" | "executed" | "dismissed" | "failed";

export type OutcomeStage =
  | "qualified"
  | "meeting_booked"
  | "meeting_attended"
  | "opportunity"
  | "converted"
  | "stalled";

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_initials: string;
  organization_id: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: LeadStatus;
  campaign_id: string | null;
  owner_id: string | null;
  confidence_score: number | null;
  confidence_tier: ConfidenceTier | null;
  last_activity_at: string;
  created_at: string;
  notes: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  agent_id: string;
  confidence_threshold: number;
  leads_targeted: number;
  qualification_rate: number | null;
  meetings_booked: number;
  strategy: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  objective: string;
  language: string;
  voice: string;
  status: AgentStatus;
  qualification_goal: string;
  permitted_actions: ActionType[];
  created_at: string;
}

export interface Call {
  id: string;
  lead_id: string;
  campaign_id: string;
  agent_id: string;
  status: CallStatus;
  duration_seconds: number | null;
  decision_id: string | null;
  scheduled_for: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface TranscriptLine {
  id: string;
  call_id: string;
  speaker: "agent" | "prospect";
  text: string;
  timestamp_seconds: number;
  signals: string[];
}

export interface Evidence {
  id: string;
  call_id: string;
  decision_id: string;
  quote: string;
  signal: string;
  weight: "high" | "medium" | "low";
  timestamp_seconds: number;
}

export interface TraceStep {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface Decision {
  id: string;
  call_id: string;
  lead_id: string;
  campaign_id: string;
  outcome: DecisionOutcome;
  confidence_score: number;
  confidence_tier: ConfidenceTier;
  reason: string;
  recommended_action: ActionType;
  actual_action: ActionType | null;
  action_status: ActionStatus;
  overridden_by: string | null;
  evidence: Evidence[];
  trace: TraceStep[];
  created_at: string;
  reviewed_at: string | null;
}

export interface Action {
  id: string;
  decision_id: string;
  lead_id: string;
  type: ActionType;
  status: ActionStatus;
  executed_at: string | null;
  created_at: string;
}

export interface Outcome {
  id: string;
  lead_id: string;
  decision_id: string;
  campaign_id: string;
  stage: OutcomeStage;
  stalled: boolean;
  meeting_booked_at: string | null;
  meeting_attended_at: string | null;
  opportunity_created_at: string | null;
  converted_at: string | null;
  created_at: string;
}

// ── View-model helpers ──

export interface LeadWithRelations extends Lead {
  campaign?: Campaign;
  owner?: User;
  latest_decision?: Decision;
  latest_call?: Call;
  outcome?: Outcome;
}

export interface CallWithRelations extends Call {
  lead?: Lead;
  campaign?: Campaign;
  agent?: Agent;
  decision?: Decision;
  transcript?: TranscriptLine[];
}

export interface DecisionWithRelations extends Decision {
  lead?: Lead;
  campaign?: Campaign;
  call?: Call;
  outcomeRecord?: Outcome;
}
