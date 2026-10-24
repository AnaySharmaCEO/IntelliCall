import { useState } from "react";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import type { ActionType } from "../../types";

interface ActionCardProps {
  type: ActionType;
  description: string;
  onExecute?: () => Promise<void>;
  onDismiss?: () => void;
}

type Status = "idle" | "loading" | "success" | "failure" | "dismissed";

const typeLabels: Record<ActionType, string> = {
  book_meeting: "Book meeting",
  send_followup: "Send follow-up",
  update_status: "Update status",
  escalate: "Escalate",
};

export default function ActionCard({ type, description, onExecute, onDismiss }: ActionCardProps) {
  const [status, setStatus] = useState<Status>("idle");
  const { toast } = useToast();

  const handleExecute = async () => {
    setStatus("loading");
    try {
      if (onExecute) {
        await onExecute();
      } else {
        // Simulate execution when no handler provided
        await new Promise(r => setTimeout(r, 900));
      }
      setStatus("success");
      toast(`${typeLabels[type]} executed.`);
    } catch {
      setStatus("failure");
      toast("Action failed. Please retry.", "error");
    }
  };

  const handleDismiss = () => {
    setStatus("dismissed");
    onDismiss?.();
  };

  if (status === "dismissed") return null;

  return (
    <div
      className="rounded-[var(--radius-md)] p-4"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border-subtle)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold mb-0.5">{typeLabels[type]}</p>
          <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>
            {description}
          </p>
        </div>

        {status === "success" && (
          <span
            className="text-[12px] font-semibold whitespace-nowrap flex-shrink-0"
            style={{ color: "var(--color-success)" }}
          >
            Executed
          </span>
        )}

        {status === "failure" && (
          <Button size="sm" variant="primary" onClick={handleExecute}>
            Retry
          </Button>
        )}

        {(status === "idle" || status === "loading") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="primary" loading={status === "loading"} onClick={handleExecute}>
              {typeLabels[type]}
            </Button>
            {(onDismiss !== undefined || status === "idle") && (
              <Button size="sm" variant="ghost" disabled={status === "loading"} onClick={handleDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Calendly Booking Modal ──────────────────────────────────────────────────
// TODO: insert Calendly link — replace placeholder below when client link is configured
export const CALENDLY_BOOKING_URL = "https://calendly.com/intellicall-demo/30min";

interface CalendlyModalProps {
  open: boolean;
  onClose: () => void;
}

export function CalendlyModal({ open, onClose }: CalendlyModalProps) {
  const handleOpenNewTab = () => {
    window.open(CALENDLY_BOOKING_URL, "_blank", "noopener,noreferrer");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="calendly-modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-[760px] rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)] animate-[ic-slide-up_var(--duration-slow)_var(--easing-standard)] flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div>
            <h2 id="calendly-modal-title" className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              Book a live walkthrough
            </h2>
            <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">
              30 minutes with our product engineering team.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] transition-colors"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            See live call qualification, custom confidence thresholds, and decision trace auditing configured on your ideal customer profile.
          </p>

          <div
            className="w-full h-[460px] rounded-[var(--radius-md)] overflow-hidden relative"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <iframe
              src={CALENDLY_BOOKING_URL}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Calendly Scheduling"
              style={{ border: 0 }}
            />
            <div className="absolute bottom-3 right-3">
              <Button size="sm" variant="secondary" onClick={handleOpenNewTab}>
                Open in new tab ↗
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)] rounded-b-[var(--radius-lg)] text-[12px] text-[var(--color-text-muted)]">
          <span>TODO: insert Calendly link in production config</span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Early Access Application Modal ──────────────────────────────────────────
interface EarlyAccessModalProps {
  open: boolean;
  onClose: () => void;
}

export function EarlyAccessModal({ open, onClose }: EarlyAccessModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("1-10 SDRs");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="early-access-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-[500px] rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)] border border-[var(--color-border-subtle)] animate-[ic-slide-up_var(--duration-slow)_var(--easing-standard)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <h2 id="early-access-title" className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Apply for Early Access
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sunken)] transition-colors"
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4 flex flex-col items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)]">
                Application received
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] max-w-[360px]">
                Thank you, {name || "there"}. We review applications within 24 hours. Your 20% discount and direct roadmap channel will be locked to {email}.
              </p>
              <Button size="md" className="mt-2" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="p-3 rounded-[var(--radius-sm)] text-[12px]" style={{ background: "var(--color-action-secondary-bg)", color: "var(--color-action-secondary-text)" }}>
                Early Access Program includes 20% off annual pricing locked permanently, direct product team access, and roadmap priority.
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jamie Rivera"
                  className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jamie@company.com"
                  className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1">
                  Company
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-secondary)] mb-1">
                  SDR / Sales Team Headcount
                </label>
                <select
                  value={teamSize}
                  onChange={e => setTeamSize(e.target.value)}
                  className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
                >
                  <option value="1-5 SDRs">1 - 5 SDRs</option>
                  <option value="6-20 SDRs">6 - 20 SDRs</option>
                  <option value="21-50 SDRs">21 - 50 SDRs</option>
                  <option value="50+ SDRs">50+ SDRs</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--color-border-subtle)]">
                <Button type="button" variant="outline" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="md">
                  Submit application
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

