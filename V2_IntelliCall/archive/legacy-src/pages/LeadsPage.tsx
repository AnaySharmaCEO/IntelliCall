import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLeads, useCampaigns } from "../hooks";
import { SkeletonTable } from "../components/ui/Skeleton";
import ErrorInline from "../components/ui/ErrorInline";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ConfidenceIndicator from "../components/shared/ConfidenceIndicator";
import CallWithAIDrawer from "../components/shared/CallWithAIDrawer";
import CsvImportModal from "../components/leads/CsvImportModal";
import { FilterBar, FilterChip } from "../components/ui/FilterBar";
import type { Lead, LeadStatus, ConfidenceTier } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusVariant(s: LeadStatus) {
  if (["qualified", "meeting_booked", "meeting_attended", "converted"].includes(s)) return "success";
  if (["not_qualified", "stalled"].includes(s)) return "error";
  if (s === "opportunity") return "info";
  return "neutral";
}

function statusLabel(s: LeadStatus) {
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type StatusFilter     = "all" | LeadStatus;
type ConfidenceFilter = "all" | ConfidenceTier;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { data: leads, loading, error, reload } = useLeads();
  const { data: campaigns } = useCampaigns();
  const [statusFilter,     setStatusFilter]     = useState<StatusFilter>("all");
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [campaignFilter,   setCampaignFilter]   = useState("all");
  const [search,           setSearch]           = useState("");
  const [callDrawerLead,   setCallDrawerLead]   = useState<Lead | null>(null);
  const [importModalOpen,  setImportModalOpen]  = useState(false);
  const navigate = useNavigate();

  const filtered = (leads ?? []).filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter)            return false;
    if (confidenceFilter !== "all" && l.confidence_tier !== confidenceFilter) return false;
    if (campaignFilter !== "all" && l.campaign_id !== campaignFilter)   return false;
    if (search && !`${l.name} ${l.company}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ fontSize: 22, color: "var(--color-text-primary)" }}>
            Leads
          </h1>
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            All leads across your campaigns.
          </p>
        </div>
        <Button onClick={() => setImportModalOpen(true)}>Import leads</Button>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div style={{ width: 240 }}>
          <Input
            placeholder="Search by name or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <FilterBar>
          <FilterChip active={statusFilter === "all"}          onClick={() => setStatusFilter("all")}>All statuses</FilterChip>
          <FilterChip active={statusFilter === "new"}          onClick={() => setStatusFilter(statusFilter === "new" ? "all" : "new")}>New</FilterChip>
          <FilterChip active={statusFilter === "qualified"}    onClick={() => setStatusFilter(statusFilter === "qualified" ? "all" : "qualified")}>Qualified</FilterChip>
          <FilterChip active={statusFilter === "meeting_booked"} onClick={() => setStatusFilter(statusFilter === "meeting_booked" ? "all" : "meeting_booked")}>Meeting booked</FilterChip>
          <FilterChip active={statusFilter === "not_qualified"} onClick={() => setStatusFilter(statusFilter === "not_qualified" ? "all" : "not_qualified")}>Not qualified</FilterChip>
        </FilterBar>
        <FilterBar>
          <FilterChip active={confidenceFilter === "high"}   onClick={() => setConfidenceFilter(confidenceFilter === "high" ? "all" : "high")}>High</FilterChip>
          <FilterChip active={confidenceFilter === "medium"} onClick={() => setConfidenceFilter(confidenceFilter === "medium" ? "all" : "medium")}>Medium</FilterChip>
          <FilterChip active={confidenceFilter === "low"}    onClick={() => setConfidenceFilter(confidenceFilter === "low" ? "all" : "low")}>Low conf.</FilterChip>
        </FilterBar>
      </div>

      <div
        className="rounded-[var(--radius-md)] overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {loading ? (
          <SkeletonTable rows={6} />
        ) : error ? (
          <div className="p-4">
            <ErrorInline message="Couldn't load leads." onRetry={reload} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
              </svg>
            }
            title={search ? "No results" : "No leads yet"}
            description={
              search
                ? `No leads match "${search}".`
                : "Import your first leads to start a campaign."
            }
            action={
              !search ? { label: "Import leads", onClick: () => setImportModalOpen(true) } : undefined
            }
          />
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Name", "Company", "Status", "Campaign", "Last activity", "Confidence", ""].map(col => (
                  <th
                    key={col}
                    className="text-left text-[12px] font-medium px-3 py-2.5"
                    style={{
                      color: "var(--color-text-secondary)",
                      background: "var(--color-bg-sunken)",
                      borderBottom: "1px solid var(--color-border-default)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => {
                const campaign = (campaigns || []).find(c => c.id === lead.campaign_id);
                return (
                  <tr
                    key={lead.id}
                    className="cursor-pointer group"
                    style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td className="px-3 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {lead.name}
                    </td>
                    <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {lead.company}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={statusVariant(lead.status)}>{statusLabel(lead.status)}</Badge>
                    </td>
                    <td className="px-3 py-3" style={{ color: "var(--color-text-secondary)" }}>
                      {campaign?.name ?? "—"}
                    </td>
                    <td
                      className="px-3 py-3 text-[12px]"
                      style={{ fontFamily: "var(--font-data)", color: "var(--color-text-muted)" }}
                    >
                      {formatDate(lead.last_activity_at)}
                    </td>
                    <td className="px-3 py-3">
                      {lead.confidence_score !== null && lead.confidence_tier ? (
                        <ConfidenceIndicator
                          score={lead.confidence_score}
                          tier={lead.confidence_tier}
                        />
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          title="Call with AI"
                          onClick={e => { e.stopPropagation(); setCallDrawerLead(lead); }}
                          className="p-1.5 rounded-[var(--radius-sm)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          style={{ color: "var(--color-text-muted)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}
                          aria-label={`Call ${lead.name} with AI`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
                          </svg>
                        </button>
                        <Link
                          to={`/leads/${lead.id}`}
                          className="text-[12px] font-semibold hover:underline"
                          style={{ color: "var(--color-action-primary)" }}
                          onClick={e => e.stopPropagation()}
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Result count */}
      {!loading && !error && filtered.length > 0 && (
        <p
          className="text-[12px] mt-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          {statusFilter !== "all" || confidenceFilter !== "all" || search ? " (filtered)" : ""}
        </p>
      )}

      {/* Call with AI drawer */}
      {callDrawerLead && (
        <CallWithAIDrawer
          open={!!callDrawerLead}
          onClose={() => setCallDrawerLead(null)}
          lead={callDrawerLead}
          onCallCreated={() => setCallDrawerLead(null)}
        />
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => reload()}
      />
    </div>
  );
}
