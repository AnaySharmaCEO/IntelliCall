import React from 'react';
import { cn } from '../../lib/cn';
import { Quote } from 'lucide-react';
import { formatDuration } from '../../lib/format';

export interface EvidenceChipProps {
  quote: string;
  timestampSeconds?: number;
  onSeek?: (seconds: number) => void;
  className?: string;
}

export const EvidenceChip: React.FC<EvidenceChipProps> = ({
  quote,
  timestampSeconds,
  onSeek,
  className,
}) => {
  return (
    <div
      onClick={() => timestampSeconds !== undefined && onSeek?.(timestampSeconds)}
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)]',
        'text-xs text-[var(--color-text-secondary)] transition-colors',
        timestampSeconds !== undefined && onSeek ? 'cursor-pointer hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-sunken)]' : '',
        className
      )}
    >
      <Quote size={13} className="shrink-0 text-[var(--color-text-muted)] mt-0.5" />
      <span className="flex-1 italic break-words">"{quote}"</span>
      {timestampSeconds !== undefined && (
        <span className="shrink-0 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] group-hover:text-[var(--color-action-primary)]">
          {formatDuration(timestampSeconds)}
        </span>
      )}
    </div>
  );
};

export default EvidenceChip;
