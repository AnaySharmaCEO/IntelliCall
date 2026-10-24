import { useState } from "react";
import { useOutcomes, useOutcomeFunnel, useLeads } from "../hooks";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import OutcomeCard from "../components/shared/OutcomeCard";
import { FilterBar, FilterChip } from "../components/ui/FilterBar";

type StageFilter = "all" | "meeting_booked" | "meeting_attended" | "opportunity" | "converted" | "stalled";

export default function OutcomesPage() {
  const { data: outcomes, loading, error, reload } = useOutcomes();
  const { data: funnel, loading: funnelLoading, error: funnelError } = useOutcomeFunnel();
  const { data: leads } = useLeads();
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  const filtered = (outcomes ?? []).filter(o => {
    if (stageFilter === "all")     return true;
    if (stageFilter === "stalled") return o.stalled;
    return o.stage === stageFilter;
  });

  // Decision accuracy: qualified → converted
  const accuracy = funnel && funnel.length >= 2 && funnel[0].count > 0
    ? Math.round((funnel[funnel.length - 1].count / funnel[0].count) * 100)
    : null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-[22px] font-semibold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Outcomes
          </h1>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            Decision-to-conversion funnel and individual outcome records.
          </p>
        </div>
      </div>

      {/* ── Funnel panel ── */}
      <div
        className="rounded-[var(--radius-md)] mb-6"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
        >
          <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Decision → Outcome funnel
          </h2>
        </div>

        <div className="px-5 py-5">
          {funnelLoading ? (
            <div
              className="h-20 rounded-[var(--radius-sm)] animate-[ic-shimmer_1.5s_infinite]"
              style={{ background: "var(--color-bg-sunken)" }}
            />
          ) : funnelError ? (
            <ErrorInline message="Couldn't load funnel." />
          ) : funnel ? (
            <>
              {/* Stage stepper */}
              <div className="flex items-start mb-6">
                {funnel.map((stage, i) => {
                  const isLast = i === funnel.length - 1;
                  const pct = i > 0
                    ? Math.round((stage.count / funnel[i - 1].count) * 100)
                    : 100;
                  return (
                    <div key={stage.stage} className="flex-1 flex flex-col items-center relative">
                      {/* Connecting line */}
                      {!isLast && (
                        <div
                          className="absolute top-[21px] h-[2px]"
                          style={{
                            left: "50%",
                            right: "-50%",
                            background: "var(--color-border-default)",
                            zIndex: 0,
                          }}
                          aria-hidden
                        />
                      )}

                      {/* Stage count bubble */}
                      <div
                        className="relative z-10 flex items-center justify-center rounded-full mb-2"
                        style={{
                          width: 44,
                          height: 44,
                          background: "var(--color-action-secondary-bg)",
                          border: `2px solid var(--color-action-primary-solid)`,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-data)",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "var(--color-action-primary)",
                          }}
                        >
                          {stage.count.toLocaleString()}
                        </span>
                      </div>

                      <p
                        className="text-[11px] font-medium text-center px-1"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {stage.stage}
                      </p>

                      {i > 0 && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{
                            fontFamily: "var(--font-data)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {pct}%
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Decision accuracy */}
              {accuracy !== null && (
                <div
                  className="flex items-center gap-6 pt-4"
                  style={{ borderTop: "1px solid var(--color-border-subtle)" }}
                >
                  <div>
                    <p
                      className="text-[12px] font-medium mb-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Decision accuracy
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 28,
                        fontWeight: 700,
                        color: "var(--color-success)",
                        lineHeight: 1,
                      }}
                    >
                      {accuracy}%
                    </p>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                    Of leads Resonology AI predicted as qualified,{" "}
                    <strong style={{ color: "var(--color-text-primary)" }}>{accuracy}%</strong>{" "}
                    actually converted — the product's core accuracy signal.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* ── Individual outcomes ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Individual outcomes
        </h2>
      </div>

      <FilterBar className="mb-4">
        <FilterChip active={stageFilter === "all"} onClick={() => setStageFilter("all")}>
          All
        </FilterChip>
        <FilterChip active={stageFilter === "meeting_booked"} onClick={() => setStageFilter("meeting_booked")}>
          Meeting booked
        </FilterChip>
        <FilterChip active={stageFilter === "meeting_attended"} onClick={() => setStageFilter("meeting_attended")}>
          Attended
        </FilterChip>
        <FilterChip active={stageFilter === "opportunity"} onClick={() => setStageFilter("opportunity")}>
          Opportunity
        </FilterChip>
        <FilterChip active={stageFilter === "converted"} onClick={() => setStageFilter("converted")}>
          Converted
        </FilterChip>
        <FilterChip active={stageFilter === "stalled"} onClick={() => setStageFilter("stalled")}>
          Stalled
        </FilterChip>
      </FilterBar>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] animate-[ic-shimmer_1.5s_infinite]"
              style={{ height: 120, background: "var(--color-bg-surface)", border: "1px solid var(--color-border-subtle)" }}
            />
          ))}
        </div>
      ) : error ? (
        <ErrorInline message="Couldn't load outcomes." onRetry={reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="M18 17V9M13 17V5M8 17v-3" />
            </svg>
          }
          title={stageFilter === "all" ? "No outcomes yet" : `No ${stageFilter.replace(/_/g, " ")} outcomes`}
          description={
            stageFilter === "all"
              ? "Outcomes appear once a qualified lead progresses through the pipeline."
              : "Try a different filter to see other outcomes."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(o => (
            <OutcomeCard
              key={o.id}
              outcome={o}
              lead={(leads || []).find(l => l.id === o.lead_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
