// DecisionTrace — §30.
// Collapsed by default. Expandable via "View reasoning" toggle.
// Vertical step timeline: label + description per step, connected by a 1px rule.
// Gets the most whitespace of any list component — space.4 (16px) between steps.

import { useState } from "react";
import type { TraceStep } from "../../types";

interface DecisionTraceProps {
  steps: TraceStep[];
  defaultOpen?: boolean;
}

export default function DecisionTrace({ steps, defaultOpen = false }: DecisionTraceProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="pt-3 mt-3"
      style={{ borderTop: "1px solid var(--color-border-subtle)" }}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
        style={{ color: "var(--color-action-primary)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-expanded={open}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform var(--duration-fast) var(--easing-standard)",
          }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {open ? "Hide reasoning" : "View reasoning"}
      </button>

      {/* Steps */}
      {open && (
        <div
          className="mt-4 flex flex-col"
          style={{ gap: 16 /* space.4 per spec — most whitespace of any list component */ }}
        >
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={step.id} className="flex gap-3">
                {/* Dot + vertical rule */}
                <div
                  className="flex flex-col items-center flex-shrink-0"
                  style={{ width: 12 }}
                >
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--color-action-primary-solid)",
                      marginTop: 5,
                    }}
                    aria-hidden
                  />
                  {!isLast && (
                    <div
                      className="flex-1 mt-1"
                      style={{
                        width: 1,
                        background: "var(--color-border-default)",
                        minHeight: 20,
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <p
                    className="text-[13px] font-semibold mb-0.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {step.label}
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
