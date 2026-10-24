import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Clock,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  User,
  Bot,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useCall, useCallAnalysis, useTriggerAnalysis } from '../../api/hooks';
import { StatusChip, ConfidenceMeter, EvidenceChip } from '../../components/patterns';
import { Button, Badge, Skeleton, useToast } from '../../components/ui';
import { formatDuration, formatDate } from '../../lib/format';

export const CallDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: call, isLoading: callLoading } = useCall(id);
  const { data: analysis, isLoading: analysisLoading } = useCallAnalysis(id);
  const triggerAnalysis = useTriggerAnalysis();

  // Audio Player State Simulation
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const duration = call?.duration_seconds || 180;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    setIsPlaying(true);
    toast(`Audio scrubbed to ${formatDuration(seconds)}`, 'info');
  };

  const handleCopyTranscript = () => {
    if (call?.transcript) {
      navigator.clipboard.writeText(call.transcript);
      toast('Full transcript copied to clipboard', 'success');
    }
  };

  const handleRunAnalysis = async () => {
    if (!id) return;
    try {
      await triggerAnalysis.mutateAsync(id);
      toast('Resonology AI analysis complete', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Analysis failed', 'error');
    }
  };

  if (callLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <Skeleton width={120} height={20} />
        <Skeleton width="60%" height={32} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2" height={400} />
          <Skeleton height={400} />
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Call Not Found</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">
          The requested call session could not be located in the database.
        </p>
        <Link to="/calls">
          <Button variant="outline" size="sm">
            &larr; Back to Call Logs
          </Button>
        </Link>
      </div>
    );
  }

  // Parse lines into dialogue turns
  const transcriptLines = (call.transcript || '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, idx) => {
      const parts = line.split(':');
      const speaker = parts[0]?.trim() || 'Speaker';
      const text = parts.slice(1).join(':').trim() || line;
      const isAgent = speaker.toLowerCase().includes('agent') || speaker.toLowerCase().includes('aria') || speaker.toLowerCase().includes('kabir');
      return { id: idx, speaker, text, isAgent };
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Back button & Action Toolbar */}
      <div className="flex items-center justify-between">
        <Link
          to="/calls"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Calls
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
            <Copy size={13} className="mr-1.5" />
            Copy Transcript
          </Button>
          {!analysis && (
            <Button
              size="sm"
              loading={triggerAnalysis.isPending}
              onClick={handleRunAnalysis}
            >
              <Sparkles size={14} className="mr-1.5" />
              Generate AI Intelligence Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-bg-sunken)] font-semibold text-[var(--color-text-secondary)]">
                {call.id}
              </span>
              <StatusChip status={call.direction} type="call" />
              <StatusChip status={call.status} type="call" />
              <StatusChip status={call.sentiment || 'neutral'} type="sentiment" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              Call Session Audit & Intelligence
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
              Started: {formatDate(call.started_at)} &bull; Duration: {formatDuration(duration)}
            </p>
          </div>

          {call.call_score && (
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] text-right flex flex-col items-end">
              <span className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase">
                Call Quality Score
              </span>
              <span
                className={`text-2xl font-bold font-mono ${
                  call.call_score >= 80
                    ? 'text-[var(--color-success)]'
                    : call.call_score >= 60
                    ? 'text-[var(--color-warning)]'
                    : 'text-[var(--color-error)]'
                }`}
              >
                {call.call_score}%
              </span>
            </div>
          )}
        </div>

        {/* Audio Player Bar */}
        <div className="pt-3 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-[var(--color-brand-blue)] text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>

          {/* Scrubber */}
          <div className="flex-1 w-full space-y-1">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              className="w-full accent-[var(--color-brand-blue)] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer ${
                  playbackSpeed === s
                    ? 'bg-[var(--color-action-secondary-bg)] text-[var(--color-action-primary)] font-bold'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Transcript vs AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Conversational Transcript */}
        <div className="lg:col-span-7 p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Transcript Dialogue ({transcriptLines.length} turns)
            </h2>
            <Badge variant="info">Verified Grounding</Badge>
          </div>

          <div className="space-y-4 pt-2">
            {transcriptLines.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                No transcript text available for this call.
              </p>
            ) : (
              transcriptLines.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex items-start gap-3 p-3 rounded-[var(--radius-md)] transition-colors ${
                    turn.isAgent
                      ? 'bg-[var(--color-bg-sunken)]/50'
                      : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                      turn.isAgent
                        ? 'bg-[var(--color-brand-blue)] text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {turn.isAgent ? <Bot size={14} /> : <User size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {turn.speaker}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                      {turn.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Resonology AI Analysis & Signals */}
        <div className="lg:col-span-5 space-y-6">
          {analysisLoading ? (
            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
              <Skeleton width="50%" height={16} />
              <Skeleton width="100%" height={80} />
              <Skeleton width="80%" height={24} />
            </div>
          ) : analysis ? (
            <>
              {/* Executive Summary */}
              <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
                  <div className="flex items-center gap-1.5 text-[var(--color-action-primary)] font-semibold text-xs">
                    <Sparkles size={14} />
                    <span>Resonology AI Intelligence Extraction</span>
                  </div>
                  <Badge variant="success">Structured JSON</Badge>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-[var(--color-text-muted)] uppercase mb-1">
                    Call Summary
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <ConfidenceMeter
                    value={analysis.intent_confidence}
                    label={`Primary Intent: ${analysis.intent_primary.replace(/_/g, ' ')}`}
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-[var(--color-bg-sunken)]">
                      <span className="text-[var(--color-text-muted)] block text-[10px] uppercase">
                        Satisfaction
                      </span>
                      <span className="font-bold text-[var(--color-text-primary)] font-mono">
                        {analysis.satisfaction_score} / 5 Stars
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-bg-sunken)]">
                      <span className="text-[var(--color-text-muted)] block text-[10px] uppercase">
                        Compliance Score
                      </span>
                      <span className="font-bold text-[var(--color-success)] font-mono">
                        {Math.round(analysis.compliance_score * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Items Checklist */}
              {analysis.action_items.length > 0 && (
                <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Assigned Action Items ({analysis.action_items.length})
                  </h3>
                  <div className="space-y-2">
                    {analysis.action_items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2 rounded bg-[var(--color-bg-sunken)]/50 text-xs"
                      >
                        <CheckCircle2
                          size={14}
                          className={`mt-0.5 shrink-0 ${
                            item.status === 'completed'
                              ? 'text-[var(--color-success)]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-[var(--color-text-primary)] font-medium">{item.text}</p>
                          <span className="text-[10px] text-[var(--color-text-muted)] capitalize">
                            Owner: {item.owner} &bull; Status: {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Signals & Compliance Breaches */}
              {analysis.risk_signals.length > 0 && (
                <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-error)]/30 space-y-3">
                  <div className="flex items-center gap-1.5 text-[var(--color-error)] font-semibold text-xs">
                    <ShieldAlert size={15} />
                    <span>Risk Flags Detected ({analysis.risk_signals.length})</span>
                  </div>

                  <div className="space-y-3">
                    {analysis.risk_signals.map((sig, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--color-text-primary)] capitalize">
                            {sig.signal.replace(/_/g, ' ')}
                          </span>
                          <Badge variant={sig.severity === 'high' ? 'error' : 'warning'}>
                            {sig.severity}
                          </Badge>
                        </div>
                        <EvidenceChip
                          quote={sig.evidence}
                          timestampSeconds={sig.timestamp_seconds}
                          onSeek={handleSeek}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-center space-y-3">
              <Sparkles size={24} className="mx-auto text-[var(--color-text-muted)]" />
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                No AI Analysis Generated Yet
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Trigger post-call structured extraction to evaluate sentiment, intents, and compliance.
              </p>
              <Button size="sm" onClick={handleRunAnalysis} loading={triggerAnalysis.isPending}>
                Run Analysis Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDetailPage;
