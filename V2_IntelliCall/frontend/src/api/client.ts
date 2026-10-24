import type {
  Call,
  Agent,
  Campaign,
  Lead,
  Appointment,
  ComplianceRule,
  PhoneNumber,
  CallAnalysis,
  Organization,
} from '../contracts/entities';

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface CallFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sentiment?: string;
  campaignId?: string;
  agentId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
}

export interface LeadFilterParams {
  page?: number;
  pageSize?: number;
  status?: string;
  campaignId?: string;
  search?: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number; mixed: number };
  funnelMetrics: { connected: number; engaged: number; converted: number; dropped: number };
  telemetry: {
    ttfbMs: number | null;
    roundtripMs: number | null;
    disconnectRatePercent: number | null;
    avgSentimentScorePercent: number | null;
  };
  recentTrends: Array<{
  date: string;
  calls: number;
  conversions: number | null;
  avgSentimentScore: number | null;
}>;
}

export interface ApiClient {
  // Calls
  listCalls(params?: CallFilterParams): Promise<PaginatedResult<Call>>;
  getCall(id: string): Promise<Call | null>;
  getCallAnalysis(callId: string): Promise<CallAnalysis | null>;
  triggerAnalysis(callId: string): Promise<{ success: boolean; analysisId?: string; error?: string }>;
  createCall(call: Partial<Call>): Promise<Call>;

  // Agents
  listAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  createAgent(agent: Partial<Agent>): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: string): Promise<void>;

  // Campaigns
  listCampaigns(): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | null>;
  createCampaign(campaign: Partial<Campaign>): Promise<Campaign>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign>;

  // Leads
  listLeads(params?: LeadFilterParams): Promise<PaginatedResult<Lead>>;
  getLead(id: string): Promise<Lead | null>;
  createLead(lead: Partial<Lead>): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;

  // Appointments
  listAppointments(status?: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | null>;
  createAppointment(appointment: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Leads Bulk
  createLeadsBulk(leads: Partial<Lead>[]): Promise<{ count: number; leads: Lead[] }>;

  // Compliance
  listComplianceRules(): Promise<ComplianceRule[]>;
  createComplianceRule(rule: Partial<ComplianceRule>): Promise<ComplianceRule>;
  updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule>;
  deleteComplianceRule(id: string): Promise<void>;

  // Numbers
  listPhoneNumbers(): Promise<PhoneNumber[]>;

  // Analytics
  getAnalyticsOverview(): Promise<AnalyticsOverview>;

  // Organization & Members
  getOrganization(): Promise<Organization | null>;
  updateOrganization(updates: Partial<Organization>): Promise<Organization>;
  listMembers(): Promise<Array<{ id: string; email: string; role: string; name: string }>>;
  inviteMember(email: string, role: string): Promise<{ success: boolean; error?: string }>;
}
