import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  UploadCloud,
  Download,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useLeads } from '../../api/hooks';
import { CsvImportModal } from './CsvImportModal';
import {
  Button,
  Input,
  FilterBar,
  FilterChip,
  SkeletonTable,
  useToast,
} from '../../components/ui';
import type { Lead } from '../../contracts/entities';
import { PipelineMetricTiles } from './components/PipelineMetricTiles';
import { LeadKanbanBoard } from './components/LeadKanbanBoard';
import { LeadCompactTable } from './components/LeadCompactTable';
import { ScheduleAICallModal } from './components/ScheduleAICallModal';
import { MoveStageModal, PIPELINE_STAGES } from './components/MoveStageModal';
import { AddLeadModal } from './components/AddLeadModal';

export const LeadsPage: React.FC = () => {
  const { toast } = useToast();

  // View state: 'board' (Kanban) or 'compact' (Table)
  const [viewMode, setViewMode] = useState<'board' | 'compact'>(() => {
    return (localStorage.getItem('intellicall_leads_view') as 'board' | 'compact') || 'board';
  });

  const handleToggleView = (mode: 'board' | 'compact') => {
    setViewMode(mode);
    localStorage.setItem('intellicall_leads_view', mode);
  };

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [callModalLead, setCallModalLead] = useState<Lead | null>(null);
  const [moveModalLead, setMoveModalLead] = useState<Lead | null>(null);

  // Data fetching
  const { data: leadsResult, isLoading, refetch } = useLeads({
    search: search.trim() || undefined,
    status: stageFilter || undefined,
  });

  const leads = leadsResult?.data || [];

  // Filter client-side if search or stageFilter
  const filteredLeads = leads.filter((lead: any) => {
    const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || '';
    const matchesSearch = !search.trim() ||
      leadName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(search.toLowerCase())) ||
      (lead.phone && lead.phone.includes(search)) ||
      (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()));

    const currentStage = lead.stage || lead.status;
    const matchesStage = !stageFilter || currentStage === stageFilter;

    return matchesSearch && matchesStage;
  });

  // Export CSV
  const handleExportCsv = () => {
    if (leads.length === 0) {
      toast('No lead records available to export', 'error');
      return;
    }

    const headers = ['Name', 'Phone', 'Email', 'Company', 'Stage', 'Estimated Value', 'Next Action', 'Created At'];
    const rows = leads.map((l: any) => [
      `"${l.name || [l.firstName, l.lastName].filter(Boolean).join(' ') || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.company || ''}"`,
      `"${l.stage || l.status || 'new'}"`,
      `"${l.estimatedValue || l.estimated_value || 0}"`,
      `"${(l.nextAction || l.next_action || '').replace(/"/g, '""')}"`,
      `"${l.createdAt || l.created_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `intellicall_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Exported ${leads.length} prospect records to CSV`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Autonomous Sales Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Sales Pipeline &amp; Prospects
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Manage target prospects, qualification stages, and schedule autonomous Resonology voice calls.
          </p>
        </div>

        {/* Header Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] p-0.5">
            <button
              type="button"
              onClick={() => handleToggleView('board')}
              className={`p-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'board'
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('compact')}
              className={`p-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'compact'
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Compact Table View"
            >
              <List size={14} />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(true)}>
            <UploadCloud size={14} className="mr-1.5" />
            Import CSV
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download size={14} className="mr-1.5" />
            Export CSV
          </Button>

          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Add Prospect
          </Button>
        </div>
      </div>

      {/* Pipeline Summary KPI Tiles */}
      <PipelineMetricTiles leads={leads} isLoading={isLoading} />

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-3 shadow-2xs">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
          <Input
            placeholder="Search leads by name, company, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <FilterBar>
          <FilterChip active={!stageFilter} onClick={() => setStageFilter('')}>
            All Prospects ({leads.length})
          </FilterChip>
          {PIPELINE_STAGES.map((s) => {
            const count = leads.filter((l: any) => (l.stage || l.status) === s.value).length;
            return (
              <FilterChip
                key={s.value}
                active={stageFilter === s.value}
                onClick={() => setStageFilter(stageFilter === s.value ? '' : s.value)}
              >
                {s.label} ({count})
              </FilterChip>
            );
          })}
        </FilterBar>
      </div>

      {/* Main View: Kanban Board or Compact Table */}
      {isLoading ? (
        <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)]">
          <SkeletonTable rows={6} />
        </div>
      ) : viewMode === 'board' ? (
        <LeadKanbanBoard
          leads={filteredLeads}
          onScheduleCall={(lead) => setCallModalLead(lead)}
          onMoveStage={(lead) => setMoveModalLead(lead)}
        />
      ) : (
        <LeadCompactTable
          leads={filteredLeads}
          onScheduleCall={(lead) => setCallModalLead(lead)}
          onMoveStage={(lead) => setMoveModalLead(lead)}
          onAddLead={() => setAddModalOpen(true)}
        />
      )}

      {/* Schedule AI Call Modal */}
      <ScheduleAICallModal
        open={Boolean(callModalLead)}
        lead={callModalLead}
        onClose={() => setCallModalLead(null)}
        onSuccess={() => refetch()}
      />

      {/* Move Stage Modal */}
      <MoveStageModal
        open={Boolean(moveModalLead)}
        lead={moveModalLead}
        onClose={() => setMoveModalLead(null)}
        onSuccess={() => refetch()}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* CSV Bulk Import Modal */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default LeadsPage;
