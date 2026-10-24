type AIState =
  | "ANALYZING_CONVERSATION"
  | "EXTRACTING_EVIDENCE"
  | "DECISION_PENDING"
  | "REVIEW_REQUIRED"
  | "AUTO_ACTION_EXECUTED"
  | "OUTCOME_PENDING"
  | "CALLING"
  | "CONNECTED"
  | "PROCESSING"
  | "COMPLETED";

interface AIStateBannerProps {
  state: AIState;
  detail?: string;
}

const stateConfig: Record<AIState, { label: string; color: string; pulse: boolean }> = {
  ANALYZING_CONVERSATION: { label: "Analyzing conversation", color: "var(--color-info)", pulse: true },
  EXTRACTING_EVIDENCE: { label: "Extracting evidence", color: "var(--color-info)", pulse: true },
  DECISION_PENDING: { label: "Decision pending", color: "var(--color-info)", pulse: true },
  REVIEW_REQUIRED: { label: "Review required", color: "var(--color-warning)", pulse: false },
  AUTO_ACTION_EXECUTED: { label: "Auto-action executed", color: "var(--color-success)", pulse: false },
  OUTCOME_PENDING: { label: "Outcome pending", color: "var(--color-info)", pulse: false },
  CALLING: { label: "Calling", color: "var(--color-info)", pulse: true },
  CONNECTED: { label: "Connected", color: "var(--color-success)", pulse: true },
  PROCESSING: { label: "Processing", color: "var(--color-info)", pulse: true },
  COMPLETED: { label: "Completed", color: "var(--color-success)", pulse: false },
};

export default function AIStateBanner({ state, detail }: AIStateBannerProps) {
  const config = stateConfig[state];

  return (
    <div
      className="flex items-center gap-2 bg-[var(--color-bg-sunken)] border-l-[3px] px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold text-[var(--color-text-secondary)] mb-3"
      style={{ borderLeftColor: config.color }}
      role="status"
      aria-live="polite"
    >
      {config.pulse ? (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-[ic-pulse_1.4s_infinite]"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
      )}
      <span className="uppercase tracking-wide text-[11px]">{config.label}</span>
      {detail && <span className="font-normal text-[var(--color-text-muted)]">— {detail}</span>}
    </div>
  );
}
