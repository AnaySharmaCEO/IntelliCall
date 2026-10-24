import { useNavigate } from "react-router-dom";
import { useAgents } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import type { AgentStatus, ActionType } from "../types";

function statusVariant(s: AgentStatus) {
  if (s === "active") return "success";
  if (s === "draft")  return "neutral";
  return "warning";
}

const ACTION_LABELS: Record<ActionType, string> = {
  book_meeting:  "Book meeting",
  send_followup: "Send follow-up",
  update_status: "Update status",
  escalate:      "Escalate",
};

export default function AgentsPage() {
  const { data: agents, loading, error, reload } = useAgents();
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ fontSize: 22, color: "var(--color-text-primary)" }}>
            Agents
          </h1>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            AI agents configured to run calls for your campaigns.
          </p>
        </div>
        <Button>New agent</Button>
      </div>

      {loading ? (
        <SkeletonTable rows={3} />
      ) : error ? (
        <ErrorInline message="Couldn't load agents." onRetry={reload} />
      ) : !agents?.length ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
            </svg>
          }
          title="No agents configured"
          description="Create an agent to run calls in your campaigns."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {agents.map(agent => (
            <div
              key={agent.id}
              className="rounded-[var(--radius-md)] p-5 cursor-pointer"
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border-subtle)",
                boxShadow: "var(--shadow-sm)",
              }}
              onClick={() => navigate(`/agents/${agent.id}`)}
              onMouseEnter={e =>
                (e.currentTarget.style.boxShadow = "var(--shadow-md)")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
              }
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-[14px] font-semibold">{agent.name}</h2>
                  <Badge variant={statusVariant(agent.status)}>{agent.status}</Badge>
                </div>
                <button
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: "var(--color-action-primary)" }}
                  onClick={e => { e.stopPropagation(); navigate(`/agents/${agent.id}`); }}
                >
                  Configure →
                </button>
              </div>

              <p className="text-[13px] mb-3" style={{ color: "var(--color-text-secondary)" }}>
                {agent.objective}
              </p>

              <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                <span>{agent.language}</span>
                <span>Voice: {agent.voice}</span>
                <span>
                  Permitted:{" "}
                  {agent.permitted_actions.map(a => ACTION_LABELS[a]).join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
