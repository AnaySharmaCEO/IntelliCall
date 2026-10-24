import type { Role } from '../contracts/enums';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  avatarInitials?: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
  role: Role;
  onboardingCompleted: boolean;
  onboardingProgress: Record<string, unknown>;
}

export interface AuthState {
  user: AuthUser | null;
  organization: AuthOrganization | null;
  token: string | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthAdapter {
  getState(): AuthState;
  subscribe(callback: (state: AuthState) => void): () => void;
  signIn(email: string, password: string): Promise<{ error: Error | null; unconfirmed?: boolean }>;
  signUp(email: string, password: string, name?: string): Promise<{ error: Error | null }>;
  signOut(): Promise<void>;
  requestPasswordReset?(email: string): Promise<{ error: Error | null }>;
  updatePassword?(password: string): Promise<{ error: Error | null }>;
  verifyOtp?(email: string, token: string, type?: 'signup' | 'email' | 'recovery'): Promise<{ error: Error | null }>;
  resendConfirmation?(email: string): Promise<{ error: Error | null }>;
  refresh(): Promise<void>;
}
