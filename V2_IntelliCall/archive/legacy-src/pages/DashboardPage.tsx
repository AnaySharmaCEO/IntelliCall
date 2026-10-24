import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDashboard, useDecisions, useOutcomeFunnel, useLeads } from "../hooks";
import { useAuth } from "../contexts/AuthContext";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import AIStateBanner from "../components/shared/AIStateBanner";
import type { Decision } from "../types";

// ── PaceUI KPI Card with full Light & Dark mode support ──────────────────────

function KPICard({
  label,
  value,
  delta,
  deltaUp,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-5 shadow-sm transition-all"
      style={{
        backgroundColor: "var(--color-bg-surface)",
        borderColor: "var(--color-border-subtle)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        {icon && <div style={{ color: "var(--color-text-muted)" }}>{icon}</div>}
      </div>

      <p
        className="font-mono text-3xl font-extrabold tracking-tight leading-none mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </p>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            deltaUp
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-red-500/10 border-red-500/20 text-red-500"
          }`}
        >
          <span>{deltaUp ? "↑" : "↓"}</span>
          <span>{delta}</span>
        </span>
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          vs last cycle
        </span>
      </div>
    </div>
  );
}

// ── PaceUI Funnel Stage ──────────────────────────────────────────────────────

function FunnelStage({
  label,
  count,
  prevCount,
  isLast,
}: {
  label: string;
  count: number;
  prevCount?: number;
  isLast?: boolean;
}) {
  const conversionRate = prevCount ? Math.round((count / prevCount) * 100) : null;

  return (
    <div className="flex-1 flex flex-col items-center relative py-2 px-1">
      {!isLast && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-sm z-10 hidden sm:block"
          style={{ color: "var(--color-border-default)" }}
        >
          →
        </span>
      )}

      <span
        className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight leading-none mb-1.5"
        style={{ color: "var(--color-text-primary)" }}
      >
        {count.toLocaleString()}
      </span>

      <span className="text-xs font-medium text-center capitalize" style={{ color: "var(--color-text-secondary)" }}>
        {label.replace(/_/g, " ")}
      </span>

      {conversionRate !== null && (
        <span className="text-[11px] font-mono text-emerald-500 font-semibold mt-1 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
          {conversionRate}%
        </span>
      )}
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { organization } = useAuth();
  const { stats, performance } = useDashboard();
  const {
    data: decisions,
    loading: decisionsLoading,
    error: decisionsError,
    reload: reloadDecisions,
  } = useDecisions();
  const { data: funnel, loading: funnelLoading } = useOutcomeFunnel();
  const { data: leads } = useLeads();
  const navigate = useNavigate();

  const [localDecisions] = useState<Decision[] | null>(null);
  const source = localDecisions ?? decisions ?? [];

  const reviewFirst = [...source].sort((a, b) => {
    const aReview = a.outcome === "review_required" && a.action_status === "pending" ? 0 : 1;
    const bReview = b.outcome === "review_required" && b.action_status === "pending" ? 0 : 1;
    return aReview - bReview;
  });
  const recentDecisions = reviewFirst.slice(0, 4);
  const reviewCount = source.filter(
    d => d.outcome === "review_required" && d.action_status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              Dashboard
            </h1>
            <span className="pace-pill">Live Stream</span>
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Operational and decision-intelligence overview for{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {organization?.name || "your workspace"}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => reloadDecisions()}
            className="px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-bg-sunken)",
              borderColor: "var(--color-border-default)",
              color: "var(--color-text-secondary)",
            }}
          >
            Refresh
          </button>
          <Link
            to="/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-opacity shadow-sm"
            style={{
              backgroundColor: "var(--color-action-primary-solid)",
              color: "var(--color-text-on-accent)",
            }}
          >
            <span className="text-base leading-none">+</span>
            <span>Create Campaign</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      {stats.loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border animate-pulse"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderColor: "var(--color-border-subtle)",
              }}
            />
          ))}
        </div>
      ) : stats.error ? (
        <ErrorInline message="Couldn't load metrics." onRetry={stats.reload} />
      ) : stats.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Calls made"
            value={stats.data.calls_made.toLocaleString()}
            delta={stats.data.calls_made_delta}
            deltaUp={stats.data.calls_made_delta_up}
            icon={
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2z" />
              </svg>
            }
          />
          <KPICard
            label="Qualification rate"
            value={`${stats.data.qualification_rate}%`}
            delta={stats.data.qualification_rate_delta}
            deltaUp={stats.data.qualification_rate_delta_up}
            icon={
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
          <KPICard
            label="Meetings booked"
            value={String(stats.data.meetings_booked)}
            delta={stats.data.meetings_booked_delta}
            deltaUp={stats.data.meetings_booked_delta_up}
            icon={
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          <KPICard
            label="Decision accuracy"
            value={`${stats.data.decision_accuracy}%`}
            delta={stats.data.decision_accuracy_delta}
            deltaUp={true}
            icon={
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />
        </div>
      ) : null}

      {/* ── Main Dashboard Split: Recent Decisions + Campaign Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Left Card: Recent Decisions */}
        <div
          className="rounded-xl border overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div>
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Recent Decisions
                </h2>
                {reviewCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-semibold animate-pulse">
                    {reviewCount} Need Review
                  </span>
                )}
              </div>
              <Link
                to="/decisions"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-text-secondary)" }}
              >
                View all →
              </Link>
            </div>

            {decisionsLoading ? (
              <div className="p-4">
                <SkeletonTable rows={3} />
              </div>
            ) : decisionsError ? (
              <div className="p-5">
                <ErrorInline message="Couldn't load decisions." onRetry={reloadDecisions} />
              </div>
            ) : recentDecisions.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-neutral-400">
                      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  }
                  title="No decisions evaluated yet"
                  description="When AI voice agents finish qualification calls, decisions will appear here."
                />
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--color-border-subtle)" }}>
                {reviewCount > 0 && (
                  <div className="p-4 bg-amber-500/[0.04]">
                    <AIStateBanner
                      state="REVIEW_REQUIRED"
                      detail={`${reviewCount} qualification decision${reviewCount !== 1 ? "s" : ""} require human confirmation`}
                    />
                  </div>
                )}

                {recentDecisions.map(d => {
                  const lead = (leads || []).find(l => l.id === d.lead_id);
                  const isReview = d.outcome === "review_required" && d.action_status === "pending";

                  return (
                    <div
                      key={d.id}
                      onClick={() => navigate(`/decisions/${d.id}`)}
                      className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[var(--color-bg-sunken)] cursor-pointer transition-colors text-xs"
                    >
                      {/* Status indicator dot */}
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          isReview
                            ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            : d.outcome === "qualified"
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            : "bg-red-500"
                        }`}
                      />

                      {/* Lead info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                          {lead?.name ?? "Prospect Lead"}
                        </p>
                        <p className="truncate text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {d.reason || "Autonomous AI qualification turn"}
                        </p>
                      </div>

                      {/* Confidence Score */}
                      <div className="font-mono text-right shrink-0">
                        <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {d.confidence_score}%
                        </span>
                        <p className="text-[10px] uppercase" style={{ color: "var(--color-text-muted)" }}>
                          Confidence
                        </p>
                      </div>

                      {/* Action Pill */}
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 transition-colors ${
                          isReview
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            : "bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                        }`}
                      >
                        {isReview ? "Review" : "View"} →
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div
            className="p-3 border-t text-center"
            style={{
              backgroundColor: "var(--color-bg-sunken)",
              borderColor: "var(--color-border-subtle)",
            }}
          >
            <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              All decisions backed by turn-by-turn audio timestamp evidence
            </span>
          </div>
        </div>

        {/* Right Card: Campaign Performance */}
        <div
          className="rounded-xl border overflow-hidden flex flex-col justify-between"
          style={{
            backgroundColor: "var(--color-bg-surface)",
            borderColor: "var(--color-border-subtle)",
          }}
        >
          <div>
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Campaign Performance
              </h2>
              <Link
                to="/campaigns"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--color-text-secondary)" }}
              >
                View all →
              </Link>
            </div>

            <div className="p-5 space-y-4">
              {performance.loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 rounded bg-[var(--color-bg-sunken)] animate-pulse" />
                  ))}
                </div>
              ) : !performance.data || performance.data.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-neutral-400">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18" />
                      </svg>
                    }
                    title="No campaigns active"
                    description="Create an outbound campaign to start qualifying leads."
                    action={{ label: "Create Campaign", onClick: () => navigate("/campaigns/new") }}
                  />
                </div>
              ) : (
                [...performance.data]
                  .sort((a, b) => b.rate - a.rate)
                  .map(row => (
                    <div key={row.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                          {row.name}
                        </span>
                        <span className="font-mono font-semibold ml-2" style={{ color: "var(--color-text-secondary)" }}>
                          {row.rate}% <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>conv.</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-[var(--color-bg-sunken)]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(row.rate, 100)}%`,
                            backgroundColor: "var(--color-action-primary-solid)",
                          }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div
            className="p-4 border-t flex items-center justify-between text-xs"
            style={{
              backgroundColor: "var(--color-bg-sunken)",
              borderColor: "var(--color-border-subtle)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span>Threshold Safety</span>
            <span className="text-emerald-500 font-mono font-medium">85% minimum</span>
          </div>
        </div>
      </div>

      {/* ── Decision → Outcome Funnel ── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderColor: "var(--color-border-subtle)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Decision → Outcome Funnel
            </h2>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Live Stage Velocity
            </span>
          </div>
          <Link
            to="/outcomes"
            className="text-xs font-medium hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Detailed analytics →
          </Link>
        </div>

        <div className="p-6">
          {funnelLoading ? (
            <div className="h-16 rounded-lg bg-[var(--color-bg-sunken)] animate-pulse" />
          ) : funnel ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {funnel.map((stage, i) => (
                <FunnelStage
                  key={stage.stage}
                  label={stage.stage}
                  count={stage.count}
                  prevCount={i > 0 ? funnel[i - 1].count : undefined}
                  isLast={i === funnel.length - 1}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
