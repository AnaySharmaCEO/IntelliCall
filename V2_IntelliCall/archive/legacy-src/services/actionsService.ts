import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Action } from "../types";

export const actionsService = {
  async list(): Promise<Action[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing actions:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      decision_id: row.decision_id,
      lead_id: row.lead_id,
      type: row.type,
      status: row.status,
      executed_at: row.executed_at,
      created_at: row.created_at,
    }));
  },

  async execute(id: string): Promise<Action | null> {
    const { data, error } = await supabase
      .from("actions")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      decision_id: data.decision_id,
      lead_id: data.lead_id,
      type: data.type,
      status: data.status,
      executed_at: data.executed_at,
      created_at: data.created_at,
    };
  },
};

