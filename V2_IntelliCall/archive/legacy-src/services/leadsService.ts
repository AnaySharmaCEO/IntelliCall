import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { Lead } from "../types";

export const leadsService = {
  async list(): Promise<Lead[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing leads:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      company: row.company || "",
      title: row.title || "",
      email: row.email || "",
      phone: row.phone || "",
      status: row.status,
      campaign_id: row.campaign_id,
      owner_id: row.owner_id,
      confidence_score: row.confidence_score ? Number(row.confidence_score) : null,
      confidence_tier: row.confidence_tier,
      last_activity_at: row.last_activity_at || row.created_at,
      created_at: row.created_at,
      notes: row.notes,
    }));
  },

  async get(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      company: data.company || "",
      title: data.title || "",
      email: data.email || "",
      phone: data.phone || "",
      status: data.status,
      campaign_id: data.campaign_id,
      owner_id: data.owner_id,
      confidence_score: data.confidence_score ? Number(data.confidence_score) : null,
      confidence_tier: data.confidence_tier,
      last_activity_at: data.last_activity_at || data.created_at,
      created_at: data.created_at,
      notes: data.notes,
    };
  },

  async create(data: Partial<Lead>): Promise<Lead> {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new Error("No active organization found.");

    const payload = {
      organization_id: orgId,
      name: data.name ?? "New Lead",
      company: data.company ?? "",
      title: data.title ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      status: data.status ?? "new",
      campaign_id: data.campaign_id ?? null,
      owner_id: data.owner_id ?? null,
      notes: data.notes ?? null,
    };

    const { data: created, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("*")
      .single();

    if (error || !created) {
      console.error("Error creating lead:", error);
      throw new Error(error?.message || "Failed to create lead.");
    }

    return {
      id: created.id,
      name: created.name,
      company: created.company || "",
      title: created.title || "",
      email: created.email || "",
      phone: created.phone || "",
      status: created.status,
      campaign_id: created.campaign_id,
      owner_id: created.owner_id,
      confidence_score: created.confidence_score ? Number(created.confidence_score) : null,
      confidence_tier: created.confidence_tier,
      last_activity_at: created.last_activity_at || created.created_at,
      created_at: created.created_at,
      notes: created.notes,
    };
  },

  async update(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const { data: updated, error } = await supabase
      .from("leads")
      .update({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.company !== undefined ? { company: data.company } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.campaign_id !== undefined ? { campaign_id: data.campaign_id } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updated) return null;

    return {
      id: updated.id,
      name: updated.name,
      company: updated.company || "",
      title: updated.title || "",
      email: updated.email || "",
      phone: updated.phone || "",
      status: updated.status,
      campaign_id: updated.campaign_id,
      owner_id: updated.owner_id,
      confidence_score: updated.confidence_score ? Number(updated.confidence_score) : null,
      confidence_tier: updated.confidence_tier,
      last_activity_at: updated.last_activity_at || updated.created_at,
      created_at: updated.created_at,
      notes: updated.notes,
    };
  },

  async insertBatch(leadsToInsert: Array<{
    name: string;
    email: string;
    phone?: string;
    company?: string;
    source?: string;
  }>): Promise<{ insertedCount: number; error: Error | null }> {
    const orgId = await getActiveOrgId();
    if (!orgId) throw new Error("No active organization found.");

    const records = leadsToInsert.map(l => ({
      organization_id: orgId,
      name: l.name,
      email: l.email,
      phone: l.phone || "",
      company: l.company || "",
      source: l.source || null,
      status: "new",
    }));

    // Insert in batches of 100 to prevent payload limits
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("leads").insert(chunk);
      if (error) {
        console.error("Batch insert error:", error);
        return { insertedCount: inserted, error: new Error(error.message) };
      }
      inserted += chunk.length;
    }

    return { insertedCount: inserted, error: null };
  },
};

