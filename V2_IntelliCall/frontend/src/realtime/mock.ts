import type { RealtimeClient, RealtimePayload } from './client';
import type { Call } from '../contracts/entities';
import { MOCK_CALLS, MOCK_ORG } from '../api/mock/data';

type CallListener = (payload: RealtimePayload<Call>) => void;

export class MockRealtimeClient implements RealtimeClient {
  private listeners = new Set<CallListener>();
  private callListeners = new Map<string, Set<CallListener>>();

  subscribeToCalls(callback: CallListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  subscribeToCall(callId: string, callback: CallListener): () => void {
    if (!this.callListeners.has(callId)) {
      this.callListeners.set(callId, new Set());
    }
    const set = this.callListeners.get(callId)!;
    set.add(callback);
    return () => {
      set.delete(callback);
      if (set.size === 0) this.callListeners.delete(callId);
    };
  }

  emit(payload: RealtimePayload<Call>): void {
    for (const listener of this.listeners) {
      listener(payload);
    }
    const callId = payload.new?.id || payload.old?.id;
    if (callId && this.callListeners.has(callId)) {
      for (const listener of this.callListeners.get(callId)!) {
        listener(payload);
      }
    }
  }

  /**
   * Helper simulator to test call lifecycle in the UI.
   */
  startSimulatedCall(scenarioId: 'S1' | 'S2' | 'S3' = 'S1'): () => void {
    const id = `call-sim-${Date.now()}`;
    let call: Call = {
      id,
      organization_id: MOCK_ORG.id,
      campaign_id: 'camp-001',
      agent_id: 'agent-001',
      direction: 'inbound',
      status: 'ringing',
      started_at: new Date().toISOString(),
      transcript: '',
      sentiment: 'neutral',
      metadata: { scenario: scenarioId, simulated: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Emit initial ringing call
    this.emit({ eventType: 'INSERT', new: call, old: null });

    const timer1 = setTimeout(() => {
      call = { ...call, status: 'in_progress', updated_at: new Date().toISOString() };
      this.emit({ eventType: 'UPDATE', new: call, old: call });
    }, 1500);

    const timer2 = setTimeout(() => {
      call = {
        ...call,
        transcript: 'Agent: Hello, thank you for calling Apex Financial. How can I help you today?\nCustomer: Hi, I wanted to inquire about the auto loan refinance options.',
        updated_at: new Date().toISOString(),
      };
      this.emit({ eventType: 'UPDATE', new: call, old: call });
    }, 3000);

    const timer3 = setTimeout(() => {
      call = {
        ...call,
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: 35,
        sentiment: 'positive',
        call_score: 91,
        transcript: `${call.transcript}\nAgent: I can help you lock in the 8.4% rate immediately!\nCustomer: Sounds fantastic, please proceed.`,
        updated_at: new Date().toISOString(),
      };
      this.emit({ eventType: 'UPDATE', new: call, old: call });
    }, 6000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }
}
