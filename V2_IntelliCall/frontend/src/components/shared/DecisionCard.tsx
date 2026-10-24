// DecisionCard — §29.
// Top-to-bottom: badge + confidence on one row · one-line reason · up to 2 EvidenceSnippets
// · recommended vs actual action (actual muted if it differs) · footer actions · DecisionTrace.
//
// Confidence-based autonomy: the card derives its own state from the score vs threshold
// so every screen that renders it gets consistent behaviour automatically.

import { useState } from "react";
import { Link } from "react-router-dom";
import type { Decision } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfidenceIndicator from "./ConfidenceIndicator";
import EvidenceSnippet from "./EvidenceSnippet";
import DecisionTrace from "./DecisionTrace";
import { useToast } from "../ui/Toast";
import { decisionsService } from "../../services";

// ── Helpers ───────────────────────────────────────────────────────────────────

function outcomeVariant(outcome: Decision["outcome"]) {
  if (outcome === "qualified")      return "success";
  if (outcome === "not_qualified")  return "error";
  return "warning";
}

function outcomeLabel(outcome: Decision["outcome"]) {
  if (outcome === "qualified")      return "Qualified";
  if (outcome === "not_qualified")  return "Not qualified";
  return "Review required";
}

function actionLabel(type: string | null | undefined) {
  if (!type) return "—";
  if (type === "book_meeting")  return "Book meeting";
  if (type === "send_followup") return "Send follow-up";
  if (type === "update_status") return "Update status";
  if (type === "escalate")      return "Escalate";
  return type;
}

// ── Autonomy state ────────────────────────────────────────────────────────────
// Derived from confidence score vs campaign threshold.
// Determines which footer actions render and which status line shows.

type AutonomyState = "auto_executed" | "review_required" | "overridden" | "resolved";

function getAutonomyState(decision: Decision, threshold?: number): AutonomyState {
  if (decision.overridden_by)                          return "overridden";
  if (decision.action_status === "executed")           return "auto_executed";
  if (decision.action_status === "dismissed")          return "overridden";
  if (threshold !== undefined && decision.confidence_score < threshold) return "review_required";
  if (decision.outcome === "review_required")          return "review_required";
  return "resolved";
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DecisionCardProps {
  decision: Decision;
  /** Campaign confidence threshold — used to derive autonomy state and show tick. */
  threshold?: number;
  /** "review" shows Approve/Override buttons; "history" shows only View trace. */
  context?: "review" | "history";
  /** Short string shown top-right (e.g. "Maria Chen — Northwind Logistics"). */
  leadName?: string;
  /** Callback when Approve or Override resolves. */
  onUpdate?: (updated: Decision) => void;
  /** Whether to link the lead name to its detail page. */
  leadId?: string;
  /** Whether to show the confidence bar (detail variant) rather than inline badge. */
  showConfidenceDetail?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DecisionCard({
  decision,
  threshold,
  context = "history",
  leadName,
  onUpdate,
  leadId,
  showConfidenceDetail = false,
}: DecisionCardProps) {
  const [approving, setApproving] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const { toast } = useToast();

  const autonomyState = getAutonomyState(decision, threshold);
  const isPendingReview = autonomyState === "review_required" && context === "review";

  const handleApprove = async () => {
    setApproving(true);
    try {
      const updated = await decisionsService.approve(decision.id, "user_1");
      if (updated) {
        toast("Decision approved — action executed.");
        onUpdate?.(updated);
      }
    } finally {
      setApproving(false);
    }
  };

  const handleOverride = async () => {
    setOverriding(true);
    try {
      const updated = await decisionsService.override(decision.id, "user_1");
      if (updated) {
        toast("Decision overridden.", "info");
        onUpdate?.(updated);
      }
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div
      className="rounded-[var(--radius-md)] p-4 mb-3"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* ── Row 1: badge + confidence + lead name ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={outcomeVariant(decision.outcome)}>
            {outcomeLabel(decision.outcome)}
          </Badge>
          <ConfidenceIndicator
            score={decision.confidence_score}
            tier={decision.confidence_tier}
            variant="badge"
          />
        </div>
        {leadName && (
          <span
            className="text-[12px] flex-shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            {leadId ? (
              <Link
                to={`/leads/${leadId}`}
                className="hover:underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                {leadName}
              </Link>
            ) : (
              leadName
            )}
          </span>
        )}
      </div>

      {/* ── Confidence detail (optional) ── */}
      {showConfidenceDetail && (
        <div className="mb-4">
          <ConfidenceIndicator
            score={decision.confidence_score}
            tier={decision.confidence_tier}
            variant="detail"
            threshold={threshold}
          />
        </div>
      )}

      {/* ── Reason ── */}
      <p
        className="text-[13px] mb-3"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {decision.reason}
      </p>

      {/* ── Evidence snippets (up to 2) ── */}
      {decision.evidence.slice(0, 2).map(ev => (
        <EvidenceSnippet
          key={ev.id}
          quote={ev.quote}
          signal={ev.signal}
          weight={ev.weight}
          callId={decision.call_id}
        />
      ))}

      {/* ── Recommended vs actual ── */}
      <div
        className="flex items-center gap-6 text-[12px] mt-3"
      >
        <span>
          <span style={{ color: "var(--color-text-muted)" }}>Recommended: </span>
          <span className="font-semibold">{actionLabel(decision.recommended_action)}</span>
        </span>
        <span>
          <span style={{ color: "var(--color-text-muted)" }}>Actual: </span>
          <ActualActionLabel decision={decision} autonomyState={autonomyState} />
        </span>
      </div>

      {/* ── Footer actions ── */}
      <div
        className="flex items-center gap-2 mt-3 pt-3"
        style={{ borderTop: "1px solid var(--color-border-subtle)" }}
      >
        {isPendingReview && (
          <>
            <Button
              size="sm"
              variant="primary"
              loading={approving}
              disabled={overriding}
              onClick={handleApprove}
            >
              Approve decision
            </Button>
            <Button
              size="sm"
              variant="destructive"
              loading={overriding}
              disabled={approving}
              onClick={handleOverride}
            >
              Override
            </Button>
          </>
        )}
        {/* View trace is always available */}
        <div className="ml-auto">
          {/* DecisionTrace toggle lives inside the component */}
        </div>
      </div>

      {/* ── Decision trace (always available, collapsed by default) ── */}
      <DecisionTrace steps={decision.trace} />
    </div>
  );
}

// ── Actual action label — context-aware color ─────────────────────────────────

function ActualActionLabel({
  decision,
  autonomyState,
}: {
  decision: Decision;
  autonomyState: AutonomyState;
}) {
  if (autonomyState === "auto_executed") {
    return (
      <span
        className="font-semibold"
        style={{ color: "var(--color-success)" }}
      >
        Executed by Resonology AI
      </span>
    );
  }
  if (autonomyState === "overridden") {
    return (
      <span
        className="font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        Overridden
      </span>
    );
  }
  if (autonomyState === "review_required") {
    return (
      <span style={{ color: "var(--color-text-muted)" }}>Pending review</span>
    );
  }
  if (decision.actual_action) {
    return (
      <span className="font-semibold">{actionLabel(decision.actual_action)}</span>
    );
  }
  return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
}
