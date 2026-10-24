import type { ReactNode } from "react";
import Button from "./Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-8 h-8 mb-3 text-[var(--color-text-muted)]">{icon}</div>
      <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-4 max-w-xs">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
