import React from 'react';
import { cn } from '../../lib/cn';

export interface FunnelStep {
  label: string;
  count: number;
  color?: string;
}

export interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ steps, className }) => {
  const max = Math.max(...steps.map((s) => s.count), 1);

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      {steps.map((step, idx) => {
        const percent = Math.round((step.count / max) * 100);
        const conversionFromPrev =
          idx > 0 && steps[idx - 1].count > 0
            ? Math.round((step.count / steps[idx - 1].count) * 100)
            : null;

        return (
          <div key={step.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-text-secondary)]">{step.label}</span>
              <div className="flex items-center gap-2">
                {conversionFromPrev !== null && (
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                    ({conversionFromPrev}% conv)
                  </span>
                )}
                <span className="font-mono font-semibold text-[var(--color-text-primary)]">
                  {step.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-3 w-full bg-[var(--color-bg-sunken)] rounded-[var(--radius-xs)] overflow-hidden">
              <div
                className={cn('h-full transition-all duration-300 rounded-[var(--radius-xs)]', step.color || 'bg-[var(--color-brand-blue)]')}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FunnelChart;
