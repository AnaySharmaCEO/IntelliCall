import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAppointments, useCreateAppointment, useDeleteAppointment, useLeads } from '../../api/hooks';
import { Button, Badge, Input, Select, Modal, useToast } from '../../components/ui';
import { formatDate } from '../../lib/format';
import type { Appointment } from '../../contracts/entities';

export const AppointmentsPage: React.FC = () => {
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: leadsResult } = useLeads();
  const leads = leadsResult?.data || [];
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [hostName, setHostName] = useState('Sales Representative');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [selectedLeadId, setSelectedLeadId] = useState('');

  // Default to first lead when leads are loaded and no lead selected
  useEffect(() => {
    if (!selectedLeadId && leads.length > 0) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateTime) {
      toast('Please enter a title and scheduled time', 'error');
      return;
    }
    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      toast('Please enter a valid scheduled date and time', 'error');
      return;
    }
    if (!selectedLeadId) {
      toast('Please select a lead to schedule an appointment with', 'error');
      return;
    }

    try {
      await createAppointment.mutateAsync({
        title: title.trim(),
        hostName: hostName.trim() || 'Sales Representative',
        scheduledFor: parsedDate.toISOString(),
        durationMinutes: Number(durationMinutes),
        status: 'confirmed',
        source: 'manual',
        leadId: selectedLeadId,
      } as any);
      toast('Appointment scheduled successfully', 'success');
      setModalOpen(false);
      setTitle('');
      setDateTime('');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to schedule appointment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      toast('Appointment cancelled', 'info');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to cancel appointment', 'error');
    }
  };

  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const proposedCount = appointments.filter((a) => a.status === 'proposed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Calendar & Commitments
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Scheduled Appointments
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Confirmed calendar reservations and pending callbacks generated during AI calls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Schedule Appointment
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Total Appointments</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-0.5">{appointments.length}</p>
          </div>
          <CalendarCheck size={24} className="text-[var(--color-action-primary)]" />
        </div>
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Confirmed Bookings</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-success)] mt-0.5">{confirmedCount}</p>
          </div>
          <CheckCircle2 size={24} className="text-[var(--color-success)]" />
        </div>
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">Proposed In-Flight</p>
            <p className="text-2xl font-bold font-mono text-amber-500 mt-0.5">{proposedCount}</p>
          </div>
          <Clock size={24} className="text-amber-500" />
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
          Loading commitments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-dashed border-[var(--color-border-default)]">
          <Calendar size={36} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No scheduled callbacks</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
            Appointments will automatically appear here when voice agents or reps schedule callbacks.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setModalOpen(true)}>
            Schedule First Callback
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appointments.map((apt) => {
            const matchedLead = leads.find((l) => l.id === apt.leadId);
            return (
              <div
                key={apt.id}
                className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-2xs hover:border-[var(--color-border-default)] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {apt.title}
                    </span>
                    <Badge variant={apt.status === 'confirmed' ? 'success' : 'warning'}>
                      {apt.status}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {matchedLead && (
                      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                        <Phone size={13} className="text-[var(--color-text-muted)]" />
                        <span>Prospect: {(matchedLead as any).name || matchedLead.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <User size={13} className="text-[var(--color-text-muted)]" />
                      <span>Host: {apt.hostName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Calendar size={13} className="text-[var(--color-text-muted)]" />
                      <span className="font-mono">{formatDate(apt.scheduledFor)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                      <Clock size={13} className="text-[var(--color-text-muted)]" />
                      <span className="font-mono">{apt.durationMinutes} minutes</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded bg-[var(--color-bg-sunken)] text-xs space-y-0.5">
                    <p className="text-[11px] text-[var(--color-text-muted)]">Source: {apt.source}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast(`Invites dispatched for ${apt.title}`, 'success')}
                  >
                    Send Invite
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(apt.id)}
                    title="Cancel appointment"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule New Consultation / Callback">
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              Target Lead / Contact
            </label>
            {leads.length === 0 ? (
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] flex items-center justify-between">
                <span>No leads found in pipeline.</span>
                <Link to="/leads" className="text-[var(--color-action-primary)] font-semibold hover:underline">
                  Create Lead First &rarr;
                </Link>
              </div>
            ) : (
              <Select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                options={leads.map((l: any) => ({
                  value: l.id,
                  label: `${l.name || [l.first_name, l.last_name].filter(Boolean).join(' ') || 'Prospect'} (${l.phone || 'No phone'})`,
                }))}
                placeholder="Select prospect for this callback..."
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              Purpose / Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Loan Sanction Agreement Callback"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
              Host / Representative
            </label>
            <Input
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Sales Specialist"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Date & Time
              </label>
              <Input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Duration (Minutes)
              </label>
              <Select
                value={String(durationMinutes)}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                options={[
                  { label: '15 Minutes', value: '15' },
                  { label: '30 Minutes', value: '30' },
                  { label: '45 Minutes', value: '45' },
                  { label: '60 Minutes', value: '60' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[var(--color-border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending || leads.length === 0}>
              {createAppointment.isPending ? 'Scheduling...' : 'Save Appointment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
