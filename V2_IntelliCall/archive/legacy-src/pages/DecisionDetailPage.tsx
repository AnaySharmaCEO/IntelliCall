import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDecision, useLeads, useCampaigns, useOutcomes } from "../hooks";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import DecisionCard from "../components/shared/DecisionCard";
import EvidenceThread from "../components/shared/EvidenceThread";
import DecisionTrace from "../components/shared/DecisionTrace";
import AIStateBanner from "../components/shared/AIStateBanner";
import ActionCard from "../components/shared/ActionCard";
import OutcomeCard from "../components/shared/OutcomeCard";
import type { Decision } from "../types";

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: decision, loading, error, reload } = useDecision(id ?? "");
  const { data: allLeads } = useLeads();
  const { data: allCampaigns } = useCampaigns();
  const { data: allOutcomes } = useOutcomes();
  const [localDecision, setLocalDecision] = useState<Decision | null>(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] animate-[ic-shimmer_1.5s_infinite]"
            style={{ height: i === 1 ? 24 : 80, background: "var(--color-bg-sunken)" }}
          />
        ))}
      </div>
    );
  }

  if (error) return <ErrorInline message="Couldn't load decision." onRetry={reload} />;
  if (!decision) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        }
        title="Decision not found"
        description="This decision doesn't exist or has been removed."
      />
    );
  }

  const d = localDecision ?? decision;
  const lead = (allLeads || []).find(l => l.id === d.lead_id);
  const campaign = (allCampaigns || []).find(c => c.id === d.campaign_id);
  const outcome = (allOutcomes || []).find(o => o.decision_id === d.id) ?? null;
  const isPendingReview = d.outcome === "review_required" && d.action_status === "pending";

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link
          to="/decisions"
          className="hover:underline"
          style={{ color: "var(--color-action-primary)" }}
        >
          Decisions
        </Link>
        <span className="mx-1.5">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{lead?.name ?? d.id}</span>
      </nav>

      <div className="mb-5">
        <h1 className="text-[22px] font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Decision
        </h1>
        <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
          {lead?.name ?? "—"}
          {lead?.company && ` — ${lead.company}`}
          {campaign?.name && ` · ${campaign.name}`}
        </p>
      </div>

      {isPendingReview && (
        <div className="mb-5">
          <AIStateBanner
            state="REVIEW_REQUIRED"
            detail="approve or override before action executes"
          />
        </div>
      )}

      {/* Two-pane workspace: evidence left, actions right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: full evidence chain + decision card ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <DecisionCard
            decision={d}
            threshold={campaign?.confidence_threshold}
            context={isPendingReview ? "review" : "history"}
            leadName={lead ? `${lead.name} — ${lead.company}` : undefined}
            leadId={lead?.id}
            showConfidenceDetail
            onUpdate={updated => setLocalDecision(updated)}
          />

          {/* Evidence thread — Statement → Signal → Decision */}
          {d.evidence.length > 0 && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                Evidence thread
              </h3>
              <EvidenceThread
                steps={[
                  ...d.evidence.map(ev => ({
                    role: "Statement" as const,
                    content: `"${ev.quote}"`,
                  })),
                  {
                    role: "Signal" as const,
                    content: d.evidence.map(ev => `${ev.signal} (${ev.weight})`).join(" · "),
                  },
                  { role: "Decision" as const, content: d.reason },
                ]}
              />
            </div>
          )}

          {/* Outcome card — shown if this decision produced an outcome */}
          {outcome && (
            <OutcomeCard outcome={outcome} lead={lead} />
          )}

          {/* Decision trace — open by default on this detail page */}
          {d.trace.length > 0 && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 className="text-[13px] font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
                AI reasoning
              </h3>
              <DecisionTrace steps={d.trace} defaultOpen />
            </div>
          )}
        </div>

        {/* ── Right: action + metadata ── */}
        <div className="flex flex-col gap-4 w-full lg:w-[360px] lg:flex-shrink-0">
          {isPendingReview && (
            <ActionCard
              type={d.recommended_action}
              description="Approve the decision to execute this action, or override to dismiss it."
            />
          )}

          {/* Metadata panel */}
          <div
            className="rounded-[var(--radius-md)] p-4"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
              Details
            </h3>
            <div className="flex flex-col gap-2.5 text-[13px]">
              {[
                {
                  label: "Campaign",
                  value: campaign?.name ?? "—",
                  mono: false,
                },
                {
                  label: "Threshold",
                  value: campaign?.confidence_threshold !== undefined
                    ? `${campaign.confidence_threshold}%`
                    : "—",
                  mono: true,
                },
                {
                  label: "Confidence",
                  value: `${d.confidence_score}%`,
                  mono: true,
                },
                {
                  label: "Autonomy",
                  value: d.action_status === "executed" && !d.overridden_by
                    ? "Auto-executed"
                    : d.overridden_by || d.action_status === "dismissed"
                    ? "Overridden"
                    : "Pending review",
                  mono: false,
                },
                {
                  label: "Status",
                  value: d.action_status.charAt(0).toUpperCase() + d.action_status.slice(1),
                  mono: false,
                },
                ...(d.reviewed_at
                  ? [{
                      label: "Reviewed",
                      value: new Date(d.reviewed_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      }),
                      mono: true,
                    }]
                  : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: row.mono ? "var(--font-data)" : undefined,
                      fontSize: row.mono ? 12 : undefined,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source call link */}
          {d.call_id && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Source call
              </h3>
              <Link
                to={`/calls/${d.call_id}`}
                className="text-[13px] font-semibold hover:underline"
                style={{ color: "var(--color-action-primary)" }}
              >
                View full transcript →
              </Link>
            </div>
          )}

          {/* Lead link */}
          {lead && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Lead
              </h3>
              <Link
                to={`/leads/${lead.id}`}
                className="text-[13px] font-semibold hover:underline"
                style={{ color: "var(--color-action-primary)" }}
              >
                {lead.name} — {lead.company} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
