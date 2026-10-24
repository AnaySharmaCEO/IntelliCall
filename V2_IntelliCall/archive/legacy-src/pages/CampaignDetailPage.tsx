import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCampaign, useAgents, useLeads, useCalls, useDecisions } from "../hooks";
import ErrorInline from "../components/ui/ErrorInline";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfidenceIndicator from "../components/shared/ConfidenceIndicator";
import { SkeletonTable } from "../components/ui/Skeleton";
import type { CampaignStatus, LeadStatus } from "../types";

function statusVariant(s: CampaignStatus) {
  if (s === "active")    return "success";
  if (s === "paused")    return "warning";
  if (s === "completed") return "info";
  return "neutral";
}

function leadStatusVariant(s: LeadStatus) {
  if (["qualified", "meeting_booked", "meeting_attended", "converted"].includes(s)) return "success";
  if (["not_qualified", "stalled"].includes(s)) return "error";
  return "neutral";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, loading, error, reload } = useCampaign(id ?? "");
  const { data: agents } = useAgents();
  const { data: allLeads } = useLeads();
  const { data: allCalls } = useCalls();
  const { data: allDecisions } = useDecisions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div>
        <div className="h-5 w-48 rounded bg-[var(--color-bg-sunken)] animate-[ic-shimmer_1.5s_infinite] mb-6" />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  if (error) return <ErrorInline message="Couldn't load campaign." onRetry={reload} />;
  if (!campaign) return <p style={{ color: "var(--color-text-muted)" }}>Campaign not found.</p>;

  const agent = (agents || []).find(a => a.id === campaign.agent_id);
  const leads = (allLeads || []).filter(l => l.campaign_id === campaign.id);
  const calls = (allCalls || []).filter(c => c.campaign_id === campaign.id);
  const decisions = (allDecisions || []).filter(d => d.campaign_id === campaign.id);
  const reviewCount = decisions.filter(d => d.outcome === "review_required" && d.action_status === "pending").length;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link to="/campaigns" style={{ color: "var(--color-action-primary)" }} className="hover:underline">
          Campaigns
        </Link>
        <span className="mx-1.5">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{campaign.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-semibold" style={{ fontSize: 22 }}>{campaign.name}</h1>
            <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
          </div>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            Agent: {agent?.name ?? "—"} · Threshold:{" "}
            <span style={{ fontFamily: "var(--font-data)" }}>{campaign.confidence_threshold}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reviewCount > 0 && (
            <Link to="/decisions">
              <Button size="sm" variant="destructive">
                {reviewCount} review{reviewCount !== 1 ? "s" : ""} pending
              </Button>
            </Link>
          )}
          <Link to={`/campaigns/new`}>
            <Button size="sm" variant="outline">Edit settings</Button>
          </Link>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Leads targeted", value: campaign.leads_targeted.toLocaleString() },
          { label: "Calls made", value: String(calls.length) },
          {
            label: "Qualification rate",
            value: campaign.qualification_rate !== null ? `${campaign.qualification_rate}%` : "—",
          },
          { label: "Meetings booked", value: String(campaign.meetings_booked) },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="rounded-[var(--radius-md)] p-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p
              className="text-[12px] font-medium mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {kpi.label}
            </p>
            <p
              className="font-semibold"
              style={{ fontFamily: "var(--font-data)", fontSize: 22 }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Threshold summary */}
      <div
        className="rounded-[var(--radius-md)] p-4 mb-6"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold">Confidence threshold</h2>
          <Link
            to="/campaigns/new"
            className="text-[12px] font-semibold hover:underline"
            style={{ color: "var(--color-action-primary)" }}
          >
            Edit →
          </Link>
        </div>
        <div className="max-w-sm">
          <ConfidenceIndicator
            score={campaign.confidence_threshold}
            tier={campaign.confidence_threshold >= 80 ? "high" : campaign.confidence_threshold >= 65 ? "medium" : "low"}
            variant="detail"
            threshold={campaign.confidence_threshold}
          />
          <p className="text-[12px] mt-2" style={{ color: "var(--color-text-secondary)" }}>
            Decisions above {campaign.confidence_threshold}% are executed automatically. Below that, they route to review.
          </p>
        </div>
      </div>

      {/* Leads table */}
      <div
        className="rounded-[var(--radius-md)] overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <h2 className="text-[14px] font-semibold">Leads in campaign</h2>
          <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            {leads.length} lead{leads.length !== 1 ? "s" : ""}
          </span>
        </div>
        {leads.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            No leads in this campaign yet.
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Name", "Company", "Status", "Last activity", "Confidence", ""].map(col => (
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
              {leads.map(lead => (
                <tr
                  key={lead.id}
                  className="cursor-pointer"
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <td className="px-3 py-3 font-medium">{lead.name}</td>
                  <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                    {lead.company}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant={leadStatusVariant(lead.status)}>
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td
                    className="px-3 py-3 text-[12px]"
                    style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}
                  >
                    {formatDate(lead.last_activity_at)}
                  </td>
                  <td className="px-3 py-3">
                    {lead.confidence_score !== null && lead.confidence_tier ? (
                      <ConfidenceIndicator score={lead.confidence_score} tier={lead.confidence_tier} />
                    ) : (
                      <span style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="text-[12px] font-semibold hover:underline"
                      style={{ color: "var(--color-action-primary)" }}
                      onClick={e => e.stopPropagation()}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
