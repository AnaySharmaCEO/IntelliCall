import { supabase } from "../lib/supabase";

/**
 * Helper to resolve the active organization ID for queries.
 * Queries organization_members to find the active organization for the current user.
 */
export async function getActiveOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.organization_id;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
