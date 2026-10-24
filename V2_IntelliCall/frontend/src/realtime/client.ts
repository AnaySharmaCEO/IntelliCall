import type { Call } from '../contracts/entities';

export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}

export interface RealtimeClient {
  subscribeToCalls(callback: (payload: RealtimePayload<Call>) => void): () => void;
  subscribeToCall(callId: string, callback: (payload: RealtimePayload<Call>) => void): () => void;
}
