import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Campaign } from "../types";

export const campaignsService = {
  async list(): Promise<Campaign[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing campaigns:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      agent_id: row.agent_id,
      confidence_threshold: row.confidence_threshold ?? 80,
      leads_targeted: row.leads_targeted ?? 0,
      qualification_rate: row.qualification_rate ? Number(row.qualification_rate) : null,
      meetings_booked: row.meetings_booked ?? 0,
      strategy: row.strategy || "direct_qualification",
      created_at: row.created_at,
    }));
  },

  async get(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      status: data.status,
      agent_id: data.agent_id,
      confidence_threshold: data.confidence_threshold ?? 80,
      leads_targeted: data.leads_targeted ?? 0,
      qualification_rate: data.qualification_rate ? Number(data.qualification_rate) : null,
      meetings_booked: data.meetings_booked ?? 0,
      strategy: data.strategy || "direct_qualification",
      created_at: data.created_at,
    };
  },

  async create(data: Partial<Campaign>): Promise<Campaign> {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new Error("No active organization found.");

    const payload = {
      organization_id: orgId,
      name: data.name ?? "New Campaign",
      status: data.status ?? "draft",
      agent_id: data.agent_id,
      confidence_threshold: data.confidence_threshold ?? 80,
      strategy: data.strategy ?? "direct_qualification",
    };

    const { data: created, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select("*")
      .single();

    if (error || !created) {
      console.error("Error creating campaign:", error);
      throw new Error(error?.message || "Failed to create campaign.");
    }

    return {
      id: created.id,
      name: created.name,
      status: created.status,
      agent_id: created.agent_id,
      confidence_threshold: created.confidence_threshold ?? 80,
      leads_targeted: created.leads_targeted ?? 0,
      qualification_rate: created.qualification_rate ? Number(created.qualification_rate) : null,
      meetings_booked: created.meetings_booked ?? 0,
      strategy: created.strategy || "direct_qualification",
      created_at: created.created_at,
    };
  },

  async update(id: string, data: Partial<Campaign>): Promise<Campaign | null> {
    const { data: updated, error } = await supabase
      .from("campaigns")
      .update({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.agent_id !== undefined ? { agent_id: data.agent_id } : {}),
        ...(data.confidence_threshold !== undefined ? { confidence_threshold: data.confidence_threshold } : {}),
        ...(data.strategy !== undefined ? { strategy: data.strategy } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      agent_id: updated.agent_id,
      confidence_threshold: updated.confidence_threshold ?? 80,
      leads_targeted: updated.leads_targeted ?? 0,
      qualification_rate: updated.qualification_rate ? Number(updated.qualification_rate) : null,
      meetings_booked: updated.meetings_booked ?? 0,
      strategy: updated.strategy || "direct_qualification",
      created_at: updated.created_at,
    };
  },
};

