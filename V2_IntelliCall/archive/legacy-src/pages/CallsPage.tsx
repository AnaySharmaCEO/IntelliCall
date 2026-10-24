import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCalls, useLeads, useCampaigns, useAgents } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import AIStateBanner from "../components/shared/AIStateBanner";
import { FilterBar, FilterChip } from "../components/ui/FilterBar";
import { mockDecisions } from "../mock";
import type { CallStatus } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(s: CallStatus) {
  if (s === "completed")                                      return "success";
  if (s === "connected" || s === "calling" || s === "processing") return "info";
  if (s === "failed" || s === "no_answer" || s === "voicemail")   return "error";
  if (s === "scheduled")                                      return "neutral";
  return "neutral";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(secs: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

type StatusFilter = "all" | "live" | "completed" | "failed";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CallsPage() {
  const { data: calls, loading, error, reload } = useCalls();
  const { data: leads } = useLeads();
  const { data: campaigns } = useCampaigns();
  const { data: agents } = useAgents();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const navigate = useNavigate();

  const liveCalls = (calls ?? []).filter(c =>
    ["calling", "connected", "processing"].includes(c.status)
  );

  const filtered = (calls ?? []).filter(c => {
    if (filter === "live")      return ["calling", "connected", "processing"].includes(c.status);
    if (filter === "completed") return c.status === "completed";
    if (filter === "failed")    return ["failed", "no_answer", "voicemail"].includes(c.status);
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ fontSize: 22, color: "var(--color-text-primary)" }}>
            Calls
          </h1>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            All calls across your campaigns.
          </p>
        </div>
      </div>

      {/* Live call banners */}
      {liveCalls.map(call => {
        const lead = (leads || []).find(l => l.id === call.lead_id);
        return (
          <AIStateBanner
            key={call.id}
            state={
              call.status === "connected"
                ? "CONNECTED"
                : call.status === "processing"
                ? "PROCESSING"
                : "CALLING"
            }
            detail={lead ? `${lead.name} — ${lead.company}` : undefined}
          />
        );
      })}

      <FilterBar className="mb-4">
        <FilterChip active={filter === "all"}       onClick={() => setFilter("all")}>All</FilterChip>
        <FilterChip active={filter === "live"}      onClick={() => setFilter("live")}>Live</FilterChip>
        <FilterChip active={filter === "completed"} onClick={() => setFilter("completed")}>Completed</FilterChip>
        <FilterChip active={filter === "failed"}    onClick={() => setFilter("failed")}>Failed / No answer</FilterChip>
      </FilterBar>

      <div
        className="rounded-[var(--radius-md)] overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <SkeletonTable rows={5} />
        ) : error ? (
          <div className="p-4">
            <ErrorInline message="Couldn't load calls." onRetry={reload} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2z" />
              </svg>
            }
            title="No calls yet"
            description="Calls will appear here once your campaigns start running."
          />
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Lead", "Campaign", "Agent", "Started", "Duration", "Status", "Decision", ""].map(col => (
                  <th
                    key={col}
                    className="text-left text-[12px] font-medium px-3 py-2.5"
                    style={{
                      color: "var(--color-text-secondary)",
                      background: "var(--color-bg-sunken)",
                      borderBottom: "1px solid var(--color-border-default)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(call => {
                const lead     = (leads || []).find(l => l.id === call.lead_id);
                const campaign = (campaigns || []).find(c => c.id === call.campaign_id);
                const agent    = (agents || []).find(a => a.id === call.agent_id);
                const decision = mockDecisions.find(d => d.id === call.decision_id);
                const isLive   = ["calling", "connected", "processing"].includes(call.status);

                return (
                  <tr
                    key={call.id}
                    className="cursor-pointer"
                    style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                    onClick={() => navigate(`/calls/${call.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-3 py-3">
                      <span className="font-medium">{lead?.name ?? "—"}</span>
                      {lead?.company && (
                        <span
                          className="block text-[11px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {lead.company}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {campaign?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {agent?.name ?? "—"}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px]"
                      style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}
                    >
                      {formatDate(call.started_at)}
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{
                        fontFamily: "var(--font-data)",
                        color: isLive ? "var(--color-success)" : "var(--color-text-muted)",
                      }}
                    >
                      {isLive ? "Live" : formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={statusVariant(call.status)}>
                        {call.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      {decision ? (
                        <Badge
                          variant={
                            decision.outcome === "qualified"     ? "success"
                            : decision.outcome === "not_qualified" ? "error"
                            : "warning"
                          }
                        >
                          {decision.outcome === "review_required"
                            ? "Review"
                            : decision.outcome === "qualified"
                            ? "Qualified"
                            : "Not qual."}
                        </Badge>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/calls/${call.id}`}
                        className="text-[12px] font-semibold hover:underline"
                        style={{ color: "var(--color-action-primary)" }}
                        onClick={e => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
