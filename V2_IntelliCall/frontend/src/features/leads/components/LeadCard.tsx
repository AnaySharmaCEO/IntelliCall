import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall, ArrowRight, AlertCircle, Building2, Phone, Calendar } from 'lucide-react';
import type { Lead } from '../../../contracts/entities';
import { formatPhone } from '../../../lib/format';

interface LeadCardProps {
  lead: Lead;
  onScheduleCall: (lead: Lead) => void;
  onMoveStage: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onScheduleCall, onMoveStage }) => {
  const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Prospect';
  const dealValue = Number(lead.estimatedValue || (lead as any).estimated_value) || 0;

  // Compute days in stage
  const daysInStage = lead.daysInStage !== undefined
    ? lead.daysInStage
    : (lead as any).stage_entered_at
    ? Math.floor((Date.now() - new Date((lead as any).stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isStuck = daysInStage > 5 && lead.stage !== 'converted' && lead.stage !== 'stalled';

  return (
    <div className="group relative rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] p-3.5 shadow-2xs hover:border-[var(--color-border-default)] transition-all space-y-3">
      {/* Top row: Name & Deal Value */}
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/leads/${lead.id}`}
          className="text-xs font-bold text-[var(--color-text-primary)] hover:text-emerald-400 transition-colors line-clamp-1"
        >
          {leadName}
        </Link>
        <span className="text-xs font-mono font-semibold text-emerald-400 flex-shrink-0">
          ${dealValue.toLocaleString()}
        </span>
      </div>

      {/* Company & Phone info */}
      <div className="space-y-1 text-[11px] text-[var(--color-text-secondary)]">
        {lead.company && (
          <div className="flex items-center gap-1.5 truncate">
            <Building2 size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 font-mono text-[var(--color-text-muted)]">
          <Phone size={11} className="flex-shrink-0" />
          <span className="truncate">{formatPhone(lead.phone)}</span>
        </div>
      </div>

      {/* Stuck Alert */}
      {isStuck && (
        <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
          <AlertCircle size={11} className="flex-shrink-0" />
          <span>Stuck for {daysInStage} days without movement</span>
        </div>
      )}

      {/* Next Action snippet */}
      {lead.nextAction && (
        <div className="text-[11px] bg-[var(--color-bg-sunken)] p-1.5 rounded border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
          <span className="font-semibold text-emerald-400 mr-1">Next:</span>
          <span className="line-clamp-1">{lead.nextAction}</span>
        </div>
      )}

      {/* Card Action Buttons */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onScheduleCall(lead)}
          className="flex-1 py-1 px-2 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 border border-[var(--color-border-subtle)] text-[11px] font-semibold text-[var(--color-text-primary)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Schedule AI Call"
        >
          <PhoneCall size={12} />
          <span>AI Call</span>
        </button>

        <button
          type="button"
          onClick={() => onMoveStage(lead)}
          className="flex-1 py-1 px-2 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30 border border-[var(--color-border-subtle)] text-[11px] font-semibold text-[var(--color-text-primary)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
          title="Change Pipeline Stage"
        >
          <ArrowRight size={12} />
          <span>Move</span>
        </button>

        <Link
          to={`/leads/${lead.id}`}
          className="py-1 px-2 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-center"
          title="View Lead Details"
        >
          Details
        </Link>
      </div>
    </div>
  );
};
