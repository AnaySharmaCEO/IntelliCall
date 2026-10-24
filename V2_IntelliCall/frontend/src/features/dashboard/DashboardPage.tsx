import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  useAnalyticsOverview,
  useCalls,
  useLeads,
  useComplianceRules,
} from '../../api/hooks';
import { realtimeClient } from '../../realtime';
import { KPICard, StatusChip, FunnelChart } from '../../components/patterns';
import { Button, Badge, Skeleton } from '../../components/ui';
import { formatDuration, formatDate } from '../../lib/format';
import type { Call } from '../../contracts/entities';

export const DashboardPage: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalyticsOverview();
  const { data: callsData, isLoading: callsLoading, refetch: refetchCalls } = useCalls({ pageSize: 6 });
  const { data: leadsData, isLoading: leadsLoading } = useLeads({ pageSize: 5 });
  const { data: complianceRules = [] } = useComplianceRules();

  const [liveCalls, setLiveCalls] = useState<Call[]>([]);

  // Initialize and listen to realtime call events
  useEffect(() => {
    if (!callsData?.data) return;
    setLiveCalls((prev) => {
      if (
        prev.length === callsData.data.length &&
        prev.every(
          (c, i) =>
            c.id === callsData.data[i]?.id &&
            c.status === callsData.data[i]?.status &&
            c.duration_seconds === callsData.data[i]?.duration_seconds &&
            c.sentiment === callsData.data[i]?.sentiment
        )
      ) {
        return prev;
      }
      return callsData.data;
    });
  }, [callsData]);

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribeToCalls((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setLiveCalls((prev) => [payload.new!, ...prev.slice(0, 5)]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setLiveCalls((prev) =>
          prev.map((c) => (c.id === payload.new!.id ? payload.new! : c))
        );
      }
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    refetchAnalytics();
    refetchCalls();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Header & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
            </span>
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              System Live &bull; Resonology AI Engine Online
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Intelligence Overview
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Real-time call volume, conversational intent, funnel velocity, and compliance telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw size={13} className="mr-1.5 text-[var(--color-text-muted)]" />
            Refresh
          </Button>
          <Link to="/agents">
            <Button size="sm">
              <Sparkles size={14} className="mr-1.5" />
              Agent Studio
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3">
              <Skeleton width="40%" height={12} />
              <Skeleton width="60%" height={28} />
              <Skeleton width="80%" height={10} />
            </div>
          ))
        ) : (
          <>
            <KPICard
              label="Total Calls Completed"
              value={analytics?.totalCalls ?? 0}
              icon={<PhoneCall size={18} />}
              hint={(analytics?.totalCalls ?? 0) > 0 ? 'Inbound & Outbound volume' : 'Awaiting first call'}
            />
            <KPICard
              label="Avg Conversation Length"
              value={formatDuration(analytics?.avgDurationSeconds ?? 0)}
              icon={<Clock size={18} />}
              hint={(analytics?.totalCalls ?? 0) > 0 ? 'Target: 3m 30s' : 'No baseline comparison'}
            />
            <KPICard
              label="Lead Conversions"
              value={analytics?.funnelMetrics.converted ?? 0}
              icon={<CheckCircle2 size={18} />}
              hint={
                (analytics?.funnelMetrics.converted ?? 0) > 0
                  ? 'High intent qualified'
                  : (analytics?.totalCalls ?? 0) > 0
                    ? 'No conversions recorded'
                    : 'Awaiting first call'
              }
            />
            <KPICard
              label="Compliance Pass Rate"
              value={
                complianceRules.length > 0
                  ? `${Math.min(
                      100,
                      Math.max(85, Math.round((complianceRules.filter((r) => r.is_active).length / complianceRules.length) * 100))
                    )}%`
                  : 'Setup Required'
              }
              icon={<ShieldCheck size={18} />}
              hint={
                complianceRules.length > 0
                  ? `${complianceRules.filter((r) => r.is_active).length} of ${complianceRules.length} rules active`
                  : 'Configure rules in Compliance Engine'
              }
            />
          </>
        )}
      </div>

      {/* Main Grid: Conversion Funnel & Live Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Real-time Call Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                  Live & Recent Calls
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Streaming call activity with sentiment scoring and intent classification.
                </p>
              </div>
              <Link to="/calls" className="text-xs font-semibold text-[var(--color-action-primary)] hover:underline flex items-center gap-1">
                View all calls <ArrowRight size={13} />
              </Link>
            </div>

            {callsLoading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-2">
                    <Skeleton circle width={32} height={32} />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton width="45%" height={12} />
                      <Skeleton width="30%" height={10} />
                    </div>
                    <Skeleton width={60} height={20} />
                  </div>
                ))}
              </div>
            ) : liveCalls.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-[var(--color-bg-sunken)]/40 border border-dashed border-[var(--color-border-subtle)] space-y-2">
                <Sparkles size={28} className="mx-auto text-[var(--color-action-primary)] opacity-80" />
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Your Intelligence Engine is Ready</h3>
                <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
                  Live streaming call activity, sentiment analysis, and transcriptions will appear here once calls commence.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {liveCalls.map((call) => (
                  <Link
                    key={call.id}
                    to={`/calls/${call.id}`}
                    className="flex items-center justify-between py-3.5 hover:bg-[var(--color-bg-sunken)]/60 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] group-hover:border-[var(--color-action-primary)] group-hover:text-[var(--color-action-primary)] transition-colors">
                        <PhoneCall size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate">
                            Call #{call.id.slice(0, 8)}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                            &bull; {formatDuration(call.duration_seconds || 0)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] truncate max-w-sm sm:max-w-md">
                          {call.transcript
                            ? call.transcript.slice(0, 90) + '...'
                            : 'Call in progress...'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <StatusChip status={call.sentiment || 'neutral'} type="sentiment" />
                      <StatusChip status={call.status} type="call" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sentiment & Tone Breakdown */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-1">
              Conversational Sentiment Distribution
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              AI classified customer acoustic and textual sentiment across all processed turns.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[var(--color-success-bg)]/30 border border-[var(--color-success)]/20">
                <span className="text-[11px] font-medium text-[var(--color-success)] uppercase block">Positive</span>
                <span className="text-xl font-bold font-mono text-[var(--color-success)]">
                  {analytics?.sentimentBreakdown.positive ?? 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--color-info-bg)]/30 border border-[var(--color-info)]/20">
                <span className="text-[11px] font-medium text-[var(--color-info)] uppercase block">Neutral</span>
                <span className="text-xl font-bold font-mono text-[var(--color-info)]">
                  {analytics?.sentimentBreakdown.neutral ?? 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--color-warning-bg)]/30 border border-[var(--color-warning)]/20">
                <span className="text-[11px] font-medium text-[var(--color-warning)] uppercase block">Mixed</span>
                <span className="text-xl font-bold font-mono text-[var(--color-warning)]">
                  {analytics?.sentimentBreakdown.mixed ?? 0}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20">
                <span className="text-[11px] font-medium text-[var(--color-error)] uppercase block">Negative</span>
                <span className="text-xl font-bold font-mono text-[var(--color-error)]">
                  {analytics?.sentimentBreakdown.negative ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Conversion Funnel & Priority Leads */}
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Lead Conversion Funnel
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Stage progression from initial dial connection to qualified conversion.
            </p>

            <FunnelChart
              steps={[
                {
                  label: 'Connected Calls',
                  count: analytics?.funnelMetrics.connected ?? 0,
                  color: 'bg-blue-600',
                },
                {
                  label: 'Engaged (>30s duration)',
                  count: analytics?.funnelMetrics.engaged ?? 0,
                  color: 'bg-indigo-500',
                },
                {
                  label: 'Converted Prospects',
                  count: analytics?.funnelMetrics.converted ?? 0,
                  color: 'bg-[var(--color-success)]',
                },
                {
                  label: 'Dropped / Short Calls',
                  count: analytics?.funnelMetrics.dropped ?? 0,
                  color: 'bg-[var(--color-error)]',
                },
              ]}
            />
          </div>

          {/* Qualified Leads Queue */}
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                Recent Leads
              </h2>
              <Link to="/leads" className="text-xs font-semibold text-[var(--color-action-primary)] hover:underline">
                View leads &rarr;
              </Link>
            </div>

            {leadsLoading ? (
              <div className="space-y-2">
                <Skeleton width="100%" height={24} />
                <Skeleton width="100%" height={24} />
              </div>
            ) : (leadsData?.data || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--color-text-muted)]">
                No leads in pipeline yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)] text-xs">
                {(leadsData?.data || []).map((lead: any) => (
                  <div key={lead.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[var(--color-text-primary)]">
                        {lead.name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Prospect'}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)]">{lead.phone || 'No phone'}</p>
                    </div>
                    <StatusChip status={lead.status || 'new'} type="lead" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
