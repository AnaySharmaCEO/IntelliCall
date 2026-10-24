// IntelliCall — Landing Page
// Redesigned with exact Pace UI AI SaaS reference:
// - Near-black surfaces, subtle grid/radial lighting, refined borders
// - Preserves all copy from LANDING_PAGE_COPY.md verbatim
// - Preserves all live interactive showcase components and modal functionality
// - Full light and dark theme synchronization

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  Radio,
  Sliders,
  Clock,
  Zap,
  Lock,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";

import ConversationStatePanel from "../../components/shared/ConversationStatePanel";
import AIStateBanner from "../../components/shared/AIStateBanner";
import EvidenceSnippet from "../../components/shared/EvidenceSnippet";
import EvidenceThread from "../../components/shared/EvidenceThread";
import ConfidenceIndicator from "../../components/shared/ConfidenceIndicator";
import DecisionCard from "../../components/shared/DecisionCard";
import DecisionTrace from "../../components/shared/DecisionTrace";
import { CalendlyModal, EarlyAccessModal } from "../../components/shared/ActionCard";
import Button from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";

import {
  landingMockConversationState,
  landingMockEvidenceSnippet,
  landingMockEvidenceThread,
  landingMockTraceSteps,
  landingMockDecision,
} from "../../mock";

export default function LandingPage() {
  const navigate = useNavigate();

  // Theme state synced with documentElement data-theme and ic-theme in localStorage
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("ic-theme");
    return stored === "light" ? "light" : "dark";
  });

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ic-theme", next);
    setThemeState(next);
    window.dispatchEvent(new Event("theme-change"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const onThemeChange = () => {
      const stored = localStorage.getItem("ic-theme");
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
      }
    };
    window.addEventListener("theme-change", onThemeChange);
    window.addEventListener("storage", onThemeChange);
    return () => {
      window.removeEventListener("theme-change", onThemeChange);
      window.removeEventListener("storage", onThemeChange);
    };
  }, [theme]);

  // Auth state check
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("intellicall_auth_token")));
  }, []);

  // Modal dialog states
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);

  // FAQ accordion state — single item open at once
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // IntersectionObserver state for Section 3 showcase
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [showcaseLoaded, setShowcaseLoaded] = useState(false);
  const showcaseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShowcaseVisible(true);
          const timer = setTimeout(() => {
            setShowcaseLoaded(true);
          }, 240);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.15 }
    );

    if (showcaseRef.current) {
      observer.observe(showcaseRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const faqItems = [
    {
      q: "Does this replace my SDR team?",
      a: "No — it runs the qualification and follow-up conversations your team doesn't have time to make consistently, and hands off to your team (or books directly) once a lead is ready.",
    },
    {
      q: "How do I know the AI's decisions are accurate?",
      a: "Every decision includes the transcript evidence it was based on. You can review any decision — not just the ones flagged for review — and see the exact reasoning.",
    },
    {
      q: "What happens on calls the AI isn't confident about?",
      a: "They route to your review queue instead of executing automatically. You set the confidence threshold per campaign.",
    },
    {
      q: "Is my data used to train a shared model?",
      a: "No. Your call transcripts, CRM leads, and proprietary qualification signals are isolated to your organization's private environment. We do not use customer conversation data to train foundational or shared public models.",
    },
    {
      q: "How long does setup take?",
      a: "Configuring an agent and launching a campaign takes minutes, not a multi-week onboarding.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors duration-200 selection:bg-white/20 selection:text-white relative overflow-hidden">
      {/* ── Background Grid & Radial Glow ──────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
        <div className="pace-grid-bg absolute inset-0 opacity-40" />
      </div>

      {/* ── Navigation (Pace UI Floating / Sticky Navbar) ────────────── */}
      <header className="sticky top-0 z-50 h-16 px-6 md:px-12 flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-white/10 group-hover:scale-105 transition-transform">
              IC
            </div>
            <span className="font-bold text-[16px] tracking-tight text-[var(--color-text-primary)]">
              IntelliCall
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-[var(--color-text-secondary)]">
            <a href="#product" className="px-3 py-1.5 rounded-lg hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="px-3 py-1.5 rounded-lg hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
              How it works
            </a>
            <a href="#early-access" className="px-3 py-1.5 rounded-lg hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
              Early access
            </a>
            <a href="#faq" className="px-3 py-1.5 rounded-lg hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
              FAQ
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)] transition-colors cursor-pointer"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 transition-colors"
            >
              Go to app →
            </Link>
          ) : (
            <Link
              to="/signin"
              className="text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 transition-colors"
            >
              Sign in
            </Link>
          )}

          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/signup")}
            className="h-9 px-4 rounded-full bg-white text-zinc-950 font-semibold text-[13px] hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] flex items-center justify-center cursor-pointer"
          >
            {isAuthenticated ? "Dashboard" : "Get started"}
          </button>
        </div>
      </header>

      {/* ── Hero Section (Pace UI Hero with Pill Badge & Floating Preview Cards) ─ */}
      <section className="relative z-10 pt-20 pb-20 px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Top Eyebrow Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[var(--color-bg-surface)]/80 backdrop-blur-md mb-8 shadow-xs">
          <Sparkles size={13} className="text-indigo-400" />
          <span className="text-[12px] font-medium tracking-wide text-zinc-300">
            Powered by Resonology AI
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.08] text-[var(--color-text-primary)] mb-6">
          Know why the AI made every call it made.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-10">
          IntelliCall runs your outbound conversations, qualifies leads, and books meetings — and shows you the exact evidence behind every decision, before it acts or after you review it.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-5">
          <button
            onClick={() => navigate("/signup")}
            className="h-11 px-7 rounded-full bg-white text-zinc-950 font-semibold text-[14px] hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer"
          >
            <span>Get started</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={() => setCalendlyOpen(true)}
            className="h-11 px-6 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-medium text-[14px] hover:bg-[var(--color-bg-sunken)] hover:border-zinc-500 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play size={13} className="text-zinc-400 fill-zinc-400" />
            <span>Book a demo</span>
          </button>
        </div>

        {/* Supporting line */}
        <p className="text-[13px] text-[var(--color-text-muted)] font-medium">
          No credit card to start. See a real decision trace in your first session.
        </p>

        {/* Floating Preview Cards (Pace UI Style) */}
        <div className="w-full mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          {/* Left Hero Card */}
          <div className="p-4 rounded-xl bg-[var(--color-bg-surface)]/70 backdrop-blur-md border border-[var(--color-border-subtle)] text-left flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Autonomous Gate</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                  94.2% PASS
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Target confidence achieved &bull; Instant calendar booking
              </p>
            </div>
          </div>

          {/* Right Hero Card */}
          <div className="p-4 rounded-xl bg-[var(--color-bg-surface)]/70 backdrop-blur-md border border-[var(--color-border-subtle)] text-left flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <PhoneCall size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">Voice Turnaround</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-bold">
                  280ms TTFB
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Resonology audio stream &bull; Sub-50ms barge-in
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof / Client Logo Strip */}
        <div className="mt-16 pt-10 border-t border-[var(--color-border-subtle)]/70 w-full max-w-4xl">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] mb-6">
            Trusted for mission-critical voice operations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> Microsoft Azure Voice
            </span>
            <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> OpenAI Realtime
            </span>
            <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Anthropic Claude 3.5
            </span>
            <span className="font-semibold text-sm tracking-tight text-[var(--color-text-primary)] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> NVIDIA Riva
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 1: The Problem (Pace UI 3-Card Bento Grid) ────────── */}
      <section id="product" className="relative z-10 py-24 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mb-16 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
              Auditability
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
              Most AI dialers give you an outcome. Not a reason.
            </h2>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
              &quot;Qualified&quot; or &quot;not interested&quot; isn&apos;t enough when you&apos;re the one accountable for the pipeline. If you can&apos;t see what the AI heard, what it flagged, and why it made the call it made, you can&apos;t trust it — and you can&apos;t improve it.
            </p>
          </div>

          {/* 3 Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-6 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-5">
                  <Radio size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  No evidence trail.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  A label with no transcript reasoning behind it.
                </p>
              </div>

              {/* Graphic widget */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span>TRANSCRIPT RAW STREAM</span>
                  <span className="text-red-400">UNVERIFIED</span>
                </div>
                <div className="p-2 rounded bg-[var(--color-bg-primary)] text-[11px] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                  &ldquo;Yeah maybe next quarter once we finish budget...&rdquo;
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                  <span>Legacy Dialer:</span>
                  <span className="text-red-400 font-bold">Lost Outcome Flag</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-6 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                  <Sliders size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  No review point.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Low-confidence calls act the same as high-confidence ones.
                </p>
              </div>

              {/* Graphic widget */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                  <span>DECISION CONFIDENCE</span>
                  <span className="text-amber-400 font-mono font-bold">58% UNCERTAIN</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
                  <div className="h-full bg-amber-500 w-[58%]" />
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[var(--color-text-muted)]">
                  <span>Autonomous Action:</span>
                  <span className="text-amber-400 font-semibold">Executes Blindly</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-6 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Layers size={20} />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  No audit path.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  When a decision is wrong, no way to see where it went wrong.
                </p>
              </div>

              {/* Graphic widget */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                  <span>AUDIT TRACE LOG</span>
                  <span className="text-zinc-500">CORRUPTED</span>
                </div>
                <div className="p-2 rounded bg-[var(--color-bg-primary)] text-[11px] text-[var(--color-text-muted)] font-mono border border-[var(--color-border-subtle)]">
                  [Error: Missing contextual reasoning trace node]
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                  <span>Root Cause:</span>
                  <span className="text-red-400 font-bold">Black Box Model</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Live Decision Engine Showcase ("How it works") ─ */}
      <section
        id="how-it-works"
        ref={showcaseRef}
        className="relative z-10 py-24 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/30"
      >
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
              Live Decision Engine
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-3">
              Every decision comes with its evidence.
            </h2>
            <p className="text-base text-[var(--color-text-secondary)]">
              This isn&apos;t a mockup — it&apos;s the actual interface, with sample data.
            </p>
          </div>

          {/* 4 Feature Blocks */}
          <div className="space-y-16">
            {/* Block 1 */}
            <div className="p-8 md:p-10 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-block">
                  01 · Live Execution
                </span>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  The agent talks to the lead, following the campaign strategy and script you set.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Real-time multi-turn dialogue with continuous acoustic sentiment evaluation and speech barge-in.
                </p>
              </div>

              <div className="lg:col-span-7">
                {!showcaseLoaded ? (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3">
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="100%" height={60} />
                    <Skeleton width="80%" height={40} />
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] shadow-sm">
                    <AIStateBanner
                      state="CONNECTED"
                      detail="Mid-Market RevOps Outreach · 02:22 duration"
                    />
                    <ConversationStatePanel state={landingMockConversationState} />
                  </div>
                )}
              </div>
            </div>

            {/* Block 2 */}
            <div className="p-8 md:p-10 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
              <div className="lg:col-span-7 order-2 lg:order-1">
                {!showcaseLoaded ? (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3">
                    <Skeleton width="30%" height={20} />
                    <Skeleton width="100%" height={70} />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-4 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                        Direct Evidence Extraction
                      </p>
                      <EvidenceSnippet
                        quote={landingMockEvidenceSnippet.quote}
                        signal={landingMockEvidenceSnippet.signal}
                        weight={landingMockEvidenceSnippet.weight}
                      />
                    </div>
                    <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                      <p className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--color-text-muted)] mb-2">
                        Reasoning Chain
                      </p>
                      <EvidenceThread steps={landingMockEvidenceThread} />
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-3 order-1 lg:order-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">
                  02 · Evidence Extraction
                </span>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  It pulls the specific lines that mattered — not a summary, the actual quotes.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Verifiable timestamps and exact audio phrase alignments eliminate AI hallucination doubts.
                </p>
              </div>
            </div>

            {/* Block 3 */}
            <div className="p-8 md:p-10 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-block">
                  03 · Transparent Thresholds
                </span>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  Confidence is shown plainly. Above your threshold, it acts. Below it, it waits for you.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Automated routing to supervisor review queues ensures human oversight on high-stakes deals.
                </p>
              </div>

              <div className="lg:col-span-7">
                {!showcaseLoaded ? (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3">
                    <Skeleton width="50%" height={24} />
                    <Skeleton width="100%" height={60} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] shadow-sm">
                      <div className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
                        Campaign Autonomous Gate
                      </div>
                      <ConfidenceIndicator score={82} tier="high" variant="detail" threshold={75} />
                    </div>
                    <DecisionCard decision={landingMockDecision} threshold={75} />
                  </div>
                )}
              </div>
            </div>

            {/* Block 4 */}
            <div className="p-8 md:p-10 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
              <div className="lg:col-span-7 order-2 lg:order-1">
                {!showcaseLoaded ? (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3">
                    <Skeleton width="40%" height={20} />
                    <Skeleton width="100%" height={100} />
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                      <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                        Decision Audit Trace
                      </span>
                      <span className="text-[11px] font-mono text-[var(--color-success)] font-bold">
                        VERIFIED 82% CONFIDENCE
                      </span>
                    </div>
                    <DecisionTrace steps={landingMockTraceSteps} defaultOpen={true} />
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-3 order-1 lg:order-2">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block">
                  04 · Full Auditability
                </span>
                <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  Every decision, traceable back to the exact words that produced it.
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Complete historic audit log protects against compliance liabilities and provides instant review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Metric Strip ("Proven Real Results") ─────────── */}
      <section className="relative z-10 py-20 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-3">
              Metrics
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Proven Real Results
            </h2>
            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
              Mission-critical metrics measured across live high-concurrency conversational workloads.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-center space-y-1">
              <span className="text-3xl md:text-5xl font-extrabold font-mono text-[var(--color-text-primary)] block">
                99.4%
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Transcription Accuracy
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">Acoustic phoneme matching</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-center space-y-1">
              <span className="text-3xl md:text-5xl font-extrabold font-mono text-emerald-400 block">
                &lt;280ms
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Turnaround Latency
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">Time-to-first-byte audio</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-center space-y-1">
              <span className="text-3xl md:text-5xl font-extrabold font-mono text-blue-400 block">
                100%
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Decision Auditability
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">Verifiable reasoning quotes</p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-center space-y-1">
              <span className="text-3xl md:text-5xl font-extrabold font-mono text-purple-400 block">
                4.9/5
              </span>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                Compliance Pass Rate
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)]">Zero disclosure omissions</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Autonomy ("Autonomy, on your terms") ─────────── */}
      <section className="relative z-10 py-24 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-16 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
              Scalable Supervision
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
              You decide how much the AI acts on its own.
            </h2>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
              Set one confidence threshold per campaign. Above it, decisions execute automatically. Below it, they land in your review queue with full context — never a silent guess.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs mb-4">
                01
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                One threshold, plain language.
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Not a matrix of settings to maintain.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs mb-4">
                02
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Review queue, not a black box.
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Approve or override, with reasoning visible.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3 shadow-sm hover:border-[var(--color-border-default)] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mb-4">
                03
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Full outcome tracking.
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                From decision to meeting to conversion, in one funnel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Early Access Program (Pace UI Pricing Card) ──── */}
      <section id="early-access" className="relative z-10 py-24 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
            Early Access Program
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4">
            We&apos;re early. Your terms lock in now.
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-12">
            IntelliCall is in early access. Teams who join now help shape the product roadmap directly — and get founding-member pricing locked in for the life of their account, before public pricing is set.
          </p>

          {/* Pricing / Early Access Box */}
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-[var(--color-bg-surface)] border border-white/10 shadow-2xl text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] mb-6">
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Early Access Program
                </h3>
                <span className="text-xs text-[var(--color-text-muted)]">Limited Founding Slots</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                Founding cohort
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  20% off annual pricing, locked permanently
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Direct line to the product team
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  ✓
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Priority on new campaign strategies as they ship
                </p>
              </div>
            </div>

            <button
              onClick={() => setEarlyAccessOpen(true)}
              className="w-full h-11 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center cursor-pointer"
            >
              Apply for early access
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 6: FAQ (Pace UI 2-Column Accordion Layout) ───────── */}
      <section id="faq" className="relative z-10 py-24 px-6 md:px-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Frequently asked questions
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Everything you need to know about transparent autonomous dialing, evidence extraction, and enterprise deployment.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setCalendlyOpen(true)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Have a unique security question? Talk to us &rarr;
              </button>
            </div>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-7 divide-y divide-[var(--color-border-subtle)] border-y border-[var(--color-border-subtle)]">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 py-2 group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-semibold text-[var(--color-text-primary)] group-hover:text-indigo-400 transition-colors">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[var(--color-text-primary)]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="pt-2 pb-3 pr-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7: Bottom CTA Banner Box (Pace UI Style) ─────────── */}
      <section className="relative z-10 py-20 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <div className="p-10 md:p-14 rounded-3xl bg-[var(--color-bg-surface)] border border-white/10 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] mb-4 relative z-10">
            See the reasoning behind your next 10 calls.
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 relative z-10">
            Start free, or talk to us first if you&apos;d rather see it walked through live.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate("/signup")}
              className="h-11 px-7 rounded-full bg-white text-zinc-950 font-semibold text-[14px] hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] flex items-center gap-2 cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={() => setCalendlyOpen(true)}
              className="h-11 px-6 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] font-medium text-[14px] hover:bg-[var(--color-bg-sunken)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play size={13} className="text-zinc-400 fill-zinc-400" />
              <span>Book a demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer (Pace UI Dark Footer) ────────────────────────────── */}
      <footer className="relative z-10 px-6 md:px-12 py-12 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]/60 text-xs text-[var(--color-text-muted)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              IC
            </div>
            <span className="font-semibold text-sm text-[var(--color-text-primary)]">
              IntelliCall
            </span>
            <span className="text-[var(--color-text-muted)]">&bull; Powered by Resonology AI</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#product" className="hover:text-[var(--color-text-primary)] transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">
              How it works
            </a>
            <a href="#early-access" className="hover:text-[var(--color-text-primary)] transition-colors">
              Early access
            </a>
            <Link to="/signin" className="hover:text-[var(--color-text-primary)] transition-colors">
              Sign in
            </Link>
            <Link to="/signup" className="hover:text-[var(--color-text-primary)] transition-colors text-white font-medium">
              Get started
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)] text-[11px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <span>&copy; {new Date().getFullYear()} IntelliCall. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CalendlyModal open={calendlyOpen} onClose={() => setCalendlyOpen(false)} />
      <EarlyAccessModal open={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}
