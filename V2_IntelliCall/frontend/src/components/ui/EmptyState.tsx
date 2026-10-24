import React, { type ReactNode } from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center mb-3.5 shadow-2xs text-[var(--color-text-secondary)]">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-5 max-w-sm">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
