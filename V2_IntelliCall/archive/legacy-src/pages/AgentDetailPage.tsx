import { useParams, Link } from "react-router-dom";
import { useAgent } from "../hooks";
import ErrorInline from "../components/ui/ErrorInline";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import type { ActionType, AgentStatus } from "../types";

const ACTION_LABELS: Record<ActionType, string> = {
  book_meeting: "Book meeting",
  send_followup: "Send follow-up",
  update_status: "Update lead status",
  escalate: "Escalate to human",
};

function statusVariant(s: AgentStatus) {
  if (s === "active") return "success";
  if (s === "draft") return "neutral";
  return "warning";
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: agent, loading, error, reload } = useAgent(id ?? "");

  if (loading) return <div className="p-4"><div className="h-6 w-48 bg-[var(--color-bg-sunken)] rounded animate-[ic-shimmer_1.5s_infinite]" /></div>;
  if (error) return <div className="p-4"><ErrorInline message="Couldn't load agent." onRetry={reload} /></div>;
  if (!agent) return <div className="p-4 text-[var(--color-text-muted)]">Agent not found.</div>;

  return (
    <div className="max-w-[720px]">
      <nav className="text-[12px] text-[var(--color-text-muted)] mb-4">
        <Link to="/agents" className="hover:text-[var(--color-action-primary)]">Agents</Link>
        <span className="mx-1.5">›</span>
        <span className="text-[var(--color-text-primary)]">{agent.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold">{agent.name}</h1>
          <Badge variant={statusVariant(agent.status)}>{agent.status}</Badge>
        </div>
        <Button>Save changes</Button>
      </div>

      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] p-6 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Agent name" defaultValue={agent.name} />
          <Select
            label="Language"
            defaultValue={agent.language}
            options={[{ value: "English", label: "English" }]}
          />
        </div>
        <Input label="Objective" defaultValue={agent.objective} />
        <Input label="Qualification goal" defaultValue={agent.qualification_goal} />
        <Select
          label="Voice"
          defaultValue={agent.voice}
          options={["Alloy", "Echo", "Nova", "Shimmer"].map((v) => ({ value: v, label: v }))}
        />

        {/* Permitted actions */}
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-secondary)] mb-2">Permitted actions</p>
          <div className="flex flex-col gap-2">
            {(Object.keys(ACTION_LABELS) as ActionType[]).map((action) => (
              <label key={action} className="flex items-center gap-2 text-[13px] cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={agent.permitted_actions.includes(action)}
                  className="accent-[var(--color-action-primary-solid)]"
                />
                <span>{ACTION_LABELS[action]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border-subtle)]">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            The confidence threshold that controls when this agent's actions execute automatically is set at the campaign level, not here.
          </p>
        </div>
      </div>
    </div>
  );
}
