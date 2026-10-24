import React, { useState } from 'react';
import { PhoneCall, Calendar, Clock, Bot, AlertTriangle } from 'lucide-react';
import { Modal, Button, Select, Input, useToast } from '../../../components/ui';
import { useAgents, useCampaigns, useCreateCall } from '../../../api/hooks';
import type { Lead } from '../../../contracts/entities';
import { formatPhone } from '../../../lib/format';
import { supabase } from '../../../lib/supabase';

interface ScheduleAICallModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess?: () => void;
}

export const ScheduleAICallModal: React.FC<ScheduleAICallModalProps> = ({
  open,
  onClose,
  lead,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useCampaigns();
  const createCall = useCreateCall();

  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [callTiming, setCallTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    // Default to tomorrow at 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });

  // Auto-select first agent and campaign when available
  React.useEffect(() => {
    if (open) {
      if (!selectedAgentId && agents.length > 0) {
        setSelectedAgentId(agents[0].id);
      }
      if (!selectedCampaignId && campaigns.length > 0) {
        setSelectedCampaignId(campaigns[0].id);
      }
    }
  }, [open, agents, campaigns, selectedAgentId, selectedCampaignId]);

  if (!lead) return null;

  const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Prospect';

  const handleScheduleCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    if (!selectedAgentId) {
      toast('Please select an AI Voice Agent to conduct the call', 'error');
      return;
    }

    try {
      const newCall = await createCall.mutateAsync({
        leadId: lead.id,
        agentId: selectedAgentId,
        campaignId: selectedCampaignId || undefined,
        status: callTiming === 'now' ? 'queued' : 'scheduled',
        scheduledFor: callTiming === 'scheduled' ? new Date(scheduledDateTime).toISOString() : undefined,
      } as any);

      // Broadcast to any active Phone Simulator clients
      if (callTiming === 'now') {
        const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
        const cfg = selectedCampaign?.strategyConfig || (selectedCampaign as any)?.strategy_config || {};
        const companyName = cfg.companyName || cfg.company_name || 'FinEdge Capital';
        const simChannel = supabase.channel('phone-simulator');
        simChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            simChannel.send({
              type: 'broadcast',
              event: 'incoming_call',
              payload: {
                callId: newCall?.id,
                callerName: companyName,
                callerId: '+91 98765 43210',
                leadName: leadName,
                leadId: lead.id,
                campaignName: selectedCampaign?.name,
                companyName: companyName,
                motto: cfg.motto,
                offer: cfg.offer,
                questions: cfg.qualifyingQuestions || cfg.qualifying_questions || [],
              },
            });
          }
        });
      }

      toast(
        callTiming === 'now'
          ? `Outbound AI call dispatched for ${leadName}`
          : `AI call scheduled for ${new Date(scheduledDateTime).toLocaleString()}`,
        'success'
      );

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to schedule AI call', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dispatch Resonology Voice Agent"
      description={`Queue an autonomous AI voice call to ${leadName}`}
    >
      <form onSubmit={handleScheduleCall} className="space-y-4">
        {/* Lead Target Card */}
        <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {leadName}
            </span>
            <span className="font-mono text-xs text-[var(--color-text-muted)]">
              {formatPhone(lead.phone)}
            </span>
          </div>
          {lead.company && (
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              Company: <span className="font-medium text-[var(--color-text-primary)]">{lead.company}</span>
            </p>
          )}
          {lead.nextAction && (
            <p className="text-[11px] text-emerald-400">
              Target goal: <span className="font-medium">{lead.nextAction}</span>
            </p>
          )}
        </div>

        {/* Agent Selector */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Bot size={14} className="text-blue-400" />
            <span>Select AI Voice Agent</span>
          </label>
          {isLoadingAgents ? (
            <div className="text-xs text-[var(--color-text-muted)] py-2">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="p-3 rounded-[var(--radius-md)] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>No active voice agents available. Create an agent first.</span>
            </div>
          ) : (
            <Select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              options={agents.map((a) => ({
                value: a.id,
                label: `${a.name} (${(a as any).language || 'English'} - ${(a as any).voice || 'Alloy'})`,
              }))}
            />
          )}
        </div>

        {/* Campaign Selector (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-purple-400" />
            <span>Campaign Context (Optional)</span>
          </label>
          <Select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            options={[
              { value: '', label: 'Ad-hoc Direct Call (No Campaign)' },
              ...campaigns.map((c) => ({
                value: c.id,
                label: `${c.name} [${c.status}]`,
              })),
            ]}
          />
          {(() => {
            const camp = campaigns.find((c) => c.id === selectedCampaignId);
            const cfg = camp?.strategyConfig || (camp as any)?.strategy_config;
            if (!cfg) return null;
            return (
              <div className="mt-2 p-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[11px] space-y-1">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-[var(--color-text-muted)]">Speaking as:</span>
                  <span className="font-semibold text-blue-400">{cfg.companyName || cfg.company_name || 'IntelliCall'}</span>
                </div>
                {cfg.motto && (
                  <p className="text-[var(--color-text-secondary)] italic truncate">
                    "{cfg.motto}"
                  </p>
                )}
                {cfg.offer && (
                  <p className="text-emerald-400 font-medium truncate">
                    Offer: {cfg.offer}
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Timing options */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)]">
            Execution Timing
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCallTiming('now')}
              className={`p-2.5 rounded-[var(--radius-md)] border text-left text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                callTiming === 'now'
                  ? 'bg-[var(--color-bg-elevated)] border-emerald-500/50 text-[var(--color-text-primary)] shadow-sm'
                  : 'bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <PhoneCall size={14} className={callTiming === 'now' ? 'text-emerald-400' : ''} />
              <div>
                <div className="font-semibold">Call Immediately</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">Queue for immediate dialing</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCallTiming('scheduled')}
              className={`p-2.5 rounded-[var(--radius-md)] border text-left text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                callTiming === 'scheduled'
                  ? 'bg-[var(--color-bg-elevated)] border-blue-500/50 text-[var(--color-text-primary)] shadow-sm'
                  : 'bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Clock size={14} className={callTiming === 'scheduled' ? 'text-blue-400' : ''} />
              <div>
                <div className="font-semibold">Schedule for Later</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">Set future date &amp; time</div>
              </div>
            </button>
          </div>
        </div>

        {callTiming === 'scheduled' && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
            <Input
              type="datetime-local"
              label="Select Date & Time"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              required
            />
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={createCall.isPending}
            disabled={!selectedAgentId || (callTiming === 'scheduled' && !scheduledDateTime)}
          >
            <PhoneCall size={14} className="mr-1.5" />
            {callTiming === 'now' ? 'Dispatch AI Call' : 'Confirm Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
