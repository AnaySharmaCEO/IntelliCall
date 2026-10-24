import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { AuthAdapter, AuthState, AuthUser, AuthOrganization } from './adapter';
import { SupabaseAuthAdapter } from './supabase';
import { MockAuthAdapter } from './mock';
import { hasPermission, type Permission } from '../lib/permissions';
import type { Role } from '../contracts/enums';

interface AuthContextValue extends AuthState {
  signIn: AuthAdapter['signIn'];
  signUp: AuthAdapter['signUp'];
  signOut: AuthAdapter['signOut'];
  refresh: AuthAdapter['refresh'];
  refreshOrgState: AuthAdapter['refresh'];
  requestPasswordReset: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  isAuthenticated: boolean;
  role: Role | null;
  onboardingCompleted: boolean;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decide adapter singleton
const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true';
export const authAdapter: AuthAdapter = useMock
  ? new MockAuthAdapter()
  : new SupabaseAuthAdapter();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => authAdapter.getState());

  useEffect(() => {
    return authAdapter.subscribe(setState);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = state.organization?.role ?? null;
    const onboardingCompleted = Boolean(state.organization?.onboardingCompleted);
    return {
      ...state,
      signIn: (email, pass) => authAdapter.signIn(email, pass),
      signUp: (email, pass, name) => authAdapter.signUp(email, pass, name),
      signOut: () => authAdapter.signOut(),
      refresh: () => authAdapter.refresh(),
      refreshOrgState: () => authAdapter.refresh(),
      requestPasswordReset: (email) =>
        authAdapter.requestPasswordReset
          ? authAdapter.requestPasswordReset(email)
          : Promise.resolve({
              error: new Error('Password reset is not supported by the current authentication provider.'),
            }),
      updatePassword: (pass) =>
        authAdapter.updatePassword
          ? authAdapter.updatePassword(pass)
          : Promise.resolve({
              error: new Error('Password update is not supported by the current authentication provider.'),
            }),
      isAuthenticated: Boolean(state.user && state.token),
      role,
      onboardingCompleted,
      can: (permission: Permission) => hasPermission(role, permission),
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { AuthUser, AuthOrganization, AuthState, AuthAdapter };
