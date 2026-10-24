import type { VoiceSession } from './client';
import { MockVoiceSession } from './mock';
import { LiveKitVoiceSession } from './livekit';

export function createVoiceSession(mode: 'mock' | 'livekit' = 'mock'): VoiceSession {
  if (mode === 'livekit') {
    return new LiveKitVoiceSession();
  }
  return new MockVoiceSession();
}

export * from './client';
export * from './mock';
export * from './livekit';
