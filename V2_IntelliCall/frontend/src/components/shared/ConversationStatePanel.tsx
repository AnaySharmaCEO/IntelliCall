// ConversationStatePanel — §31 of the design system spec.
// Two-column known/missing summary, current objective, detected intent,
// open objection, and next suggested question.

interface KnownFact {
  label: string;
  value: string;
  known: boolean;
}

interface ConversationState {
  known_facts: KnownFact[];
  objective: string;
  detected_intent: string | null;
  open_objection: string | null;
  next_question: string | null;
}

interface ConversationStatePanelProps {
  state: ConversationState;
}

export default function ConversationStatePanel({ state }: ConversationStatePanelProps) {
  const known = state.known_facts.filter(f => f.known);
  const missing = state.known_facts.filter(f => !f.known);

  return (
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
        Conversation state
      </h3>

      {/* Known / Missing two-column */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Known
          </p>
          {known.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>Nothing confirmed</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {known.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: "var(--color-success)" }}
                    aria-hidden
                  />
                  <div>
                    <span className="text-[11px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                      {f.label}
                    </span>
                    <p className="text-[12px]" style={{ color: "var(--color-text-primary)" }}>{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Missing
          </p>
          {missing.length === 0 ? (
            <p className="text-[12px]" style={{ color: "var(--color-success)" }}>All key facts confirmed</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {missing.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: "var(--color-text-muted)" }}
                    aria-hidden
                  />
                  <span className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--color-border-subtle)", marginBottom: 12 }} />

      {/* Objective */}
      <div className="flex flex-col gap-2.5">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Objective
          </p>
          <p className="text-[13px]" style={{ color: "var(--color-text-primary)" }}>
            {state.objective}
          </p>
        </div>

        {state.detected_intent && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Detected intent
            </p>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-semibold uppercase tracking-[0.02em]"
              style={{
                background: "var(--color-info-bg)",
                color: "var(--color-info)",
              }}
            >
              {state.detected_intent}
            </span>
          </div>
        )}

        {state.open_objection && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Open objection
            </p>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-semibold uppercase tracking-[0.02em]"
              style={{
                background: "var(--color-warning-bg)",
                color: "var(--color-warning)",
              }}
            >
              {state.open_objection}
            </span>
          </div>
        )}

        {state.next_question && (
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Next question
            </p>
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              "{state.next_question}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
