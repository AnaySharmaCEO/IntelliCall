import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import { Modal, Button, useToast } from '../../components/ui';
import { useCreateLeadsBulk, useCampaigns } from '../../api/hooks';
import type { Lead } from '../../contracts/entities';

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  [header: string]: string;
}

interface MappedLead {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  isValid: boolean;
  error?: string;
}

function parseCsvText(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    if (values.length === 0 || values.every((v) => !v)) continue;

    const rowObj: ParsedRow = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<MappedLead[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: campaigns = [] } = useCampaigns();
  const createBulk = useCreateLeadsBulk();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const { headers, rows } = parseCsvText(content);
      const mapped: MappedLead[] = rows.map((r) => {
        // Find best matching keys
        const fNameKey = headers.find((h) => /first|f_name|fname|name/i.test(h));
        const lNameKey = headers.find((h) => /last|l_name|lname|surname/i.test(h));
        const phoneKey = headers.find((h) => /phone|mobile|tel|contact/i.test(h));
        const emailKey = headers.find((h) => /email|mail/i.test(h));
        const companyKey = headers.find((h) => /company|org|business/i.test(h));

        const fullName = fNameKey ? r[fNameKey] : '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = lNameKey ? r[lNameKey] : nameParts.slice(1).join(' ');
        const phone = phoneKey ? r[phoneKey] : '';
        const email = emailKey ? r[emailKey] : '';
        const company = companyKey ? r[companyKey] : '';

        const isValid = Boolean(firstName && phone);
        const error = !firstName ? 'Missing Name' : !phone ? 'Missing Phone' : undefined;

        return {
          firstName,
          lastName,
          phone,
          email,
          company,
          isValid,
          error,
        };
      });

      setParsedLeads(mapped);
    };
    reader.readAsText(selected);
  };

  const handleImport = async () => {
    const validLeads = parsedLeads.filter((l) => l.isValid);
    if (validLeads.length === 0) {
      toast('No valid prospect rows to import', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const payload: Partial<Lead>[] = validLeads.map((l) => ({
        name: [l.firstName, l.lastName].filter(Boolean).join(' ') || 'Prospect',
        first_name: l.firstName,
        last_name: l.lastName || undefined,
        phone: l.phone,
        email: l.email || undefined,
        company: l.company || undefined,
        campaign_id: selectedCampaignId || undefined,
        status: 'new' as any,
      }));

      await createBulk.mutateAsync(payload);
      toast(`Successfully imported ${payload.length} prospect records`, 'success');
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedLeads([]);
    onClose();
  };

  const validCount = parsedLeads.filter((l) => l.isValid).length;
  const invalidCount = parsedLeads.length - validCount;

  return (
    <Modal open={open} onClose={handleClose} title="Import Prospects via CSV" size="lg">
      <div className="space-y-5 mt-2">
        {/* Upload Dropzone */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-8 text-center cursor-pointer hover:border-[var(--color-action-primary)] hover:bg-[var(--color-bg-sunken)]/40 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud size={36} className="mx-auto text-[var(--color-text-muted)] mb-2" />
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Click to select or drag and drop a CSV file
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Supports standard column headers: Name, First Name, Last Name, Phone, Email, Company
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info pill */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] text-xs">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--color-action-primary)]" />
                <span className="font-semibold text-[var(--color-text-primary)]">{file.name}</span>
                <span className="text-[var(--color-text-muted)] font-mono">({parsedLeads.length} total rows)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setParsedLeads([]);
                }}
              >
                Change File
              </Button>
            </div>

            {/* Campaign Selector */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-1">
                Assign to Outbound Campaign (Optional)
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full h-9 px-3 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)]"
              >
                <option value="">No Campaign Assignment (General Pool)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Validation Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-[var(--color-success-bg)]/30 border border-[var(--color-success)]/20 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[var(--color-success)]" />
                <span><strong>{validCount}</strong> valid prospects ready</span>
              </div>
              <div className="p-3 rounded bg-[var(--color-error-bg)]/30 border border-[var(--color-error)]/20 flex items-center gap-2">
                <AlertCircle size={16} className="text-[var(--color-error)]" />
                <span><strong>{invalidCount}</strong> rows skipped (missing name/phone)</span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-56 overflow-y-auto border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--color-bg-sunken)] sticky top-0 border-b border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
                  <tr>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] font-mono text-[11px]">
                  {parsedLeads.slice(0, 10).map((l, i) => (
                    <tr key={i} className="hover:bg-[var(--color-bg-sunken)]/40">
                      <td className="py-1.5 px-3 font-sans font-medium text-[var(--color-text-primary)]">
                        {l.firstName} {l.lastName}
                      </td>
                      <td className="py-1.5 px-3 text-[var(--color-text-secondary)]">{l.phone || '—'}</td>
                      <td className="py-1.5 px-3 text-[var(--color-text-muted)]">{l.email || '—'}</td>
                      <td className="py-1.5 px-3">
                        {l.isValid ? (
                          <span className="text-[var(--color-success)] font-semibold">Valid</span>
                        ) : (
                          <span className="text-[var(--color-error)]">{l.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} loading={isProcessing} disabled={validCount === 0}>
                Import {validCount} Prospects
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CsvImportModal;
