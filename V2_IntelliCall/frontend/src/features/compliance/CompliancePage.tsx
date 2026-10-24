import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import {
  useComplianceRules,
  useCreateComplianceRule,
  useUpdateComplianceRule,
  useDeleteComplianceRule,
} from '../../api/hooks';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  SkeletonTable,
  EmptyState,
  useToast,
} from '../../components/ui';
import type { ComplianceRule } from '../../contracts/entities';

export const CompliancePage: React.FC = () => {
  const { data: rules = [], isLoading } = useComplianceRules();
  const createRule = useCreateComplianceRule();
  const updateRule = useUpdateComplianceRule();
  const deleteRule = useDeleteComplianceRule();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [ruleType, setRuleType] = useState<'required_phrase' | 'forbidden_phrase'>('required_phrase');
  const [description, setDescription] = useState('');
  const [threshold, setThreshold] = useState(0.85);
  const [action, setAction] = useState<'flag' | 'terminate_call' | 'escalate'>('flag');

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createRule.mutateAsync({
        name,
        rule_type: ruleType,
        description,
        threshold,
        action_on_violation: action,
        is_active: true,
      });
      toast('Compliance rule added', 'success');
      setModalOpen(false);
      setName('');
      setDescription('');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to add rule', 'error');
    }
  };

  const handleToggleRule = async (rule: ComplianceRule) => {
    try {
      await updateRule.mutateAsync({
        id: rule.id,
        updates: { is_active: !rule.is_active },
      });
      toast(`Rule ${rule.is_active ? 'deactivated' : 'activated'}`, 'info');
    } catch (err: unknown) {
      toast('Failed to update rule', 'error');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Delete this compliance audit rule?')) {
      await deleteRule.mutateAsync(id);
      toast('Rule deleted', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Regulatory Audit & Safety
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Compliance Policy Engine
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Automated acoustic and transcript audit rules, required disclosures, and prohibited claims.
          </p>
        </div>

        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} className="mr-1.5" />
          Add Compliance Rule
        </Button>
      </div>

      {/* Rules Table */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={4} />
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck size={32} />}
            title="No compliance audit rules active"
            description="Establish disclosure checklists and prohibited phrase filters to audit every call turn."
            action={{
              label: 'Add Compliance Rule',
              onClick: () => setModalOpen(true),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/50 text-[var(--color-text-secondary)] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Policy Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Action on Violation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[var(--color-bg-sunken)]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[var(--color-text-primary)]">
                      {rule.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={rule.rule_type === 'required_phrase' ? 'info' : 'warning'}>
                        {rule.rule_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--color-text-secondary)] max-w-xs">
                      {rule.description || <span className="text-[var(--color-text-muted)]">&mdash;</span>}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-[var(--color-text-primary)]">
                      {Math.round(rule.threshold * 100)}%
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] capitalize text-[var(--color-error)]">
                      {rule.action_on_violation.replace(/_/g, ' ')}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold cursor-pointer ${
                          rule.is_active
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                            : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]'
                        }`}
                      >
                        {rule.is_active ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors cursor-pointer"
                        title="Delete Rule"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Rule */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Establish Compliance Rule">
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Input
            label="Rule Name"
            placeholder="e.g. Call Recording Consent Disclaimer"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Rule Category"
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as any)}
            options={[
              { value: 'required_phrase', label: 'Required Disclosure (Must be stated)' },
              { value: 'forbidden_phrase', label: 'Prohibited Claim (Strictly disallowed)' },
            ]}
          />

          <div>
            <label className="text-[13px] font-medium text-[var(--color-text-secondary)] block mb-1">
              Description / Required Phrasing
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 'This call is recorded for quality and security purposes'..."
              className="w-full p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-sunken)]/40 focus:border-[var(--color-action-primary)] focus:bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] outline-none transition-all duration-150"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-[var(--color-text-secondary)] block mb-1">
                Similarity Threshold ({Math.round(threshold * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-[var(--color-brand-blue)]"
              />
            </div>

            <Select
              label="Action on Breach"
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              options={[
                { value: 'flag', label: 'Flag in Audit Log' },
                { value: 'escalate', label: 'Escalate to Supervisor' },
                { value: 'terminate_call', label: 'Graceful Call Termination' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createRule.isPending}>
              Create Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompliancePage;
