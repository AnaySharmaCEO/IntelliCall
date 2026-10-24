import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Call, TranscriptLine } from "../types";

export const callsService = {
  async list(): Promise<Call[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("organization_id", orgId)
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error listing calls:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      lead_id: row.lead_id,
      campaign_id: row.campaign_id,
      agent_id: row.agent_id,
      status: row.status,
      duration_seconds: row.duration_seconds,
      decision_id: row.decision_id,
      scheduled_for: row.scheduled_for,
      started_at: row.started_at,
      ended_at: row.ended_at,
    }));
  },

  async get(id: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from("calls")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      agent_id: data.agent_id,
      status: data.status,
      duration_seconds: data.duration_seconds,
      decision_id: data.decision_id,
      scheduled_for: data.scheduled_for,
      started_at: data.started_at,
      ended_at: data.ended_at,
    };
  },

  async getTranscript(callId: string): Promise<TranscriptLine[]> {
    const { data, error } = await supabase
      .from("transcript_turns")
      .select("*")
      .eq("transcript_id", callId)
      .order("turn_order", { ascending: true });

    if (error || !data) {
      // Fallback check: find transcript record first
      const { data: transcriptRecord } = await supabase
        .from("transcripts")
        .select("id")
        .eq("call_id", callId)
        .maybeSingle();

      if (!transcriptRecord) return [];

      const { data: turns } = await supabase
        .from("transcript_turns")
        .select("*")
        .eq("transcript_id", transcriptRecord.id)
        .order("turn_order", { ascending: true });

      return (turns || []).map((t: any) => ({
        id: t.id,
        call_id: callId,
        speaker: t.speaker,
        text: t.text,
        timestamp_seconds: t.timestamp_ms ? Math.round(t.timestamp_ms / 1000) : 0,
        signals: t.signals || [],
      }));
    }

    return (data || []).map((t: any) => ({
      id: t.id,
      call_id: callId,
      speaker: t.speaker,
      text: t.text,
      timestamp_seconds: t.timestamp_ms ? Math.round(t.timestamp_ms / 1000) : 0,
      signals: t.signals || [],
    }));
  },

  async create(data: {
    lead_id: string;
    campaign_id: string;
    agent_id: string;
    mode: "now" | "schedule";
    scheduled_for?: string;
  }): Promise<Call> {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new Error("No active organization found.");

    const payload = {
      organization_id: orgId,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      agent_id: data.agent_id,
      status: data.mode === "schedule" ? "scheduled" : "calling",
      scheduled_for: data.scheduled_for ?? null,
      started_at: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from("calls")
      .insert(payload)
      .select("*")
      .single();

    if (error || !created) {
      console.error("Error creating call:", error);
      throw new Error(error?.message || "Failed to create call.");
    }

    return {
      id: created.id,
      lead_id: created.lead_id,
      campaign_id: created.campaign_id,
      agent_id: created.agent_id,
      status: created.status,
      duration_seconds: created.duration_seconds,
      decision_id: created.decision_id,
      scheduled_for: created.scheduled_for,
      started_at: created.started_at,
      ended_at: created.ended_at,
    };
  },

  async cancelScheduled(callId: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from("calls")
      .update({ status: "cancelled", ended_at: new Date().toISOString() })
      .eq("id", callId)
      .select("*")
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      agent_id: data.agent_id,
      status: data.status,
      duration_seconds: data.duration_seconds,
      decision_id: data.decision_id,
      scheduled_for: data.scheduled_for,
      started_at: data.started_at,
      ended_at: data.ended_at,
    };
  },

  async reschedule(callId: string, scheduledFor: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from("calls")
      .update({ scheduled_for: scheduledFor })
      .eq("id", callId)
      .select("*")
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      agent_id: data.agent_id,
      status: data.status,
      duration_seconds: data.duration_seconds,
      decision_id: data.decision_id,
      scheduled_for: data.scheduled_for,
      started_at: data.started_at,
      ended_at: data.ended_at,
    };
  },

  async progressLiveState(callId: string, status: Call["status"]): Promise<Call | null> {
    const { data, error } = await supabase
      .from("calls")
      .update({
        status,
        ...(status === "completed" ? { ended_at: new Date().toISOString() } : {}),
      })
      .eq("id", callId)
      .select("*")
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      agent_id: data.agent_id,
      status: data.status,
      duration_seconds: data.duration_seconds,
      decision_id: data.decision_id,
      scheduled_for: data.scheduled_for,
      started_at: data.started_at,
      ended_at: data.ended_at,
    };
  },
};

