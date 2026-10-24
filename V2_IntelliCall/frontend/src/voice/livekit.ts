import type { VoiceSession } from './client';
import type {
  VoiceConnectionState,
  AgentState,
  VoiceSessionConfig,
  VoiceSessionEvent,
} from '../contracts/voice';

/**
 * LiveKitVoiceSession connects to LiveKit Cloud WebRTC room.
 * For Phase F1-F10 this operates in seamless mock mode if LiveKit client packages
 * are not yet connected, or prepares the WebRTC pipeline for Phase 11.
 */
export class LiveKitVoiceSession implements VoiceSession {
  private connectionState: VoiceConnectionState = 'idle';
  private agentState: AgentState = 'idle';
  private muted = false;
  private listeners = new Set<(event: VoiceSessionEvent) => void>();

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

  async connect(_config: VoiceSessionConfig): Promise<void> {
    this.connectionState = 'connecting';
    this.agentState = 'idle';
    // Seam placeholder for Phase 11 livekit-client integration
  }

  async disconnect(): Promise<void> {
    this.connectionState = 'disconnected';
    this.agentState = 'idle';
  }

  sendTextMessage(_text: string): void {
    // Phase 11 data channel text message
  }
}
