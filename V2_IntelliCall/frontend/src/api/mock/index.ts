import type {
  ApiClient,
  CallFilterParams,
  LeadFilterParams,
  PaginatedResult,
  AnalyticsOverview,
} from '../client';
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
} from '../../contracts/entities';
import {
  MOCK_ORG,
  MOCK_AGENTS,
  MOCK_CAMPAIGNS,
  MOCK_LEADS,
  MOCK_CALLS,
  MOCK_ANALYSES,
  MOCK_COMPLIANCE_RULES,
  MOCK_PHONE_NUMBERS,
} from './data';

export class MockApiClient implements ApiClient {
  private org: Organization = { ...MOCK_ORG };
  private agents: Agent[] = [...MOCK_AGENTS];
  private campaigns: Campaign[] = [...MOCK_CAMPAIGNS];
  private leads: Lead[] = [...MOCK_LEADS];
  private calls: Call[] = [...MOCK_CALLS];
  private analyses: Record<string, CallAnalysis> = { ...MOCK_ANALYSES };
  private complianceRules: ComplianceRule[] = [...MOCK_COMPLIANCE_RULES];
  private phoneNumbers: PhoneNumber[] = [...MOCK_PHONE_NUMBERS];

  async listCalls(params?: CallFilterParams): Promise<PaginatedResult<Call>> {
    let result = [...this.calls];
    if (params?.status) {
      result = result.filter((c) => c.status === params.status);
    }
    if (params?.sentiment) {
      result = result.filter((c) => c.sentiment === params.sentiment);
    }
    if (params?.campaignId) {
      result = result.filter((c) => c.campaign_id === params.campaignId);
    }
    if (params?.agentId) {
      result = result.filter((c) => c.agent_id === params.agentId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter((c) => (c.transcript || '').toLowerCase().includes(q));
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const data = result.slice(start, start + pageSize);

    return {
      data,
      count: result.length,
      page,
      pageSize,
    };
  }

  async getCall(id: string): Promise<Call | null> {
    return this.calls.find((c) => c.id === id) || null;
  }

  async getCallAnalysis(callId: string): Promise<CallAnalysis | null> {
    return this.analyses[callId] || null;
  }

  async triggerAnalysis(callId: string): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    const existing = this.analyses[callId];
    if (existing) {
      return { success: true, analysisId: existing.id };
    }
    const newAnalysis: CallAnalysis = {
      id: `analysis-mock-${Date.now()}`,
      call_id: callId,
      summary: 'Automated post-call analysis completed by inline Gemini engine.',
      sentiment_overall: 'positive',
      intent_primary: 'general_query',
      intent_confidence: 0.88,
      resolution_status: 'resolved',
      satisfaction_score: 4,
      compliance_score: 0.95,
      action_items: [{ text: 'Log disposition in CRM', owner: 'system', status: 'completed' }],
      risk_signals: [],
      created_at: new Date().toISOString(),
    };
    this.analyses[callId] = newAnalysis;
    return { success: true, analysisId: newAnalysis.id };
  }

  async createCall(call: Partial<Call>): Promise<Call> {
    const newCall: any = {
      id: `call-${Date.now()}`,
      orgId: this.org.id,
      leadId: call.leadId || (call as any).lead_id,
      campaignId: call.campaignId || (call as any).campaign_id || null,
      agentId: call.agentId || (call as any).agent_id,
      status: (call as any).status || 'scheduled',
      direction: (call as any).direction || 'outbound',
      durationSeconds: 0,
      createdAt: new Date().toISOString(),
      ...call,
    };
    this.calls.unshift(newCall);
    return newCall;
  }

  async listAgents(): Promise<Agent[]> {
    return [...this.agents];
  }

  async getAgent(id: string): Promise<Agent | null> {
    return this.agents.find((a) => a.id === id) || null;
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      organization_id: this.org.id,
      name: agent.name || 'Untitled Agent',
      voice: agent.voice || 'Puck',
      voice_speed: agent.voice_speed ?? 1.0,
      voice_temperature: agent.voice_temperature ?? 0.3,
      ambient_sound: agent.ambient_sound || 'none',
      system_prompt: agent.system_prompt || '',
      greeting: agent.greeting || 'Hello!',
      language: agent.language || 'en-IN',
      status: agent.status || 'draft',
      metadata: agent.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.agents.push(newAgent);
    return newAgent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const idx = this.agents.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Agent ${id} not found`);
    this.agents[idx] = {
      ...this.agents[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.agents[idx];
  }

  async deleteAgent(id: string): Promise<void> {
    this.agents = this.agents.filter((a) => a.id !== id);
  }

  async listCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns];
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    return this.campaigns.find((c) => c.id === id) || null;
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      organization_id: this.org.id,
      name: campaign.name || 'New Campaign',
      status: campaign.status || 'draft',
      agent_id: campaign.agent_id,
      daily_budget: campaign.daily_budget,
      concurrency_limit: campaign.concurrency_limit ?? 5,
      calling_hours_start: campaign.calling_hours_start || '09:00',
      calling_hours_end: campaign.calling_hours_end || '18:00',
      timezone: campaign.timezone || 'Asia/Kolkata',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const idx = this.campaigns.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Campaign ${id} not found`);
    this.campaigns[idx] = {
      ...this.campaigns[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.campaigns[idx];
  }

  async listLeads(params?: LeadFilterParams): Promise<PaginatedResult<Lead>> {
    let result = [...this.leads];
    if (params?.campaignId) {
      result = result.filter((l) => l.campaign_id === params.campaignId);
    }
    if (params?.status) {
      result = result.filter((l) => l.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.first_name.toLowerCase().includes(q) ||
          (l.last_name || '').toLowerCase().includes(q) ||
          l.phone.includes(q)
      );
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;

    return {
      data: result.slice(start, start + pageSize),
      count: result.length,
      page,
      pageSize,
    };
  }

  async getLead(id: string): Promise<Lead | null> {
    return this.leads.find((l) => l.id === id) || null;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      organization_id: this.org.id,
      campaign_id: lead.campaign_id,
      first_name: lead.first_name || 'Prospect',
      last_name: lead.last_name,
      phone: lead.phone || '+910000000000',
      email: lead.email,
      status: lead.status || 'pending',
      custom_fields: lead.custom_fields || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.leads.push(newLead);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Lead ${id} not found`);
    this.leads[idx] = {
      ...this.leads[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.leads[idx];
  }

  async deleteLead(id: string): Promise<void> {
    this.leads = this.leads.filter((l) => l.id !== id);
  }

  async listComplianceRules(): Promise<ComplianceRule[]> {
    return [...this.complianceRules];
  }

  async createComplianceRule(rule: Partial<ComplianceRule>): Promise<ComplianceRule> {
    const newRule: ComplianceRule = {
      id: `rule-${Date.now()}`,
      organization_id: this.org.id,
      name: rule.name || 'New Rule',
      rule_type: rule.rule_type || 'required_phrase',
      description: rule.description,
      threshold: rule.threshold ?? 0.85,
      action_on_violation: rule.action_on_violation || 'flag',
      is_active: rule.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.complianceRules.push(newRule);
    return newRule;
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule> {
    const idx = this.complianceRules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Rule ${id} not found`);
    this.complianceRules[idx] = {
      ...this.complianceRules[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.complianceRules[idx];
  }

  async deleteComplianceRule(id: string): Promise<void> {
    this.complianceRules = this.complianceRules.filter((r) => r.id !== id);
  }

  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    return [...this.phoneNumbers];
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const totalCalls = this.calls.length;
    const totalDuration = this.calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
    const avgDuration = totalCalls ? Math.round(totalDuration / totalCalls) : 0;

    const recentTrends = Array.from({ length: 5 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (4 - idx));
      const dateStr = d.toISOString().slice(0, 10);
      return {
        date: dateStr,
        calls: 12 + idx * 6,
        conversions: 3 + idx * 2,
        avgSentimentScore: 78 + idx * 3,
      };
    });

    return {
      totalCalls,
      totalDurationSeconds: totalDuration,
      avgDurationSeconds: avgDuration,
      sentimentBreakdown: {
        positive: this.calls.filter((c) => c.sentiment === 'positive').length,
        neutral: this.calls.filter((c) => c.sentiment === 'neutral').length,
        negative: this.calls.filter((c) => c.sentiment === 'negative').length,
        mixed: this.calls.filter((c) => c.sentiment === 'mixed').length,
      },
      funnelMetrics: {
        connected: totalCalls,
        engaged: this.calls.filter((c) => (c.duration_seconds || 0) > 30).length,
        converted: this.leads.filter((l) => l.status === 'converted').length,
        dropped: this.calls.filter((c) => (c.duration_seconds || 0) < 30).length,
      },
      telemetry: {
        ttfbMs: 280,
        roundtripMs: 410,
        disconnectRatePercent: 3.2,
        avgSentimentScorePercent: 88,
      },
      recentTrends,
    };
  }

  // --- APPOINTMENTS ---
  private appointments: Appointment[] = [
    {
      id: 'apt-001',
      orgId: 'org-default',
      leadId: 'lead-001',
      title: 'Sign Loan Agreement Documents',
      scheduledFor: '2026-10-20T14:00:00Z',
      durationMinutes: 30,
      status: 'confirmed',
      hostName: 'Vikram Malhotra',
      source: 'AI Agent',
      createdAt: '2026-10-18T10:00:00Z',
    },
    {
      id: 'apt-002',
      orgId: 'org-default',
      leadId: 'lead-002',
      title: 'Fixed Deposit Advisory Callback',
      scheduledFor: '2026-10-21T11:30:00Z',
      durationMinutes: 15,
      status: 'proposed',
      hostName: 'Rohit Verma',
      source: 'AI Agent',
      createdAt: '2026-10-18T11:00:00Z',
    },
    {
      id: 'apt-003',
      orgId: 'org-default',
      leadId: 'lead-003',
      title: 'Fee Reversal Verification',
      scheduledFor: '2026-10-20T16:00:00Z',
      durationMinutes: 45,
      status: 'confirmed',
      hostName: 'Anita Deshmukh',
      source: 'AI Agent',
      createdAt: '2026-10-19T09:00:00Z',
    },
  ];

  async listAppointments(status?: string): Promise<Appointment[]> {
    if (status) {
      return this.appointments.filter((a) => a.status === status);
    }
    return [...this.appointments];
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    return this.appointments.find((a) => a.id === id) || null;
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<Appointment> {
    const newApt: Appointment = {
      id: appointment.id || `apt-${Date.now()}`,
      orgId: this.org.id,
      leadId: appointment.leadId || 'lead-default',
      title: appointment.title || 'Follow-up Call',
      scheduledFor: appointment.scheduledFor || new Date().toISOString(),
      durationMinutes: appointment.durationMinutes || 30,
      status: (appointment.status as any) || 'confirmed',
      hostName: appointment.hostName || 'Sales Representative',
      source: appointment.source || 'Manual Schedule',
      createdAt: new Date().toISOString(),
    };
    this.appointments.unshift(newApt);
    return newApt;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const index = this.appointments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Appointment not found');
    this.appointments[index] = { ...this.appointments[index], ...updates };
    return this.appointments[index];
  }

  async deleteAppointment(id: string): Promise<void> {
    this.appointments = this.appointments.filter((a) => a.id !== id);
  }

  // --- BULK LEADS ---
  async createLeadsBulk(newLeads: Partial<Lead>[]): Promise<{ count: number; leads: Lead[] }> {
    const created: Lead[] = newLeads.map((l, i) => ({
      id: `lead-bulk-${Date.now()}-${i}`,
      organization_id: this.org.id,
      first_name: l.first_name || 'Prospect',
      last_name: l.last_name || '',
      phone: l.phone || '+91 99999 99999',
      email: l.email || undefined,
      campaign_id: l.campaign_id,
      status: l.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    this.leads = [...created, ...this.leads];
    return { count: created.length, leads: created };
  }

  async getOrganization(): Promise<Organization | null> {
    return this.org;
  }

  async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
    this.org = {
      ...this.org,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.org;
  }

  async listMembers(): Promise<Array<{ id: string; email: string; role: string; name: string }>> {
    return [
      { id: 'mem-1', email: 'anay@resonology.ai', role: 'owner', name: 'Anay Sharma' },
      { id: 'mem-2', email: 'sam@resonology.ai', role: 'admin', name: 'Sam Chen' },
      { id: 'mem-3', email: 'operator@resonology.ai', role: 'agent_operator', name: 'Rajesh Kumar' },
    ];
  }

  async inviteMember(email: string, role: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }
}
