// Generic vertical timeline — §33.
// Used for lead activity history and outcome progression.
// Dot color encodes entry type; line connects entries.

export type TimelineEntryType = "call" | "decision" | "outcome" | "note" | "status";

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  title: string;
  description?: string;
  timestamp: string;
  href?: string;
}

interface TimelineProps {
  entries: TimelineEntry[];
}

const dotColors: Record<TimelineEntryType, string> = {
  call:     "var(--color-info)",
  decision: "var(--color-warning)",
  outcome:  "var(--color-success)",
  note:     "var(--color-text-muted)",
  status:   "var(--color-text-muted)",
};

const typeIcons: Record<TimelineEntryType, React.ReactNode> = {
  call: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c1 .3 2 .5 3 .7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  decision: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 11l3 3L22 4" />
    </svg>
  ),
  outcome: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  note: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  status: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-[13px] text-center py-6" style={{ color: "var(--color-text-muted)" }}>
        No activity yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => {
        const color = dotColors[entry.type];
        const isLast = i === entries.length - 1;

        return (
          <div key={entry.id} className="flex gap-3">
            {/* Dot + line */}
            <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  background: color + "22",
                  color,
                  marginTop: 2,
                }}
              >
                {typeIcons[entry.type]}
              </div>
              {!isLast && (
                <div
                  className="flex-1 mt-1"
                  style={{
                    width: 1,
                    background: "var(--color-border-default)",
                    minHeight: 16,
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {entry.href ? (
                    <a
                      href={entry.href}
                      className="hover:underline"
                      style={{ color: "var(--color-action-primary)" }}
                    >
                      {entry.title}
                    </a>
                  ) : (
                    entry.title
                  )}
                </p>
                <span
                  className="flex-shrink-0"
                  style={{
                    fontFamily: "var(--font-data)",
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              {entry.description && (
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {entry.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
