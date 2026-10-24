import { useCampaigns } from "../hooks";

function strategyLabel(key: string) {
  if (key === "direct_qualification")    return "Direct qualification";
  if (key === "discovery_first")         return "Discovery-first";
  if (key === "value_first")             return "Value-first";
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function StrategiesPage() {
  const { data: campaigns } = useCampaigns();

  // Aggregate qualification rate by strategy type from campaigns
  const map: Record<string, { total: number; qualified: number }> = {};
  for (const c of (campaigns || [])) {
    const s = c.strategy ?? "direct_qualification";
    if (!map[s]) map[s] = { total: 0, qualified: 0 };
    map[s].total += c.leads_targeted;
    if (c.qualification_rate !== null) {
      map[s].qualified += Math.round((c.qualification_rate / 100) * c.leads_targeted);
    }
  }

  const stats = Object.entries(map).map(([strategy, { total, qualified }]) => ({
    strategy,
    rate: total > 0 ? Math.round((qualified / total) * 100) : null,
    campaigns: (campaigns || []).filter(c => c.strategy === strategy).length,
  })).filter(s => s.rate !== null);

  const hasData = stats.length > 0;

  return (
    <div className="max-w-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <h1
          className="text-[22px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Strategies
        </h1>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-pill)]"
          style={{
            background: "var(--color-bg-sunken)",
            color: "var(--color-text-muted)",
          }}
        >
          Coming later
        </span>
      </div>
      <p className="text-[13px] mb-6" style={{ color: "var(--color-text-secondary)" }}>
        Strategy comparison will unlock once enough outcome data exists.
      </p>

      {/* Explainer */}
      <div
        className="rounded-[var(--radius-md)] p-5 mb-6"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-[14px] font-semibold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          What strategy comparison will do
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Once your campaigns generate enough resolved outcomes, IntelliCall will compare
          conversation strategies — direct qualification, problem-first discovery, value-first
          discovery — against real conversion outcomes, not just call volume or qualification
          rate. You'll see which strategy produces the highest decision accuracy and shortest
          time-to-close for each segment. This view unlocks automatically as data accumulates;
          nothing needs to be configured.
        </p>
      </div>

      {/* Read-only data preview (only shown if data exists) */}
      {hasData && (
        <div
          className="rounded-[var(--radius-md)]"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border-subtle)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
          >
            <div>
              <h2
                className="text-[14px] font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Qualification rate by strategy
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Read-only preview — comparison controls coming later.
              </p>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            {stats.map(s => (
              <div key={s.strategy}>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {strategyLabel(s.strategy)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {s.campaigns} campaign{s.campaigns !== 1 ? "s" : ""}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-data)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {s.rate}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-1.5 rounded-[var(--radius-pill)]"
                  style={{ background: "var(--color-bg-sunken)" }}
                >
                  <div
                    className="h-full rounded-[var(--radius-pill)]"
                    style={{
                      width: `${s.rate}%`,
                      background: "var(--color-action-primary-solid)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
