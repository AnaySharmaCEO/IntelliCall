import { useState } from "react";
import type { Decision, Lead, Campaign } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfidenceIndicator from "./ConfidenceIndicator";
import { decisionsService } from "../../services";
import { useToast } from "../ui/Toast";
import { Link } from "react-router-dom";

interface ReviewQueueRowProps {
  decision: Decision;
  lead?: Lead;
  campaign?: Campaign;
  onUpdate?: (updated: Decision) => void;
}

type RowState = "idle" | "approving" | "overriding" | "approved" | "overridden";

function actionLabel(type: string | null | undefined) {
  if (!type) return "—";
  if (type === "book_meeting") return "Book meeting";
  if (type === "send_followup") return "Send follow-up";
  if (type === "update_status") return "Update status";
  if (type === "escalate") return "Escalate";
  return type;
}

export default function ReviewQueueRow({ decision, lead, campaign, onUpdate }: ReviewQueueRowProps) {
  const initialState: RowState =
    decision.action_status === "executed" ? "approved" :
    decision.overridden_by ? "overridden" : "idle";
  const [rowState, setRowState] = useState<RowState>(initialState);
  const { toast } = useToast();

  const handleApprove = async () => {
    setRowState("approving");
    try {
      const updated = await decisionsService.approve(decision.id, "user_1");
      if (updated) {
        setRowState("approved");
        toast("Decision approved — action executed.");
        onUpdate?.(updated);
      } else {
        setRowState("idle");
      }
    } catch {
      setRowState("idle");
    }
  };

  const handleOverride = async () => {
    setRowState("overriding");
    try {
      const updated = await decisionsService.override(decision.id, "user_1");
      if (updated) {
        setRowState("overridden");
        toast("Decision overridden.", "info");
        onUpdate?.(updated);
      } else {
        setRowState("idle");
      }
    } catch {
      setRowState("idle");
    }
  };

  const isResolved = rowState === "approved" || rowState === "overridden";
  const isApproved = rowState === "approved";

  return (
    <tr
      className="transition-colors"
      style={{
        background: isResolved
          ? isApproved
            ? "color-mix(in srgb, var(--color-success) 6%, transparent)"
            : "color-mix(in srgb, var(--color-error) 5%, transparent)"
          : undefined,
        opacity: isResolved ? 0.75 : 1,
      }}
    >
      {/* Lead */}
      <td className="px-3 py-3 text-[13px]">
        <Link
          to={`/leads/${decision.lead_id}`}
          className="font-medium hover:underline"
          style={{ color: "var(--color-text-primary)" }}
        >
          {lead?.name ?? "—"}
        </Link>
        {lead?.company && (
          <span
            className="block text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {lead.company}
          </span>
        )}
      </td>

      {/* Campaign */}
      <td className="px-3 py-3 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        {campaign?.name ?? "—"}
      </td>

      {/* Decision badge */}
      <td className="px-3 py-3">
        <Badge
          variant={
            decision.outcome === "qualified" ? "success" :
            decision.outcome === "not_qualified" ? "error" : "warning"
          }
        >
          {decision.outcome === "qualified" ? "Qualified" :
           decision.outcome === "not_qualified" ? "Not qualified" : "Review"}
        </Badge>
      </td>

      {/* Confidence */}
      <td className="px-3 py-3 text-right">
        <ConfidenceIndicator
          score={decision.confidence_score}
          tier={decision.confidence_tier}
          variant="badge"
        />
      </td>

      {/* Recommended action */}
      <td className="px-3 py-3 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        {actionLabel(decision.recommended_action)}
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2 justify-end">
          {isResolved ? (
            <span
              className="text-[12px] font-semibold"
              style={{ color: isApproved ? "var(--color-success)" : "var(--color-text-muted)" }}
            >
              {isApproved ? "Executed" : "Overridden"}
            </span>
          ) : (
            <>
              <Button
                size="sm"
                variant="primary"
                loading={rowState === "approving"}
                disabled={rowState === "overriding"}
                onClick={handleApprove}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                loading={rowState === "overriding"}
                disabled={rowState === "approving"}
                onClick={handleOverride}
              >
                Override
              </Button>
            </>
          )}
          <Link
            to={`/decisions/${decision.id}`}
            className="text-[12px] font-semibold hover:underline"
            style={{ color: "var(--color-action-primary)" }}
          >
            View
          </Link>
        </div>
      </td>
    </tr>
  );
}
