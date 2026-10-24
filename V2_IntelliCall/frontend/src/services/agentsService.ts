import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Agent } from "../types";

export const agentsService = {
  async list(): Promise<Agent[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing agents:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      objective: row.objective || "",
      language: row.language || "English",
      voice: row.voice || "Alloy",
      status: row.status || "active",
      qualification_goal: row.qualification_goal || "",
      permitted_actions: row.permitted_actions || ["book_meeting", "send_followup", "update_status"],
      created_at: row.created_at,
    }));
  },

  async get(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      objective: data.objective || "",
      language: data.language || "English",
      voice: data.voice || "Alloy",
      status: data.status || "active",
      qualification_goal: data.qualification_goal || "",
      permitted_actions: data.permitted_actions || ["book_meeting", "send_followup", "update_status"],
      created_at: data.created_at,
    };
  },
};

