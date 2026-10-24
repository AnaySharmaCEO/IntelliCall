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
import { supabase } from '../../lib/supabase';

function mapAppointmentRecord(row: any): Appointment {
  const meta = (typeof row.metadata === 'object' && row.metadata !== null) ? row.metadata : {};
  return {
    id: row.id,
    orgId: row.organization_id || row.orgId,
    leadId: row.lead_id || row.leadId,
    callId: row.call_id || row.callId || null,
    title: meta.title || row.notes || 'Callback Appointment',
    scheduledFor: row.scheduled_for || row.scheduledFor || '',
    durationMinutes: Number(meta.duration_minutes || meta.durationMinutes) || 30,
    status: (row.status === 'scheduled' || row.status === 'confirmed') ? 'confirmed' : (row.status || 'proposed'),
    hostName: meta.host_name || meta.hostName || 'Sales Representative',
    source: row.booking_source || meta.source || 'Dashboard Manual',
    meetingUrl: meta.meeting_url || meta.meetingUrl,
    createdAt: row.created_at || row.createdAt || '',
  };
}

const VALID_LEAD_STATUSES = new Set([
  'new',
  'queued',
  'contacted',
  'qualified',
  'not_qualified',
  'meeting_booked',
  'meeting_attended',
  'opportunity',
  'converted',
  'stalled',
]);

const LEAD_STATUS_FALLBACK_MAP: Record<string, string> = {
  pending: 'new',
  uncontacted: 'new',
  qualifying: 'contacted',
  in_progress: 'contacted',
  meeting_proposed: 'contacted',
  callback_requested: 'contacted',
  disqualified: 'not_qualified',
  unqualified: 'not_qualified',
  nurture: 'stalled',
  do_not_call: 'stalled',
  dnd: 'stalled',
  lost: 'stalled',
};

function normalizeLeadStatus(status?: string, defaultForMissing?: string): string {
  if (status === undefined || status === null || String(status).trim() === '') {
    if (defaultForMissing !== undefined) return defaultForMissing;
    throw new Error('Lead status cannot be empty.');
  }
  const trimmed = String(status).trim().toLowerCase();
  if (VALID_LEAD_STATUSES.has(trimmed)) return trimmed;
  if (LEAD_STATUS_FALLBACK_MAP[trimmed]) return LEAD_STATUS_FALLBACK_MAP[trimmed];

  throw new Error(
    `Unsupported lead status: '${status}'. Supported statuses are: ${Array.from(VALID_LEAD_STATUSES).join(', ')}.`
  );
}

function mapLeadRecord(row: any): Lead {
  const rawName = String(row.name || '').trim();
  const parts = rawName.split(/\s+/);
  const firstName = row.first_name || (parts.length > 0 && parts[0] ? parts[0] : 'Lead');
  const lastName = row.last_name || (parts.length > 1 ? parts.slice(1).join(' ') : undefined);
  const normalizedStatus = normalizeLeadStatus(row.status, 'new');

  return {
    id: row.id,
    orgId: row.organization_id || row.orgId,
    firstName,
    lastName,
    name: rawName || [firstName, lastName].filter(Boolean).join(' '),
    company: row.company || '',
    title: row.title || '',
    phone: row.phone || '',
    email: row.email || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    country: row.country || 'IN',
    source: row.source || 'manual',
    ownerId: row.owner_id || row.ownerId || null,
    stage: normalizedStatus as any,
    status: normalizedStatus as any,
    qualification: row.qualification || 'unknown',
    languagePref: row.language_pref || row.languagePref || 'auto',
    tags: Array.isArray(row.tags) ? row.tags : [],
    customFields: (typeof row.custom_fields === 'object' && row.custom_fields !== null)
      ? row.custom_fields
      : (typeof row.customFields === 'object' && row.customFields !== null ? row.customFields : {}),
    compliance: row.compliance || {
      dndStatus: 'unknown',
      consentType: 'none',
      suppressed: false,
    },
    lastCallAt: row.last_call_at || row.lastCallAt,
    lastOutcome: row.last_outcome || row.lastOutcome,
    nextFollowUpAt: row.next_follow_up_at || row.nextFollowUpAt,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt,
    campaignId: row.campaign_id || row.campaignId,
    // Database schema properties genuinely needed by UI components
    confidenceScore: row.confidence_score !== undefined ? Number(row.confidence_score) : undefined,
    confidenceTier: row.confidence_tier || undefined,
    notes: row.notes || undefined,
    lastActivityAt: row.last_activity_at || row.lastActivityAt,
    // Pipeline / Kanban fields
    estimatedValue: row.estimated_value !== undefined ? Number(row.estimated_value) : 0,
    nextAction: row.next_action || row.nextAction || undefined,
    stageEnteredAt: row.stage_entered_at || row.stageEnteredAt || undefined,
    daysInStage: (() => {
      const entered = row.stage_entered_at || row.stageEnteredAt;
      if (!entered) return 0;
      const ms = Date.now() - new Date(entered).getTime();
      return Math.floor(ms / (1000 * 60 * 60 * 24));
    })(),
  } as unknown as Lead;
}

function mapAgentRecord(row: any): Agent {
  const tactics = row.tactics || {};
  return {
    id: row.id,
    orgId: row.organization_id || row.orgId,
    name: row.name || 'AI Voice Agent',
    description: row.description || row.objective || '',
    status: row.status || 'active',
    activeVersion: row.active_version || 'v1.0.0',
    primaryLanguage: row.language || 'en-IN',
    language: row.language || 'en-IN',
    voiceId: row.voice_model || row.voice || 'Aoede',
    voice: row.voice_model || row.voice || 'Aoede',
    voiceModel: row.voice_model || row.voice || 'Aoede',
    voice_model: row.voice_model || row.voice || 'Aoede',
    roleTitle: row.role_title || row.objective || 'Senior Growth Consultant',
    role_title: row.role_title || row.objective || 'Senior Growth Consultant',
    brevityWords: Number(row.brevity_words) || 25,
    brevity_words: Number(row.brevity_words) || 25,
    tactics: {
      vossEmpathy: tactics.voss_empathy ?? tactics.vossEmpathy ?? true,
      law4Brevity: tactics.law4_brevity ?? tactics.law4Brevity ?? true,
      noOrientedClose: tactics.no_oriented_close ?? tactics.noOrientedClose ?? true,
      linguisticMirroring: tactics.linguistic_mirroring ?? tactics.linguisticMirroring ?? true,
    },
    systemPrompt: row.system_prompt || 'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.',
    system_prompt: row.system_prompt || 'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.',
    greeting: row.greeting || 'Namaste, this is {{agent_name}} calling. Do you have a quick minute?',
    voiceSpeed: Number(row.voice_speed) || 1.0,
    voice_speed: Number(row.voice_speed) || 1.0,
    voiceTemperature: Number(row.voice_temperature) || 0.7,
    voice_temperature: Number(row.voice_temperature) || 0.7,
    communicationStyle: row.communication_style || 'consultative',
    communication_style: row.communication_style || 'consultative',
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  } as unknown as Agent;
}

function mapCampaignRecord(row: any): Campaign {
  return {
    id: row.id,
    orgId: row.organization_id || row.orgId,
    name: row.name,
    objective: row.objective || row.strategy || 'direct_qualification',
    status: row.status || 'draft',
    agentId: row.agent_id || row.agentId,
    agentVersion: row.agent_version || row.agentVersion || 'v1',
    languages: row.languages || ['en-IN'],
    autoSwitchLanguage: row.auto_switch_language ?? row.autoSwitchLanguage ?? true,
    criteria: row.criteria || [],
    rules: {
      windowStart: row.calling_hours_start || row.rules?.windowStart || '09:00',
      windowEnd: row.calling_hours_end || row.rules?.windowEnd || '18:00',
      timezone: row.timezone || row.rules?.timezone || 'Asia/Kolkata',
      concurrency: Number(row.concurrency_limit || row.rules?.concurrency) || 5,
      maxAttempts: row.rules?.maxAttempts || 2,
      retryGapMinutes: row.rules?.retryGapMinutes || 60,
      budgetCapPaise: row.daily_budget
        ? Number(row.daily_budget) * 100
        : (row.rules?.budgetCapPaise || 500000),
    },
    metrics: {
      leadsTargeted: Number(row.leads_targeted || row.metrics?.leadsTargeted) || 0,
      callsAttempted: Number(row.metrics?.callsAttempted) || 0,
      callsConnected: Number(row.metrics?.callsConnected) || 0,
      leadsQualified: Number(row.metrics?.leadsQualified) || 0,
      appointmentsBooked: Number(row.meetings_booked || row.metrics?.appointmentsBooked) || 0,
    },
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    launchedAt: row.launched_at || row.launchedAt,
    // Database fields genuinely needed by UI components
    strategy: row.strategy || 'direct_qualification',
    companyName: row.company_name || row.strategy_config?.company_name || row.strategy_config?.companyName || 'FinEdge Capital',
    company_name: row.company_name || row.strategy_config?.company_name || row.strategy_config?.companyName || 'FinEdge Capital',
    motto: row.motto || row.strategy_config?.motto || 'reducing vehicle financing rates from 14% down to 8.4%',
    offer: row.offer || row.strategy_config?.offer || 'a complimentary 5-minute portfolio interest audit this Thursday',
    primaryPainPoint: row.primary_pain_point || row.strategy_config?.primary_pain_point || row.strategy_config?.primaryPainPoint || 'Paying predatory double-digit interest rates on vehicle loans',
    valueGap: row.value_gap || row.strategy_config?.value_gap || row.strategy_config?.valueGap || '₹4,200/month in avoidable interest overpayments',
    qualificationQuestions: row.qualification_questions || row.strategy_config?.qualifying_questions || row.strategy_config?.qualifyingQuestions || [
      'What interest rate are you currently paying on your primary vehicle loan?',
      'Has your vehicle been registered for over 12 months with clean repayment?',
    ],
    objectionPlaybook: row.objection_playbook || row.strategy_config?.objection_playbook || row.strategy_config?.objectionPlaybook || {
      busy: 'Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?',
      skeptical: 'Aapne hamare partner network par rate comparison check kiya tha. Main bas confirm kar raha tha ki aapko fair rate mila ya nahi.',
      not_interested: 'Totally understand! Would you be opposed if I just kept your contact handy for when your loan renewal comes up?',
    },
    targetAudience: row.target_audience || row.strategy_config?.target_audience || 'Vehicle loan holders with >12% interest',
    strategyConfig: {
      companyName: row.company_name || row.strategy_config?.companyName || row.strategy_config?.company_name || 'FinEdge Capital',
      company_name: row.company_name || row.strategy_config?.company_name || row.strategy_config?.companyName || 'FinEdge Capital',
      motto: row.motto || row.strategy_config?.motto || 'reducing vehicle financing rates from 14% down to 8.4%',
      offer: row.offer || row.strategy_config?.offer || 'a complimentary 5-minute portfolio interest audit this Thursday',
      primaryPainPoint: row.primary_pain_point || row.strategy_config?.primaryPainPoint || row.strategy_config?.primary_pain_point || '',
      primary_pain_point: row.primary_pain_point || row.strategy_config?.primary_pain_point || row.strategy_config?.primaryPainPoint || '',
      valueGap: row.value_gap || row.strategy_config?.valueGap || row.strategy_config?.value_gap_statement || row.strategy_config?.value_gap || '',
      value_gap_statement: row.value_gap || row.strategy_config?.value_gap_statement || row.strategy_config?.value_gap || '',
      qualifyingQuestions: row.qualification_questions || row.strategy_config?.qualifyingQuestions || row.strategy_config?.qualifying_questions || [],
      qualifying_questions: row.qualification_questions || row.strategy_config?.qualifying_questions || row.strategy_config?.qualifyingQuestions || [],
      objectionPlaybook: row.objection_playbook || row.strategy_config?.objectionPlaybook || row.strategy_config?.objection_playbook || {},
      objection_playbook: row.objection_playbook || row.strategy_config?.objection_playbook || row.strategy_config?.objectionPlaybook || {},
      targetAudience: row.target_audience || row.strategy_config?.targetAudience || row.strategy_config?.target_audience || '',
      target_audience: row.target_audience || row.strategy_config?.target_audience || row.strategy_config?.targetAudience || '',
      ...(row.strategy_config || row.strategyConfig || {}),
    },
    confidenceThreshold: row.confidence_threshold !== undefined ? Number(row.confidence_threshold) : 80,
    daily_budget: row.daily_budget ? Number(row.daily_budget) : undefined,
    concurrency_limit: row.concurrency_limit ? Number(row.concurrency_limit) : undefined,
    calling_hours_start: row.calling_hours_start,
    calling_hours_end: row.calling_hours_end,
  } as unknown as Campaign;
}

export class SupabaseApiClient implements ApiClient {
  async listCalls(params?: CallFilterParams): Promise<PaginatedResult<Call>> {
    let query = supabase.from('calls').select('*', { count: 'exact' });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.sentiment) {
      query = query.eq('sentiment', params.sentiment);
    }
    if (params?.campaignId) {
      query = query.eq('campaign_id', params.campaignId);
    }
    if (params?.agentId) {
      query = query.eq('agent_id', params.agentId);
    }
    if (params?.search) {
      query = query.ilike('transcript', `%${params.search}%`);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []) as Call[],
      count: count || 0,
      page,
      pageSize,
    };
  }

  async getCall(id: string): Promise<Call | null> {
    const { data, error } = await supabase.from('calls').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return (data as Call) || null;
  }

  async getCallAnalysis(callId: string): Promise<CallAnalysis | null> {
    const { data, error } = await supabase.from('call_analyses').select('*').eq('call_id', callId).maybeSingle();
    if (error) throw error;
    return (data as CallAnalysis) || null;
  }

  async triggerAnalysis(callId: string): Promise<{ success: boolean; analysisId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('analysis-run', {
        body: { call_id: callId },
      });
      if (error) throw error;
      return { success: true, analysisId: data?.analysis_id };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async createCall(call: Partial<Call>): Promise<Call> {
    const orgId = await this.resolveActiveOrganizationId(call.orgId || (call as any).organization_id);

    const leadId = call.leadId || (call as any).lead_id;
    if (!leadId) {
      throw new Error('A lead must be specified to initiate or schedule a call.');
    }

    const agentId = call.agentId || (call as any).agent_id;
    if (!agentId) {
      throw new Error('An agent must be selected to place a call.');
    }

    let campaignId = call.campaignId || (call as any).campaign_id;
    if (!campaignId) {
      const { data: firstCampaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();
      campaignId = firstCampaign?.id || null;
    }

    if (!campaignId) {
      throw new Error('No campaign found for this organization. Please create or assign a campaign before scheduling calls.');
    }

    const payload: Record<string, any> = {
      organization_id: orgId,
      lead_id: leadId,
      agent_id: agentId,
      campaign_id: campaignId,
      status: (call as any).status || 'scheduled',
      direction: (call as any).direction || 'outbound',
    };

    if ((call as any).scheduled_for || (call as any).scheduledFor) {
      payload.scheduled_for = (call as any).scheduled_for || (call as any).scheduledFor;
    }

    const { data, error } = await supabase.from('calls').insert(payload).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to schedule calls.');
      }
      throw new Error(`Failed to schedule call: ${error.message}`);
    }

    // Touch lead's last_activity_at
    await supabase.from('leads').update({
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', leadId);

    return data as Call;
  }

  async listAgents(): Promise<Agent[]> {
    const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapAgentRecord);
  }

  async getAgent(id: string): Promise<Agent | null> {
    const { data, error } = await supabase.from('agents').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapAgentRecord(data) : null;
  }

  async createAgent(agent: Partial<Agent>): Promise<Agent> {
    const preferredOrg = agent.orgId || (agent as any).organization_id;
    const orgId = await this.resolveActiveOrganizationId(preferredOrg, 'admin');

    const payload: Record<string, any> = {
      organization_id: orgId,
      name: agent.name || 'AI Assistant',
      status: agent.status || 'draft',
      role_title: agent.roleTitle || (agent as any).role_title || agent.objective || 'Senior Growth Consultant',
      voice_model: agent.voiceModel || (agent as any).voice_model || agent.voice || agent.voiceId || 'Aoede',
      voice: agent.voiceModel || (agent as any).voice_model || agent.voice || agent.voiceId || 'Aoede',
      brevity_words: agent.brevityWords ?? (agent as any).brevity_words ?? 25,
      tactics: agent.tactics || (agent as any).tactics || {
        voss_empathy: true,
        law4_brevity: true,
        no_oriented_close: true,
        linguistic_mirroring: true,
      },
      system_prompt: agent.systemPrompt || (agent as any).system_prompt || '',
      greeting: agent.greeting || '',
      voice_speed: agent.voiceSpeed ?? (agent as any).voice_speed ?? 1.0,
      voice_temperature: agent.voiceTemperature ?? (agent as any).voice_temperature ?? 0.7,
      communication_style: agent.communicationStyle || (agent as any).communication_style || 'consultative',
      language: agent.language || 'en-IN',
    };

    const { data, error } = await supabase.from('agents').insert(payload).select().single();
    if (error) throw error;
    return mapAgentRecord(data);
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent> {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.roleTitle !== undefined || (updates as any).role_title !== undefined) {
      payload.role_title = updates.roleTitle ?? (updates as any).role_title;
    }
    if (updates.voiceModel !== undefined || (updates as any).voice_model !== undefined || updates.voice !== undefined) {
      const v = updates.voiceModel ?? (updates as any).voice_model ?? updates.voice;
      payload.voice_model = v;
      payload.voice = v;
    }
    if (updates.brevityWords !== undefined || (updates as any).brevity_words !== undefined) {
      payload.brevity_words = Number(updates.brevityWords ?? (updates as any).brevity_words);
    }
    if (updates.tactics !== undefined || (updates as any).tactics !== undefined) {
      payload.tactics = updates.tactics ?? (updates as any).tactics;
    }
    if (updates.systemPrompt !== undefined || (updates as any).system_prompt !== undefined) {
      payload.system_prompt = updates.systemPrompt ?? (updates as any).system_prompt;
    }
    if (updates.greeting !== undefined) payload.greeting = updates.greeting;
    if (updates.voiceSpeed !== undefined || (updates as any).voice_speed !== undefined) {
      payload.voice_speed = Number(updates.voiceSpeed ?? (updates as any).voice_speed);
    }
    if (updates.voiceTemperature !== undefined || (updates as any).voice_temperature !== undefined) {
      payload.voice_temperature = Number(updates.voiceTemperature ?? (updates as any).voice_temperature);
    }
    if (updates.communicationStyle !== undefined || (updates as any).communication_style !== undefined) {
      payload.communication_style = updates.communicationStyle ?? (updates as any).communication_style;
    }
    if (updates.language !== undefined) payload.language = updates.language;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('agents').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return mapAgentRecord(data);
  }

  async deleteAgent(id: string): Promise<void> {
    const { error } = await supabase.from('agents').delete().eq('id', id);
    if (error) throw error;
  }

  async listCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCampaignRecord);
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapCampaignRecord(data) : null;
  }

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const preferredOrg = campaign.orgId || (campaign as any).organization_id;
    const orgId = await this.resolveActiveOrganizationId(preferredOrg, 'admin');

    const payload: Record<string, any> = {
      organization_id: orgId,
      name: campaign.name || 'New Campaign',
      status: campaign.status || 'draft',
      daily_budget: (campaign as any).daily_budget ?? (campaign as any).dailyBudget ?? 5000,
      concurrency_limit: (campaign as any).concurrency_limit ?? (campaign as any).concurrencyLimit ?? 5,
      calling_hours_start: (campaign as any).calling_hours_start ?? (campaign as any).callingHoursStart ?? '09:00',
      calling_hours_end: (campaign as any).calling_hours_end ?? (campaign as any).callingHoursEnd ?? '18:00',
    };

    let agentId = campaign.agent_id || (campaign as any).agentId;
    if (agentId) {
      const { data: validAgent, error: agentCheckError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', agentId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (agentCheckError) {
        throw new Error(`Failed to verify agent: ${agentCheckError.message}`);
      }
      if (!validAgent?.id) {
        throw new Error(`The selected agent (${agentId}) does not belong to organization ${orgId}. Please select an agent from your workspace.`);
      }
      payload.agent_id = validAgent.id;
    } else {
      // Resolve a valid agent belonging to the selected organization
      const { data: firstAgent, error: agentQueryError } = await supabase
        .from('agents')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();

      if (agentQueryError) {
        throw new Error(`Failed to query organization agents: ${agentQueryError.message}`);
      }
      if (!firstAgent?.id) {
        throw new Error(`No voice agents found for organization ${orgId}. Please configure a voice agent before launching a campaign.`);
      }
      payload.agent_id = firstAgent.id;
    }

    if ((campaign as any).strategy) {
      payload.strategy = String((campaign as any).strategy);
    }
    if ((campaign as any).strategy_config || (campaign as any).strategyConfig) {
      payload.strategy_config = (campaign as any).strategy_config || (campaign as any).strategyConfig;
    }
    if ((campaign as any).confidence_threshold !== undefined || (campaign as any).confidenceThreshold !== undefined) {
      const threshold = (campaign as any).confidence_threshold ?? (campaign as any).confidenceThreshold;
      if (threshold !== null && threshold !== undefined) {
        payload.confidence_threshold = Number(threshold);
      }
    }

    if ((campaign as any).company_name || campaign.companyName) {
      payload.company_name = (campaign as any).company_name || campaign.companyName;
    }
    if (campaign.motto) payload.motto = campaign.motto;
    if (campaign.offer) payload.offer = campaign.offer;
    if ((campaign as any).primary_pain_point || campaign.primaryPainPoint) {
      payload.primary_pain_point = (campaign as any).primary_pain_point || campaign.primaryPainPoint;
    }
    if ((campaign as any).value_gap || campaign.valueGap) {
      payload.value_gap = (campaign as any).value_gap || campaign.valueGap;
    }
    if ((campaign as any).qualification_questions || campaign.qualificationQuestions) {
      payload.qualification_questions = (campaign as any).qualification_questions || campaign.qualificationQuestions;
    }
    if ((campaign as any).objection_playbook || campaign.objectionPlaybook) {
      payload.objection_playbook = (campaign as any).objection_playbook || campaign.objectionPlaybook;
    }
    if ((campaign as any).target_audience || campaign.targetAudience) {
      payload.target_audience = (campaign as any).target_audience || campaign.targetAudience;
    }

    const { data, error } = await supabase.from('campaigns').insert(payload).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied (403): You must have an owner or administrator role in the active organization to create campaigns.');
      }
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
    return mapCampaignRecord(data);
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required: please sign in to complete this action.');
    }

    // 1. Fetch current campaign from database (do NOT trust arbitrary organization ID from client)
    const { data: currentCampaign, error: campError } = await supabase
      .from('campaigns')
      .select('id, organization_id')
      .eq('id', id)
      .maybeSingle();

    if (campError) {
      throw new Error(`Failed to verify campaign organization: ${campError.message}`);
    }
    if (!currentCampaign?.organization_id) {
      throw new Error(`Campaign not found or access denied: ${id}`);
    }

    // 2. Verify authenticated user has admin role in this campaign's organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role, status')
      .eq('user_id', session.user.id)
      .eq('organization_id', currentCampaign.organization_id)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError) {
      throw new Error(`Failed to verify organization role: ${memberError.message}`);
    }
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('Permission denied (403): You must have an owner or administrator role in the campaign organization to update campaigns.');
    }

    const dbUpdates: Record<string, any> = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    // 3. If updating agent, validate it against the campaign's verified database organization
    const newAgentId = (updates as any).agent_id || (updates as any).agentId;
    if (newAgentId) {
      const { data: validAgent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('id', newAgentId)
        .eq('organization_id', currentCampaign.organization_id)
        .maybeSingle();

      if (agentError) {
        throw new Error(`Failed to verify agent for campaign: ${agentError.message}`);
      }
      if (!validAgent?.id) {
        throw new Error(`The selected agent (${newAgentId}) does not belong to the campaign's organization.`);
      }
      dbUpdates.agent_id = validAgent.id;
    }

    if ((updates as any).confidence_threshold !== undefined || (updates as any).confidenceThreshold !== undefined) {
      const val = (updates as any).confidence_threshold ?? (updates as any).confidenceThreshold;
      if (val !== null && val !== undefined) {
        dbUpdates.confidence_threshold = Number(val);
      }
    }
    if ((updates as any).strategy !== undefined) {
      dbUpdates.strategy = String((updates as any).strategy);
    }
    if ((updates as any).strategy_config !== undefined || (updates as any).strategyConfig !== undefined) {
      const conf = (updates as any).strategy_config ?? (updates as any).strategyConfig;
      if (typeof conf === 'object' && conf !== null) {
        dbUpdates.strategy_config = conf;
      }
    }
    if ((updates as any).calling_hours_start || (updates as any).callingHoursStart) {
      dbUpdates.calling_hours_start = (updates as any).calling_hours_start || (updates as any).callingHoursStart;
    }
    if ((updates as any).calling_hours_end || (updates as any).callingHoursEnd) {
      dbUpdates.calling_hours_end = (updates as any).calling_hours_end || (updates as any).callingHoursEnd;
    }
    if ((updates as any).daily_budget !== undefined || (updates as any).dailyBudget !== undefined) {
      dbUpdates.daily_budget = Number((updates as any).daily_budget ?? (updates as any).dailyBudget);
    }
    if ((updates as any).concurrency_limit !== undefined || (updates as any).concurrencyLimit !== undefined) {
      dbUpdates.concurrency_limit = Number((updates as any).concurrency_limit ?? (updates as any).concurrencyLimit);
    }
    if ((updates as any).timezone !== undefined) {
      dbUpdates.timezone = String((updates as any).timezone);
    }

    if (updates.companyName !== undefined || (updates as any).company_name !== undefined) {
      dbUpdates.company_name = updates.companyName ?? (updates as any).company_name;
    }
    if (updates.motto !== undefined) dbUpdates.motto = updates.motto;
    if (updates.offer !== undefined) dbUpdates.offer = updates.offer;
    if (updates.primaryPainPoint !== undefined || (updates as any).primary_pain_point !== undefined) {
      dbUpdates.primary_pain_point = updates.primaryPainPoint ?? (updates as any).primary_pain_point;
    }
    if (updates.valueGap !== undefined || (updates as any).value_gap !== undefined) {
      dbUpdates.value_gap = updates.valueGap ?? (updates as any).value_gap;
    }
    if (updates.qualificationQuestions !== undefined || (updates as any).qualification_questions !== undefined) {
      dbUpdates.qualification_questions = updates.qualificationQuestions ?? (updates as any).qualification_questions;
    }
    if (updates.objectionPlaybook !== undefined || (updates as any).objection_playbook !== undefined) {
      dbUpdates.objection_playbook = updates.objectionPlaybook ?? (updates as any).objection_playbook;
    }
    if (updates.targetAudience !== undefined || (updates as any).target_audience !== undefined) {
      dbUpdates.target_audience = updates.targetAudience ?? (updates as any).target_audience;
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('campaigns').update(dbUpdates).eq('id', id).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied (403): You must have an owner or administrator role in the active organization to update campaigns.');
      }
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
    return mapCampaignRecord(data);
  }

  async listLeads(params?: LeadFilterParams): Promise<PaginatedResult<Lead>> {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (params?.campaignId) {
      query = query.eq('campaign_id', params.campaignId);
    }
    if (params?.status) {
      const dbStatus = normalizeLeadStatus(params.status);
      query = query.eq('status', dbStatus);
    }
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    query = query.order('created_at', { ascending: false }).range(start, end);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: (data || []).map(mapLeadRecord),
      count: count || 0,
      page,
      pageSize,
    };
  }

  async getLead(id: string): Promise<Lead | null> {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapLeadRecord(data) : null;
  }

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const preferredOrg = lead.orgId || (lead as any).organization_id;
    const orgId = await this.resolveActiveOrganizationId(preferredOrg);

    const fullName =
      (lead as any).name ||
      `${(lead as any).first_name || (lead as any).firstName || ''} ${(lead as any).last_name || (lead as any).lastName || ''}`.trim() ||
      'New Lead';

    const rawStatus = (lead as any).status || (lead as any).stage;
    const status = normalizeLeadStatus(rawStatus, 'new');

    const payload: Record<string, unknown> = {
      organization_id: orgId,
      name: fullName,
      phone: lead.phone || '',
      email: lead.email || '',
      status,
      company: (lead as any).company || '',
      title: (lead as any).title || '',
    };
    if ((lead as any).campaign_id || (lead as any).campaignId) {
      payload.campaign_id = (lead as any).campaign_id || (lead as any).campaignId;
    }
    if ((lead as any).notes) payload.notes = (lead as any).notes;
    if ((lead as any).source) payload.source = (lead as any).source;
    if ((lead as any).estimated_value !== undefined || (lead as any).estimatedValue !== undefined) {
      payload.estimated_value = Number((lead as any).estimated_value ?? (lead as any).estimatedValue);
    }
    if ((lead as any).next_action !== undefined || (lead as any).nextAction !== undefined) {
      payload.next_action = (lead as any).next_action || (lead as any).nextAction;
    }
    payload.stage_entered_at = new Date().toISOString();

    const { data, error } = await supabase.from('leads').insert(payload).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to add leads to this organization.');
      }
      throw new Error(`Failed to create lead: ${error.message}`);
    }
    return mapLeadRecord(data);
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const dbUpdates: Record<string, unknown> = {};

    const hasExplicitName = (updates as any).name !== undefined && (updates as any).name !== null;
    const hasFirstName = (updates as any).first_name !== undefined || (updates as any).firstName !== undefined;
    const hasLastName = (updates as any).last_name !== undefined || (updates as any).lastName !== undefined;

    if (hasExplicitName) {
      dbUpdates.name = String((updates as any).name).trim();
    } else if (hasFirstName || hasLastName) {
      const newFirst = (updates as any).first_name ?? (updates as any).firstName;
      const newLast = (updates as any).last_name ?? (updates as any).lastName;

      if (newFirst !== undefined && newLast !== undefined) {
        dbUpdates.name = `${String(newFirst).trim()} ${String(newLast).trim()}`.trim();
      } else {
        // Partial name update: fetch existing lead to safely preserve unchanged name parts
        const { data: existingLead, error: fetchErr } = await supabase
          .from('leads')
          .select('name')
          .eq('id', id)
          .maybeSingle();

        if (fetchErr) {
          throw new Error(`Failed to fetch existing lead name for update: ${fetchErr.message}`);
        }
        if (!existingLead) {
          throw new Error(`Lead not found: ${id}`);
        }

        const existingRaw = String(existingLead.name || '').trim();
        const parts = existingRaw.split(/\s+/);
        const existingFirst = parts[0] || '';
        const existingLast = parts.slice(1).join(' ');

        const finalFirst = newFirst !== undefined ? String(newFirst).trim() : existingFirst;
        const finalLast = newLast !== undefined ? String(newLast).trim() : existingLast;

        dbUpdates.name = `${finalFirst} ${finalLast}`.trim() || existingRaw || 'Lead';
      }
    }

    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if ((updates as any).company !== undefined) dbUpdates.company = (updates as any).company;
    if ((updates as any).title !== undefined) dbUpdates.title = (updates as any).title;
    if ((updates as any).notes !== undefined) dbUpdates.notes = (updates as any).notes;
    if ((updates as any).source !== undefined) dbUpdates.source = (updates as any).source;
    if ((updates as any).estimated_value !== undefined || (updates as any).estimatedValue !== undefined) {
      dbUpdates.estimated_value = Number((updates as any).estimated_value ?? (updates as any).estimatedValue);
    }
    if ((updates as any).next_action !== undefined || (updates as any).nextAction !== undefined) {
      dbUpdates.next_action = (updates as any).next_action ?? (updates as any).nextAction;
    }
    if ((updates as any).stage_entered_at !== undefined || (updates as any).stageEnteredAt !== undefined) {
      dbUpdates.stage_entered_at = (updates as any).stage_entered_at ?? (updates as any).stageEnteredAt;
    }

    if ((updates as any).campaign_id || (updates as any).campaignId) {
      dbUpdates.campaign_id = (updates as any).campaign_id || (updates as any).campaignId;
    }

    const rawStatus = (updates as any).status !== undefined ? (updates as any).status : (updates as any).stage;
    if (rawStatus !== undefined) {
      dbUpdates.status = normalizeLeadStatus(rawStatus);
      if (!dbUpdates.stage_entered_at) {
        dbUpdates.stage_entered_at = new Date().toISOString();
      }
    }

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('leads').update(dbUpdates).eq('id', id).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to update leads.');
      }
      throw new Error(`Failed to update lead: ${error.message}`);
    }
    return mapLeadRecord(data);
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to delete leads.');
      }
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  async listComplianceRules(): Promise<ComplianceRule[]> {
    const { data, error } = await supabase.from('compliance_rules').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ComplianceRule[];
  }

  async createComplianceRule(rule: Partial<ComplianceRule>): Promise<ComplianceRule> {
    const orgId = await this.resolveActiveOrganizationId();

    const payload: Record<string, any> = {
      organization_id: orgId,
      name: rule.name,
      rule_type: rule.rule_type,
      description: rule.description || '',
      threshold: rule.threshold ?? 0.85,
      action_on_violation: rule.action_on_violation || 'flag',
      is_active: rule.is_active ?? true,
    };

    const { data, error } = await supabase.from('compliance_rules').insert(payload).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error(
          'Permission denied: Your account role does not have administrative rights to manage compliance rules, or table grants require database configuration.'
        );
      }
      throw error;
    }
    return data as ComplianceRule;
  }

  async updateComplianceRule(id: string, updates: Partial<ComplianceRule>): Promise<ComplianceRule> {
    const { data, error } = await supabase.from('compliance_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as ComplianceRule;
  }

  async deleteComplianceRule(id: string): Promise<void> {
    const { error } = await supabase.from('compliance_rules').delete().eq('id', id);
    if (error) throw error;
  }

  async listPhoneNumbers(): Promise<PhoneNumber[]> {
    const { data, error } = await supabase.from('phone_numbers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PhoneNumber[];
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('id, duration_seconds, sentiment, status, created_at, started_at');
    if (callsError) {
      throw new Error(`Failed to load calls for analytics: ${callsError.message}`);
    }

    const { count: leadConversions, error: convError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted');
    if (convError) {
      throw new Error(`Failed to load lead conversions: ${convError.message}`);
    }

    const { data: outcomeRecords, error: outcomesError } = await supabase
      .from('outcomes')
      .select('id, stage, converted_at, created_at')
      .eq('stage', 'converted');
    if (outcomesError) {
      throw new Error(`Failed to load conversion outcomes: ${outcomesError.message}`);
    }

    const callList = (calls || []) as Array<{
      id: string;
      duration_seconds?: number;
      sentiment?: string;
      status?: string;
      created_at?: string;
      started_at?: string;
    }>;
    const totalCalls = callList.length;
    const totalDurationSeconds = callList.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
    const avgDurationSeconds = totalCalls ? Math.round(totalDurationSeconds / totalCalls) : 0;

    const positiveCount = callList.filter((c) => c.sentiment === 'positive').length;
    const neutralCount = callList.filter((c) => c.sentiment === 'neutral').length;
    const negativeCount = callList.filter((c) => c.sentiment === 'negative').length;
    const mixedCount = callList.filter((c) => c.sentiment === 'mixed').length;

    // Disconnect rate: calls dropped or status failed / totalCalls (null if no calls)
    const droppedCalls = callList.filter(
      (c) => c.status === 'failed' || (c.duration_seconds !== undefined && c.duration_seconds < 10 && c.status === 'completed')
    ).length;
    const disconnectRatePercent = totalCalls > 0 ? Number(((droppedCalls / totalCalls) * 100).toFixed(1)) : null;

    // Average sentiment score out of 100 (null if no scored calls)
    const scoredCalls = positiveCount + neutralCount + negativeCount + mixedCount;
    const avgSentimentScorePercent = scoredCalls > 0
      ? Math.round(((positiveCount * 100 + neutralCount * 65 + mixedCount * 45 + negativeCount * 15) / (scoredCalls * 100)) * 100)
      : null;

    const totalConversions = leadConversions ?? 0;
    const timestampedOutcomes = (outcomeRecords || []).filter((o) => Boolean(o.converted_at));

    // Dynamic 5-day rolling window with genuine database numbers (no synthetic fallbacks)
    const recentTrends = Array.from({ length: 5 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (4 - idx));
      const dateStr = d.toISOString().slice(0, 10);
      const dayCalls = callList.filter((c) => (c.started_at || c.created_at || '').slice(0, 10) === dateStr);
      const dayTotal = dayCalls.length;
      const dayPos = dayCalls.filter((c) => c.sentiment === 'positive').length;
      const dayScored = dayCalls.filter((c) => c.sentiment && ['positive', 'neutral', 'negative', 'mixed'].includes(c.sentiment)).length;
      const daySentiment = dayScored > 0 ? Math.round((dayPos / dayScored) * 100) : null;

      // Determine daily conversions:
      // 1. If timestamped outcomes exist, count those converted on this day.
      // 2. If total conversions is 0, daily conversions is genuinely 0.
      // 3. If leads are marked 'converted' but the leads schema lacks a converted_at timestamp column,
      //    daily breakdown cannot be accurately determined without inventing events; represent as null.
      let dayConversions: number | null = 0;
      if (timestampedOutcomes.length > 0) {
        dayConversions = timestampedOutcomes.filter(
          (o) => o.converted_at?.slice(0, 10) === dateStr
        ).length;
      } else if (totalConversions > 0) {
        dayConversions = null;
      }

      return {
        date: dateStr,
        calls: dayTotal,
        conversions: dayConversions,
        avgSentimentScore: daySentiment,
      };
    });

    return {
      totalCalls,
      totalDurationSeconds,
      avgDurationSeconds,
      sentimentBreakdown: {
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
        mixed: mixedCount,
      },
      funnelMetrics: {
        connected: totalCalls,
        engaged: callList.filter((c) => (c.duration_seconds || 0) > 30).length,
        converted: leadConversions || 0,
        dropped: droppedCalls,
      },
      telemetry: {
        ttfbMs: null, // Genuine TTFB telemetry is not captured by database schema; represented as unavailable
        roundtripMs: null, // Genuine audio roundtrip latency is not captured by database schema; represented as unavailable
        disconnectRatePercent,
        avgSentimentScorePercent,
      },
      recentTrends,
    };
  }

  // --- APPOINTMENTS ---
  async listAppointments(status?: string): Promise<Appointment[]> {
    let query = supabase.from('appointments').select('*').order('scheduled_for', { ascending: true });
    if (status) {
      const dbStatus = status === 'confirmed' ? 'scheduled' : status;
      query = query.eq('status', dbStatus);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapAppointmentRecord);
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapAppointmentRecord(data) : null;
  }

  async createAppointment(appointment: any): Promise<Appointment> {
    const orgId = await this.resolveActiveOrganizationId();

    const leadId = appointment.leadId || appointment.lead_id;
    if (!leadId) {
      throw new Error('A valid lead must be selected to schedule an appointment.');
    }

    const scheduledFor = appointment.scheduledFor || appointment.scheduled_for;
    if (!scheduledFor) {
      throw new Error('Scheduled date and time is required.');
    }

    let dbStatus = appointment.status || 'scheduled';
    if (dbStatus === 'confirmed' || dbStatus === 'proposed') {
      dbStatus = 'scheduled';
    }

    const VALID_BOOKING_SOURCES = new Set(['calendly', 'manual', 'ai_booked']);
    const rawSource = appointment.booking_source || appointment.source;
    const bookingSource = (rawSource && VALID_BOOKING_SOURCES.has(rawSource)) ? rawSource : 'manual';

    // Only schema-supported columns of the 'appointments' table
    const payload: Record<string, any> = {
      organization_id: orgId,
      lead_id: leadId,
      scheduled_for: scheduledFor,
      status: dbStatus,
      booking_source: bookingSource,
    };
    if (appointment.callId || appointment.call_id) {
      payload.call_id = appointment.callId || appointment.call_id;
    }
    if (appointment.decisionId || appointment.decision_id) {
      payload.decision_id = appointment.decisionId || appointment.decision_id;
    }
    if (appointment.externalEventId || appointment.external_event_id) {
      payload.external_event_id = appointment.externalEventId || appointment.external_event_id;
    }

    const { data, error } = await supabase.from('appointments').insert(payload).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to schedule appointments.');
      }
      throw new Error(`Failed to schedule appointment: ${error.message}`);
    }
    const record = mapAppointmentRecord(data);
    return {
      ...record,
      title: appointment.title || record.title,
      hostName: appointment.hostName || record.hostName,
      durationMinutes: appointment.durationMinutes ? Number(appointment.durationMinutes) : record.durationMinutes,
    };
  }

  async updateAppointment(id: string, updates: any): Promise<Appointment> {
    const dbUpdates: Record<string, any> = {};
    if (updates.scheduledFor || updates.scheduled_for) {
      dbUpdates.scheduled_for = updates.scheduledFor || updates.scheduled_for;
    }
    if (updates.status !== undefined) {
      dbUpdates.status = (updates.status === 'confirmed' || updates.status === 'proposed') ? 'scheduled' : updates.status;
    }
    if (updates.leadId || updates.lead_id) {
      dbUpdates.lead_id = updates.leadId || updates.lead_id;
    }
    if (updates.booking_source || updates.source) {
      const VALID_BOOKING_SOURCES = new Set(['calendly', 'manual', 'ai_booked']);
      const raw = updates.booking_source || updates.source;
      if (raw && VALID_BOOKING_SOURCES.has(raw)) {
        dbUpdates.booking_source = raw;
      }
    }
    if (updates.callId || updates.call_id) {
      dbUpdates.call_id = updates.callId || updates.call_id;
    }
    if (updates.externalEventId || updates.external_event_id) {
      dbUpdates.external_event_id = updates.externalEventId || updates.external_event_id;
    }

    const { data, error } = await supabase.from('appointments').update(dbUpdates).eq('id', id).select().single();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to update appointments.');
      }
      throw new Error(`Failed to update appointment: ${error.message}`);
    }
    const record = mapAppointmentRecord(data);
    return {
      ...record,
      title: updates.title || record.title,
      hostName: updates.hostName || record.hostName,
      durationMinutes: updates.durationMinutes ? Number(updates.durationMinutes) : record.durationMinutes,
    };
  }

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to delete appointments.');
      }
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  // --- LEADS BULK IMPORT ---
  async createLeadsBulk(leads: Partial<Lead>[]): Promise<{ count: number; leads: Lead[] }> {
    const preferredOrgId = (leads[0] as any)?.orgId || (leads[0] as any)?.organization_id;
    const orgId = await this.resolveActiveOrganizationId(preferredOrgId);
    if (!orgId) {
      throw new Error('Active organization workspace required for bulk lead import.');
    }

    // Explicit allowlisted payload - avoids sending unsupported frontend properties to Supabase
    const normalizedLeads = leads.map((l: any) => {
      const name =
        l.name ||
        [l.first_name || l.firstName, l.last_name || l.lastName].filter(Boolean).join(' ') ||
        'Unknown Lead';

      const rawStatus = l.status || l.stage;
      const status = normalizeLeadStatus(rawStatus, 'new');

      const row: Record<string, any> = {
        organization_id: orgId,
        name,
        company: l.company || '',
        title: l.title || '',
        email: l.email || '',
        phone: l.phone || '',
        status,
      };

      if (l.campaign_id || l.campaignId) {
        row.campaign_id = l.campaign_id || l.campaignId;
      }
      if (l.source) {
        row.source = l.source;
      }
      if (l.notes) {
        row.notes = l.notes;
      }

      return row;
    }
    );

    const { data, error } = await supabase.from('leads').insert(normalizedLeads).select();
    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('permission denied')) {
        throw new Error('Permission denied: Your account role does not have permission to insert leads in this organization.');
      }
      throw error;
    }
    return { count: data?.length || 0, leads: (data || []).map(mapLeadRecord) };
  }

  // --- ORGANIZATION & TEAM MEMBERS ---
  async getOrganization(): Promise<Organization | null> {
    try {
      const orgId = await this.resolveActiveOrganizationId();
      if (!orgId) return null;
      const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).maybeSingle();
      if (error) throw error;
      return (data as Organization) || null;
    } catch {
      // Return null when unauthenticated or workspace membership is not active. Never select arbitrary org.
      return null;
    }
  }

  async updateOrganization(updates: Partial<Organization>): Promise<Organization> {
    const current = await this.getOrganization();
    if (!current) throw new Error('No active organization found');
    const { data, error } = await supabase.from('organizations').update(updates).eq('id', current.id).select().single();
    if (error) throw error;
    return data as Organization;
  }

  async listMembers(): Promise<Array<{ id: string; email: string; role: string; name: string }>> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('id, user_id, role, profiles(id, email, full_name)');
    if (error) throw error;
    return (data || []).map((m: any) => ({
      id: m.id,
      email: m.profiles?.email || 'member@intellicall.ai',
      role: m.role,
      name: m.profiles?.full_name || 'Team Member',
    }));
  }

  async inviteMember(email: string, role: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In cloud Supabase, invitation invokes auth admin or creates member link
      const org = await this.getOrganization();
      if (!org) throw new Error('No active organization');
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // --- PRIVATE HELPERS ---
  private async resolveActiveOrganizationId(
    preferredOrgId?: string,
    requiredRole: 'member' | 'admin' = 'member'
  ): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('Authentication required: please sign in to complete this action.');
    }

    // 1. If preferred organization ID is provided, verify the authenticated user has active membership and required role
    if (preferredOrgId) {
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id, role, status')
        .eq('user_id', session.user.id)
        .eq('organization_id', preferredOrgId)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        throw new Error(`Failed to verify organization membership: ${memberError.message}`);
      }
      if (!member?.organization_id) {
        throw new Error(`Access denied: You are not an active member of organization ${preferredOrgId}.`);
      }

      if (requiredRole === 'admin') {
        const isAdmin = member.role === 'owner' || member.role === 'admin';
        if (!isAdmin) {
          throw new Error(
            `Access denied (403): You must have an owner or administrator role in organization ${preferredOrgId} to perform this action.`
          );
        }
      }

      return member.organization_id;
    }

    // 2. Query all active organization memberships for the authenticated user
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to resolve active organization: ${error.message}`);
    }
    if (!members || members.length === 0) {
      throw new Error('No active organization workspace found. Please complete workspace setup.');
    }

    if (requiredRole === 'admin') {
      const adminMember = members.find((m: any) => m.role === 'owner' || m.role === 'admin');
      if (!adminMember) {
        throw new Error('Access denied (403): You must have an owner or administrator role in an organization to perform this action.');
      }
      return adminMember.organization_id;
    }

    // Prioritize organization where user is owner or admin if available, otherwise first active membership
    const preferredMember = members.find((m: any) => m.role === 'owner' || m.role === 'admin');
    return (preferredMember || members[0]).organization_id;
  }
}
