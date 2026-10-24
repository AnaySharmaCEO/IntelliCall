import React from 'react';
import Badge, { type BadgeVariant } from '../ui/Badge';
import type { CallStatus, Sentiment, LeadStatus, CampaignStatus, AgentStatus } from '../../contracts/enums';

export interface StatusChipProps {
  status: CallStatus | Sentiment | LeadStatus | CampaignStatus | AgentStatus | string;
  type?: 'call' | 'sentiment' | 'lead' | 'campaign' | 'agent';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, type = 'call', className }) => {
  let variant: BadgeVariant = 'neutral';
  let label = String(status).replace(/_/g, ' ');

  if (type === 'sentiment') {
    switch (status) {
      case 'positive':
        variant = 'success';
        break;
      case 'negative':
        variant = 'error';
        break;
      case 'neutral':
        variant = 'info';
        break;
      case 'mixed':
        variant = 'warning';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'call') {
    switch (status) {
      case 'completed':
        variant = 'success';
        break;
      case 'in_progress':
      case 'ringing':
        variant = 'info';
        break;
      case 'failed':
      case 'busy':
        variant = 'error';
        break;
      case 'queued':
        variant = 'warning';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'lead') {
    switch (status) {
      case 'converted':
        variant = 'success';
        break;
      case 'in_progress':
      case 'qualified':
        variant = 'info';
        break;
      case 'failed':
      case 'disqualified':
        variant = 'error';
        break;
      case 'pending':
        variant = 'warning';
        break;
      default:
        variant = 'neutral';
    }
  } else if (type === 'campaign' || type === 'agent') {
    switch (status) {
      case 'active':
        variant = 'success';
        break;
      case 'paused':
        variant = 'warning';
        break;
      case 'draft':
      case 'archived':
        variant = 'neutral';
        break;
      default:
        variant = 'neutral';
    }
  }

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

export default StatusChip;
