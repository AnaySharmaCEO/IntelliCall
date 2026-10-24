import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PhoneCall,
  ArrowRight,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Trash2,
  Bot,
  ExternalLink,
  Plus,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useLead, useUpdateLead, useDeleteLead, useCalls } from '../../api/hooks';
import {
  Button,
  Input,
  useToast,
  EmptyState,
} from '../../components/ui';
import { PIPELINE_STAGES, MoveStageModal } from './components/MoveStageModal';
import { ScheduleAICallModal } from './components/ScheduleAICallModal';
import { formatPhone, formatDate } from '../../lib/format';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: lead, isLoading: isLoadingLead, refetch: refetchLead } = useLead(id);
  const { data: callsResult, refetch: refetchCalls } = useCalls();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();

  // Modals state
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Note editor state
  const [noteText, setNoteText] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);

  React.useEffect(() => {
    if (lead?.notes) {
      setNoteText(lead.notes);
    }
  }, [lead?.notes]);

  if (isLoadingLead) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 space-y-4">
        <div className="h-6 w-32 bg-[var(--color-bg-sunken)] rounded animate-pulse" />
        <div className="h-40 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] animate-pulse" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Prospect Not Found</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          The requested opportunity record does not exist or has been removed.
        </p>
        <Button asChild variant="outline">
          <Link to="/leads">
            <ArrowLeft size={14} className="mr-1.5" />
            Back to Sales Pipeline
          </Link>
        </Button>
      </div>
    );
  }

  const leadName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || 'Prospect';
  const dealValue = Number(lead.estimatedValue || (lead as any).estimated_value) || 0;
  const currentStage = lead.stage || (lead as any).status || 'new';

  const stageObj = PIPELINE_STAGES.find((s) => s.value === currentStage) || {
    label: currentStage,
    color: 'slate',
  };

  // Compute days in stage
  const daysInStage = lead.daysInStage !== undefined
    ? lead.daysInStage
    : (lead as any).stage_entered_at
    ? Math.floor((Date.now() - new Date((lead as any).stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isStuck = daysInStage > 5 && currentStage !== 'converted' && currentStage !== 'stalled';

  // Filter calls placed to this lead
  const allCalls = callsResult?.data || [];
  const leadCalls = allCalls.filter(
    (c: any) => c.leadId === lead.id || c.lead_id === lead.id
  );

  const handleSaveNotes = async () => {
    if (!id) return;
    try {
      await updateLead.mutateAsync({
        id,
        updates: { notes: noteText },
      });
      toast('Notes updated successfully', 'success');
      setIsEditingNote(false);
      refetchLead();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to update notes', 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteLead.mutateAsync(id);
      toast(`Deleted prospect ${leadName}`, 'success');
      navigate('/leads');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to delete prospect', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Back Link */}
      <div>
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Sales Pipeline</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {leadName}
              </h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentStage === 'converted'
                      ? 'bg-emerald-400'
                      : currentStage === 'stalled'
                      ? 'bg-red-400'
                      : currentStage === 'meeting_booked'
                      ? 'bg-teal-400'
                      : currentStage === 'qualified'
                      ? 'bg-green-400'
                      : currentStage === 'contacted'
                      ? 'bg-blue-400'
                      : 'bg-zinc-400'
                  }`}
                />
                <span>{stageObj.label}</span>
              </span>
            </div>

            <p className="text-sm text-[var(--color-text-secondary)] mt-1 flex items-center gap-2 flex-wrap">
              {lead.company ? (
                <span className="font-medium text-[var(--color-text-primary)]">{lead.company}</span>
              ) : (
                <span>Independent Prospect</span>
              )}
              {lead.title && <span>&bull; {lead.title}</span>}
              {lead.email && <span>&bull; {lead.email}</span>}
            </p>
          </div>

          <div className="md:text-right">
            <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Estimated Deal Value
            </div>
            <div className="font-mono text-2xl md:text-3xl font-bold text-emerald-400 mt-0.5">
              ${dealValue.toLocaleString()}
            </div>
            {lead.nextAction && (
              <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1">
                Next: <span className="text-emerald-400 font-semibold">{lead.nextAction}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stuck Banner */}
        {isStuck && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-[var(--radius-md)] flex items-center gap-2.5 text-xs text-amber-400 font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>
              This opportunity has been stalled in <strong>{stageObj.label}</strong> for {daysInStage} days without forward progression.
            </span>
          </div>
        )}

        {/* Stage Stepper Bar */}
        <div className="pt-2 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-muted)] mb-2">
            <span>PIPELINE PROGRESSION</span>
            <button
              type="button"
              onClick={() => setShowMoveModal(true)}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ArrowRight size={12} />
              <span>Change Stage</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {PIPELINE_STAGES.map((s, idx) => {
              const isCurrent = s.value === currentStage;
              const isPassed = PIPELINE_STAGES.findIndex((x) => x.value === currentStage) >= idx;

              return (
                <div
                  key={s.value}
                  className={`p-2 rounded text-center text-[10px] font-medium border transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold shadow-2xs'
                      : isPassed
                      ? 'bg-[var(--color-bg-sunken)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
                      : 'bg-transparent border-dashed border-[var(--color-border-subtle)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <div className="truncate">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2-Column Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Timeline & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Autonomous AI Calls Timeline */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-2">
                <Bot size={15} className="text-blue-400" />
                <span>Resonology Voice Call History ({leadCalls.length})</span>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCallModal(true)}
                className="h-7 text-xs"
              >
                <PhoneCall size={12} className="mr-1.5 text-emerald-400" />
                Dispatch Call
              </Button>
            </div>

            {leadCalls.length === 0 ? (
              <div className="p-6 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-dashed border-[var(--color-border-subtle)] text-center space-y-3">
                <Bot size={28} className="mx-auto text-[var(--color-text-muted)]" />
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                    No autonomous AI calls placed yet
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Trigger an AI voice agent to qualify this lead, gather facts, or schedule appointments.
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowCallModal(true)}>
                  <PhoneCall size={13} className="mr-1.5" />
                  Dispatch First AI Call
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {leadCalls.map((call: any) => (
                  <div
                    key={call.id}
                    className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                          Outbound Qualification Call
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                            call.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : call.status === 'failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {call.status}
                        </span>
                        {call.sentiment && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                            Sentiment: {call.sentiment}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] font-mono flex items-center gap-3">
                        <span>{formatDate(call.createdAt || call.created_at)}</span>
                        {call.durationSeconds !== undefined && (
                          <span>Duration: {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/calls/${call.id}`}
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Audio &amp; Transcript</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CRM Notes Section */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Sales Notes &amp; Account Intelligence
              </h2>
              {!isEditingNote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingNote(true)}
                  className="h-7 text-xs"
                >
                  Edit Notes
                </Button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] p-3 text-xs outline-none focus:border-emerald-500 min-h-[100px] transition-colors"
                  placeholder="Record deal constraints, client pain points, or conversation takeaways..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes} loading={updateLead.isPending}>
                    <Save size={13} className="mr-1.5" />
                    Save Notes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditingNote(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : noteText ? (
              <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
                {noteText}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)] py-2">
                No notes logged for this opportunity yet. Click "Edit Notes" to capture deal notes.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Quick info & Actions */}
        <div className="space-y-6">
          {/* Opportunity Details Panel */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Prospect Telemetry
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <div>
                  <p className="text-[var(--color-text-muted)]">Verified Phone</p>
                  <p className="font-semibold font-mono text-[var(--color-text-primary)] mt-0.5">
                    {formatPhone(lead.phone)}
                  </p>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-start gap-3">
                  <Mail size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                  <div>
                    <p className="text-[var(--color-text-muted)]">Email Contact</p>
                    <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                      {lead.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <div>
                  <p className="text-[var(--color-text-muted)]">Lead Ingestion Date</p>
                  <p className="font-semibold font-mono text-[var(--color-text-primary)] mt-0.5">
                    {formatDate(lead.createdAt || (lead as any).created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign size={14} className="text-[var(--color-text-muted)] mt-0.5" />
                <div>
                  <p className="text-[var(--color-text-muted)]">Contracted Deal Value</p>
                  <p className="font-semibold font-mono text-emerald-400 mt-0.5">
                    ${dealValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Hub Panel */}
          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-2xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Autonomous Actions
            </h2>

            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => setShowCallModal(true)}
                className="w-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5"
              >
                <PhoneCall size={14} />
                <span>Schedule AI Voice Call</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMoveModal(true)}
                className="w-full text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ArrowRight size={14} />
                <span>Advance Pipeline Stage</span>
              </Button>

              <Button
                asChild
                variant="outline"
                className="w-full text-xs font-semibold"
              >
                <Link to="/appointments">
                  <Calendar size={14} className="mr-1.5" />
                  <span>View Appointments</span>
                </Link>
              </Button>

              <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Opportunity</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule AI Call Modal */}
      <ScheduleAICallModal
        open={showCallModal}
        lead={lead}
        onClose={() => setShowCallModal(false)}
        onSuccess={() => {
          refetchLead();
          refetchCalls();
        }}
      />

      {/* Move Stage Modal */}
      <MoveStageModal
        open={showMoveModal}
        lead={lead}
        onClose={() => setShowMoveModal(false)}
        onSuccess={() => refetchLead()}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-md w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              Permanently delete prospect?
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong>{leadName}</strong>? This action cannot be undone and will purge the prospect record and all associated disposition notes.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDeleteLead}
                loading={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailPage;
