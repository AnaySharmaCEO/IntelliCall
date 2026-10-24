import { z } from 'zod';
import { AgentStateSchema } from './enums';

export const VoiceConnectionStateSchema = z.enum([
  'idle',
  'connecting',
  'connected',
  'reconnecting',
  'disconnected',
  'failed',
]);
export type VoiceConnectionState = z.infer<typeof VoiceConnectionStateSchema>;

export const VoiceTranscriptChunkSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'agent', 'system']),
  text: z.string(),
  is_final: z.boolean(),
  timestamp_ms: z.number(),
  confidence: z.number().min(0).max(1).optional(),
});
export type VoiceTranscriptChunk = z.infer<typeof VoiceTranscriptChunkSchema>;

export const VoiceToolCallSchema = z.object({
  call_id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
  result: z.record(z.unknown()).optional(),
  status: z.enum(['invoking', 'success', 'failed']),
  timestamp_ms: z.number(),
});
export type VoiceToolCall = z.infer<typeof VoiceToolCallSchema>;

export const VoiceLatencyMetricsSchema = z.object({
  ttfb_ms: z.number(),
  roundtrip_ms: z.number(),
  network_rtt_ms: z.number().optional(),
  audio_buffer_ms: z.number().optional(),
});
export type VoiceLatencyMetrics = z.infer<typeof VoiceLatencyMetricsSchema>;

export const VoiceSessionConfigSchema = z.object({
  agent_id: z.string(),
  campaign_id: z.string().optional(),
  lead_id: z.string().optional(),
  sample_rate: z.number().default(24000),
  voice_id: z.string().default('Puck'),
  language: z.string().default('en-IN'),
  temperature: z.number().default(0.4),
  enable_recording: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});
export type VoiceSessionConfig = z.infer<typeof VoiceSessionConfigSchema>;

export const VoiceSessionEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('connection_changed'),
    state: VoiceConnectionStateSchema,
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal('agent_state_changed'),
    state: AgentStateSchema,
  }),
  z.object({
    type: z.literal('transcript_delta'),
    chunk: VoiceTranscriptChunkSchema,
  }),
  z.object({
    type: z.literal('tool_call'),
    tool: VoiceToolCallSchema,
  }),
  z.object({
    type: z.literal('metrics'),
    metrics: VoiceLatencyMetricsSchema,
  }),
  z.object({
    type: z.literal('interrupted'),
    timestamp_ms: z.number(),
  }),
]);
export type VoiceSessionEvent = z.infer<typeof VoiceSessionEventSchema>;
