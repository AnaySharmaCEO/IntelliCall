import type { RealtimeClient, RealtimePayload } from './client';
import type { Call } from '../contracts/entities';
import { supabase } from '../lib/supabase';

export class SupabaseRealtimeClient implements RealtimeClient {
  subscribeToCalls(callback: (payload: RealtimePayload<Call>) => void): () => void {
    const channel = supabase
      .channel('calls-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls' },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new as Call,
            old: payload.old as Call,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToCall(callId: string, callback: (payload: RealtimePayload<Call>) => void): () => void {
    const channel = supabase
      .channel(`call-${callId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${callId}` },
        (payload: any) => {
          callback({
            eventType: payload.eventType,
            new: payload.new as Call,
            old: payload.old as Call,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
