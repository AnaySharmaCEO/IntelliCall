// IntelliCall — SaaS Landing Page
// Faithful to LANDING_PAGE_COPY.md, LANDING_PAGE_BUILD_PROMPT.md, and PaceUI modern dark/light design system.

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConversationStatePanel from "../components/shared/ConversationStatePanel";
import AIStateBanner from "../components/shared/AIStateBanner";
import EvidenceSnippet from "../components/shared/EvidenceSnippet";
import EvidenceThread from "../components/shared/EvidenceThread";
import ConfidenceIndicator from "../components/shared/ConfidenceIndicator";
import DecisionCard from "../components/shared/DecisionCard";
import DecisionTrace from "../components/shared/DecisionTrace";
import { CalendlyModal, EarlyAccessModal } from "../components/shared/ActionCard";
import { Skeleton } from "../components/ui/Skeleton";

import {
  landingMockConversationState,
  landingMockEvidenceSnippet,
  landingMockEvidenceThread,
  landingMockTraceSteps,
  landingMockDecision,
} from "../mock";

export default function LandingPage() {
  const navigate = useNavigate();

  // ── Theme State (synced with localStorage & html[data-theme]) ──────────
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("ic-theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ic-theme", next);
    setThemeState(next);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Check auth for header
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    setIsAuthenticated(Boolean(localStorage.getItem("intellicall_auth_token")));
  }, []);

  // Modals
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [earlyAccessOpen, setEarlyAccessOpen] = useState(false);

  // FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Section 3 Live Component Showcase IntersectionObserver
  const [showcaseVisible, setShowcaseVisible] = useState(false);
  const [showcaseLoaded, setShowcaseLoaded] = useState(false);
  const showcaseRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setShowcaseVisible(true);
          const timer = setTimeout(() => setShowcaseLoaded(true), 250);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.1 }
    );

    if (showcaseRef.current) observer.observe(showcaseRef.current);
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
    <div
      className="min-h-screen flex flex-col antialiased transition-colors duration-200"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* ── Sticky Navigation ── */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="size-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105"
              style={{
                backgroundColor: "var(--color-action-primary-solid)",
                color: "var(--color-text-on-accent)",
              }}
            >
              IC
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              IntelliCall
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
            <a href="#product" className="hover:text-[var(--color-text-primary)] transition-colors">
              Product
            </a>
            <a href="#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors">
              How it works
            </a>
            <a href="#autonomy" className="hover:text-[var(--color-text-primary)] transition-colors">
              Autonomy
            </a>
            <a href="#early-access" className="hover:text-[var(--color-text-primary)] transition-colors">
              Early access
            </a>
            <a href="#faq" className="hover:text-[var(--color-text-primary)] transition-colors">
              FAQ
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] hover:opacity-80 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="text-[13px] font-medium px-2 py-1 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              to="/signin"
              className="text-[13px] font-medium px-2 py-1 transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign in
            </Link>
          )}

          {/* Primary Nav Button — Guaranteed rock-solid contrast */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/signup"}
            className="px-4 py-2 rounded-lg font-semibold text-[13px] shadow-sm transition-all hover:opacity-90 inline-flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-action-primary-solid)",
              color: "var(--color-text-on-accent)",
            }}
          >
            {isAuthenticated ? "Dashboard" : "Get started"}
          </Link>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6 md:px-12 overflow-hidden text-center flex flex-col items-center">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 pace-grid-bg pointer-events-none opacity-40"></div>

        <div className="relative z-10 max-w-[960px] mx-auto flex flex-col items-center">
          {/* Eyebrow Pill */}
          <div className="pace-pill mb-6">
            <span
              className="px-1.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide"
              style={{
                backgroundColor: "var(--color-action-primary-solid)",
                color: "var(--color-text-on-accent)",
              }}
            >
              AI
            </span>
            <span>Powered by Resonology AI</span>
          </div>

          {/* Headline */}
          <h1
            className="font-bold tracking-tight mb-5 max-w-[800px] text-[34px] sm:text-[44px] md:text-[54px] leading-[1.14]"
            style={{ color: "var(--color-text-primary)" }}
          >
            Know why the AI made every call it made.
          </h1>

          {/* Subheadline */}
          <p
            className="text-[16px] sm:text-[18px] md:text-[20px] max-w-[720px] mb-8 leading-relaxed font-normal"
            style={{ color: "var(--color-text-secondary)" }}
          >
            IntelliCall runs your outbound conversations, qualifies leads, and books meetings — and shows you the exact evidence behind every decision, before it acts or after you review it.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-4">
            <Link
              to="/signup"
              className="min-w-[150px] px-6 py-3 rounded-lg font-semibold text-[14px] shadow-sm transition-all hover:opacity-90 inline-flex items-center justify-center"
              style={{
                backgroundColor: "var(--color-action-primary-solid)",
                color: "var(--color-text-on-accent)",
              }}
            >
              Get started
            </Link>

            <button
              type="button"
              onClick={() => setCalendlyOpen(true)}
              className="min-w-[150px] px-6 py-3 rounded-lg font-medium text-[14px] transition-all inline-flex items-center justify-center border"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderColor: "var(--color-border-default)",
                color: "var(--color-text-primary)",
              }}
            >
              Book a demo
            </button>
          </div>

          {/* Supporting line */}
          <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            No credit card to start. See a real decision trace in your first session.
          </p>
        </div>
      </section>

      {/* ── Section 2 — The Problem (Agitation, Factual) ── */}
      <section
        id="product"
        className="py-20 px-6 md:px-12 border-t border-b border-[var(--color-border-subtle)] transition-colors"
        style={{ backgroundColor: "var(--color-bg-surface)" }}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[700px] mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-emerald-500">
              The Reality
            </p>
            <h2
              className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-3.5 leading-snug"
              style={{ color: "var(--color-text-primary)" }}
            >
              Most AI dialers give you an outcome. Not a reason.
            </h2>
            <p
              className="text-[15px] sm:text-[16px] leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              "Qualified" or "not interested" isn't enough when you're the one accountable for the pipeline. If you can't see what the AI heard, what it flagged, and why it made the call it made, you can't trust it — and you can't improve it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                No evidence trail
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                A generic label with no transcript reasoning or quotes behind it. You're left guessing why the lead was discarded.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                No review point
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Low-confidence calls execute blindly the same as high-confidence ones, risking real revenue on unverified guesses.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                No audit path
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                When a decision is wrong, there is no way to see where the conversation broke down or refine your strategy rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 — Live Product Showcase ("How it works") ── */}
      <section id="how-it-works" ref={showcaseRef} className="py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[700px] mb-16">
            <div className="pace-pill mb-3">
              <span>Interactive Architecture</span>
            </div>
            <h2
              className="text-[28px] sm:text-[36px] font-bold tracking-tight mb-3 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Every decision comes with its evidence.
            </h2>
            <p className="text-[15px]" style={{ color: "var(--color-text-muted)" }}>
              This isn't a mockup — it's the actual interface, with sample data.
            </p>
          </div>

          <div className="space-y-16">
            {/* Block 1: The agent talks to the lead */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Step 01</span>
                <h3 className="text-xl font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  Strategy Execution
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  The agent talks to the lead, following the campaign strategy and qualification rules you set.
                </p>
              </div>
              <div className="lg:col-span-7">
                {!showcaseLoaded ? (
                  <Skeleton className="h-44 w-full rounded-xl" />
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
                    <AIStateBanner state="CONNECTED" detail="Live autonomous call in progress — strategy: Direct Qualification" />
                    <div className="mt-4">
                      <ConversationStatePanel state={landingMockConversationState} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Block 2: Evidence quotes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1">
                {!showcaseLoaded ? (
                  <Skeleton className="h-44 w-full rounded-xl" />
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-sm space-y-3">
                    <EvidenceSnippet {...landingMockEvidenceSnippet} />
                    <EvidenceThread steps={landingMockEvidenceThread} />
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Step 02</span>
                <h3 className="text-xl font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  Verified Quotes
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  It pulls the specific lines that mattered — not a summary, the actual quotes tagged with timestamps.
                </p>
              </div>
            </div>

            {/* Block 3: Confidence threshold routing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Step 03</span>
                <h3 className="text-xl font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  Threshold Routing
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Confidence is shown plainly. Above your threshold, it acts. Below it, it waits for you in the review queue.
                </p>
              </div>
              <div className="lg:col-span-7">
                {!showcaseLoaded ? (
                  <Skeleton className="h-44 w-full rounded-xl" />
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-sm space-y-3">
                    <ConfidenceIndicator score={82} tier="high" threshold={75} />
                    <DecisionCard decision={landingMockDecision} />
                  </div>
                )}
              </div>
            </div>

            {/* Block 4: Decision trace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1">
                {!showcaseLoaded ? (
                  <Skeleton className="h-44 w-full rounded-xl" />
                ) : (
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
                    <DecisionTrace steps={landingMockTraceSteps} />
                  </div>
                )}
              </div>
              <div className="lg:col-span-5 order-1 lg:order-2 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">Step 04</span>
                <h3 className="text-xl font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                  Explainable Decision Trace
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  Every decision, traceable back to the exact words and rules that produced it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Autonomy, on your terms ── */}
      <section
        id="autonomy"
        className="py-20 px-6 md:px-12 border-t border-[var(--color-border-subtle)] transition-colors"
        style={{ backgroundColor: "var(--color-bg-surface)" }}
      >
        <div className="max-w-[1100px] mx-auto">
          <div className="max-w-[700px] mb-12">
            <h2
              className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-3 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              You decide how much the AI acts on its own.
            </h2>
            <p
              className="text-[15px] sm:text-[16px] leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Set one confidence threshold per campaign. Above it, decisions execute automatically. Below it, they land in your review queue with full context — never a silent guess.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                One threshold, plain language
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Not a complex matrix of fifty settings to maintain. Pick your confidence score cutoff and launch.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Review queue, not a black box
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Approve or override with transcript reasoning visible side-by-side, teaching the system your team's standard.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
              <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                Full outcome tracking
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                From qualification decision to meeting booked to closed revenue, all analyzed in one continuous conversion funnel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5 — Early Access Program ── */}
      <section id="early-access" className="py-20 px-6 md:px-12">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="pace-pill mb-4">
            <span>Founding Cohort</span>
          </div>
          <h2
            className="text-[28px] sm:text-[36px] font-bold tracking-tight mb-3 leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            We're early. Your terms lock in now.
          </h2>
          <p
            className="text-[15px] sm:text-[16px] leading-relaxed mb-8 max-w-[640px] mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            IntelliCall is in early access. Teams who join now help shape the product roadmap directly — and get founding-member pricing locked in for the life of their account, before public pricing is set.
          </p>

          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-8 text-left shadow-md max-w-lg mx-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Early Access Program
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>20% off annual pricing, locked permanently</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Direct line to the product & engineering team</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Priority on new campaign strategies and voice engines as they ship</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setEarlyAccessOpen(true)}
              className="mt-6 w-full py-3 rounded-lg font-semibold text-sm transition-all shadow-sm"
              style={{
                backgroundColor: "var(--color-action-primary-solid)",
                color: "var(--color-text-on-accent)",
              }}
            >
              Apply for early access
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 6 — Frequently Asked Questions ── */}
      <section
        id="faq"
        className="py-20 px-6 md:px-12 border-t border-[var(--color-border-subtle)] transition-colors"
        style={{ backgroundColor: "var(--color-bg-surface)" }}
      >
        <div className="max-w-[760px] mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-[26px] md:text-[34px] font-bold tracking-tight mb-2 leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Frequently asked questions
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Objection handling and architectural assurances for RevOps evaluators.
            </p>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 py-2 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {item.q}
                    </span>
                    <span className="text-sm font-mono text-[var(--color-text-muted)]">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pt-2 pb-2 pr-6">
                      <p className="text-[14px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7 — Final CTA ── */}
      <section className="py-20 px-6 md:px-12 max-w-[760px] mx-auto text-center">
        <h2
          className="text-[28px] md:text-[36px] font-bold tracking-tight mb-3 leading-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          See the reasoning behind your next 10 calls.
        </h2>
        <p className="text-[15px] mb-8" style={{ color: "var(--color-text-secondary)" }}>
          Start free, or talk to us first if you'd rather see it walked through live.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link
            to="/signup"
            className="min-w-[150px] px-6 py-3 rounded-lg font-semibold text-sm shadow-sm transition-all inline-flex items-center justify-center"
            style={{
              backgroundColor: "var(--color-action-primary-solid)",
              color: "var(--color-text-on-accent)",
            }}
          >
            Get started
          </Link>
          <button
            type="button"
            onClick={() => setCalendlyOpen(true)}
            className="min-w-[150px] px-6 py-3 rounded-lg font-medium text-sm transition-all inline-flex items-center justify-center border"
            style={{
              backgroundColor: "var(--color-bg-surface)",
              borderColor: "var(--color-border-default)",
              color: "var(--color-text-primary)",
            }}
          >
            Book a demo
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 md:px-12 py-8 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] border-t border-[var(--color-border-subtle)]"
        style={{
          backgroundColor: "var(--color-bg-surface)",
          color: "var(--color-text-muted)",
        }}
      >
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
          <Link
            to="/signup"
            className="font-semibold hover:underline"
            style={{ color: "var(--color-text-primary)" }}
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[var(--color-border-default)] bg-[var(--color-bg-sunken)] hover:opacity-80 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>

          <span>© IntelliCall. Powered by Resonology AI.</span>
        </div>
      </footer>

      {/* Modals */}
      <CalendlyModal open={calendlyOpen} onClose={() => setCalendlyOpen(false)} />
      <EarlyAccessModal open={earlyAccessOpen} onClose={() => setEarlyAccessOpen(false)} />
    </div>
  );
}
