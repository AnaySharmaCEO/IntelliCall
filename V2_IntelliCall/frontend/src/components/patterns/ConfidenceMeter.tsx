import React from 'react';
import { cn } from '../../lib/cn';

export interface ConfidenceMeterProps {
  /** Value from 0.0 to 1.0 or 0 to 100 */
  value: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  value,
  label,
  showPercentage = true,
  className,
}) => {
  // Normalize to 0 - 100
  const normalized = value > 1 ? Math.min(100, Math.max(0, value)) : Math.round(value * 100);

  let barColor = 'bg-[var(--color-error)]';
  if (normalized >= 75) {
    barColor = 'bg-[var(--color-success)]';
  } else if (normalized >= 50) {
    barColor = 'bg-[var(--color-warning)]';
  }

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      <div className="flex items-center justify-between text-xs">
        {label && <span className="text-[var(--color-text-secondary)] font-medium">{label}</span>}
        {showPercentage && (
          <span className="font-mono text-[var(--color-text-primary)] font-semibold ml-auto">
            {normalized}%
          </span>
        )}
      </div>
      <div className="h-1.5 w-full bg-[var(--color-bg-sunken)] rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300 rounded-full', barColor)}
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceMeter;
