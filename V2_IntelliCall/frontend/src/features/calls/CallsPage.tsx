import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Search,
  ArrowUpDown,
  Play,
  FileText,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useCalls } from '../../api/hooks';
import { StatusChip } from '../../components/patterns';
import {
  Button,
  Badge,
  Input,
  Select,
  FilterBar,
  FilterChip,
  SkeletonTable,
  EmptyState,
} from '../../components/ui';
import { formatDuration, formatDate } from '../../lib/format';

export const CallsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, refetch } = useCalls({
    status: statusFilter || undefined,
    sentiment: sentimentFilter || undefined,
    search: search.trim() || undefined,
    pageSize: 20,
  });

  const calls = data?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Telemetry & Auditing
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Call Logs & Transcripts
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Full audit trail of inbound & outbound conversations, speech analysis, and risk signals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw size={13} className="mr-1.5 text-[var(--color-text-muted)]" />
            Refresh
          </Button>
          <Link to="/agents">
            <Button size="sm">
              <PhoneCall size={14} className="mr-1.5" />
              Simulate New Call
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search size={15} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
            <Input
              placeholder="Search transcript content or lead details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              placeholder="All Sentiments"
              options={[
                { value: 'positive', label: 'Positive' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'negative', label: 'Negative' },
                { value: 'mixed', label: 'Mixed' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All Statuses"
              options={[
                { value: 'completed', label: 'Completed' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'ringing', label: 'Ringing' },
                { value: 'failed', label: 'Failed' },
                { value: 'busy', label: 'Busy' },
              ]}
            />
          </div>
        </div>

        <FilterBar>
          <FilterChip active={!statusFilter && !sentimentFilter} onClick={() => { setStatusFilter(''); setSentimentFilter(''); }}>
            All Logs ({calls.length})
          </FilterChip>
          <FilterChip active={sentimentFilter === 'positive'} onClick={() => setSentimentFilter(sentimentFilter === 'positive' ? '' : 'positive')}>
            Positive Sentiment
          </FilterChip>
          <FilterChip active={sentimentFilter === 'negative'} onClick={() => setSentimentFilter(sentimentFilter === 'negative' ? '' : 'negative')}>
            Negative / Disputed
          </FilterChip>
          <FilterChip active={statusFilter === 'completed'} onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}>
            Completed
          </FilterChip>
        </FilterBar>
      </div>

      {/* Calls Table */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={6} />
          </div>
        ) : calls.length === 0 ? (
          <EmptyState
            icon={<PhoneCall size={32} />}
            title="No call records found"
            description="No call logs match your current filter criteria or pipeline activity."
            action={{
              label: 'Reset Filters',
              onClick: () => {
                setSearch('');
                setStatusFilter('');
                setSentimentFilter('');
              },
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/50 text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Direction & ID</th>
                  <th className="py-3 px-4">Transcript Preview</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Sentiment</th>
                  <th className="py-3 px-4">Call Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {calls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-[var(--color-bg-sunken)]/60 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-[var(--color-text-primary)]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            call.direction === 'inbound' ? 'bg-sky-500' : 'bg-emerald-500'
                          }`}
                        />
                        <Link
                          to={`/calls/${call.id}`}
                          className="font-semibold text-[var(--color-action-primary)] hover:underline truncate max-w-[120px]"
                        >
                          {call.id.slice(0, 10)}
                        </Link>
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)] capitalize block">
                        {call.direction}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                      <Link to={`/calls/${call.id}`} className="block">
                        <p className="text-[12px] text-[var(--color-text-primary)] font-medium line-clamp-1">
                          {call.transcript
                            ? call.transcript.split('\n')[0]
                            : 'Call session initialized'}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">
                          {call.transcript
                            ? call.transcript.split('\n')[1] || ''
                            : 'Streaming audio packets...'}
                        </p>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[var(--color-text-secondary)]">
                      {formatDuration(call.duration_seconds || 0)}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusChip status={call.sentiment || 'neutral'} type="sentiment" />
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {call.call_score ? (
                        <span
                          className={`font-semibold ${
                            call.call_score >= 80
                              ? 'text-[var(--color-success)]'
                              : call.call_score >= 60
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-error)]'
                          }`}
                        >
                          {call.call_score}%
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">&mdash;</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusChip status={call.status} type="call" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/calls/${call.id}`}>
                        <Button variant="ghost" size="sm">
                          Inspect &rarr;
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsPage;
