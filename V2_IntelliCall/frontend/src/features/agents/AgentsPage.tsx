import React, { useState } from 'react';
import {
  Bot,
  Plus,
  Play,
  Volume2,
  Sliders,
  Sparkles,
  Trash2,
  Edit,
  Mic,
  MessageSquare,
  ShieldAlert,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  useAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from '../../api/hooks';
import { StatusChip } from '../../components/patterns';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Drawer,
  Skeleton,
  EmptyState,
  useToast,
} from '../../components/ui';
import { createVoiceSession } from '../../voice';
import type { Agent } from '../../contracts/entities';

export const AgentsPage: React.FC = () => {
  const { data: agents = [], isLoading } = useAgents();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const { toast } = useToast();

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('Senior Growth Consultant');
  const [voice, setVoice] = useState<'Aoede' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'>('Aoede');
  const [language, setLanguage] = useState('en-IN');
  const [temperature, setTemperature] = useState(0.7);
  const [speed, setSpeed] = useState(1.0);
  const [brevityWords, setBrevityWords] = useState(25);
  const [communicationStyle, setCommunicationStyle] = useState('consultative');
  const [greeting, setGreeting] = useState('Namaste, this is {{agent_name}} calling. Do you have a quick minute?');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.'
  );

  // Psychological tactics state
  const [vossEmpathy, setVossEmpathy] = useState(true);
  const [law4Brevity, setLaw4Brevity] = useState(true);
  const [noOrientedClose, setNoOrientedClose] = useState(true);
  const [linguisticMirroring, setLinguisticMirroring] = useState(true);

  // Voice Test Simulator Drawer State
  const [testDrawerOpen, setTestDrawerOpen] = useState(false);
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null);
  const [voiceSession] = useState(() => createVoiceSession('mock'));
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [agentState, setAgentState] = useState('idle');
  const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [latencyMetrics, setLatencyMetrics] = useState<{ ttfb: number; roundtrip: number } | null>(null);

  const openCreateModal = () => {
    setEditingAgent(null);
    setName('');
    setRoleTitle('Senior Refinancing Specialist');
    setVoice('Aoede');
    setLanguage('en-IN');
    setTemperature(0.7);
    setSpeed(1.0);
    setBrevityWords(25);
    setCommunicationStyle('consultative');
    setGreeting('Namaste, this is {{agent_name}} calling. Do you have a quick minute?');
    setSystemPrompt(
      'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.'
    );
    setVossEmpathy(true);
    setLaw4Brevity(true);
    setNoOrientedClose(true);
    setLinguisticMirroring(true);
    setModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setRoleTitle(agent.roleTitle || (agent as any).role_title || 'Senior Growth Consultant');
    const v = agent.voiceModel || (agent as any).voice_model || agent.voice || 'Aoede';
    setVoice(v as any);
    setLanguage(agent.language || agent.primaryLanguage || 'en-IN');
    setTemperature(Number(agent.voiceTemperature ?? (agent as any).voice_temperature ?? 0.7));
    setSpeed(Number(agent.voiceSpeed ?? (agent as any).voice_speed ?? 1.0));
    setBrevityWords(Number(agent.brevityWords ?? (agent as any).brevity_words ?? 25));
    setCommunicationStyle(agent.communicationStyle || (agent as any).communication_style || 'consultative');
    setGreeting(agent.greeting || 'Namaste, this is {{agent_name}} calling. Do you have a quick minute?');
    setSystemPrompt(agent.systemPrompt || (agent as any).system_prompt || '');

    const tactics = agent.tactics || {};
    setVossEmpathy(tactics.vossEmpathy ?? (tactics as any).voss_empathy ?? true);
    setLaw4Brevity(tactics.law4Brevity ?? (tactics as any).law4_brevity ?? true);
    setNoOrientedClose(tactics.noOrientedClose ?? (tactics as any).no_oriented_close ?? true);
    setLinguisticMirroring(tactics.linguisticMirroring ?? (tactics as any).linguistic_mirroring ?? true);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Agent name is required', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      role_title: roleTitle.trim(),
      voiceModel: voice,
      voice_model: voice,
      voice,
      language,
      voiceTemperature: temperature,
      voice_temperature: temperature,
      voiceSpeed: speed,
      voice_speed: speed,
      brevityWords,
      brevity_words: brevityWords,
      communicationStyle,
      communication_style: communicationStyle,
      greeting: greeting.trim(),
      systemPrompt: systemPrompt.trim(),
      system_prompt: systemPrompt.trim(),
      tactics: {
        vossEmpathy,
        voss_empathy: vossEmpathy,
        law4Brevity,
        law4_brevity: law4Brevity,
        noOrientedClose,
        no_oriented_close: noOrientedClose,
        linguisticMirroring,
        linguistic_mirroring: linguisticMirroring,
      },
    };

    try {
      if (editingAgent) {
        await updateAgent.mutateAsync({
          id: editingAgent.id,
          updates: payload,
        });
        toast('Agent configuration updated successfully', 'success');
      } else {
        await createAgent.mutateAsync({
          ...payload,
          status: 'active',
        });
        toast('New AI voice agent created', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save agent', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      await deleteAgent.mutateAsync(id);
      toast('Agent removed', 'info');
    }
  };

  const openSimulator = async (agent: Agent) => {
    setTestingAgent(agent);
    setTranscriptLog([]);
    setTestDrawerOpen(true);

    voiceSession.onEvent((event) => {
      if (event.type === 'agent_state_changed') {
        setAgentState(event.state);
      } else if (event.type === 'transcript_delta') {
        setTranscriptLog((prev) => [...prev, `${event.chunk.role}: ${event.chunk.text}`]);
      } else if (event.type === 'metrics') {
        setLatencyMetrics({
          ttfb: event.metrics.ttfb_ms,
          roundtrip: event.metrics.roundtrip_ms,
        });
      }
    });

    await voiceSession.connect({
      agent_id: agent.id,
      voice_id: agent.voiceModel || (agent as any).voice_model || agent.voice || 'Aoede',
      language: agent.language || agent.primaryLanguage || 'en-IN',
      temperature: Number(agent.voiceTemperature ?? (agent as any).voice_temperature ?? 0.7),
    });
    setVoiceConnected(true);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    voiceSession.sendTextMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Gemini Live Voice Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            AI Agent Studio
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Configure conversational personas, Gemini Live voices, Law 4 brevity word limits, and negotiation tactics.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal}>
          <Plus size={14} className="mr-1.5" />
          Create New Agent
        </Button>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4"
            >
              <Skeleton width="40%" height={20} />
              <Skeleton width="100%" height={60} />
              <Skeleton width="60%" height={16} />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={<Bot size={36} />}
          title="No voice personas configured"
          description="Create your first conversational agent with customized Gemini Live voice, brevity limit, and behavioral tactics."
          action={{
            label: 'Create Agent',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => {
            const role = agent.roleTitle || (agent as any).role_title || 'Growth Consultant';
            const voiceId = agent.voiceModel || (agent as any).voice_model || agent.voice || 'Aoede';
            const brevity = Number(agent.brevityWords || (agent as any).brevity_words) || 25;
            const tactics = agent.tactics || {};

            return (
              <div
                key={agent.id}
                className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-2xs hover:border-[var(--color-border-default)] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-action-secondary-bg)] text-[var(--color-action-primary)] flex items-center justify-center font-bold">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)]">
                          {agent.name}
                        </h3>
                        <span className="text-[12px] font-medium text-[var(--color-text-secondary)] block">
                          {role}
                        </span>
                      </div>
                    </div>
                    <StatusChip status={agent.status} type="agent" />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Volume2 size={10} /> {voiceId}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      {agent.language || agent.primaryLanguage || 'en-IN'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Max {brevity} words
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-[var(--color-bg-sunken)]">
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase block mb-1">
                        System Directive
                      </span>
                      <p className="text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                        {agent.systemPrompt || (agent as any).system_prompt || 'Standard qualification prompt.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1.5">
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase block">
                        Psychological Tactics
                      </span>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {(tactics.vossEmpathy ?? (tactics as any).voss_empathy ?? true) && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            Voss Empathy
                          </span>
                        )}
                        {(tactics.law4Brevity ?? (tactics as any).law4_brevity ?? true) && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            Law 4 Brevity
                          </span>
                        )}
                        {(tactics.noOrientedClose ?? (tactics as any).no_oriented_close ?? true) && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            No-Oriented Close
                          </span>
                        )}
                        {(tactics.linguisticMirroring ?? (tactics as any).linguistic_mirroring ?? true) && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            Mirroring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => openSimulator(agent)}>
                    <Play size={13} className="mr-1 text-[var(--color-action-primary)]" />
                    Test Voice
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="p-1.5 rounded hover:bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors"
                      title="Edit agent"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="p-1.5 rounded hover:bg-[var(--color-error-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] cursor-pointer transition-colors"
                      title="Delete agent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Agent */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAgent ? 'Edit AI Voice Agent' : 'Create AI Voice Agent'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Agent Display Name"
              placeholder="e.g. Priya, Karan, Maya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Role / Title"
              placeholder="e.g. Senior Refinancing Consultant"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select
              label="Gemini Live Neural Voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value as any)}
              options={[
                { value: 'Aoede', label: 'Aoede (Warm & Engaging)' },
                { value: 'Puck', label: 'Puck (Direct & Versatile)' },
                { value: 'Charon', label: 'Charon (Empathetic & Calm)' },
                { value: 'Kore', label: 'Kore (Dynamic & Polished)' },
                { value: 'Fenrir', label: 'Fenrir (Authoritative & Crisp)' },
              ]}
            />
            <Select
              label="Primary Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              options={[
                { value: 'en-IN', label: 'English (India - Hinglish Mirroring)' },
                { value: 'hi-IN', label: 'Hindi (India)' },
                { value: 'en-US', label: 'English (US)' },
              ]}
            />
            <Select
              label="Communication Style"
              value={communicationStyle}
              onChange={(e) => setCommunicationStyle(e.target.value)}
              options={[
                { value: 'consultative', label: 'Consultative (Diagnostic & Listening)' },
                { value: 'direct', label: 'Direct & Assertive (Quick Value Pitch)' },
                { value: 'empathetic', label: 'Empathetic (Patient & Supportive)' },
              ]}
            />
          </div>

          <div className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                  Robert Greene Law 4: Brevity Limit
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  Strictly caps agent speaking turns to keep calls crisp and human.
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-action-primary)] bg-[var(--color-action-secondary-bg)] px-2 py-0.5 rounded">
                {brevityWords} words max / turn
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="1"
              value={brevityWords}
              onChange={(e) => setBrevityWords(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--color-action-primary)] cursor-pointer"
            />
          </div>

          {/* Negotiation Tactics Checkboxes */}
          <div className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-2.5">
            <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
              Psychological Tactics & Voice Guardrails
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-[var(--color-bg-sunken)] transition-colors">
                <input
                  type="checkbox"
                  checked={vossEmpathy}
                  onChange={(e) => setVossEmpathy(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-action-primary)] rounded"
                />
                <div>
                  <span className="font-medium text-[var(--color-text-primary)] block">Chris Voss Tactical Empathy</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Labels unspoken objections: "Sounds like you are in the middle of something urgent..."
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-[var(--color-bg-sunken)] transition-colors">
                <input
                  type="checkbox"
                  checked={law4Brevity}
                  onChange={(e) => setLaw4Brevity(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-action-primary)] rounded"
                />
                <div>
                  <span className="font-medium text-[var(--color-text-primary)] block">Law 4 Brevity Enforcement</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Never recites monologue scripts; prompts prospect to speak 70% of the time.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-[var(--color-bg-sunken)] transition-colors">
                <input
                  type="checkbox"
                  checked={noOrientedClose}
                  onChange={(e) => setNoOrientedClose(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-action-primary)] rounded"
                />
                <div>
                  <span className="font-medium text-[var(--color-text-primary)] block">Calibrated 'No'-Oriented Close</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Asks safe 'No' questions: "Would you be opposed to a 5-minute review?"
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-[var(--color-bg-sunken)] transition-colors">
                <input
                  type="checkbox"
                  checked={linguisticMirroring}
                  onChange={(e) => setLinguisticMirroring(e.target.checked)}
                  className="mt-0.5 accent-[var(--color-action-primary)] rounded"
                />
                <div>
                  <span className="font-medium text-[var(--color-text-primary)] block">Linguistic Mirroring & Hinglish</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    Mirrors prospect's exact dialect, respectful Indian business Hinglish or crisp English.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)] block mb-1">
                Acoustic Temperature ({temperature})
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-action-primary)] cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[var(--color-text-secondary)] block mb-1">
                Voice Cadence Speed ({speed}x)
              </label>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-action-primary)] cursor-pointer"
              />
            </div>
          </div>

          <Input
            label="Initial Greeting Phrase (use {{agent_name}} variable)"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="Namaste, this is {{agent_name}} calling. Do you have a quick minute?"
          />

          <div>
            <label className="text-[12px] font-medium text-[var(--color-text-secondary)] block mb-1">
              Custom Persona Instructions & Guardrails
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Define behavioral rules, tone, qualification criteria, and objections..."
              className="w-full p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] outline-none transition-all duration-150"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createAgent.isPending || updateAgent.isPending}>
              {editingAgent ? 'Save Changes' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Drawer: Live Voice Simulator */}
      <Drawer
        open={testDrawerOpen}
        onClose={async () => {
          await voiceSession.disconnect();
          setTestDrawerOpen(false);
          setVoiceConnected(false);
        }}
        title={`Testing ${testingAgent?.name || 'Agent'}`}
        width="max-w-[560px]"
        footer={
          <form onSubmit={handleSendChat} className="flex gap-2 w-full">
            <Input
              placeholder="Type message to agent..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <Button type="submit" size="md">
              Send
            </Button>
          </form>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span>Status: <strong>{agentState}</strong></span>
            </div>
            {latencyMetrics && (
              <span className="text-[var(--color-action-primary)]">
                TTFB: {latencyMetrics.ttfb}ms &bull; Turn: {latencyMetrics.roundtrip}ms
              </span>
            )}
          </div>

          <div className="h-[420px] overflow-y-auto p-4 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-3 text-xs">
            {transcriptLog.length === 0 ? (
              <p className="text-[var(--color-text-muted)] italic text-center py-10">
                Connected to voice session. Send a text or speak to initiate audio turns.
              </p>
            ) : (
              transcriptLog.map((line, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded ${
                    line.startsWith('agent')
                      ? 'bg-[var(--color-action-secondary-bg)] text-[var(--color-text-primary)]'
                      : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default AgentsPage;
