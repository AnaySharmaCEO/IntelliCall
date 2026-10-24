// OnboardingPage — Hardened, resumable, 5-step guided onboarding flow for IntelliCall.
// Step 1: Workspace setup (mandatory, creates org + owner membership)
// Step 2: Import leads (embedded CSV/lead flow, skippable)
// Step 3: Create AI agent (embedded agent form, skippable)
// Step 4: Create campaign (guided flow, handles missing agent gracefully, skippable)
// Step 5: Done (sets onboarding_completed = true -> routes to /dashboard)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import type { ActionType, Agent } from "../types";

type OnboardingStep = "workspace" | "leads_import" | "agent" | "campaign" | "done";

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "leads_import", label: "Import leads" },
  { id: "agent", label: "AI Agent" },
  { id: "campaign", label: "Campaign" },
  { id: "done", label: "Ready" },
];

const ACTION_LABELS: Record<ActionType, string> = {
  book_meeting: "Book meeting",
  send_followup: "Send follow-up",
  update_status: "Update status",
  escalate: "Escalate to human",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, organization, onboardingProgress, refreshOrgState } = useAuth();

  // Determine current step based on persistent backend onboarding_progress
  const deriveStep = (prog: Record<string, any>, orgExists: boolean): OnboardingStep => {
    if (!orgExists || !prog.workspace) return "workspace";
    if (!prog.leads_import) return "leads_import";
    if (!prog.agent) return "agent";
    if (!prog.campaign) return "campaign";
    return "done";
  };

  const [step, setStep] = useState<OnboardingStep>(() =>
    deriveStep(onboardingProgress, Boolean(organization))
  );

  // Sync step if organization state updates
  useEffect(() => {
    if (organization) {
      const derived = deriveStep(organization.onboarding_progress || {}, true);
      setStep(derived);
    }
  }, [organization]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Workspace Form
  const defaultWorkspaceName = user?.email
    ? user.email.split("@")[1]?.split(".")[0]?.replace(/^\w/, c => c.toUpperCase()) + " Outbound"
    : "Acme Outbound";
  const [workspaceName, setWorkspaceName] = useState(organization?.name || defaultWorkspaceName);
  const [role, setRole] = useState("RevOps / Sales Operations");

  // Step 2: Leads Import Form
  const [leadInputText, setLeadInputText] = useState(
    "Daniel Okafor, VP Operations, Northwind Logistics, d.okafor@northwind.com, +1 555 0142\n" +
    "Priya Nair, COO, Fieldstone Retail, priya.nair@fieldstone.com, +1 555 0198\n" +
    "Wei Zhang, Director of Finance, Granite Capital, w.zhang@granite.com, +1 555 0311"
  );
  const [leadsCount, setLeadsCount] = useState(3);

  // Step 3: Agent Form
  const [agentName, setAgentName] = useState("Qualifier Pro");
  const [agentObjective, setAgentObjective] = useState("Qualify outbound prospects on intent and purchase timeline");
  const [agentVoice, setAgentVoice] = useState("Alloy");
  const [agentGoal, setAgentGoal] = useState("Confirm budget, authority, and urgency");
  const [permittedActions, setPermittedActions] = useState<ActionType[]>([
    "book_meeting",
    "send_followup",
    "update_status",
  ]);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);

  // Step 4: Campaign Form
  const [campaignName, setCampaignName] = useState("Q4 Outbound Pilot");
  const [campaignStrategy, setCampaignStrategy] = useState("direct_qualification");
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [existingAgents, setExistingAgents] = useState<Agent[]>([]);

  // Fetch available agents when entering campaign step
  useEffect(() => {
    if (organization && (step === "campaign" || step === "agent")) {
      supabase
        .from("agents")
        .select("id, name, objective, status")
        .eq("organization_id", organization.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setExistingAgents(data as any);
            if (!createdAgentId) {
              setCreatedAgentId(data[0].id);
            }
          }
        });
    }
  }, [step, organization, createdAgentId]);

  // Persist progress helper
  const updateProgress = async (stepKey: string, status: "done" | "skipped") => {
    if (!organization) return;
    const nextProgress = {
      ...(organization.onboarding_progress || {}),
      [stepKey]: status,
    };

    try {
      await supabase
        .from("organizations")
        .update({ onboarding_progress: nextProgress })
        .eq("id", organization.id);

      await refreshOrgState();
    } catch (err) {
      console.error("Failed to update onboarding progress:", err);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 1: Submit Workspace Setup
  // --------------------------------------------------------------------------
  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!workspaceName.trim()) {
      setError("Please enter an organization / workspace name.");
      return;
    }

    if (!user) {
      setError("User session not found. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      const slug = workspaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      // 1. Create Organization (gated by RLS: created_by = auth.uid())
      const { data: newOrg, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          name: workspaceName.trim(),
          slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
          created_by: user.id,
          onboarding_completed: false,
          onboarding_progress: { workspace: "done" },
        })
        .select("id, name, slug, onboarding_completed, onboarding_progress")
        .single();

      if (orgErr || !newOrg) {
        throw new Error(orgErr?.message || "Failed to create organization.");
      }

      // 2. Create Owner Membership (gated by strict first-member owner policy)
      const { error: memErr } = await supabase
        .from("organization_members")
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "owner",
          status: "active",
        });

      if (memErr) {
        throw new Error(memErr.message || "Failed to establish workspace ownership.");
      }

      await refreshOrgState();
      toast("Workspace initialized successfully.");
      setStep("leads_import");
    } catch (err: any) {
      console.error("Workspace setup error:", err);
      setError(err.message || "Failed to setup workspace. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 2: Import Leads
  // --------------------------------------------------------------------------
  const handleImportLeads = async () => {
    setError(null);
    if (!organization) return;

    setLoading(true);
    try {
      // Parse CSV text
      const lines = leadInputText.split("\n").filter(l => l.trim().length > 0);
      const leadsToInsert = lines.map(line => {
        const parts = line.split(",").map(p => p.trim());
        return {
          organization_id: organization.id,
          name: parts[0] || "New Lead",
          title: parts[1] || "",
          company: parts[2] || "",
          email: parts[3] || "",
          phone: parts[4] || "",
          status: "new" as const,
        };
      });

      if (leadsToInsert.length > 0) {
        const { error: leadsErr } = await supabase.from("leads").insert(leadsToInsert);
        if (leadsErr) {
          console.warn("Notice: Leads insert error:", leadsErr.message);
        }
      }

      await updateProgress("leads_import", "done");
      toast(`${leadsToInsert.length} leads imported.`);
      setStep("agent");
    } catch (err: any) {
      setError(err.message || "Failed to import leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLeads = async () => {
    await updateProgress("leads_import", "skipped");
    setStep("agent");
  };

  // --------------------------------------------------------------------------
  // STEP 3: Create AI Agent
  // --------------------------------------------------------------------------
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!organization) return;

    if (!agentName.trim() || !agentObjective.trim()) {
      setError("Please fill in the agent name and objective.");
      return;
    }

    setLoading(true);
    try {
      const { data: newAgent, error: agentErr } = await supabase
        .from("agents")
        .insert({
          organization_id: organization.id,
          name: agentName.trim(),
          objective: agentObjective.trim(),
          language: "English",
          voice: agentVoice,
          qualification_goal: agentGoal,
          permitted_actions: permittedActions,
          status: "active",
        })
        .select()
        .single();

      if (agentErr || !newAgent) {
        throw new Error(agentErr?.message || "Failed to create agent.");
      }

      setCreatedAgentId(newAgent.id);
      await updateProgress("agent", "done");
      toast("AI Agent created.");
      setStep("campaign");
    } catch (err: any) {
      setError(err.message || "Failed to create agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAgent = async () => {
    await updateProgress("agent", "skipped");
    setStep("campaign");
  };

  // --------------------------------------------------------------------------
  // STEP 4: Create Campaign
  // --------------------------------------------------------------------------
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!organization) return;

    const agentId = createdAgentId || existingAgents[0]?.id;
    if (!agentId) {
      setError("An AI agent is required to launch this campaign. Please go back to create an agent or skip.");
      return;
    }

    setLoading(true);
    try {
      const { error: campErr } = await supabase.from("campaigns").insert({
        organization_id: organization.id,
        agent_id: agentId,
        name: campaignName.trim() || "First Campaign",
        status: "active",
        confidence_threshold: confidenceThreshold,
        strategy: campaignStrategy,
        leads_targeted: leadsCount,
      });

      if (campErr) {
        throw new Error(campErr.message);
      }

      await updateProgress("campaign", "done");
      toast("Campaign launched.");
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Failed to create campaign.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipCampaign = async () => {
    await updateProgress("campaign", "skipped");
    setStep("done");
  };

  // --------------------------------------------------------------------------
  // STEP 5: Finalize Onboarding
  // --------------------------------------------------------------------------
  const handleCompleteOnboarding = async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const { error: completeErr } = await supabase
        .from("organizations")
        .update({ onboarding_completed: true })
        .eq("id", organization.id);

      if (completeErr) {
        throw completeErr;
      }

      await refreshOrgState();
      toast("Welcome to IntelliCall! Your dashboard is ready.");
      navigate("/dashboard");
    } catch (err: any) {
      setError("Failed to finalize onboarding. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header & Step Indicator */}
      <div className="w-full max-w-[620px] mb-6 text-center">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-[var(--radius-pill)]"
          style={{
            background: "var(--color-action-secondary-bg)",
            color: "var(--color-action-secondary-text)",
          }}
        >
          First-time Setup · Step {currentStepIndex + 1} of {STEPS.length}
        </span>
        <h1 className="text-[24px] font-semibold mt-3 mb-1 text-[var(--color-text-primary)]">
          {step === "workspace" && "Create your workspace"}
          {step === "leads_import" && "Import your audience"}
          {step === "agent" && "Configure your first AI agent"}
          {step === "campaign" && "Create your first campaign"}
          {step === "done" && "You're all set!"}
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {step === "workspace" && "Set up your organization workspace to unlock autonomous qualification."}
          {step === "leads_import" && "Add sample prospects or paste your CSV contacts to target."}
          {step === "agent" && "Define the objective and vocal persona your AI agent uses on calls."}
          {step === "campaign" && "Pair your audience with your AI agent and autonomous action threshold."}
          {step === "done" && "Your workspace, agents, and pipelines have been initialized."}
        </p>

        {/* Stepper progress dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors",
                  idx < currentStepIndex
                    ? "bg-[var(--color-success)] text-white"
                    : idx === currentStepIndex
                    ? "bg-[var(--color-action-primary-solid)] text-white"
                    : "bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]",
                ].join(" ")}
              >
                {idx < currentStepIndex ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[12px] ${
                  idx === currentStepIndex
                    ? "font-semibold text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && <div className="w-6 h-px bg-[var(--color-border-default)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Stepper Card */}
      <div
        className="w-full max-w-[620px] rounded-[var(--radius-lg)] p-8"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {error && (
          <div
            className="p-3 mb-5 rounded-[var(--radius-sm)] text-[12px] flex items-center gap-2"
            style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 1: Workspace Setup (Mandatory) */}
        {/* ---------------------------------------------------------------- */}
        {step === "workspace" && (
          <form onSubmit={handleWorkspaceSubmit} className="flex flex-col gap-5">
            <Input
              label="Organization / Company name"
              required
              placeholder="e.g. Acme Corp"
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">Your role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[13px] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
              >
                <option value="RevOps / Sales Operations">RevOps / Sales Operations</option>
                <option value="VP / Director of Sales">VP / Director of Sales</option>
                <option value="SDR Manager / Team Lead">SDR Manager / Team Lead</option>
                <option value="Founder / Executive">Founder / Executive</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[12px] text-[var(--color-text-muted)]">
                Creates your isolated multi-tenant organization.
              </span>
              <Button type="submit" size="lg" loading={loading}>
                Continue to Leads →
              </Button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 2: Import Leads (Skippable) */}
        {/* ---------------------------------------------------------------- */}
        {step === "leads_import" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[13px] font-medium text-[var(--color-text-secondary)] mb-1 block">
                Paste CSV formatted leads (Name, Title, Company, Email, Phone)
              </label>
              <textarea
                rows={6}
                value={leadInputText}
                onChange={e => {
                  setLeadInputText(e.target.value);
                  setLeadsCount(e.target.value.split("\n").filter(l => l.trim()).length);
                }}
                className="w-full p-3 font-mono text-[12px] rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
              />
              <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                {leadsCount} prospects detected. You can edit this sample or paste your own.
              </span>
            </div>

            <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <button
                type="button"
                onClick={handleSkipLeads}
                disabled={loading}
                className="text-[13px] hover:underline"
                style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}
              >
                Skip for now
              </button>
              <Button onClick={handleImportLeads} size="lg" loading={loading}>
                Import {leadsCount} leads & Continue →
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 3: Create First AI Agent (Skippable) */}
        {/* ---------------------------------------------------------------- */}
        {step === "agent" && (
          <form onSubmit={handleCreateAgent} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Agent name"
                required
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
              />
              <Select
                label="Voice persona"
                value={agentVoice}
                onChange={e => setAgentVoice(e.target.value)}
                options={["Alloy", "Echo", "Nova", "Shimmer"].map(v => ({ value: v, label: v }))}
              />
            </div>

            <Input
              label="Primary objective"
              required
              value={agentObjective}
              onChange={e => setAgentObjective(e.target.value)}
            />

            <Input
              label="Qualification goal"
              value={agentGoal}
              onChange={e => setAgentGoal(e.target.value)}
            />

            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">
                Permitted autonomous actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ACTION_LABELS) as ActionType[]).map(act => (
                  <label key={act} className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permittedActions.includes(act)}
                      onChange={e => {
                        if (e.target.checked) {
                          setPermittedActions([...permittedActions, act]);
                        } else {
                          setPermittedActions(permittedActions.filter(a => a !== act));
                        }
                      }}
                      className="accent-[var(--color-action-primary-solid)]"
                    />
                    <span>{ACTION_LABELS[act]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={handleSkipAgent}
                disabled={loading}
                className="text-[13px] hover:underline"
                style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}
              >
                Skip for now
              </button>
              <Button type="submit" size="lg" loading={loading}>
                Save Agent & Continue →
              </Button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 4: Create Campaign (Skippable) */}
        {/* ---------------------------------------------------------------- */}
        {step === "campaign" && (
          <form onSubmit={handleCreateCampaign} className="flex flex-col gap-4">
            {existingAgents.length === 0 && !createdAgentId ? (
              <div className="p-4 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
                <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
                  A campaign requires an assigned AI agent to run qualification calls. Since the agent step was skipped, you can create one now or skip campaign setup.
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep("agent")}>
                    ← Back to create agent
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleSkipCampaign}>
                    Skip campaign for now
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Input
                  label="Campaign name"
                  required
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />

                <Select
                  label="Assigned Agent"
                  value={createdAgentId || existingAgents[0]?.id || ""}
                  onChange={e => setCreatedAgentId(e.target.value)}
                  options={existingAgents.map(a => ({ value: a.id, label: a.name }))}
                />

                <Select
                  label="Strategy playbook"
                  value={campaignStrategy}
                  onChange={e => setCampaignStrategy(e.target.value)}
                  options={[
                    { value: "direct_qualification", label: "Direct qualification — qualify on first call" },
                    { value: "discovery_first", label: "Discovery-first — understand need before qualifying" },
                    { value: "value_first", label: "Value-first — lead with product value prop" },
                  ]}
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                      Autonomous confidence threshold
                    </label>
                    <span className="text-[13px] font-mono font-semibold text-[var(--color-action-primary)]">
                      {confidenceThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={confidenceThreshold}
                    onChange={e => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full accent-[var(--color-action-primary-solid)] cursor-pointer"
                  />
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Decisions above {confidenceThreshold}% execute actions automatically. Below {confidenceThreshold}% routes to human review.
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={handleSkipCampaign}
                    disabled={loading}
                    className="text-[13px] hover:underline"
                    style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}
                  >
                    Skip for now
                  </button>
                  <Button type="submit" size="lg" loading={loading}>
                    Launch Campaign & Finish →
                  </Button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* STEP 5: Done */}
        {/* ---------------------------------------------------------------- */}
        {step === "done" && (
          <div className="flex flex-col items-center text-center py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-[24px]"
              style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
            >
              ✓
            </div>
            <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)] mb-2">
              Setup Complete
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)] max-w-[420px] mb-6">
              Your IntelliCall workspace <strong>{organization?.name}</strong> is live. You can now monitor calls, review explainable AI decisions, and manage pipeline conversions.
            </p>

            <Button onClick={handleCompleteOnboarding} size="lg" loading={loading} className="w-full max-w-[300px] justify-center">
              Go to Dashboard →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
