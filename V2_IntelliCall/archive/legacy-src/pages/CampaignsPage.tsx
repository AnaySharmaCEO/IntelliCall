import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCampaigns, useAgents } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { FilterBar, FilterChip } from "../components/ui/FilterBar";
import type { CampaignStatus } from "../types";

function statusVariant(s: CampaignStatus) {
  if (s === "active")    return "success";
  if (s === "paused")    return "warning";
  if (s === "completed") return "info";
  if (s === "archived")  return "error";
  return "neutral";
}

type Filter = "all" | CampaignStatus;

export default function CampaignsPage() {
  const { data: campaigns, loading, error, reload } = useCampaigns();
  const { data: agents } = useAgents();
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  const filtered = (campaigns ?? []).filter(c => filter === "all" || c.status === filter);

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ fontSize: 22, color: "var(--color-text-primary)" }}>
            Campaigns
          </h1>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            Manage your outbound qualification campaigns.
          </p>
        </div>
        <Link to="/campaigns/new">
          <Button>Create campaign</Button>
        </Link>
      </div>

      <FilterBar className="mb-4">
        <FilterChip active={filter === "all"}       onClick={() => setFilter("all")}>All</FilterChip>
        <FilterChip active={filter === "active"}    onClick={() => setFilter("active")}>Active</FilterChip>
        <FilterChip active={filter === "paused"}    onClick={() => setFilter("paused")}>Paused</FilterChip>
        <FilterChip active={filter === "draft"}     onClick={() => setFilter("draft")}>Draft</FilterChip>
        <FilterChip active={filter === "completed"} onClick={() => setFilter("completed")}>Completed</FilterChip>
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
          <SkeletonTable rows={4} />
        ) : error ? (
          <div className="p-4">
            <ErrorInline message="Couldn't load campaigns." onRetry={reload} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 9h18" />
              </svg>
            }
            title={filter === "all" ? "No campaigns yet" : `No ${filter} campaigns`}
            description={
              filter === "all"
                ? "Create your first campaign to start qualifying leads."
                : "Try a different filter."
            }
            action={
              filter === "all"
                ? { label: "Create campaign", onClick: () => navigate("/campaigns/new") }
                : undefined
            }
          />
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Name", "Status", "Agent", "Threshold", "Leads", "Qual. rate", "Meetings", ""].map(col => (
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
              {filtered.map(c => {
                const agent = (agents || []).find(a => a.id === c.agent_id);
                return (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = "var(--color-bg-sunken)")
                    }
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-3 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {c.name}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {agent?.name ?? "—"}
                    </td>
                    <td
                      className="px-3 py-3"
                      style={{ fontFamily: "var(--font-data)", color: "var(--color-text-secondary)" }}
                    >
                      {c.confidence_threshold}%
                    </td>
                    <td
                      className="px-3 py-3 text-right"
                      style={{ fontFamily: "var(--font-data)", color: "var(--color-text-secondary)" }}
                    >
                      {c.leads_targeted.toLocaleString()}
                    </td>
                    <td
                      className="px-3 py-3 text-right font-semibold"
                      style={{
                        fontFamily: "var(--font-data)",
                        color:
                          c.qualification_rate !== null && c.qualification_rate >= 40
                            ? "var(--color-success)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {c.qualification_rate !== null ? `${c.qualification_rate}%` : "—"}
                    </td>
                    <td
                      className="px-3 py-3 text-right"
                      style={{ fontFamily: "var(--font-data)", color: "var(--color-text-secondary)" }}
                    >
                      {c.meetings_booked}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/campaigns/${c.id}`}
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
