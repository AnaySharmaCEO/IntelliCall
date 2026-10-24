import React from 'react';
import { DollarSign, Flame, AlertCircle, Target } from 'lucide-react';
import type { Lead } from '../../../contracts/entities';

interface PipelineMetricTilesProps {
  leads: Lead[];
  isLoading?: boolean;
}

export const PipelineMetricTiles: React.FC<PipelineMetricTilesProps> = ({ leads, isLoading }) => {
  // Compute metrics
  const activeLeads = leads.filter(
    (l: any) => l.status !== 'converted' && l.status !== 'stalled' && l.status !== 'not_qualified'
  );

  const totalPipelineValue = activeLeads.reduce((acc, l: any) => {
    return acc + (Number(l.estimatedValue || l.estimated_value) || 0);
  }, 0);

  const stuckLeads = activeLeads.filter((l: any) => {
    const days = l.daysInStage !== undefined
      ? l.daysInStage
      : l.stage_entered_at
      ? Math.floor((Date.now() - new Date(l.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return days > 5;
  });

  const convertedCount = leads.filter((l: any) => l.status === 'converted').length;
  const winRate = leads.length > 0 ? Math.round((convertedCount / leads.length) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Pipeline Value */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Active Pipeline Value
          </span>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
            {isLoading ? (
              <span className="text-xs text-[var(--color-text-muted)]">Calculating...</span>
            ) : (
              `$${totalPipelineValue.toLocaleString()}`
            )}
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            Across {activeLeads.length} active opportunities
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
          <DollarSign size={18} />
        </div>
      </div>

      {/* 2. Active Opportunities */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            In-Flight Opportunities
          </span>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
            {isLoading ? '...' : activeLeads.length}
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            Out of {leads.length} total prospect records
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
          <Flame size={18} />
        </div>
      </div>

      {/* 3. Stuck / At Risk */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Stuck / At Risk (&gt;5d)
          </span>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
            {isLoading ? '...' : stuckLeads.length}
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            {stuckLeads.length > 0 ? (
              <span className="text-amber-400 font-medium">Require follow-up outreach</span>
            ) : (
              'Pipeline cadence is healthy'
            )}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          stuckLeads.length > 0
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            : 'bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
        }`}>
          <AlertCircle size={18} />
        </div>
      </div>

      {/* 4. Conversion Velocity */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] font-medium">
            Won / Converted
          </span>
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
            {isLoading ? '...' : `${convertedCount} (${winRate}%)`}
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            Successfully closed prospects
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400">
          <Target size={18} />
        </div>
      </div>
    </div>
  );
};
