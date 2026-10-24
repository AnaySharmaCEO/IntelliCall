import { type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className = "" }: TabsProps) {
  return (
    <div
      role="tablist"
      className={["flex border-b border-[var(--color-border-subtle)]", className].join(" ")}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            "flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors duration-[var(--duration-fast)]",
            active === tab.id
              ? "text-[var(--color-text-primary)] font-semibold border-[var(--color-action-primary)]"
              : "text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]",
          ].join(" ")}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={[
                "text-[11px] px-1.5 py-0.5 rounded-[var(--radius-pill)]",
                active === tab.id
                  ? "bg-[var(--color-action-secondary-bg)] text-[var(--color-action-secondary-text)]"
                  : "bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]",
              ].join(" ")}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  active: string;
  children: ReactNode;
}

export function TabPanel({ id, active, children }: TabPanelProps) {
  if (id !== active) return null;
  return <div role="tabpanel">{children}</div>;
}
