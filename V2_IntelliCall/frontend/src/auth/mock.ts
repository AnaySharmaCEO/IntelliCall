import type { AuthAdapter, AuthState, AuthUser, AuthOrganization } from './adapter';

const DEMO_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'anay@apexfinancial.com',
  name: 'Anay Sharma',
  avatarInitials: 'AS',
};

const DEMO_ORG: AuthOrganization = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'Apex Financial Services',
  slug: 'apex-financial',
  role: 'admin',
  onboardingCompleted: true,
  onboardingProgress: { completed_steps: ['profile', 'agent', 'campaign'] },
};

export class MockAuthAdapter implements AuthAdapter {
  private state: AuthState = {
    user: DEMO_USER,
    organization: DEMO_ORG,
    token: 'mock-jwt-token-apex-financial',
    loading: false,
    error: null,
  };

  private listeners = new Set<(state: AuthState) => void>();

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

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  async signIn(email: string): Promise<{ error: Error | null }> {
    this.state = {
      ...this.state,
      user: {
        ...DEMO_USER,
        email,
        name: email.split('@')[0],
      },
      token: 'mock-jwt-token',
      error: null,
    };
    this.notify();
    return { error: null };
  }

  async signUp(email: string, _password: string, name?: string): Promise<{ error: Error | null }> {
    this.state = {
      ...this.state,
      user: {
        id: 'mock-user-id',
        email,
        name: name || email.split('@')[0],
        avatarInitials: (name || 'U').slice(0, 2).toUpperCase(),
      },
      organization: DEMO_ORG,
      token: 'mock-jwt-token',
      error: null,
    };
    this.notify();
    return { error: null };
  }

  async signOut(): Promise<void> {
    this.state = {
      user: null,
      organization: null,
      token: null,
      loading: false,
      error: null,
    };
    this.notify();
  }

  async refresh(): Promise<void> {
    this.notify();
  }

  async requestPasswordReset(email: string): Promise<{ error: Error | null }> {
    if (!email || !email.trim().includes('@')) {
      return { error: new Error('Please enter a valid email address.') };
    }
    return { error: null };
  }

  async updatePassword(password: string): Promise<{ error: Error | null }> {
    if (!password || password.length < 8) {
      return { error: new Error('Password must be at least 8 characters long.') };
    }
    return { error: null };
  }
}
