import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ArrowRight, AlertCircle, Users, ExternalLink } from 'lucide-react';
import type { Lead } from '../../../contracts/entities';
import { PIPELINE_STAGES } from './MoveStageModal';
import { formatPhone, formatDate } from '../../../lib/format';
import { EmptyState } from '../../../components/ui';

interface LeadCompactTableProps {
  leads: Lead[];
  onScheduleCall: (lead: Lead) => void;
  onMoveStage: (lead: Lead) => void;
  onAddLead: () => void;
}

export const LeadCompactTable: React.FC<LeadCompactTableProps> = ({
  leads,
  onScheduleCall,
  onMoveStage,
  onAddLead,
}) => {
  if (leads.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] p-8">
        <EmptyState
          icon={<Users size={32} />}
          title="No prospects found in this view"
          description="Try clearing your search filters or add a new lead record."
          action={{
            label: 'Add Prospect',
            onClick: onAddLead,
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/60 text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Opportunity</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Est. Value</th>
              <th className="py-3 px-4">Time in Stage</th>
              <th className="py-3 px-4">Next Action</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {leads.map((lead: any) => {
              const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Prospect';
              const rawStage = lead.stage || lead.status || 'new';
              const stageObj = PIPELINE_STAGES.find((s) => s.value === rawStage) || {
                label: rawStage,
                color: 'slate',
              };

              const dealValue = Number(lead.estimatedValue || lead.estimated_value) || 0;
              const daysInStage = lead.daysInStage !== undefined
                ? lead.daysInStage
                : lead.stage_entered_at
                ? Math.floor((Date.now() - new Date(lead.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
                : 0;

              const isStuck = daysInStage > 5 && rawStage !== 'converted' && rawStage !== 'stalled';

              return (
                <tr key={lead.id} className="hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
                  {/* Opportunity & Contact */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-semibold text-[var(--color-text-primary)] hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{leadName}</span>
                        <ExternalLink size={11} className="text-[var(--color-text-muted)]" />
                      </Link>
                      <div className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
                        {lead.company && <span>{lead.company}</span>}
                        {lead.company && lead.phone && <span>&bull;</span>}
                        <span className="font-mono text-[var(--color-text-muted)]">{formatPhone(lead.phone)}</span>
                      </div>
                    </div>
                  </td>

                  {/* Stage badge */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          stageObj.value === 'converted'
                            ? 'bg-emerald-400'
                            : stageObj.value === 'stalled'
                            ? 'bg-red-400'
                            : stageObj.value === 'meeting_booked'
                            ? 'bg-teal-400'
                            : stageObj.value === 'qualified'
                            ? 'bg-green-400'
                            : stageObj.value === 'contacted'
                            ? 'bg-blue-400'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span>{stageObj.label}</span>
                    </span>
                  </td>

                  {/* Deal Value */}
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                    ${dealValue.toLocaleString()}
                  </td>

                  {/* Time in Stage */}
                  <td className="py-3.5 px-4">
                    {isStuck ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] font-semibold">
                        <AlertCircle size={10} />
                        Stuck {daysInStage}d
                      </span>
                    ) : (
                      <span className="font-mono text-[var(--color-text-muted)]">
                        {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
                      </span>
                    )}
                  </td>

                  {/* Next Action */}
                  <td className="py-3.5 px-4 text-[var(--color-text-secondary)] max-w-xs truncate">
                    {lead.nextAction || <span className="text-[var(--color-text-muted)]">&mdash;</span>}
                  </td>

                  {/* Source */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--color-text-muted)] capitalize">
                    {lead.source || 'Manual'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onScheduleCall(lead)}
                        className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-emerald-500/10 hover:text-emerald-400 text-[var(--color-text-secondary)] transition-colors border border-[var(--color-border-subtle)]"
                        title="Schedule AI Call"
                      >
                        <PhoneCall size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveStage(lead)}
                        className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-blue-500/10 hover:text-blue-400 text-[var(--color-text-secondary)] transition-colors border border-[var(--color-border-subtle)]"
                        title="Change Stage"
                      >
                        <ArrowRight size={13} />
                      </button>

                      <Link
                        to={`/leads/${lead.id}`}
                        className="py-1 px-2 text-[11px] font-medium rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] transition-colors border border-[var(--color-border-subtle)]"
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
