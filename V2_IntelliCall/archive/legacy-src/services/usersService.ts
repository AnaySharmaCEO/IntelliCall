import { supabase } from "../lib/supabase";
import { getActiveOrgId } from "./supabaseClientHelper";
import type { User } from "../types";

export const usersService = {
  async list(): Promise<User[]> {
    const orgId = await getActiveOrgId();
    if (!orgId) return [];

    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        user_id,
        profiles (
          id,
          name,
          email,
          avatar_initials
        )
      `)
      .eq("organization_id", orgId)
      .eq("status", "active");

    if (error || !data) return [];

    return data
      .filter((row: any) => row.profiles)
      .map((row: any) => ({
        id: row.profiles.id,
        name: row.profiles.name,
        email: row.profiles.email || "",
        avatar_initials: row.profiles.avatar_initials || "U",
        organization_id: orgId,
      }));
  },

  async getCurrent(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const orgId = await getActiveOrgId();
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const name = profile?.name || user.email?.split("@")[0] || "User";
    return {
      id: user.id,
      name,
      email: user.email || "",
      avatar_initials: profile?.avatar_initials || name.slice(0, 2).toUpperCase(),
      organization_id: orgId || "",
    };
  },
};

