// CallWithAIDrawer — Phase 5.
// Step 1: Select campaign (active only). Shows assigned agent as read-only summary.
// Step 2: Call now vs schedule for later.
// Step 3: Confirm. Closes, fires toast, invokes onCallCreated with the new Call record.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Drawer from "../ui/Drawer";
import Button from "../ui/Button";
import type { Lead, Campaign, Call } from "../../types";
import { useCallActions } from "../../hooks";
import { mockCampaigns, mockAgents } from "../../mock";
import { useToast } from "../ui/Toast";

interface CallWithAIDrawerProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onCallCreated: (call: Call) => void;
}

function formatScheduledFor(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CallWithAIDrawer({ open, onClose, lead, onCallCreated }: CallWithAIDrawerProps) {
  const { createCall, loading } = useCallActions();
  const { toast } = useToast();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [mode, setMode] = useState<"now" | "schedule" | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedCampaignId("");
      setMode(null);
      setScheduledDate("");
      setScheduledTime("");
      setError(null);
    }
  }, [open]);

  const eligibleCampaigns = mockCampaigns.filter(c => c.status === "active");
  const selectedCampaign = eligibleCampaigns.find(c => c.id === selectedCampaignId) ?? null;
  const assignedAgent = selectedCampaign
    ? mockAgents.find(a => a.id === selectedCampaign.agent_id) ?? null
    : null;

  const scheduledFor =
    scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : null;

  const canSubmit =
    selectedCampaignId &&
    mode !== null &&
    (mode === "now" || (mode === "schedule" && scheduledFor !== null));

  const handleSubmit = async () => {
    if (!canSubmit || !selectedCampaign) return;
    setError(null);
    try {
      const call = await createCall({
        lead_id: lead.id,
        campaign_id: selectedCampaign.id,
        agent_id: selectedCampaign.agent_id,
        mode,
        scheduled_for: scheduledFor ?? undefined,
      });
      if (!call) throw new Error("Failed to create call");
      onCallCreated(call);
      onClose();
      if (mode === "now") {
        toast("Call started — Resonology AI is calling now.");
      } else {
        toast(`Call scheduled for ${formatScheduledFor(scheduledFor!)}`);
      }
    } catch {
      setError("Couldn't start the call. Please try again.");
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Call with AI">
      <div className="flex flex-col gap-6">

        {/* ── Step 1: Campaign ── */}
        <section>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Campaign
          </p>

          {eligibleCampaigns.length === 0 ? (
            <div
              className="rounded-[var(--radius-sm)] p-4 text-[13px]"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border-default)",
                color: "var(--color-text-secondary)",
              }}
            >
              No active campaign covers this lead yet.{" "}
              <Link
                to="/campaigns"
                className="font-semibold hover:underline"
                style={{ color: "var(--color-action-primary)" }}
                onClick={onClose}
              >
                Go to Campaigns →
              </Link>
            </div>
          ) : (
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border appearance-none focus:outline-none focus:ring-2 transition-colors"
              style={{
                background: "var(--color-bg-primary)",
                border: "1px solid var(--color-border-default)",
                color: selectedCampaignId ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              <option value="" disabled>Select a campaign…</option>
              {eligibleCampaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Agent summary — read-only */}
          {assignedAgent && (
            <div
              className="mt-3 rounded-[var(--radius-sm)] p-3"
              style={{
                background: "var(--color-bg-sunken)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Assigned agent
              </p>
              <p className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {assignedAgent.name}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {assignedAgent.objective}
              </p>
            </div>
          )}
        </section>

        {/* ── Step 2: Mode ── */}
        {selectedCampaignId && (
          <section>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.04em] mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              When
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("now")}
                className="flex-1 h-10 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                style={{
                  background: mode === "now" ? "var(--color-action-primary-solid)" : "var(--color-bg-sunken)",
                  color: mode === "now" ? "#fff" : "var(--color-text-secondary)",
                  border: mode === "now" ? "1px solid var(--color-action-primary-solid)" : "1px solid var(--color-border-default)",
                }}
              >
                Call now
              </button>
              <button
                onClick={() => setMode("schedule")}
                className="flex-1 h-10 rounded-[var(--radius-sm)] text-[13px] font-semibold transition-colors"
                style={{
                  background: mode === "schedule" ? "var(--color-action-primary-solid)" : "var(--color-bg-sunken)",
                  color: mode === "schedule" ? "#fff" : "var(--color-text-secondary)",
                  border: mode === "schedule" ? "1px solid var(--color-action-primary-solid)" : "1px solid var(--color-border-default)",
                }}
              >
                Schedule for later
              </button>
            </div>

            {/* Date/time picker for schedule */}
            {mode === "schedule" && (
              <div className="flex gap-2 mt-3">
                <div className="flex-1">
                  <label
                    className="block text-[11px] font-medium mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      background: "var(--color-bg-primary)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label
                    className="block text-[11px] font-medium mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="w-full h-9 px-3 rounded-[var(--radius-sm)] text-[13px] border focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      background: "var(--color-bg-primary)",
                      border: "1px solid var(--color-border-default)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Confirm summary ── */}
        {canSubmit && selectedCampaign && (
          <div
            className="rounded-[var(--radius-sm)] p-3 text-[13px]"
            style={{
              background: "var(--color-action-secondary-bg)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <p style={{ color: "var(--color-text-secondary)" }}>
              {mode === "now" ? (
                <>
                  Resonology AI will call{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>{lead.name}</strong>
                  {" "}immediately using{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>{selectedCampaign.name}</strong>.
                </>
              ) : (
                <>
                  Call scheduled for{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {scheduledFor ? formatScheduledFor(scheduledFor) : "—"}
                  </strong>
                  {" "}using{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>{selectedCampaign.name}</strong>.
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <p className="text-[12px]" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        {/* ── Footer actions ── */}
        <div
          className="flex gap-2 pt-4 mt-auto"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={!canSubmit || eligibleCampaigns.length === 0}
            onClick={handleSubmit}
            className="flex-1"
          >
            {mode === "now" ? "Start call" : mode === "schedule" ? "Schedule call" : "Continue"}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
