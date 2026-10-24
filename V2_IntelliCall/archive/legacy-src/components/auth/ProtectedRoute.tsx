import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function ProtectedRoute() {
  const { session, user, organization, onboardingCompleted, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-action-primary)] border-t-transparent animate-spin" />
          <span className="text-[12px] font-mono text-[var(--color-text-muted)]">
            Loading workspace…
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to sign in, preserving destination
  if (!session || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Authenticated but no organization or onboarding incomplete -> redirect to onboarding
  if (!organization || !onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { session, user, organization, onboardingCompleted, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-action-primary)] border-t-transparent animate-spin" />
          <span className="text-[12px] font-mono text-[var(--color-text-muted)]">
            Loading onboarding…
          </span>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to sign in
  if (!session || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Onboarding already complete -> never show onboarding again, route to dashboard
  if (organization && onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
