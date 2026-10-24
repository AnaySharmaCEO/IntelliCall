import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import { useAgents } from "../hooks";
import { campaignsService } from "../services";
import { useToast } from "../components/ui/Toast";

type Step = "audience" | "agent" | "strategy" | "threshold" | "launch";
const STEPS: Step[] = ["audience", "agent", "strategy", "threshold", "launch"];

const STRATEGY_OPTIONS = [
  { value: "direct_qualification", label: "Direct qualification — qualify on first call" },
  { value: "discovery_first", label: "Discovery-first — understand need before qualifying" },
  { value: "value_first", label: "Value-first — lead with value prop" },
];

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: agents } = useAgents();

  const [step, setStep] = useState<Step>("audience");
  const [form, setForm] = useState({
    name: "",
    description: "",
    agent_id: "",
    strategy: "direct_qualification",
    confidence_threshold: 80,
  });
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const canAdvance = () => {
    if (step === "audience") return form.name.trim().length > 0;
    if (step === "agent") return form.agent_id.length > 0;
    return true;
  };

  const advance = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const launch = async () => {
    setLoading(true);
    await campaignsService.create(form);
    setLoading(false);
    toast("Campaign created.");
    navigate("/campaigns");
  };

  return (
    <div>
      <nav className="text-[12px] text-[var(--color-text-muted)] mb-4">
        <Link to="/campaigns" className="hover:text-[var(--color-action-primary)]">Campaigns</Link>
        <span className="mx-1.5">›</span>
        <span className="text-[var(--color-text-primary)]">New campaign</span>
      </nav>

      <div className="max-w-[640px]">
        <h1 className="text-[22px] font-semibold mb-1">Create campaign</h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">Configure audience, agent, strategy, and confidence threshold.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={[
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold",
                i < stepIndex ? "bg-[var(--color-success)] text-white" : i === stepIndex ? "bg-[var(--color-action-primary-solid)] text-white" : "bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]",
              ].join(" ")}>
                {i < stepIndex ? "✓" : i + 1}
              </div>
              <span className={`text-[12px] capitalize ${i === stepIndex ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-[var(--color-border-default)]" />}
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6">
          {/* Step: Audience */}
          {step === "audience" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold mb-1">Audience</h2>
              <Input label="Campaign name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mid-market Q4" />
              <Input label="Description (optional)" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What is this campaign targeting?" />
            </div>
          )}

          {/* Step: Agent */}
          {step === "agent" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold mb-1">Agent</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">Choose the AI agent that will run calls for this campaign.</p>
              <div className="flex flex-col gap-2">
                {(agents ?? []).map((a) => (
                  <label
                    key={a.id}
                    className={[
                      "flex items-start gap-3 p-3 rounded-[var(--radius-sm)] border cursor-pointer transition-colors",
                      form.agent_id === a.id ? "border-[var(--color-action-primary)] bg-[var(--color-action-secondary-bg)]" : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-sunken)]",
                    ].join(" ")}
                  >
                    <input type="radio" name="agent" value={a.id} checked={form.agent_id === a.id} onChange={() => set("agent_id", a.id)} className="mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold">{a.name}</p>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{a.objective}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step: Strategy */}
          {step === "strategy" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold mb-1">Strategy</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">Choose a conversation approach. Deeper strategy comparison is coming in a future release.</p>
              <Select label="Conversation strategy" value={form.strategy} onChange={(e) => set("strategy", e.target.value)} options={STRATEGY_OPTIONS} />
            </div>
          )}

          {/* Step: Threshold */}
          {step === "threshold" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold mb-1">Confidence threshold</h2>
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Resonology AI will execute the recommended action automatically when confidence is above this threshold. Decisions below it are routed to review.
              </p>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium">Auto-act when confidence is above</span>
                  <span className="font-['IBM_Plex_Mono',ui-monospace,monospace] text-[18px] font-semibold text-[var(--color-action-primary)]">{form.confidence_threshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={form.confidence_threshold}
                  onChange={(e) => set("confidence_threshold", Number(e.target.value))}
                  className="w-full accent-[var(--color-action-primary-solid)]"
                />
                <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mt-1">
                  <span>50% — more coverage</span>
                  <span>95% — more precision</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Launch */}
          {step === "launch" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold mb-1">Ready to launch</h2>
              <div className="bg-[var(--color-bg-sunken)] rounded-[var(--radius-sm)] p-4 text-[13px] flex flex-col gap-2">
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Campaign</span><span className="font-medium">{form.name}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Agent</span><span className="font-medium">{agents?.find((a) => a.id === form.agent_id)?.name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Strategy</span><span className="font-medium">{STRATEGY_OPTIONS.find((s) => s.value === form.strategy)?.label.split(" —")[0]}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Auto-action threshold</span><span className="font-['IBM_Plex_Mono',ui-monospace,monospace] font-semibold">{form.confidence_threshold}%</span></div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
            <Button variant="outline" onClick={() => stepIndex > 0 ? setStep(STEPS[stepIndex - 1]) : navigate("/campaigns")}>
              {stepIndex === 0 ? "Cancel" : "Back"}
            </Button>
            {step !== "launch" ? (
              <Button disabled={!canAdvance()} onClick={advance}>Continue</Button>
            ) : (
              <Button loading={loading} size="lg" onClick={launch}>Launch campaign</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
