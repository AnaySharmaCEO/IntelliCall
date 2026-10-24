import React, { useState } from 'react';
import { Modal, Button, Input, Select, useToast } from '../../../components/ui';
import { useCreateLead, useCampaigns } from '../../../api/hooks';
import { PIPELINE_STAGES } from './MoveStageModal';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ open, onClose, onSuccess }) => {
  const { toast } = useToast();
  const createLead = useCreateLead();
  const { data: campaigns = [] } = useCampaigns();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('new');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [campaignId, setCampaignId] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setCompany('');
    setTitle('');
    setStage('new');
    setEstimatedValue('');
    setNextAction('');
    setCampaignId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) return;

    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    try {
      await createLead.mutateAsync({
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        title: title.trim() || undefined,
        stage: stage as any,
        status: stage as any,
        estimatedValue: estimatedValue ? Number(estimatedValue) : 0,
        nextAction: nextAction.trim() || undefined,
        campaignId: campaignId || undefined,
      } as any);

      toast(`Added ${fullName} to sales pipeline`, 'success');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to add lead', 'error');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Target Prospect"
      description="Create a new lead opportunity in your outbound sales pipeline"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name inputs */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="e.g. Rahul"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            placeholder="e.g. Verma"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            hint="E.164 international format"
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="prospect@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Company & Title */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Company"
            placeholder="e.g. Acme Tech"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Input
            label="Job Title"
            placeholder="e.g. VP of Sales"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Pipeline Stage & Deal Value */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Initial Pipeline Stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={PIPELINE_STAGES.map((s) => ({ value: s.value, label: s.label }))}
          />
          <Input
            label="Estimated Deal Value ($)"
            type="number"
            placeholder="e.g. 5000"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </div>

        {/* Next Action */}
        <Input
          label="Initial Next Action"
          placeholder="e.g. Place initial qualification call..."
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
        />

        {/* Campaign assignment */}
        <Select
          label="Assign to Campaign (Optional)"
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          options={campaigns.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select an active campaign..."
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={createLead.isPending}>
            Save Prospect Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};
