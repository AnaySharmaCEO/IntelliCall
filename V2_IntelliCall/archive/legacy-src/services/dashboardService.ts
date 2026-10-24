import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";

export interface DashboardStats {
  calls_made: number;
  calls_made_delta: string;
  calls_made_delta_up: boolean;
  qualification_rate: number;
  qualification_rate_delta: string;
  qualification_rate_delta_up: boolean;
  meetings_booked: number;
  meetings_booked_delta: string;
  meetings_booked_delta_up: boolean;
  decision_accuracy: number;
  decision_accuracy_delta: string;
  decision_accuracy_delta_up: boolean;
}

export interface CampaignPerformanceRow {
  name: string;
  rate: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const orgId = await getActiveOrgId();
    if (!orgId) {
      return {
        calls_made: 0,
        calls_made_delta: "0 vs last week",
        calls_made_delta_up: true,
        qualification_rate: 0,
        qualification_rate_delta: "0% vs last week",
        qualification_rate_delta_up: true,
        meetings_booked: 0,
        meetings_booked_delta: "0 vs last week",
        meetings_booked_delta_up: true,
        decision_accuracy: 0,
        decision_accuracy_delta: "predicted vs. converted",
        decision_accuracy_delta_up: true,
      };
    }

    // 1. Calls count
    const { count: callsCount } = await supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId);

    // 2. Decisions count & qualified count
    const { data: decisionsData } = await supabase
      .from("decisions")
      .select("outcome")
      .eq("organization_id", orgId);

    const totalDecisions = decisionsData?.length || 0;
    const qualifiedDecisions = decisionsData?.filter(d => d.outcome === "qualified").length || 0;
    const qualRate = totalDecisions > 0 ? Math.round((qualifiedDecisions / totalDecisions) * 1000) / 10 : 0;

    // 3. Outcomes: meetings booked count & converted count
    const { data: outcomesData } = await supabase
      .from("outcomes")
      .select("stage")
      .eq("organization_id", orgId);

    const meetingsBooked = outcomesData?.filter(o =>
      ["meeting_booked", "meeting_attended", "opportunity", "converted"].includes(o.stage)
    ).length || 0;

    const converted = outcomesData?.filter(o => o.stage === "converted").length || 0;
    const accuracy = qualifiedDecisions > 0 ? Math.round((converted / qualifiedDecisions) * 1000) / 10 : 0;

    return {
      calls_made: callsCount || 0,
      calls_made_delta: callsCount ? "+100% (initial)" : "0 vs last week",
      calls_made_delta_up: true,
      qualification_rate: qualRate,
      qualification_rate_delta: `${qualRate}% overall`,
      qualification_rate_delta_up: qualRate >= 30,
      meetings_booked: meetingsBooked,
      meetings_booked_delta: `${meetingsBooked} total booked`,
      meetings_booked_delta_up: meetingsBooked > 0,
      decision_accuracy: accuracy > 0 ? accuracy : 100,
      decision_accuracy_delta: "predicted vs. converted",
      decision_accuracy_delta_up: true,
    };
  },

  async getCampaignPerformance(): Promise<CampaignPerformanceRow[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("campaigns")
      .select("name, qualification_rate")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error || !data) return [];

    return data.map((c: any) => ({
      name: c.name,
      rate: c.qualification_rate ? Number(c.qualification_rate) : 0,
    }));
  },
};

