import { useState } from "react";
import { useDecisions, useLeads, useCampaigns } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import ReviewQueueRow from "../components/shared/ReviewQueueRow";
import { FilterBar, FilterChip } from "../components/ui/FilterBar";
import type { Decision } from "../types";

type StatusFilter = "review_required" | "auto_executed" | "overridden" | "all";

export default function DecisionsPage() {
  const { data: decisions, loading, error, reload } = useDecisions();
  const { data: leads } = useLeads();
  const { data: campaigns } = useCampaigns();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("review_required");
  const [localDecisions, setLocalDecisions] = useState<Decision[] | null>(null);

  const source = localDecisions ?? decisions ?? [];

  const filtered = source.filter((d) => {
    if (statusFilter === "review_required") return d.outcome === "review_required" && d.action_status === "pending";
    if (statusFilter === "auto_executed") return d.action_status === "executed" && !d.overridden_by;
    if (statusFilter === "overridden") return !!d.overridden_by;
    return true;
  });

  const handleUpdate = (updated: Decision) => {
    const base = localDecisions ?? decisions ?? [];
    setLocalDecisions(base.map((d) => d.id === updated.id ? updated : d));
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold mb-1">Decisions</h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">Review, approve, or override AI decisions. Defaults to pending review.</p>
        </div>
      </div>

      <FilterBar className="mb-4">
        <FilterChip active={statusFilter === "review_required"} onClick={() => setStatusFilter("review_required")}>Review required</FilterChip>
        <FilterChip active={statusFilter === "auto_executed"} onClick={() => setStatusFilter("auto_executed")}>Auto-executed</FilterChip>
        <FilterChip active={statusFilter === "overridden"} onClick={() => setStatusFilter("overridden")}>Overridden</FilterChip>
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All</FilterChip>
      </FilterBar>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading ? <SkeletonTable rows={4} /> : error ? (
          <div className="p-4"><ErrorInline message="Couldn't load decisions." onRetry={reload} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>}
            title={statusFilter === "review_required" ? "No decisions pending review" : "No decisions found"}
            description={statusFilter === "review_required" ? "Decisions that need human review will appear here." : "Try adjusting your filter."}
          />
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Lead", "Campaign", "Decision", "Confidence", "Recommended action", ""].map((col) => (
                  <th key={col} className={["text-[12px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-sunken)] px-3 py-2.5 border-b border-[var(--color-border-default)]", col === "Confidence" || col === "" ? "text-right" : "text-left"].join(" ")}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <ReviewQueueRow
                  key={d.id}
                  decision={d}
                  lead={(leads || []).find((l) => l.id === d.lead_id)}
                  campaign={(campaigns || []).find((c) => c.id === d.campaign_id)}
                  onUpdate={handleUpdate}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
