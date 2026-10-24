import React, { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className }) => {
  return (
    <div
      role="tablist"
      className={cn('flex border-b border-[var(--color-border-subtle)] overflow-x-auto no-scrollbar', className)}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-[var(--duration-fast)] cursor-pointer whitespace-nowrap',
            active === tab.id
              ? 'text-[var(--color-text-primary)] font-semibold border-[var(--color-action-primary)]'
              : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'text-[11px] px-1.5 py-0.5 rounded-[var(--radius-pill)] font-mono',
                active === tab.id
                  ? 'bg-[var(--color-action-secondary-bg)] text-[var(--color-action-secondary-text)]'
                  : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export interface TabPanelProps {
  id: string;
  active: string;
  children: ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, active, children }) => {
  if (id !== active) return null;
  return <div role="tabpanel">{children}</div>;
};

export default Tabs;
