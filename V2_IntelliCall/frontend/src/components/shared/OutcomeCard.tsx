// OutcomeCard — §47.
// Horizontal five-stage stepper. Current stage highlighted in action.primary.
// Stalled/failed stage marked in status.error. Linked back to originating decision.

import { Link } from "react-router-dom";
import type { Outcome, Lead } from "../../types";

const STAGES: { key: keyof Outcome | string; label: string }[] = [
  { key: "qualified", label: "Qualified" },
  { key: "meeting_booked", label: "Meeting booked" },
  { key: "meeting_attended", label: "Meeting attended" },
  { key: "opportunity", label: "Opportunity" },
  { key: "converted", label: "Converted" },
];

const STAGE_ORDER = STAGES.map(s => s.key);

function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage);
}

function getTimestampFor(outcome: Outcome, stage: string): string | null {
  if (stage === "meeting_booked") return outcome.meeting_booked_at;
  if (stage === "meeting_attended") return outcome.meeting_attended_at;
  if (stage === "opportunity") return outcome.opportunity_created_at;
  if (stage === "converted") return outcome.converted_at;
  return outcome.created_at; // qualified = decision created
}

function formatShort(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface OutcomeCardProps {
  outcome: Outcome;
  lead?: Lead;
}

export default function OutcomeCard({ outcome, lead }: OutcomeCardProps) {
  const currentIndex = getStageIndex(outcome.stage);

  return (
    <div
      className="rounded-[var(--radius-md)] p-4"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {lead?.name ?? "—"}
            {lead?.company && (
              <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>
                {" "}— {lead.company}
              </span>
            )}
          </p>
          {outcome.stalled && (
            <p
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: "var(--color-error)" }}
            >
              Stalled at {STAGES.find(s => s.key === outcome.stage)?.label ?? outcome.stage}
            </p>
          )}
        </div>
        <Link
          to={`/decisions/${outcome.decision_id}`}
          className="text-[12px] font-semibold hover:underline flex-shrink-0"
          style={{ color: "var(--color-action-primary)" }}
        >
          View decision →
        </Link>
      </div>

      {/* Stage stepper */}
      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const isReached = i <= currentIndex;
          const isCurrent = i === currentIndex;
          const isStalled = outcome.stalled && isCurrent;
          const ts = getTimestampFor(outcome, stage.key as string);
          const isLast = i === STAGES.length - 1;

          let dotColor = "var(--color-border-default)";
          let lineColor = "var(--color-border-default)";
          let labelColor = "var(--color-text-muted)";

          if (isStalled) {
            dotColor = "var(--color-error)";
            labelColor = "var(--color-error)";
          } else if (isCurrent) {
            dotColor = "var(--color-action-primary-solid)";
            labelColor = "var(--color-text-primary)";
          } else if (isReached) {
            dotColor = "var(--color-success)";
            lineColor = "var(--color-success)";
            labelColor = "var(--color-text-secondary)";
          }

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className="absolute top-[7px] h-[2px]"
                  style={{
                    left: "50%",
                    right: "-50%",
                    background: i < currentIndex && !outcome.stalled
                      ? "var(--color-success)"
                      : "var(--color-border-default)",
                  }}
                  aria-hidden
                />
              )}

              {/* Dot */}
              <div
                className="relative z-10 rounded-full mb-2"
                style={{
                  width: 14,
                  height: 14,
                  background: dotColor,
                  border: isCurrent && !isStalled
                    ? `2px solid var(--color-action-primary-solid)`
                    : isReached && !isStalled
                    ? "2px solid var(--color-success)"
                    : "2px solid var(--color-border-default)",
                  boxSizing: "border-box",
                }}
                aria-hidden
              />

              {/* Label */}
              <p
                className="text-[10px] text-center leading-tight"
                style={{ color: labelColor, fontWeight: isCurrent ? 600 : 400 }}
              >
                {stage.label}
              </p>

              {/* Timestamp */}
              {isReached && ts && (
                <p
                  className="text-[9px] mt-0.5 text-center"
                  style={{
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {formatShort(ts)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
