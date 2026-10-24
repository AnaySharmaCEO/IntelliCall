import type { RealtimeClient } from './client';
import { MockRealtimeClient } from './mock';
import { SupabaseRealtimeClient } from './supabase';

const useMockRealtime = import.meta.env.VITE_USE_MOCK_API === 'true';

export const realtimeClient: RealtimeClient = useMockRealtime
  ? new MockRealtimeClient()
  : new SupabaseRealtimeClient();

export * from './client';
export * from './mock';
export * from './supabase';
