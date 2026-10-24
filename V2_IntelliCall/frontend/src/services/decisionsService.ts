import { supabase } from "../lib/supabase";
import { getActiveOrgId, getCurrentUserId } from "./supabaseClientHelper";
import type { Decision, Evidence, TraceStep } from "../types";

export const decisionsService = {
  async list(): Promise<Decision[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("decisions")
      .select(`
        *,
        evidence_signals (*)
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing decisions:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      call_id: row.call_id,
      lead_id: row.lead_id,
      campaign_id: row.campaign_id,
      outcome: row.outcome,
      confidence_score: row.confidence_score ? Number(row.confidence_score) : 0,
      confidence_tier: row.confidence_tier || "medium",
      reason: row.reason || "",
      recommended_action: row.recommended_action || "book_meeting",
      actual_action: row.actual_action,
      action_status: row.action_status || "pending",
      overridden_by: row.overridden_by,
      evidence: (row.evidence_signals || []).map((e: any) => ({
        id: e.id,
        call_id: row.call_id,
        decision_id: row.id,
        quote: e.quote || "",
        signal: e.signal || "",
        weight: e.weight || "medium",
        timestamp_seconds: e.timestamp_seconds ?? 0,
      })),
      trace: Array.isArray(row.reasoning_trace) ? row.reasoning_trace : [],
      created_at: row.created_at,
      reviewed_at: row.reviewed_at,
    }));
  },

  async get(id: string): Promise<Decision | null> {
    const { data, error } = await supabase
      .from("decisions")
      .select(`
        *,
        evidence_signals (*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      call_id: data.call_id,
      lead_id: data.lead_id,
      campaign_id: data.campaign_id,
      outcome: data.outcome,
      confidence_score: data.confidence_score ? Number(data.confidence_score) : 0,
      confidence_tier: data.confidence_tier || "medium",
      reason: data.reason || "",
      recommended_action: data.recommended_action || "book_meeting",
      actual_action: data.actual_action,
      action_status: data.action_status || "pending",
      overridden_by: data.overridden_by,
      evidence: (data.evidence_signals || []).map((e: any) => ({
        id: e.id,
        call_id: data.call_id,
        decision_id: data.id,
        quote: e.quote || "",
        signal: e.signal || "",
        weight: e.weight || "medium",
        timestamp_seconds: e.timestamp_seconds ?? 0,
      })),
      trace: Array.isArray(data.reasoning_trace) ? data.reasoning_trace : [],
      created_at: data.created_at,
      reviewed_at: data.reviewed_at,
    };
  },

  async approve(id: string, userId?: string): Promise<Decision | null> {
    const currentUid = userId || (await getCurrentUserId()) || "authenticated";

    // First fetch decision
    const current = await this.get(id);
    if (!current) return null;

    const { data: updated, error } = await supabase
      .from("decisions")
      .update({
        action_status: "executed",
        actual_action: current.recommended_action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUid,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      console.error("Error approving decision:", error);
      return null;
    }

    // Also update associated actions table
    await supabase
      .from("actions")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
      })
      .eq("decision_id", id);

    return this.get(id);
  },

  async override(id: string, userId?: string): Promise<Decision | null> {
    const currentUid = userId || (await getCurrentUserId()) || "authenticated";

    const { data: updated, error } = await supabase
      .from("decisions")
      .update({
        action_status: "dismissed",
        outcome: "not_qualified",
        overridden_by: currentUid,
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUid,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) {
      console.error("Error overriding decision:", error);
      return null;
    }

    // Also update associated actions table
    await supabase
      .from("actions")
      .update({
        status: "dismissed",
      })
      .eq("decision_id", id);

    return this.get(id);
  },
};

