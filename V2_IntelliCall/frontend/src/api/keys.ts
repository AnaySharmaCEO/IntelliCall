import type { CallFilterParams, LeadFilterParams } from './client';

/**
 * Hierarchical Query Key Factory for IntelliCall / Resonology AI.
 * Enforces strict cache boundaries, deterministic invalidation, and prevents cache leaks.
 */
export const queryKeys = {
  calls: {
    all: ['calls'] as const,
    lists: () => [...queryKeys.calls.all, 'list'] as const,
    list: (params?: CallFilterParams) => [...queryKeys.calls.lists(), params] as const,
    details: () => [...queryKeys.calls.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.calls.details(), id] as const,
    analyses: () => [...queryKeys.calls.all, 'analysis'] as const,
    analysis: (callId: string) => [...queryKeys.calls.analyses(), callId] as const,
  },
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    details: () => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.campaigns.details(), id] as const,
  },
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (params?: LeadFilterParams) => [...queryKeys.leads.lists(), params] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (status?: string) => [...queryKeys.appointments.lists(), status] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
  },
  compliance: {
    all: ['compliance'] as const,
    rules: () => [...queryKeys.compliance.all, 'rules'] as const,
  },
  phoneNumbers: {
    all: ['phone-numbers'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    overview: () => [...queryKeys.analytics.all, 'overview'] as const,
  },
  organization: {
    all: ['organization'] as const,
    current: () => [...queryKeys.organization.all, 'current'] as const,
    members: () => [...queryKeys.organization.all, 'members'] as const,
  },
};
