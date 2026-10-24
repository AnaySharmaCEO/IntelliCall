import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useLead, useCallActions, useDecisions, useCampaigns, useCalls, useOutcomes } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DecisionCard from "../components/shared/DecisionCard";
import AIStateBanner from "../components/shared/AIStateBanner";
import ActionCard from "../components/shared/ActionCard";
import ConversationStatePanel from "../components/shared/ConversationStatePanel";
import Timeline, { type TimelineEntry } from "../components/shared/Timeline";
import EmptyState from "../components/ui/EmptyState";
import EvidenceThread from "../components/shared/EvidenceThread";
import OutcomeCard from "../components/shared/OutcomeCard";
import CallWithAIDrawer from "../components/shared/CallWithAIDrawer";
import { mockDecisions } from "../mock";
import type { Decision, Call, LeadStatus } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(s: LeadStatus) {
  if (["qualified", "meeting_booked", "meeting_attended", "converted"].includes(s)) return "success";
  if (["not_qualified", "stalled"].includes(s)) return "error";
  if (s === "opportunity") return "info";
  return "neutral";
}

function statusLabel(s: LeadStatus) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, loading, error, reload } = useLead(id ?? "");
  const { data: campaigns } = useCampaigns();
  const { data: allDecisionsData } = useDecisions();
  const { data: allCallsData } = useCalls();
  const { data: allOutcomesData } = useOutcomes();

  const [localDecisions, setLocalDecisions] = useState<Decision[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveCall, setLiveCall] = useState<Call | null>(null);
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { progressLiveState } = useCallActions();

  // Clean up timers on unmount
  useEffect(() => () => { if (liveTimerRef.current) clearTimeout(liveTimerRef.current); }, []);

  if (loading) {
    return (
      <div>
        <div
          className="rounded w-48 mb-4 animate-[ic-shimmer_1.5s_infinite]"
          style={{ height: 20, background: "var(--color-bg-sunken)" }}
        />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorInline message="Couldn't load lead." onRetry={reload} />
      </div>
    );
  }

  if (!lead) {
    return (
      <EmptyState
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
          </svg>
        }
        title="Lead not found"
        description="This lead doesn't exist or has been removed."
      />
    );
  }

  const campaign = (campaigns || []).find(c => c.id === lead.campaign_id);
  const leadOutcome = (allOutcomesData || []).find(o => o.lead_id === lead.id) ?? null;
  const leadDecisions = (allDecisionsData || []).filter(d => d.lead_id === lead.id);
  const allDecisions = localDecisions ?? leadDecisions;
  const latestDecision = allDecisions[0] ?? null;
  const calls = (allCallsData || []).filter(c => c.lead_id === lead.id);
  const latestCall = calls[0] ?? null;
  const effectiveCall = liveCall ?? latestCall;
  const isLiveCall = effectiveCall?.status === "connected" || effectiveCall?.status === "calling" || effectiveCall?.status === "processing";
  const isScheduled = effectiveCall?.status === "scheduled";
  const callInFlight = isLiveCall || isScheduled;
  const convoState = null;
  const reviewRequired =
    latestDecision?.outcome === "review_required" &&
    latestDecision.action_status === "pending";

  // Build activity timeline from calls and decisions
  const timelineEntries: TimelineEntry[] = [
    ...calls.map(call => ({
      id: call.id,
      type: "call" as const,
      title: `Call — ${call.status.replace(/_/g, " ")}`,
      description: call.duration_seconds
        ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
        : call.status === "no_answer" ? "No answer" : undefined,
      timestamp: call.started_at,
      href: `/calls/${call.id}`,
    })),
    ...allDecisions.map(dec => ({
      id: dec.id,
      type: "decision" as const,
      title: `Decision — ${dec.outcome === "qualified" ? "Qualified" : dec.outcome === "not_qualified" ? "Not qualified" : "Review required"}`,
      description: `${dec.confidence_score}% confidence`,
      timestamp: dec.created_at,
      href: `/decisions/${dec.id}`,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleCallCreated = (call: Call) => {
    setLiveCall(call);
    if (call.status !== "calling") return; // scheduled — no timer
    // Progress CALLING → CONNECTED → PROCESSING → COMPLETED on a short mock timer
    const steps: Array<Call["status"]> = ["connected", "processing", "completed"];
    let delay = 2000;
    steps.forEach(status => {
      liveTimerRef.current = setTimeout(async () => {
        const updated = await progressLiveState(call.id, status);
        if (updated) setLiveCall(updated);
        if (status === "completed") setLiveCall(null);
      }, delay);
      delay += 3000;
    });
  };


  const handleDecisionUpdate = (updated: Decision) => {
    const base = localDecisions ?? mockDecisions.filter(d => d.lead_id === lead.id);
    setLocalDecisions(base.map(d => (d.id === updated.id ? updated : d)));
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-[12px] mb-4" style={{ color: "var(--color-text-muted)" }}>
        <Link to="/leads" className="hover:underline" style={{ color: "var(--color-action-primary)" }}>
          Leads
        </Link>
        <span className="mx-1.5">›</span>
        <span style={{ color: "var(--color-text-primary)" }}>{lead.name}</span>
      </nav>

      {/* Two-pane workspace */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Left pane: operational context ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Identity block */}
          <div
            className="rounded-[var(--radius-md)] p-6"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1
                  className="font-semibold mb-1"
                  style={{ fontSize: 22, color: "var(--color-text-primary)" }}
                >
                  {lead.name}
                </h1>
                <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                  {lead.title}
                  {lead.company && ` · ${lead.company}`}
                </p>
              </div>
              <Badge variant={statusVariant(lead.status)}>{statusLabel(lead.status)}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Email", value: lead.email, mono: true },
                { label: "Phone", value: lead.phone, mono: true },
                { label: "Campaign", value: campaign?.name ?? "—", mono: false },
                { label: "Added", value: formatDate(lead.created_at), mono: true },
              ].map(field => (
                <div key={field.label}>
                  <p
                    className="text-[11px] font-medium mb-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {field.label}
                  </p>
                  <p
                    className="text-[13px]"
                    style={{
                      color: "var(--color-text-primary)",
                      fontFamily: field.mono ? "var(--font-data)" : undefined,
                      fontSize: field.mono ? 12 : undefined,
                    }}
                  >
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            {lead.notes && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid var(--color-border-subtle)" }}
              >
                <p
                  className="text-[11px] font-medium mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Notes
                </p>
                <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                  {lead.notes}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
              <Button size="sm" variant="outline">Edit lead</Button>
              <Button size="sm" variant="secondary">Log note</Button>
            </div>
          </div>

          {/* Conversation state (if recent call) */}
          {convoState && (
            <ConversationStatePanel state={convoState} />
          )}

          {/* Activity timeline */}
          <div
            className="rounded-[var(--radius-md)]"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="px-4 py-3.5"
              style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
            >
              <h2 className="text-[14px] font-semibold">Activity</h2>
            </div>
            <div className="px-4 pt-4 pb-2">
              <Timeline entries={timelineEntries} />
            </div>
          </div>
        </div>

        {/* ── Right pane: decision / evidence context ── */}
        <div
          className="flex flex-col gap-4 w-full lg:w-[400px] lg:flex-shrink-0"
        >
          {/* Call with AI — button or status chip */}
          {callInFlight ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold"
              style={{
                background: "var(--color-action-secondary-bg)",
                border: "1px solid var(--color-border-subtle)",
                color: "var(--color-action-primary)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: isScheduled ? "var(--color-text-muted)" : "var(--color-action-primary-solid)",
                  animation: isLiveCall ? "ic-pulse 1.4s ease-in-out infinite" : undefined,
                }}
              />
              {isScheduled
                ? `Scheduled ${effectiveCall?.scheduled_for ? new Date(effectiveCall.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}`
                : effectiveCall?.status === "calling"
                ? "Calling…"
                : effectiveCall?.status === "connected"
                ? "Connected"
                : "Processing"}
            </div>
          ) : (
            <Button variant="primary" onClick={() => setDrawerOpen(true)}>
              Call with AI
            </Button>
          )}

          {/* Live call banner */}
          {isLiveCall && (
            <AIStateBanner
              state={effectiveCall?.status === "connected" ? "CONNECTED" : effectiveCall?.status === "processing" ? "PROCESSING" : "CALLING"}
              detail="call in progress"
            />
          )}

          {/* Review banner */}
          {reviewRequired && (
            <AIStateBanner
              state="REVIEW_REQUIRED"
              detail="approve or override before action executes"
            />
          )}

          {/* Decision */}
          {latestDecision ? (
            <DecisionCard
              decision={latestDecision}
              threshold={campaign?.confidence_threshold}
              context={reviewRequired ? "review" : "history"}
              leadName={`${lead.name} — ${lead.company}`}
              onUpdate={handleDecisionUpdate}
            />
          ) : (
            <div
              className="rounded-[var(--radius-md)]"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <EmptyState
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                }
                title="No AI decision yet"
                description="Schedule a call to start the qualification process."
              />
            </div>
          )}

          {/* Evidence thread — sourced from latest decision */}
          {latestDecision && latestDecision.evidence.length > 0 && (
            <div
              className="rounded-[var(--radius-md)] p-4"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3
                className="text-[13px] font-semibold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                Evidence thread
              </h3>
              <EvidenceThread
                steps={[
                  ...latestDecision.evidence.map(ev => ({
                    role: "Statement" as const,
                    content: `"${ev.quote}"`,
                  })),
                  {
                    role: "Signal" as const,
                    content: latestDecision.evidence.map(ev => `${ev.signal} (${ev.weight})`).join(" · "),
                  },
                  { role: "Decision" as const, content: latestDecision.reason },
                ]}
              />
            </div>
          )}

          {/* Outcome card — once outcome exists, it augments / replaces the action */}
          {leadOutcome && (
            <OutcomeCard outcome={leadOutcome} lead={lead} />
          )}

          {/* Recommended action */}
          {latestDecision?.action_status === "pending" && (
            <ActionCard
              type={latestDecision.recommended_action}
              description="Resonology AI recommends this action based on the conversation analysis."
            />
          )}
        </div>
      </div>

      {/* Call with AI drawer */}
      <CallWithAIDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={lead}
        onCallCreated={handleCallCreated}
      />
    </div>
  );
}
