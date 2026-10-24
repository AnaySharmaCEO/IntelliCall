import type { ConfidenceTier } from "../../types";

interface ConfidenceIndicatorProps {
  score: number;
  tier: ConfidenceTier;
  variant?: "badge" | "detail";
  threshold?: number;
}

const tierColors: Record<ConfidenceTier, string> = {
  high: "var(--color-success)",
  medium: "var(--color-warning)",
  low: "var(--color-error)",
};

const tierLabels: Record<ConfidenceTier, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

export default function ConfidenceIndicator({ score, tier, variant = "badge", threshold }: ConfidenceIndicatorProps) {
  const color = tierColors[tier];

  if (variant === "badge") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
        <span className="font-['IBM_Plex_Mono',ui-monospace,monospace]" style={{ color }}>{score}%</span>
        <span className="text-[var(--color-text-muted)] text-[11px]">{tierLabels[tier]}</span>
      </span>
    );
  }

  // detail variant
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-[28px] font-semibold leading-none"
          style={{ color }}
        >
          {score}%
        </span>
        <span className="text-[13px] font-semibold text-[var(--color-text-muted)]">{tierLabels[tier]}</span>
      </div>
      <div className="relative h-1.5 rounded-[var(--radius-pill)] bg-[var(--color-bg-sunken)] overflow-visible">
        <div
          className="h-full rounded-[var(--radius-pill)] transition-all duration-[var(--duration-base)]"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        {threshold !== undefined && (
          <div
            className="absolute top-[-3px] w-0.5 h-3 bg-[var(--color-text-muted)] rounded"
            style={{ left: `${threshold}%` }}
            title={`Threshold: ${threshold}%`}
          />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1">
        <span>0%</span>
        {threshold !== undefined && (
          <span style={{ marginLeft: `calc(${threshold}% - 20px)` }}>↑ {threshold}% threshold</span>
        )}
        <span>100%</span>
      </div>
    </div>
  );
}
