import React, { useState } from 'react';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Drawer,
  Tabs,
  TabPanel,
  FilterBar,
  FilterChip,
  Skeleton,
  SkeletonTable,
  EmptyState,
  ErrorInline,
  useToast,
} from '../../components/ui';
import {
  KPICard,
  StatusChip,
  ConfidenceMeter,
  EvidenceChip,
  FunnelChart,
} from '../../components/patterns';
import { useAuth } from '../../auth';
import { createVoiceSession } from '../../voice';
import { realtimeClient, MockRealtimeClient } from '../../realtime';
import { PhoneCall, Play, Mic, Volume2, Sparkles, AlertTriangle } from 'lucide-react';

export const KitPage: React.FC = () => {
  const { user, organization, role, can } = useAuth();
  const { toast } = useToast();

  // State for component interactive testing
  const [activeTab, setActiveTab] = useState('primitives');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterActive, setFilterActive] = useState('all');

  // Voice Seam Testing State
  const [voiceSession] = useState(() => createVoiceSession('mock'));
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [agentState, setAgentState] = useState('idle');
  const [voiceMessages, setVoiceMessages] = useState<string[]>([]);
  const [voiceInput, setVoiceInput] = useState('');
  const [latencyMetrics, setLatencyMetrics] = useState<{ ttfb: number; roundtrip: number } | null>(null);

  // Realtime Simulation State
  const [simLog, setSimLog] = useState<string[]>([]);

  const handleConnectVoice = async () => {
    if (voiceConnected) {
      await voiceSession.disconnect();
      setVoiceConnected(false);
      setAgentState('idle');
      return;
    }

    voiceSession.onEvent((event) => {
      if (event.type === 'agent_state_changed') {
        setAgentState(event.state);
      } else if (event.type === 'transcript_delta') {
        setVoiceMessages((prev) => [...prev, `${event.chunk.role}: ${event.chunk.text}`]);
      } else if (event.type === 'metrics') {
        setLatencyMetrics({
          ttfb: event.metrics.ttfb_ms,
          roundtrip: event.metrics.roundtrip_ms,
        });
      }
    });

    await voiceSession.connect({
      agent_id: 'agent-001',
      voice_id: 'Puck',
      language: 'en-IN',
      temperature: 0.3,
      sample_rate: 24000,
      enable_recording: true,
    });
    setVoiceConnected(true);
    toast('Voice agent connected in low-latency mock mode', 'info');
  };

  const handleSendVoiceMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInput.trim()) return;
    voiceSession.sendTextMessage(voiceInput.trim());
    setVoiceInput('');
  };

  const handleStartRealtimeSim = () => {
    if (realtimeClient instanceof MockRealtimeClient) {
      setSimLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Starting S1 Inbound Call simulation...`]);
      realtimeClient.subscribeToCalls((payload) => {
        setSimLog((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Realtime Event: ${payload.eventType} -> Call ${payload.new?.id} status: ${payload.new?.status}`,
        ]);
      });
      realtimeClient.startSimulatedCall('S1');
      toast('Call lifecycle simulation started', 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="info">Phase F1 Verification</Badge>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">/__kit</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Design System & Architecture Kit
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">
          Live kitchen sink verifying tokens, typography, UI primitives, domain patterns, and seams.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'primitives', label: 'UI Primitives' },
          { id: 'patterns', label: 'Domain Patterns' },
          { id: 'seams', label: 'Architecture & Seams' },
          { id: 'tokens', label: 'Tokens & Typography' },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: UI PRIMITIVES */}
      <TabPanel id="primitives" active={activeTab}>
        <div className="space-y-8">
          {/* Buttons */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Button Variants & Sizes
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="md">Primary Button</Button>
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="outline" size="md">Outline</Button>
              <Button variant="destructive" size="md">Destructive</Button>
              <Button variant="ghost" size="md">Ghost</Button>
              <Button variant="primary" size="md" loading>Loading</Button>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
            </div>
          </section>

          {/* Badges */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Badge Variants
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </section>

          {/* Form Controls */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Inputs & Selects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Campaign Name" placeholder="e.g. Q4 Auto Loan Refinance" hint="Visible to internal callers" />
              <Input label="Concurreny Limit" placeholder="5" error="Must be less than 50 calls" />
              <Select
                label="Voice Persona"
                options={[
                  { value: 'puck', label: 'Puck (Natural English / Hindi)' },
                  { value: 'charon', label: 'Charon (Empathetic)' },
                  { value: 'fenrir', label: 'Fenrir (Authoritative)' },
                ]}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                  Filter Chips Bar
                </label>
                <FilterBar>
                  <FilterChip active={filterActive === 'all'} onClick={() => setFilterActive('all')}>
                    All Calls
                  </FilterChip>
                  <FilterChip active={filterActive === 'positive'} onClick={() => setFilterActive('positive')}>
                    Positive Sentiment
                  </FilterChip>
                  <FilterChip active={filterActive === 'flagged'} onClick={() => setFilterActive('flagged')}>
                    Flagged
                  </FilterChip>
                </FilterBar>
              </div>
            </div>
          </section>

          {/* Overlays & Feedback */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Overlays, Feedback & Skeleton
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(true)}>Open Test Modal</Button>
              <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open Test Drawer</Button>
              <Button
                variant="secondary"
                onClick={() => toast('Notification delivered via Toast system', 'success')}
              >
                Trigger Success Toast
              </Button>
            </div>

            <ErrorInline
              message="Compliance disclaimer was omitted during initial greeting"
              onRetry={() => toast('Retrying rule evaluation...', 'info')}
            />

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Skeleton Loading Table
              </h3>
              <SkeletonTable rows={3} />
            </div>
          </section>
        </div>
      </TabPanel>

      {/* TAB 2: DOMAIN PATTERNS */}
      <TabPanel id="patterns" active={activeTab}>
        <div className="space-y-8">
          {/* KPI Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              label="Total Calls Logged"
              value="1,420"
              delta={{ value: 14.2, period: 'last week' }}
              hint="High connection rate"
            />
            <KPICard
              label="Avg Turnaround Latency"
              value="420 ms"
              delta={{ value: -8.5, period: 'yesterday' }}
              hint="Under 500ms target"
            />
            <KPICard
              label="Qualified Conversions"
              value="284"
              delta={{ value: 21.0, period: 'last month' }}
              hint="20% conversion rate"
            />
          </section>

          {/* Status Chips */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Domain Status Chips
            </h2>
            <div className="flex flex-wrap gap-2">
              <StatusChip status="completed" type="call" />
              <StatusChip status="in_progress" type="call" />
              <StatusChip status="ringing" type="call" />
              <StatusChip status="failed" type="call" />
              <StatusChip status="positive" type="sentiment" />
              <StatusChip status="neutral" type="sentiment" />
              <StatusChip status="negative" type="sentiment" />
              <StatusChip status="converted" type="lead" />
              <StatusChip status="qualified" type="lead" />
            </div>
          </section>

          {/* Confidence Meter & Evidence */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Confidence Meters
              </h2>
              <ConfidenceMeter value={0.94} label="Primary Intent: Loan Refinance" />
              <ConfidenceMeter value={0.65} label="Sentiment Confidence" />
              <ConfidenceMeter value={0.32} label="Risk of Churn" />
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Transcript Evidence Chips
              </h2>
              <EvidenceChip
                quote="I see your car loan is eligible for our lower interest rate refinance at 8.4%."
                timestampSeconds={42}
                onSeek={(s) => toast(`Seek audio to ${s}s`, 'info')}
              />
              <EvidenceChip
                quote="You people promised to reverse it last month and nothing happened!"
                timestampSeconds={124}
                onSeek={(s) => toast(`Seek audio to ${s}s`, 'info')}
              />
            </div>
          </section>

          {/* Funnel Chart */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Outbound Conversion Funnel
            </h2>
            <FunnelChart
              steps={[
                { label: 'Outbound Calls Placed', count: 1200 },
                { label: 'Calls Connected & Answered', count: 840 },
                { label: 'Engaged (>30s conversation)', count: 520 },
                { label: 'Qualified & Converted', count: 195 },
              ]}
            />
          </section>
        </div>
      </TabPanel>

      {/* TAB 3: SEAMS (VOICE & REALTIME SIMULATOR) */}
      <TabPanel id="seams" active={activeTab}>
        <div className="space-y-8">
          {/* Auth State Seam */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Active Auth Seam State
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-[var(--color-bg-sunken)]">
                <span className="text-[var(--color-text-muted)] block">User:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{user?.name}</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-bg-sunken)]">
                <span className="text-[var(--color-text-muted)] block">Organization:</span>
                <span className="font-semibold text-[var(--color-text-primary)]">{organization?.name}</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-bg-sunken)]">
                <span className="text-[var(--color-text-muted)] block">Role:</span>
                <span className="font-semibold text-[var(--color-action-primary)] uppercase">{role}</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-bg-sunken)]">
                <span className="text-[var(--color-text-muted)] block">Can edit agents:</span>
                <span className="font-semibold text-[var(--color-success)]">{can('agents:write') ? 'YES' : 'NO'}</span>
              </div>
            </div>
          </section>

          {/* Voice Session Seam */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Voice Session Seam (AI Live Speech Ready)
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Simulates bidirectional speech stream, audio turn events, and roundtrip latency (&lt;500ms).
                </p>
              </div>
              <Button
                variant={voiceConnected ? 'destructive' : 'primary'}
                size="sm"
                onClick={handleConnectVoice}
              >
                {voiceConnected ? 'Disconnect Agent' : 'Connect Voice Agent'}
              </Button>
            </div>

            {voiceConnected && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                    <span>Agent State: <strong>{agentState}</strong></span>
                  </div>
                  {latencyMetrics && (
                    <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
                      <span>TTFB: <strong className="text-[var(--color-action-primary)]">{latencyMetrics.ttfb} ms</strong></span>
                      <span>Turnaround: <strong className="text-[var(--color-action-primary)]">{latencyMetrics.roundtrip} ms</strong></span>
                    </div>
                  )}
                </div>

                <div className="h-44 overflow-y-auto p-3 rounded bg-[var(--color-bg-sunken)] text-xs space-y-2 border border-[var(--color-border-subtle)]">
                  {voiceMessages.length === 0 ? (
                    <span className="text-[var(--color-text-muted)] italic">Waiting for agent audio stream...</span>
                  ) : (
                    voiceMessages.map((msg, i) => (
                      <p key={i} className="leading-relaxed">
                        {msg}
                      </p>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendVoiceMessage} className="flex gap-2">
                  <Input
                    placeholder="Type user message (e.g. 'What is the refinance rate?')..."
                    value={voiceInput}
                    onChange={(e) => setVoiceInput(e.target.value)}
                  />
                  <Button type="submit" size="md">Send</Button>
                </form>
              </div>
            )}
          </section>

          {/* Realtime Call Lifecycle Simulator */}
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Realtime Call Lifecycle Simulator
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Tests state changes: ringing &rarr; in_progress &rarr; live transcript &rarr; completed &rarr; analysis.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleStartRealtimeSim}>
                Simulate Inbound Call (S1)
              </Button>
            </div>

            <div className="h-36 overflow-y-auto p-3 rounded bg-[var(--color-bg-sunken)] text-xs font-mono space-y-1 border border-[var(--color-border-subtle)]">
              {simLog.length === 0 ? (
                <span className="text-[var(--color-text-muted)] italic">Click "Simulate Inbound Call" to test the event loop.</span>
              ) : (
                simLog.map((log, i) => (
                  <p key={i} className="text-[var(--color-text-secondary)]">
                    {log}
                  </p>
                ))
              )}
            </div>
          </section>
        </div>
      </TabPanel>

      {/* TAB 4: TOKENS & TYPOGRAPHY */}
      <TabPanel id="tokens" active={activeTab}>
        <div className="space-y-8">
          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Brand Colors & Surfaces
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded bg-[var(--color-brand-blue)] text-white text-xs font-mono font-bold">
                Brand Blue<br />#2B4C8C
              </div>
              <div className="p-4 rounded bg-[var(--color-action-primary)] text-white text-xs font-mono font-bold">
                Action Primary<br />#2B4C8C
              </div>
              <div className="p-4 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-xs font-mono">
                bg-surface
              </div>
              <div className="p-4 rounded bg-[var(--color-bg-sunken)] text-xs font-mono">
                bg-sunken
              </div>
            </div>
          </section>

          <section className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Multilingual & Typography
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">IBM Plex Sans (English)</span>
                <p className="text-lg font-medium text-[var(--color-text-primary)]">
                  Autonomous explainable phone intelligence with strict compliance auditability.
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">Noto Sans Devanagari (Hindi / Hinglish Support)</span>
                <p className="text-lg font-hindi text-[var(--color-text-primary)]">
                  नमस्ते, अपेक्स फाइनेंशियल में आपका स्वागत है। हम आपके लोन रिन्यूअल में सहायता कर सकते हैं।
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">IBM Plex Mono (Metrics & IDs)</span>
                <p className="font-mono text-sm text-[var(--color-text-primary)]">
                  call_id: 00000000-0000-0000-0000-000000000010 | ttfb_ms: 280 | score: 94%
                </p>
              </div>
            </div>
          </section>
        </div>
      </TabPanel>

      {/* Test Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Interactive Test Modal"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          This modal adheres to the IBM Plex design tokens with standard backdrop blur, slide-up easing, and ESC key listener.
        </p>
      </Modal>

      {/* Test Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Interactive Test Drawer"
        footer={
          <Button size="sm" onClick={() => setDrawerOpen(false)}>
            Close Drawer
          </Button>
        }
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          Drawer test panel rendered with smooth slide-in animation.
        </p>
      </Drawer>
    </div>
  );
};

export default KitPage;
