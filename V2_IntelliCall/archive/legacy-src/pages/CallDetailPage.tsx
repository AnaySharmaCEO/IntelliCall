import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useCall, useTranscript, useLeads, useCampaigns, useDecisions } from "../hooks";
import { Tabs, TabPanel } from "../components/ui/Tabs";
import ErrorInline from "../components/ui/ErrorInline";
import Badge from "../components/ui/Badge";
import DecisionCard from "../components/shared/DecisionCard";
import AIStateBanner from "../components/shared/AIStateBanner";
import EvidenceThread from "../components/shared/EvidenceThread";
import ConversationStatePanel from "../components/shared/ConversationStatePanel";
import { SkeletonTable } from "../components/ui/Skeleton";
import type { CallStatus, Decision } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(s: CallStatus) {
  if (s === "completed") return "success";
  if (["connected", "calling", "processing"].includes(s)) return "info";
  return "error";
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── TranscriptViewer ──────────────────────────────────────────────────────────
// Rendered inline here; see §32 of spec.
// Signal lines get a subtle left rule + tinted row bg — no bright full-row highlight.

function TranscriptViewer({ callId }: { callId: string }) {
  const { data: lines, loading } = useTranscript(callId);

  if (loading) return <SkeletonTable rows={4} />;

  if (!lines?.length) {
    return (
      <div
        className="px-4 py-8 text-center text-[13px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        No transcript available for this call.
      </div>
    );
  }

  return (
    <div
      className="divide-y"
      style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}
    >
      {lines.map(line => {
        const hasSignal = line.signals.length > 0;
        return (
          <div
            key={line.id}
            className="flex gap-4 px-4 py-3"
            style={
              hasSignal
                ? {
                    borderLeft: "2px solid var(--color-success)",
                    background: "color-mix(in srgb, var(--color-success-bg) 30%, transparent)",
                  }
                : {
                    borderLeft: "2px solid transparent",
                    borderBottom: "1px solid var(--color-border-subtle)",
                  }
            }
          >
            {/* Speaker + timestamp */}
            <div
              className="flex flex-col items-end flex-shrink-0"
              style={{ width: 72 }}
            >
              <span
                className="text-[11px] font-medium capitalize"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {line.speaker}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-data)",
                  fontSize: 10,
                  color: "var(--color-text-muted)",
                }}
              >
                {formatTime(line.timestamp_seconds)}
              </span>
            </div>

            {/* Text + signals */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>
                {line.text}
              </p>
              {hasSignal && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {line.signals.map(sig => (
                    <span
                      key={sig}
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--color-success)" }}
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: call, loading, error, reload } = useCall(id ?? "");
  const { data: allLeads } = useLeads();
  const { data: allCampaigns } = useCampaigns();
  const { data: allDecisions } = useDecisions();
  const [activeTab, setActiveTab] = useState("transcript");
  const [localDecision, setLocalDecision] = useState<Decision | null>(null);

  if (loading) return <SkeletonTable rows={5} />;
  if (error)   return <ErrorInline message="Couldn't load call." onRetry={reload} />;
  if (!call)   return <p style={{ color: "var(--color-text-muted)" }}>Call not found.</p>;

  const lead      = (allLeads || []).find(l => l.id === call.lead_id);
  const campaign  = (allCampaigns || []).find(c => c.id === call.campaign_id);
  const decision  = localDecision ?? (allDecisions || []).find(d => d.id === call.decision_id) ?? null;
  const convoState = null;
  const isLive    = ["calling", "connected", "processing"].includes(call.status);
  const reviewRequired =
    decision?.outcome === "review_required" && decision.action_status === "pending";

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link to="/calls" style={{ color: "var(--color-action-primary)" }} className="hover:underline">
          Calls
        </Link>
        <span className="mx-1.5">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>
          {lead?.name ?? call.id}
        </span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="font-semibold" style={{ fontSize: 22 }}>
          {lead?.name ?? "Call"}
        </h1>
        {lead?.company && (
          <span className="text-[15px]" style={{ color: "var(--color-text-secondary)" }}>
            — {lead.company}
          </span>
        )}
        <Badge variant={statusVariant(call.status)}>
          {call.status.replace(/_/g, " ")}
        </Badge>
        {call.duration_seconds && (
          <span
            className="text-[13px]"
            style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}
          >
            {formatTime(call.duration_seconds)}
          </span>
        )}
      </div>

      {/* Meta row */}
      <p className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <span style={{ fontFamily: "var(--font-data)" }}>{formatDate(call.started_at)}</span>
        {campaign && (
          <>
            {" · "}
            <Link
              to={`/campaigns/${campaign.id}`}
              className="hover:underline"
              style={{ color: "var(--color-action-primary)" }}
            >
              {campaign.name}
            </Link>
          </>
        )}
        {lead && (
          <>
            {" · "}
            <Link
              to={`/leads/${lead.id}`}
              className="hover:underline"
              style={{ color: "var(--color-action-primary)" }}
            >
              View lead →
            </Link>
          </>
        )}
      </p>

      {/* Live banner */}
      {isLive && (
        <AIStateBanner
          state={
            call.status === "connected"
              ? "CONNECTED"
              : call.status === "processing"
              ? "PROCESSING"
              : "CALLING"
          }
          detail="live call in progress — transcript updates when call completes"
        />
      )}

      {/* Review banner */}
      {reviewRequired && (
        <AIStateBanner
          state="REVIEW_REQUIRED"
          detail="approve or override before action executes"
        />
      )}

      {/* Two-pane */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left: Transcript ── */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-[var(--radius-md)] overflow-hidden"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Tabs
              tabs={[
                { id: "transcript", label: "Transcript" },
                { id: "state",      label: "Conversation state" },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            />
            <TabPanel id="transcript" active={activeTab}>
              <TranscriptViewer callId={call.id} />
            </TabPanel>
            <TabPanel id="state" active={activeTab}>
              <div className="p-4">
                {convoState ? (
                  <ConversationStatePanel state={convoState} />
                ) : (
                  <p
                    className="text-[13px] text-center py-6"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    No conversation state data for this call.
                  </p>
                )}
              </div>
            </TabPanel>
          </div>
        </div>

        {/* ── Right: Decision + Evidence ── */}
        <div
          className="flex flex-col gap-4 w-full lg:w-[400px] lg:flex-shrink-0"
        >
          {decision ? (
            <>
              <DecisionCard
                decision={decision}
                threshold={campaign?.confidence_threshold}
                context={reviewRequired ? "review" : "history"}
                leadName={lead ? `${lead.name} — ${lead.company}` : undefined}
                onUpdate={d => setLocalDecision(d)}
              />

              {/* Evidence thread */}
              {decision.evidence.length > 0 && (
                <div
                  className="rounded-[var(--radius-md)] p-4"
                  style={{
                    background: "var(--color-bg-surface)",
                    border: "1px solid var(--color-border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <h3 className="text-[13px] font-semibold mb-3">Evidence thread</h3>
                  <EvidenceThread
                    steps={[
                      ...decision.evidence.map(ev => ({
                        role: "Statement" as const,
                        content: `"${ev.quote}"`,
                      })),
                      {
                        role: "Signal" as const,
                        content: decision.evidence
                          .map(ev => `${ev.signal} (${ev.weight})`)
                          .join(" · "),
                      },
                      { role: "Decision" as const, content: decision.reason },
                    ]}
                  />
                </div>
              )}
            </>
          ) : (
            <div
              className="rounded-[var(--radius-md)] p-6"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {isLive ? (
                <>
                  <AIStateBanner state="ANALYZING_CONVERSATION" />
                  <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    Decision will appear here once the call completes.
                  </p>
                </>
              ) : (
                <p
                  className="text-[13px] text-center py-4"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No decision was made for this call.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
