import React, { useState, useRef } from "react";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { leadsService } from "../../services";
import {
  CANONICAL_LEAD_FIELDS,
  detectColumnMapping,
} from "../../config/leadImportFieldAliases";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type ImportStep = "upload" | "mapping" | "validate" | "importing";

interface ParsedRow {
  [rawHeader: string]: string;
}

interface ValidatedLead {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  isValid: boolean;
  validationError?: string;
}

/**
 * Standard client-side RFC 4180 CSV parser supporting commas, quotes, and newlines.
 */
function parseCsvContent(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentVal.trim());
      currentVal = "";
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map(h => h.trim());
  const rows = lines.slice(1).map(row => {
    const rowObj: ParsedRow = {};
    headers.forEach((h, index) => {
      rowObj[h] = row[index] || "";
    });
    return rowObj;
  });

  return { headers, rows };
}

export default function CsvImportModal({
  open,
  onClose,
  onImportSuccess,
}: CsvImportModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [fileName, setFileName] = useState("");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
  });
  const [validatedLeads, setValidatedLeads] = useState<ValidatedLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({ name: "", email: "", phone: "", company: "", source: "" });
    setValidatedLeads([]);
    setError(null);
    setLoading(false);
  };

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid .csv file.");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError("File exceeds 5MB limit. Please upload a smaller CSV file.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { headers, rows } = parseCsvContent(text);

        if (headers.length === 0 || rows.length === 0) {
          setError("The uploaded CSV file is empty or missing content.");
          return;
        }

        setRawHeaders(headers);
        setRawRows(rows);

        // Auto-detect aliases mapping
        const initialMapping = detectColumnMapping(headers);
        setColumnMapping(initialMapping);

        setStep("mapping");
      } catch (err: any) {
        setError(err.message || "Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  // Step 2: Validate Mapping
  const handleProceedToValidation = () => {
    setError(null);
    if (!columnMapping.name) {
      setError("Please map the required 'Name' field to an uploaded column.");
      return;
    }
    if (!columnMapping.email) {
      setError("Please map the required 'Email' field to an uploaded column.");
      return;
    }

    // Validate rows
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validated: ValidatedLead[] = rawRows.map((row) => {
      const name = (row[columnMapping.name] || "").trim();
      const email = (row[columnMapping.email] || "").trim();
      const phone = columnMapping.phone ? (row[columnMapping.phone] || "").trim() : "";
      const company = columnMapping.company ? (row[columnMapping.company] || "").trim() : "";
      const source = columnMapping.source ? (row[columnMapping.source] || "").trim() : "";

      if (!name) {
        return { name, email, phone, company, source, isValid: false, validationError: "Missing name" };
      }
      if (!email || !emailRegex.test(email)) {
        return { name, email, phone, company, source, isValid: false, validationError: "Invalid or missing email" };
      }

      return { name, email, phone, company, source, isValid: true };
    });

    setValidatedLeads(validated);
    setStep("validate");
  };

  // Step 3: Push Batched to Backend
  const handleConfirmImport = async () => {
    const validOnes = validatedLeads.filter(l => l.isValid);
    if (validOnes.length === 0) {
      setError("No valid leads available to import.");
      return;
    }

    setLoading(true);
    setStep("importing");
    setError(null);

    try {
      const { insertedCount, error: insertErr } = await leadsService.insertBatch(validOnes);
      if (insertErr) {
        throw insertErr;
      }

      toast(`Successfully imported ${insertedCount} leads into your workspace.`);
      onImportSuccess();
      handleReset();
      onClose();
    } catch (err: any) {
      console.error("CSV import failed:", err);
      setError(err.message || "Failed to push leads to Supabase. Please retry.");
      setStep("validate");
    } finally {
      setLoading(false);
    }
  };

  const validCount = validatedLeads.filter(l => l.isValid).length;
  const invalidCount = validatedLeads.length - validCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleReset();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-[620px] rounded-[var(--radius-lg)] p-6 flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border-subtle)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-subtle)]">
          <div>
            <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
              Import Leads from CSV
            </h2>
            <p className="text-[12px] text-[var(--color-text-secondary)]">
              {step === "upload" && "Upload a .csv file of contacts to populate your pipeline."}
              {step === "mapping" && "Match your uploaded column names to IntelliCall lead fields."}
              {step === "validate" && "Review validation before adding leads to your workspace."}
              {step === "importing" && "Inserting leads into your database…"}
            </p>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            disabled={loading}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-sm)]"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="mt-4 p-3 rounded-[var(--radius-sm)] text-[12px] flex items-center gap-2"
            style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="py-4 overflow-y-auto flex-1">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) handleFileProcess(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[var(--radius-md)] p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-[var(--color-action-primary)] bg-[var(--color-bg-sunken)]"
                    : "border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] bg-[var(--color-bg-primary)]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
                  }}
                />
                <div className="w-10 h-10 mx-auto mb-3 text-[var(--color-text-muted)] flex items-center justify-center rounded-full bg-[var(--color-bg-sunken)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)] mb-1">
                  Drag and drop your CSV file here, or browse
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Supports .csv files up to 5MB
                </p>
              </div>

              {/* Demo template download */}
              <div className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    Need an example file?
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Contains headers like 'Full Name', 'Email Address', 'Company Name' to test auto-mapping.
                  </p>
                </div>
                <a
                  href="/sample-leads-import.csv"
                  download="sample-leads-import.csv"
                  className="text-[12px] font-semibold text-[var(--color-action-primary)] hover:underline whitespace-nowrap ml-3"
                >
                  Download example CSV ↓
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === "mapping" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-[12px] text-[var(--color-text-muted)]">
                <span>File: <strong className="text-[var(--color-text-primary)]">{fileName}</strong> ({rawRows.length} rows)</span>
                <span>{rawHeaders.length} columns detected</span>
              </div>

              {/* Mapping Form */}
              <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] overflow-hidden">
                <div className="grid grid-cols-[1fr_1.5fr] bg-[var(--color-bg-sunken)] px-3 py-2 text-[11px] font-medium text-[var(--color-text-secondary)] border-b border-[var(--color-border-default)]">
                  <span>IntelliCall Field</span>
                  <span>Your CSV Column</span>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
                  {CANONICAL_LEAD_FIELDS.map((field) => {
                    const selected = columnMapping[field.key] || "";
                    return (
                      <div key={field.key} className="grid grid-cols-[1fr_1.5fr] items-center px-3 py-2.5 gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-[10px] text-[var(--color-error)] font-semibold">*</span>
                          )}
                        </div>
                        <select
                          value={selected}
                          onChange={(e) =>
                            setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="h-8 px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] text-[12px] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-action-primary)]"
                        >
                          <option value="">
                            {field.required ? "— Select uploaded column —" : "(Not in this file)"}
                          </option>
                          {rawHeaders.map((hdr) => (
                            <option key={hdr} value={hdr}>
                              {hdr}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* First rows preview */}
              <div>
                <p className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1.5">
                  File Preview (First {Math.min(3, rawRows.length)} rows):
                </p>
                <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--color-bg-sunken)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                      <tr>
                        {rawHeaders.map(h => (
                          <th key={h} className="px-2 py-1.5 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0">
                          {rawHeaders.map(h => (
                            <td key={h} className="px-2 py-1.5 truncate max-w-[120px] text-[var(--color-text-primary)]">
                              {row[h] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATE & PREVIEW */}
          {step === "validate" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-success)] text-white font-bold text-[12px]">
                  ✓
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    {validCount} of {validatedLeads.length} leads valid
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {invalidCount > 0
                      ? `${invalidCount} row(s) have missing name or invalid email and will be skipped.`
                      : "All rows passed verification and are ready to import."}
                  </p>
                </div>
              </div>

              <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] overflow-x-auto max-h-[260px]">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-[var(--color-bg-sunken)] border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Company</th>
                      <th className="px-3 py-2 font-medium">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {validatedLeads.slice(0, 10).map((lead, idx) => (
                      <tr key={idx} className={lead.isValid ? "" : "bg-red-500/5"}>
                        <td className="px-3 py-2">
                          {lead.isValid ? (
                            <span className="text-[10px] font-semibold text-[var(--color-success)] uppercase">Valid</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[var(--color-error)] uppercase" title={lead.validationError}>
                              {lead.validationError}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-[var(--color-text-primary)]">{lead.name || "—"}</td>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">{lead.email || "—"}</td>
                        <td className="px-3 py-2 text-[var(--color-text-secondary)]">{lead.company || "—"}</td>
                        <td className="px-3 py-2 text-[var(--color-text-muted)]">{lead.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {validatedLeads.length > 10 && (
                <p className="text-[11px] text-[var(--color-text-muted)] text-center">
                  Showing first 10 rows of {validatedLeads.length} total.
                </p>
              )}
            </div>
          )}

          {/* STEP 4: IMPORTING */}
          {step === "importing" && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--color-action-primary)] border-t-transparent animate-spin mb-4" />
              <h3 className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">
                Pushing leads to your workspace…
              </h3>
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                Inserting records in batches with full organization isolation.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== "importing" && (
          <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
            {step === "upload" ? (
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setStep(step === "validate" ? "mapping" : "upload")}
              >
                ← Back
              </Button>
            )}

            {step === "mapping" && (
              <Button onClick={handleProceedToValidation}>
                Validate & Preview →
              </Button>
            )}

            {step === "validate" && (
              <Button
                onClick={handleConfirmImport}
                loading={loading}
                disabled={validCount === 0}
              >
                Import {validCount} Valid Leads
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
