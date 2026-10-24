import type { VoiceSession } from './client';
import type {
  VoiceConnectionState,
  AgentState,
  VoiceSessionConfig,
  VoiceSessionEvent,
} from '../contracts/voice';

export class MockVoiceSession implements VoiceSession {
  private connectionState: VoiceConnectionState = 'idle';
  private agentState: AgentState = 'idle';
  private muted = false;
  private listeners = new Set<(event: VoiceSessionEvent) => void>();
  private timers: NodeJS.Timeout[] = [];

  getConnectionState(): VoiceConnectionState {
    return this.connectionState;
  }

  getAgentState(): AgentState {
    return this.agentState;
  }

  isMuted(): boolean {
    return this.muted;
  }

  mute(muted: boolean): void {
    this.muted = muted;
  }

  onEvent(callback: (event: VoiceSessionEvent) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private emit(event: VoiceSessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private setConnState(state: VoiceConnectionState): void {
    this.connectionState = state;
    this.emit({ type: 'connection_changed', state });
  }

  private setAgentState(state: AgentState): void {
    this.agentState = state;
    this.emit({ type: 'agent_state_changed', state });
  }

  async connect(config: VoiceSessionConfig): Promise<void> {
    this.setConnState('connecting');

    const t1 = setTimeout(() => {
      this.setConnState('connected');
      this.setAgentState('speaking');

      // Emit greeting
      this.emit({
        type: 'transcript_delta',
        chunk: {
          id: `chunk-${Date.now()}-1`,
          role: 'agent',
          text: `Hello! I am ${config.voice_id} AI assistant. How may I help you today?`,
          is_final: true,
          timestamp_ms: Date.now(),
        },
      });

      this.emit({
        type: 'metrics',
        metrics: {
          ttfb_ms: 280,
          roundtrip_ms: 410,
          network_rtt_ms: 32,
          audio_buffer_ms: 12,
        },
      });

      const t2 = setTimeout(() => {
        this.setAgentState('listening');
      }, 2500);
      this.timers.push(t2);
    }, 600);

    this.timers.push(t1);
  }

  async disconnect(): Promise<void> {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.setAgentState('idle');
    this.setConnState('disconnected');
  }

  sendTextMessage(text: string): void {
    // Emit user chunk
    this.emit({
      type: 'transcript_delta',
      chunk: {
        id: `chunk-${Date.now()}-u`,
        role: 'user',
        text,
        is_final: true,
        timestamp_ms: Date.now(),
      },
    });

    this.setAgentState('thinking');

    const t1 = setTimeout(() => {
      this.setAgentState('speaking');
      this.emit({
        type: 'metrics',
        metrics: {
          ttfb_ms: 310,
          roundtrip_ms: 440,
          network_rtt_ms: 30,
        },
      });

      // Simulate a tool call if asking for rates or accounts
      if (text.toLowerCase().includes('rate') || text.toLowerCase().includes('account')) {
        this.emit({
          type: 'tool_call',
          tool: {
            call_id: `tool-${Date.now()}`,
            name: 'lookup_rate_tiers',
            args: { product: 'auto_refinance' },
            status: 'success',
            result: { tier_a: '8.4%', tier_b: '8.9%' },
            timestamp_ms: Date.now(),
          },
        });
      }

      this.emit({
        type: 'transcript_delta',
        chunk: {
          id: `chunk-${Date.now()}-a`,
          role: 'agent',
          text: `I understand your question regarding "${text}". Based on current records, our preferred rate is 8.4% APR. Would you like me to reserve that rate for your application?`,
          is_final: true,
          timestamp_ms: Date.now(),
        },
      });

      const t2 = setTimeout(() => {
        this.setAgentState('listening');
      }, 3000);
      this.timers.push(t2);
    }, 450);

    this.timers.push(t1);
  }
}
