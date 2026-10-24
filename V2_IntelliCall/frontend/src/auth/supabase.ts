import type { AuthAdapter, AuthState, AuthUser, AuthOrganization } from './adapter';
import type { Role } from '../contracts/enums';
import { supabase } from '../lib/supabase';

export class SupabaseAuthAdapter implements AuthAdapter {
  private state: AuthState = {
    user: null,
    organization: null,
    token: null,
    loading: true,
    error: null,
  };

  private listeners = new Set<(state: AuthState) => void>();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await this.loadUserAndOrg(session.user.id, session.user.email, session.access_token);
      } else {
        this.updateState({ loading: false, user: null, organization: null, token: null });
      }
    } catch (err: unknown) {
      this.updateState({
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.updateState({
          user: null,
          organization: null,
          token: null,
          loading: false,
          error: null,
        });
      } else if (session?.user) {
        await this.loadUserAndOrg(session.user.id, session.user.email, session.access_token);
      }
    });
  }

  private async loadUserAndOrg(userId: string, email?: string, token?: string) {
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_initials, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      const user: AuthUser = {
        id: userId,
        email: email || profile?.email || '',
        name: profile?.name || email?.split('@')[0] || 'User',
        avatarUrl: profile?.avatar_url,
        avatarInitials: profile?.avatar_initials || (profile?.name || email || 'U').slice(0, 2).toUpperCase(),
      };

      // 2. Fetch Organization membership
      const { data: membershipData } = await supabase
        .from('organization_members')
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
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      let organization: AuthOrganization | null = null;
      if (membershipData && membershipData.organization) {
        const orgRecord = Array.isArray(membershipData.organization)
          ? membershipData.organization[0]
          : membershipData.organization;

        organization = {
          id: orgRecord.id,
          name: orgRecord.name,
          slug: orgRecord.slug,
          role: (membershipData.role as Role) || 'viewer',
          onboardingCompleted: Boolean(orgRecord.onboarding_completed),
          onboardingProgress: (orgRecord.onboarding_progress as Record<string, unknown>) || {},
        };
      }

      this.updateState({
        user,
        organization,
        token: token || null,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      this.updateState({
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  private updateState(partial: Partial<AuthState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null; unconfirmed?: boolean }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { error, unconfirmed: true };
        }
        return { error: new Error('Invalid email or password. Please try again.') };
      }

      if (data.session?.user) {
        await this.loadUserAndOrg(data.session.user.id, data.session.user.email, data.session.access_token);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<{ error: Error | null }> {
    try {
      const trimmedEmail = email.trim();
      const userName = name?.trim() || trimmedEmail.split('@')[0];

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: userName,
            name: userName,
          },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          return { error: new Error('An account with this email already exists. Please sign in.') };
        }
        return { error };
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    this.updateState({
      user: null,
      organization: null,
      token: null,
      loading: false,
      error: null,
    });
  }

  async requestPasswordReset(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });
      return { error: error || null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error };
      await supabase.auth.signOut();
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async verifyOtp(email: string, token: string, type: 'signup' | 'email' | 'recovery' = 'signup'): Promise<{ error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type,
      });
      if (error) return { error: new Error(error.message || 'Invalid or expired verification code.') };
      if (data.session?.user) {
        await this.loadUserAndOrg(data.session.user.id, data.session.user.email, data.session.access_token);
      }
      return { error: null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async resendConfirmation(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });
      return { error: error || null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  async refresh(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await this.loadUserAndOrg(session.user.id, session.user.email, session.access_token);
    }
  }
}
