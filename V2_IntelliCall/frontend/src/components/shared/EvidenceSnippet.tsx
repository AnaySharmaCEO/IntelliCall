import { Link } from "react-router-dom";

interface EvidenceSnippetProps {
  quote: string;
  signal: string;
  weight?: string;
  /** When provided, renders a "Show full transcript →" link to /calls/:callId */
  callId?: string | null;
  onShowTranscript?: () => void;
}

export default function EvidenceSnippet({ quote, signal, weight, callId, onShowTranscript }: EvidenceSnippetProps) {
  return (
    <div
      className="pl-3 py-1 mb-2"
      style={{ borderLeft: "3px solid var(--color-border-default)" }}
    >
      <p
        className="text-[13px] line-clamp-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        "{quote}"
      </p>
      <div className="flex items-center justify-between mt-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[11px] font-semibold truncate"
            style={{ color: "var(--color-action-primary)" }}
          >
            {signal}
          </span>
          {weight !== undefined && (
            <span
              className="text-[10px] uppercase tracking-[0.04em] flex-shrink-0"
              style={{ color: "var(--color-text-muted)" }}
            >
              {weight}
            </span>
          )}
        </div>
        {callId && (
          <Link
            to={`/calls/${callId}`}
            className="text-[11px] flex-shrink-0 hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            Show full transcript →
          </Link>
        )}
        {!callId && onShowTranscript && (
          <button
            onClick={onShowTranscript}
            className="text-[11px] flex-shrink-0 transition-colors"
            style={{ color: "var(--color-text-muted)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            Show full transcript →
          </button>
        )}
      </div>
    </div>
  );
}
