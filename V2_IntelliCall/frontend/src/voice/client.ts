import type {
  VoiceConnectionState,
  AgentState,
  VoiceSessionConfig,
  VoiceSessionEvent,
} from '../contracts/voice';

export interface VoiceSession {
  getConnectionState(): VoiceConnectionState;
  getAgentState(): AgentState;
  connect(config: VoiceSessionConfig): Promise<void>;
  disconnect(): Promise<void>;
  mute(muted: boolean): void;
  isMuted(): boolean;
  onEvent(callback: (event: VoiceSessionEvent) => void): () => void;
  sendTextMessage(text: string): void;
}
