import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiClient, CallFilterParams, LeadFilterParams } from '../client';
import { MockApiClient } from '../mock';
import { SupabaseApiClient } from '../http';
import { queryKeys } from '../keys';
import type { Call, Agent, Campaign, Lead, Appointment, ComplianceRule, Organization } from '../../contracts/entities';

const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
export const apiClient: ApiClient = useMockApi
  ? new MockApiClient()
  : new SupabaseApiClient();

// --- CALLS ---
export function useCalls(params?: CallFilterParams) {
  return useQuery({
    queryKey: queryKeys.calls.list(params),
    queryFn: () => apiClient.listCalls(params),
  });
}

export function useCall(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.calls.detail(id) : ['calls', 'detail', 'null'],
    queryFn: () => (id ? apiClient.getCall(id) : null),
    enabled: Boolean(id),
  });
}

export function useCallAnalysis(callId: string | undefined) {
  return useQuery({
    queryKey: callId ? queryKeys.calls.analysis(callId) : ['calls', 'analysis', 'null'],
    queryFn: () => (callId ? apiClient.getCallAnalysis(callId) : null),
    enabled: Boolean(callId),
  });
}

export function useCreateCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (call: Partial<Call>) => apiClient.createCall(call),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => apiClient.triggerAnalysis(callId),
    onSuccess: (_, callId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.analysis(callId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.calls.detail(callId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// --- AGENTS ---
export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents.all,
    queryFn: () => apiClient.listAgents(),
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.agents.detail(id) : ['agents', 'detail', 'null'],
    queryFn: () => (id ? apiClient.getAgent(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agent: Partial<Agent>) => apiClient.createAgent(agent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Agent> }) =>
      apiClient.updateAgent(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(id) });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAgent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all }),
  });
}

// --- CAMPAIGNS ---
export function useCampaigns() {
  return useQuery({
    queryKey: queryKeys.campaigns.all,
    queryFn: () => apiClient.listCampaigns(),
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.campaigns.detail(id) : ['campaigns', 'detail', 'null'],
    queryFn: () => (id ? apiClient.getCampaign(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaign: Partial<Campaign>) => apiClient.createCampaign(campaign),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      apiClient.updateCampaign(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(id) });
    },
  });
}

// --- LEADS ---
export function useLeads(params?: LeadFilterParams) {
  return useQuery({
    queryKey: queryKeys.leads.list(params),
    queryFn: () => apiClient.listLeads(params),
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.leads.detail(id) : ['leads', 'detail', 'null'],
    queryFn: () => (id ? apiClient.getLead(id) : null),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lead: Partial<Lead>) => apiClient.createLead(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useCreateLeadsBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (leads: Partial<Lead>[]) => apiClient.createLeadsBulk(leads),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Lead> }) =>
      apiClient.updateLead(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

// --- APPOINTMENTS ---
export function useAppointments(status?: string) {
  return useQuery({
    queryKey: queryKeys.appointments.list(status),
    queryFn: () => apiClient.listAppointments(status),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: Partial<Appointment>) => apiClient.createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Appointment> }) =>
      apiClient.updateAppointment(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.detail(id) });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });
}

// --- COMPLIANCE ---
export function useComplianceRules() {
  return useQuery({
    queryKey: queryKeys.compliance.rules(),
    queryFn: () => apiClient.listComplianceRules(),
  });
}

export function useCreateComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: Partial<ComplianceRule>) => apiClient.createComplianceRule(rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.all }),
  });
}

export function useUpdateComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ComplianceRule> }) =>
      apiClient.updateComplianceRule(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.all }),
  });
}

export function useDeleteComplianceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteComplianceRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.all }),
  });
}

// --- NUMBERS & ANALYTICS ---
export function usePhoneNumbers() {
  return useQuery({
    queryKey: queryKeys.phoneNumbers.all,
    queryFn: () => apiClient.listPhoneNumbers(),
  });
}

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: queryKeys.analytics.overview(),
    queryFn: () => apiClient.getAnalyticsOverview(),
  });
}

// --- ORGANIZATION & TEAM MEMBERS ---
export function useOrganization() {
  return useQuery({
    queryKey: queryKeys.organization.current(),
    queryFn: () => apiClient.getOrganization(),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Organization>) => apiClient.updateOrganization(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organization.current() }),
  });
}

export function useOrganizationMembers() {
  return useQuery({
    queryKey: queryKeys.organization.members(),
    queryFn: () => apiClient.listMembers(),
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) => apiClient.inviteMember(email, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.organization.members() }),
  });
}
