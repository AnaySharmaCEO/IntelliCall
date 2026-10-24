export interface LandingConversationState {
  known_facts: Array<{ label: string; value: string; known: boolean }>;
  objective: string;
  detected_intent: string | null;
  open_objection: string | null;
  next_question: string | null;
}

export interface TraceStep {
  id: string;
  label: string;
  description: string;
  order: number;
}

export interface EvidenceItem {
  id: string;
  call_id: string;
  decision_id: string;
  quote: string;
  signal: string;
  weight: 'high' | 'medium' | 'low';
  timestamp_seconds: number;
}

export interface LandingDecision {
  id: string;
  call_id: string;
  lead_id: string;
  campaign_id: string;
  outcome: 'qualified' | 'not_qualified' | 'review_required';
  confidence_score: number;
  confidence_tier: 'high' | 'medium' | 'low';
  reason: string;
  recommended_action: string;
  actual_action: string;
  action_status: string;
  overridden_by: string | null;
  evidence: EvidenceItem[];
  trace: TraceStep[];
  created_at: string;
  reviewed_at: string | null;
}

export const landingMockConversationState: LandingConversationState = {
  known_facts: [
    { label: 'Role', value: 'VP of Sales Development', known: true },
    { label: 'Team size', value: '18 outbound SDRs', known: true },
    { label: 'Current tool', value: 'Legacy manual dialer + spreadsheet notes', known: true },
    { label: 'Timeline', value: 'Active evaluation for Q3 rollout', known: true },
    { label: 'Tech stack', value: 'Salesforce + Outreach', known: true },
    { label: 'Budget allocated', value: 'Pending committee review', known: false },
  ],
  objective: 'Qualify outbound pipeline volume and assess interest in autonomous explainable qualification.',
  detected_intent: 'High intent — seeking transparent audit trails for SDR qualification.',
  open_objection: 'Security and compliance review required before connecting CRM.',
  next_question: 'Would a sandboxed test against historical call logs help clear your compliance review?',
};

export const landingMockEvidenceSnippet = {
  quote: "We waste nearly twenty hours a week trying to figure out why half the calls tagged 'uninterested' were actually good prospects who just asked for a callback next quarter.",
  signal: 'Explicit pain with black-box call labeling',
  weight: 'HIGH' as const,
};

export const landingMockEvidenceThread = [
  {
    role: 'Statement' as const,
    content: "Prospect: 'Our managers spend Fridays spot-checking recordings because nobody trusts the SDR qualification tags.'",
  },
  {
    role: 'Signal' as const,
    content: 'Detected lack of auditability in current workflow; executive review overhead identified as critical friction.',
  },
  {
    role: 'Decision' as const,
    content: 'System flags prospect as High Fit for Explainable AI Call qualification with direct Salesforce trace sync.',
  },
];

export const landingMockTraceSteps: TraceStep[] = [
  {
    id: 'trace-step-1',
    label: 'Transcript Speech-to-Intent Extraction',
    description: 'Identified verified prospect role (VP Sales Dev), active SDR team headcount (18 reps), and current pain with black-box call categorization.',
    order: 1,
  },
  {
    id: 'trace-step-2',
    label: 'Campaign Strategy Rule Evaluation',
    description: "Matched criteria for Campaign 'Mid-Market RevOps Outreach' (Headcount > 10, explicit workflow friction, authority to evaluate).",
    order: 2,
  },
  {
    id: 'trace-step-3',
    label: 'Evidence Weight & Grounding Check',
    description: 'Corroborated 3 explicit quote timestamps against acoustic engagement score (0.88 speech confidence, zero contradictory statements).',
    order: 3,
  },
  {
    id: 'trace-step-4',
    label: 'Confidence Scoring & Threshold Gate',
    description: 'Assigned 82% confidence score. Exceeds campaign autonomous action threshold (75%).',
    order: 4,
  },
  {
    id: 'trace-step-5',
    label: 'Autonomous Action Formulation',
    description: 'Generated meeting invite calendar slot reservation and staged personalized recap email with attached transcript citation snippet.',
    order: 5,
  },
];

export const landingMockDecision: LandingDecision = {
  id: 'dec-landing-demo',
  call_id: 'call-landing-sample',
  lead_id: 'lead-landing-sample',
  campaign_id: 'camp-landing-sample',
  outcome: 'qualified',
  confidence_score: 82,
  confidence_tier: 'high',
  reason: 'Prospect confirmed outbound team of 18 SDRs, actively seeks explainable call qualification to eliminate manual review overhead, and agreed to calendar review.',
  recommended_action: 'book_meeting',
  actual_action: 'book_meeting',
  action_status: 'executed',
  overridden_by: null,
  evidence: [
    {
      id: 'ev-landing-1',
      call_id: 'call-landing-sample',
      decision_id: 'dec-landing-demo',
      quote: "We waste nearly twenty hours a week trying to figure out why half the calls tagged 'uninterested' were actually good prospects.",
      signal: 'Explicit pain with black-box qualification',
      weight: 'high',
      timestamp_seconds: 74,
    },
    {
      id: 'ev-landing-2',
      call_id: 'call-landing-sample',
      decision_id: 'dec-landing-demo',
      quote: 'Send over a calendar invite for Thursday at 2 PM. I want my sales operations lead on the line as well.',
      signal: 'Direct meeting confirmation & buying team inclusion',
      weight: 'high',
      timestamp_seconds: 142,
    },
  ],
  trace: landingMockTraceSteps,
  created_at: '2026-09-06T10:00:00Z',
  reviewed_at: null,
};
