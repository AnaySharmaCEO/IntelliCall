import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { Modal, Button, Select, Input, useToast } from '../../../components/ui';
import { useUpdateLead } from '../../../api/hooks';
import type { Lead } from '../../../contracts/entities';

export const PIPELINE_STAGES = [
  { value: 'new', label: 'New Lead', color: 'slate', desc: 'Fresh record, not yet called' },
  { value: 'contacted', label: 'AI Called', color: 'blue', desc: 'Outbound AI call initiated' },
  { value: 'qualified', label: 'Interested', color: 'green', desc: 'Positive qualification verified' },
  { value: 'meeting_booked', label: 'Meeting Booked', color: 'teal', desc: 'Appointment or demo scheduled' },
  { value: 'opportunity', label: 'Proposal Stage', color: 'amber', desc: 'Active deal proposal in-flight' },
  { value: 'converted', label: 'Won / Converted', color: 'emerald', desc: 'Client signed or converted' },
  { value: 'stalled', label: 'Lost / Stalled', color: 'red', desc: 'Disqualified, unresponsive, or DNC' },
];

interface MoveStageModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSuccess?: () => void;
}

export const MoveStageModal: React.FC<MoveStageModalProps> = ({
  open,
  onClose,
  lead,
  onSuccess,
}) => {
  const { toast } = useToast();
  const updateLead = useUpdateLead();

  const [targetStage, setTargetStage] = useState<string>('contacted');
  const [nextAction, setNextAction] = useState<string>('');
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [lostReason, setLostReason] = useState<string>('');

  React.useEffect(() => {
    if (lead) {
      setTargetStage(lead.stage || (lead as any).status || 'new');
      setNextAction(lead.nextAction || '');
      setEstimatedValue(lead.estimatedValue ? String(lead.estimatedValue) : '');
      setLostReason('');
    }
  }, [lead, open]);

  if (!lead) return null;

  const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Prospect';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      const updates: any = {
        status: targetStage,
        next_action: nextAction.trim() || undefined,
        stage_entered_at: new Date().toISOString(),
      };

      if (estimatedValue.trim()) {
        updates.estimated_value = Number(estimatedValue);
      }

      if (targetStage === 'stalled' && lostReason.trim()) {
        updates.notes = lead.notes
          ? `${lead.notes}\n[Lost Reason: ${lostReason.trim()}]`
          : `[Lost Reason: ${lostReason.trim()}]`;
      }

      await updateLead.mutateAsync({
        id: lead.id,
        updates,
      });

      const stageObj = PIPELINE_STAGES.find((s) => s.value === targetStage);
      toast(`Moved ${leadName} to "${stageObj?.label || targetStage}"`, 'success');

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update pipeline stage', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advance Pipeline Stage"
      description={`Update sales trajectory and next actions for ${leadName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stage Selection */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
            Target Pipeline Stage
          </label>
          <div className="space-y-1.5">
            {PIPELINE_STAGES.map((stg) => {
              const isSelected = targetStage === stg.value;
              const isCurrent = (lead.stage || (lead as any).status) === stg.value;

              return (
                <button
                  key={stg.value}
                  type="button"
                  onClick={() => setTargetStage(stg.value)}
                  className={`w-full p-2.5 rounded-[var(--radius-md)] border text-left text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--color-bg-elevated)] border-emerald-500/50 text-[var(--color-text-primary)] shadow-sm'
                      : 'bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stg.value === 'converted'
                          ? 'bg-emerald-400'
                          : stg.value === 'stalled'
                          ? 'bg-red-400'
                          : stg.value === 'meeting_booked'
                          ? 'bg-teal-400'
                          : stg.value === 'qualified'
                          ? 'bg-green-400'
                          : stg.value === 'contacted'
                          ? 'bg-blue-400'
                          : 'bg-zinc-400'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {stg.label}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] font-mono">
                          Current
                        </span>
                      )}
                      <p className="text-[11px] text-[var(--color-text-muted)]">{stg.desc}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Action input */}
        <Input
          label="Next Action Step"
          placeholder="e.g. Schedule follow-up AI call, send pricing quote..."
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          hint="Visible to the entire sales & outreach team on Kanban card"
        />

        {/* Estimated Value */}
        <Input
          label="Deal Value ($ USD)"
          type="number"
          placeholder="e.g. 5000"
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
        />

        {/* Lost Reason if target is stalled */}
        {targetStage === 'stalled' && (
          <Input
            label="Reason for Stalling / Disqualification"
            placeholder="e.g. Budget constraints, opted for competitor, requested DNC..."
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            required
          />
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={updateLead.isPending}>
            <ArrowRight size={14} className="mr-1.5" />
            Update Stage
          </Button>
        </div>
      </form>
    </Modal>
  );
};
