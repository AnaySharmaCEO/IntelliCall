import React from 'react';
import { PIPELINE_STAGES } from './MoveStageModal';
import { LeadCard } from './LeadCard';
import type { Lead } from '../../../contracts/entities';

interface LeadKanbanBoardProps {
  leads: Lead[];
  onScheduleCall: (lead: Lead) => void;
  onMoveStage: (lead: Lead) => void;
}

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onScheduleCall,
  onMoveStage,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="inline-flex gap-4 min-w-full">
        {PIPELINE_STAGES.map((stg) => {
          // Normalize matching: lead.stage or lead.status
          const stageLeads = leads.filter(
            (l: any) => (l.stage || l.status) === stg.value
          );

          const stageValue = stageLeads.reduce((acc, l: any) => {
            return acc + (Number(l.estimatedValue || l.estimated_value) || 0);
          }, 0);

          return (
            <div
              key={stg.value}
              className="w-72 flex-shrink-0 flex flex-col rounded-[var(--radius-lg)] bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)] overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
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
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {stg.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] font-semibold border border-[var(--color-border-subtle)]">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
                  <span>Value:</span>
                  <span className="text-[var(--color-text-primary)] font-semibold">
                    ${stageValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Column Body / Cards */}
              <div className="p-2.5 space-y-2.5 flex-1 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-center p-3">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      No prospects in this stage
                    </p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onScheduleCall={onScheduleCall}
                      onMoveStage={onMoveStage}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
