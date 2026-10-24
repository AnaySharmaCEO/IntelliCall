import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Quote,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useCalls, useCallAnalysis } from '../../api/hooks';
import { StatusChip, ConfidenceMeter, EvidenceChip } from '../../components/patterns';
import { Button, Badge, Skeleton, EmptyState, useToast } from '../../components/ui';
import { formatDuration, formatDate } from '../../lib/format';
import type { Call } from '../../contracts/entities';

export const ReviewQueuePage: React.FC = () => {
  const { data: callsData, isLoading } = useCalls({ pageSize: 15 });
  const { toast } = useToast();

  const flaggedCalls = (callsData?.data || []).filter(
    (c) => c.sentiment === 'negative' || (c.call_score && c.call_score < 75) || c.metadata?.scenario === 'S2'
  );

  const [selectedCallId, setSelectedCallId] = useState<string | null>(() => {
    return flaggedCalls[0]?.id || callsData?.data[0]?.id || null;
  });

  const activeCall = (callsData?.data || []).find((c) => c.id === selectedCallId) || flaggedCalls[0] || null;
  const { data: analysis } = useCallAnalysis(activeCall?.id);

  const handleApprove = () => {
    toast(`Decision on Call #${activeCall?.id.slice(0, 8)} approved and recorded`, 'success');
  };

  const handleOverride = () => {
    toast(`Supervisor override applied to Call #${activeCall?.id.slice(0, 8)}`, 'info');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Human-In-The-Loop Supervision
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Decision Review Queue
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Audit low-confidence classifications, customer churn disputes, and policy violations before execution.
          </p>
        </div>

        <Badge variant={flaggedCalls.length > 0 ? 'warning' : 'success'}>
          {flaggedCalls.length} Pending Review Items
        </Badge>
      </div>

      {/* Split-pane Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (5 cols): Review Queue List */}
        <div className="lg:col-span-5 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)] text-xs font-semibold text-[var(--color-text-secondary)] uppercase">
            <span>Items Requiring Review</span>
            <span>Flag Reason</span>
          </div>

          {isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton height={60} />
              <Skeleton height={60} />
            </div>
          ) : flaggedCalls.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-[var(--color-success)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Queue is clear</h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-xs mx-auto">
                All decisions verified. No flagged items require attention.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {flaggedCalls.map((call) => {
                const isSelected = call.id === (activeCall?.id || selectedCallId);
                return (
                  <div
                    key={call.id}
                    onClick={() => setSelectedCallId(call.id)}
                    className={`p-3.5 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--color-action-secondary-bg)] border-[var(--color-action-primary)]'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-default)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
                        Call #{call.id.slice(0, 10)}
                      </span>
                      <StatusChip status={call.sentiment || 'negative'} type="sentiment" />
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {call.transcript || 'Review required: customer escalation signal detected.'}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[var(--color-border-subtle)]/60 flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                      <span>Duration: {formatDuration(call.duration_seconds || 0)}</span>
                      <span className="text-[var(--color-error)] font-semibold">
                        Score: {call.call_score || 50}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane (7 cols): Audit & Decision Detail */}
        <div className="lg:col-span-7 space-y-5">
          {activeCall ? (
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
                <div>
                  <h2 className="text-[16px] font-bold text-[var(--color-text-primary)]">
                    Auditing Call #{activeCall.id.slice(0, 10)}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    Recorded on {formatDate(activeCall.started_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleOverride}>
                    <ThumbsDown size={14} className="mr-1 text-[var(--color-error)]" />
                    Override
                  </Button>
                  <Button size="sm" onClick={handleApprove}>
                    <ThumbsUp size={14} className="mr-1" />
                    Approve
                  </Button>
                </div>
              </div>

              {/* Analysis Summary */}
              {analysis ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase block">
                      AI Reasoning & Synthesis
                    </span>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>

                  <ConfidenceMeter
                    value={analysis.intent_confidence}
                    label={`Confidence in Intent (${analysis.intent_primary})`}
                  />

                  {/* Signals */}
                  {analysis.risk_signals.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold text-[var(--color-error)] uppercase tracking-wider block">
                        Evidence Citations
                      </span>
                      {analysis.risk_signals.map((sig, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[var(--color-text-primary)] capitalize">
                              {sig.signal.replace(/_/g, ' ')}
                            </span>
                            <Badge variant="error">{sig.severity}</Badge>
                          </div>
                          <EvidenceChip quote={sig.evidence} timestampSeconds={sig.timestamp_seconds} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded bg-[var(--color-bg-sunken)] text-xs text-[var(--color-text-secondary)]">
                  <p className="font-semibold text-[var(--color-text-primary)] mb-1">
                    Transcript Snapshot
                  </p>
                  <p className="leading-relaxed whitespace-pre-line">{activeCall.transcript}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>Keyboard Shortcuts: <strong>A</strong> (Approve) &bull; <strong>O</strong> (Override)</span>
                <Link to={`/calls/${activeCall.id}`} className="text-[var(--color-action-primary)] hover:underline font-semibold flex items-center gap-1">
                  Full Audit Detail <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : flaggedCalls.length === 0 ? (
            <div className="p-12 text-center rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <CheckCircle2 size={36} className="mx-auto text-[var(--color-success)] opacity-80" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Queue is clear</h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
                No calls require manual verification or supervisor intervention.
              </p>
            </div>
          ) : (
            <div className="p-12 text-center rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
              Select an item on the left to inspect its decision trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewQueuePage;
