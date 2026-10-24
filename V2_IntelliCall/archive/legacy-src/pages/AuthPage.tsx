// AuthPage — Authentication for IntelliCall.
// Email/Password sign up -> directly authenticates into /onboarding (confirm email disabled in Supabase).
// Subsequent sign ins -> email/password authentication into /dashboard (or /onboarding if not completed).
// Password reset via emailed recovery link.
// (OTP verification system is commented out on the backside for future use).

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type AuthMode = "signin" | "signup" | "forgot-password" | "reset-password";
// type AuthModeWithOtp = AuthMode | "confirm-email" | "otp"; // [BACKSIDE OTP PRESERVED]

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    user,
    session,
    organization,
    onboardingCompleted,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    // verifyOtp, // [BACKSIDE OTP PRESERVED]
    // resendConfirmation, // [BACKSIDE OTP PRESERVED]
  } = useAuth();

  const paramMode = searchParams.get("mode") as AuthMode;
  const initialMode: AuthMode =
    paramMode === "signup"
      ? "signup"
      : paramMode === "forgot-password"
      ? "forgot-password"
      : paramMode === "reset-password"
      ? "reset-password"
      : "signin";

  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  /* [BACKSIDE OTP SYSTEM PRESERVED FOR FUTURE USE]
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpResendCountdown, setOtpResendCountdown] = useState(30);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const cleanChar = val.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = cleanChar;
    setOtp(nextOtp);
    if (cleanChar && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    const { error: otpErr } = await verifyOtp(email, fullOtp, "signup");
    setLoading(false);
    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    toast("Email verified successfully.");
    navigate("/onboarding");
  };
  */

  // Recovery token state
  const [recoverySessionValid, setRecoverySessionValid] = useState<boolean | null>(null);

  // Redirect if already authenticated and not in reset-password flow
  useEffect(() => {
    if (session && user && mode !== "reset-password") {
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== "/signin" && from !== "/signup" && from !== "/auth") {
        navigate(from, { replace: true });
      } else if (!organization || !onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [session, user, organization, onboardingCompleted, mode, navigate, location.state]);

  // Sync mode changes with search params
  useEffect(() => {
    if (paramMode && paramMode !== mode) {
      setMode(paramMode);
    }
  }, [paramMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessNotice(null);
    setSearchParams({ mode: newMode });
  };

  // Check recovery session on reset-password mode
  useEffect(() => {
    if (mode === "reset-password") {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession) {
          setRecoverySessionValid(true);
        } else {
          const hash = window.location.hash;
          if (hash && hash.includes("type=recovery")) {
            setRecoverySessionValid(true);
          } else {
            setRecoverySessionValid(false);
          }
        }
      });
    }
  }, [mode]);

  // ==========================================================================
  // SIGN IN (Direct Password-based)
  // ==========================================================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    const { error: signInErr } = await signIn(email, password);
    setLoading(false);

    if (signInErr) {
      setError(signInErr.message);
      return;
    }

    toast("Signed in successfully.");
  };

  // ==========================================================================
  // SIGN UP (Direct Password-based -> Immediate Onboarding)
  // ==========================================================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: signUpErr, session: newSession } = await signUp(trimmedEmail, password, name);

    if (signUpErr) {
      setLoading(false);
      setError(signUpErr.message);
      return;
    }

    // If session was not immediately returned, sign in directly with password
    if (!newSession) {
      const { error: signInErr } = await signIn(trimmedEmail, password);
      if (signInErr) {
        setLoading(false);
        setError(signInErr.message);
        return;
      }
    }

    setLoading(false);
    toast("Account created successfully. Let's set up your workspace.");
    navigate("/onboarding");
  };

  // ==========================================================================
  // PASSWORD RESET REQUEST
  // ==========================================================================
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const { error: resetErr } = await requestPasswordReset(trimmedEmail);
    setLoading(false);

    if (resetErr) {
      setError("Unable to process password reset. Please verify the email and try again.");
      return;
    }

    setSuccessNotice("Password reset instructions have been sent to " + trimmedEmail);
  };

  // ==========================================================================
  // SET NEW PASSWORD (from recovery link)
  // ==========================================================================
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmNewPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateErr } = await updatePassword(newPassword);
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message || "Failed to update password. The reset link may be expired.");
      return;
    }

    toast("Password updated successfully. Please sign in with your new password.");
    switchMode("signin");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Brand header */}
      <div className="mb-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[20px] font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span>IntelliCall</span>
        </Link>
        <p className="text-[12px] font-mono mt-1" style={{ color: "var(--color-text-muted)" }}>
          Explainable outbound AI qualification
        </p>
      </div>

      {/* Main Card */}
      <div
        className="w-full max-w-[440px] rounded-[var(--radius-lg)] p-8 relative"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Error notification */}
        {error && (
          <div
            className="p-3 mb-4 rounded-[var(--radius-sm)] text-[12px] flex items-start gap-2.5"
            style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
          >
            <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success notification */}
        {successNotice && (
          <div
            className="p-3 mb-4 rounded-[var(--radius-sm)] text-[12px] flex items-center gap-2"
            style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successNotice}</span>
          </div>
        )}

        {/* MODE: Sign In or Sign Up */}
        {(mode === "signin" || mode === "signup") && (
          <>
            {/* Mode switch tabs */}
            <div className="flex rounded-[var(--radius-sm)] p-1 bg-[var(--color-bg-sunken)] mb-6">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={[
                  "flex-1 py-1.5 text-[13px] font-semibold rounded-[var(--radius-sm)] transition-all",
                  mode === "signin"
                    ? "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={[
                  "flex-1 py-1.5 text-[13px] font-semibold rounded-[var(--radius-sm)] transition-all",
                  mode === "signup"
                    ? "bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
                ].join(" ")}
              >
                Sign up
              </button>
            </div>

            {/* DIRECT PASSWORD-BASED SIGN IN */}
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <Input
                  label="Work email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Password</label>
                    <button
                      type="button"
                      onClick={() => switchMode("forgot-password")}
                      className="text-[12px] hover:underline"
                      style={{ color: "var(--color-action-primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-[13px] focus:outline-none focus:border-[var(--color-action-primary)] transition-colors"
                  />
                </div>
                <Button type="submit" size="lg" loading={loading} className="w-full justify-center mt-2">
                  Sign in
                </Button>
              </form>
            ) : (
              /* DIRECT SIGN UP WITH PASSWORD -> ONBOARDING */
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <Input
                  label="Your name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <Input
                  label="Work email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Input
                  label="Create password"
                  type="password"
                  required
                  hint="Minimum 8 characters"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <Button type="submit" size="lg" loading={loading} className="w-full justify-center mt-2">
                  Create account & Continue →
                </Button>
              </form>
            )}
          </>
        )}

        {/* 
        // ====================================================================
        // [BACKSIDE OTP & CONFIRM EMAIL UI PRESERVED FOR FUTURE RE-ENABLING]
        // ====================================================================
        // {mode === "confirm-email" && (
        //   <div className="flex flex-col gap-4 text-center">
        //     <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center bg-[var(--color-action-secondary-bg)] text-[var(--color-action-primary)]">
        //       <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
        //     </div>
        //     <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Check your inbox</h2>
        //     <p className="text-[13px] text-[var(--color-text-secondary)]">We sent a confirmation link to <strong>{email}</strong>.</p>
        //     <Button type="button" variant="secondary" onClick={handleResendConfirmation}>Resend confirmation email</Button>
        //   </div>
        // )}
        //
        // {mode === "otp" && (
        //   <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
        //     <div className="flex justify-between gap-2">
        //       {otp.map((digit, idx) => (
        //         <input key={idx} ref={el => (otpInputs.current[idx] = el)} maxLength={1} value={digit} onChange={e => handleOtpChange(idx, e.target.value)} className="w-12 h-13 text-center text-[20px] font-mono" />
        //       ))}
        //     </div>
        //     <Button type="submit">Verify Code</Button>
        //   </form>
        // )}
        */}

        {/* MODE: Forgot Password */}
        {mode === "forgot-password" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-1">
                Reset your password
              </h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Enter your work email and we will send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleRequestPasswordReset} className="flex flex-col gap-4 mt-2">
              <Input
                label="Work email"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" loading={loading} className="w-full justify-center">
                Send reset link
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-[12px] hover:underline"
                  style={{ color: "var(--color-action-primary)", background: "none", border: "none", cursor: "pointer" }}
                >
                  ← Back to sign in
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODE: Reset Password (via emailed link) */}
        {mode === "reset-password" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-1">
                Set a new password
              </h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Create a strong password of at least 8 characters.
              </p>
            </div>

            {recoverySessionValid === false ? (
              <div className="text-center py-4">
                <p className="text-[13px] text-[var(--color-error)] mb-4">
                  This password reset link is invalid or has expired.
                </p>
                <Button onClick={() => switchMode("forgot-password")} variant="secondary" className="w-full justify-center">
                  Request a new reset link
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 mt-2">
                <Input
                  label="New password"
                  type="password"
                  required
                  hint="Minimum 8 characters"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                />
                <Button type="submit" size="lg" loading={loading} className="w-full justify-center">
                  Update password
                </Button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="text-[12px] hover:underline"
                    style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Cancel and return to sign in
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Back to landing page */}
      <p className="mt-8 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
        <Link to="/" className="hover:underline" style={{ color: "var(--color-action-primary)" }}>
          ← Back to IntelliCall home
        </Link>
      </p>
    </div>
  );
}
