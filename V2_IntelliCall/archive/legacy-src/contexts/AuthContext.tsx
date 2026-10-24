import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface OrganizationState {
  id: string;
  name: string;
  slug: string;
  onboarding_completed: boolean;
  onboarding_progress: Record<string, any>;
  role?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_initials?: string;
  avatar_url?: string;
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  organization: OrganizationState | null;
  onboardingCompleted: boolean;
  onboardingProgress: Record<string, any>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; unconfirmed?: boolean }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; user: SupabaseUser | null; session: Session | null }>;
  verifyOtp: (email: string, token: string, type?: "signup" | "email" | "recovery") => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshOrgState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<OrganizationState | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Organization & Profile for authenticated user
  const fetchOrgAndProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_initials, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
        const fallbackName = userEmail ? userEmail.split("@")[0] : "User";
        setProfile({
          id: userId,
          name: fallbackName,
          email: userEmail || "",
          avatar_initials: fallbackName.slice(0, 2).toUpperCase(),
        });
      }

      // 2. Fetch Organization membership
      const { data: membershipData, error: memErr } = await supabase
        .from("organization_members")
        .select(`
          role,
          status,
          organization:organization_id (
            id,
            name,
            slug,
            onboarding_completed,
            onboarding_progress
          )
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (!memErr && membershipData && membershipData.organization) {
        const org = membershipData.organization as any;
        setOrganization({
          id: org.id,
          name: org.name,
          slug: org.slug,
          onboarding_completed: Boolean(org.onboarding_completed),
          onboarding_progress: org.onboarding_progress || {},
          role: membershipData.role,
        });
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error("Error loading user profile or organization:", err);
      setOrganization(null);
    }
  }, []);

  const refreshOrgState = useCallback(async () => {
    if (!user) return;
    await fetchOrgAndProfile(user.id, user.email);
  }, [user, fetchOrgAndProfile]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        await fetchOrgAndProfile(initSession.user.id, initSession.user.email);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes across tabs and sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setOrganization(null);
          setLoading(false);
        } else if (newSession?.user) {
          await fetchOrgAndProfile(newSession.user.id, newSession.user.email);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrgAndProfile]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Detect unconfirmed email vs wrong credentials
        if (error.message.toLowerCase().includes("email not confirmed")) {
          return { error, unconfirmed: true };
        }
        return { error: new Error("Invalid email or password. Please try again.") };
      }

      if (data.user) {
        await fetchOrgAndProfile(data.user.id, data.user.email);
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign in failed.") };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const trimmedEmail = email.trim();
      const userName = name?.trim() || trimmedEmail.split("@")[0];

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: userName,
            name: userName,
          },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          return { error: new Error("An account with this email already exists. Please sign in."), user: null, session: null };
        }
        return { error, user: null, session: null };
      }

      return { error: null, user: data.user, session: data.session };
    } catch (err: any) {
      return { error: new Error(err.message || "Sign up failed."), user: null, session: null };
    }
  };

  // Verify OTP
  const verifyOtp = async (email: string, token: string, type: "signup" | "email" | "recovery" = "signup") => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type,
      });

      if (error) {
        return { error: new Error(error.message || "Invalid or expired verification code.") };
      }

      if (data.user) {
        await fetchOrgAndProfile(data.user.id, data.user.email);
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "OTP verification failed.") };
    }
  };

  // Resend Confirmation Email
  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to resend confirmation email.") };
    }
  };

  // Request Password Reset
  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) {
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to request password reset.") };
    }
  };

  // Update Password (when on reset-password recovery session)
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { error };
      }
      // Explicitly sign out so user logs in with their new password cleanly
      await supabase.auth.signOut();
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || "Failed to update password.") };
    }
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setOrganization(null);
  };

  const onboardingCompleted = Boolean(organization?.onboarding_completed);
  const onboardingProgress = organization?.onboarding_progress || {};

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        organization,
        onboardingCompleted,
        onboardingProgress,
        loading,
        signIn,
        signUp,
        verifyOtp,
        resendConfirmation,
        requestPasswordReset,
        updatePassword,
        signOut,
        refreshOrgState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
