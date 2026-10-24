import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Outcome } from "../types";

export const outcomesService = {
  async list(): Promise<Outcome[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("outcomes")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing outcomes:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      lead_id: row.lead_id,
      decision_id: row.decision_id,
      campaign_id: row.campaign_id,
      stage: row.stage,
      stalled: row.stalled,
      meeting_booked_at: row.meeting_booked_at,
      meeting_attended_at: row.meeting_attended_at,
      opportunity_created_at: row.opportunity_created_at,
      converted_at: row.converted_at,
      created_at: row.created_at,
    }));
  },

  async get(id: string): Promise<Outcome | null> {
    const { data, error } = await supabase
      .from("outcomes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      lead_id: data.lead_id,
      decision_id: data.decision_id,
      campaign_id: data.campaign_id,
      stage: data.stage,
      stalled: data.stalled,
      meeting_booked_at: data.meeting_booked_at,
      meeting_attended_at: data.meeting_attended_at,
      opportunity_created_at: data.opportunity_created_at,
      converted_at: data.converted_at,
      created_at: data.created_at,
    };
  },

  async getFunnel(): Promise<{ stage: string; count: number }[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) {
      return [
        { stage: "Qualified", count: 0 },
        { stage: "Meeting booked", count: 0 },
        { stage: "Meeting attended", count: 0 },
        { stage: "Opportunity", count: 0 },
        { stage: "Converted", count: 0 },
      ];
    }

    const { data, error } = await supabase
      .from("outcomes")
      .select("stage")
      .eq("organization_id", orgId);

    if (error || !data) {
      return [
        { stage: "Qualified", count: 0 },
        { stage: "Meeting booked", count: 0 },
        { stage: "Meeting attended", count: 0 },
        { stage: "Opportunity", count: 0 },
        { stage: "Converted", count: 0 },
      ];
    }

    // Tally stages
    const stageCounts: Record<string, number> = {
      qualified: 0,
      meeting_booked: 0,
      meeting_attended: 0,
      opportunity: 0,
      converted: 0,
    };

    data.forEach((row: any) => {
      if (row.stage in stageCounts) {
        stageCounts[row.stage]++;
      }
    });

    return [
      { stage: "Qualified", count: stageCounts.qualified },
      { stage: "Meeting booked", count: stageCounts.meeting_booked },
      { stage: "Meeting attended", count: stageCounts.meeting_attended },
      { stage: "Opportunity", count: stageCounts.opportunity },
      { stage: "Converted", count: stageCounts.converted },
    ];
  },
};

