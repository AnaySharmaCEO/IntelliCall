import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Clock,
  PhoneCall,
  Settings,
  DollarSign,
  Users,
  Briefcase,
  Target,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
} from 'lucide-react';
import {
  useCampaigns,
  useAgents,
  useCreateCampaign,
  useUpdateCampaign,
} from '../../api/hooks';
import { StatusChip } from '../../components/patterns';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Skeleton,
  EmptyState,
  useToast,
} from '../../components/ui';
import { formatCurrency } from '../../lib/format';
import type { Campaign } from '../../contracts/entities';

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading } = useCampaigns();
  const { data: agents = [] } = useAgents();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [dailyBudget, setDailyBudget] = useState(5000);
  const [concurrencyLimit, setConcurrencyLimit] = useState(10);
  const [callingStart, setCallingStart] = useState('09:00');
  const [callingEnd, setCallingEnd] = useState('19:00');
  const [strategy, setStrategy] = useState('direct_qualification');
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);

  // Strategy & Value Proposition Fields
  const [companyName, setCompanyName] = useState('Resonology AI');
  const [motto, setMotto] = useState('qualifying high-intent inbound leads within 60 seconds');
  const [offer, setOffer] = useState('a 14-day zero-risk trial with 100 free qualification calls');
  const [primaryPainPoint, setPrimaryPainPoint] = useState('Sales reps wasting 3-4 hours daily manually dialing dial tones');
  const [valueGap, setValueGap] = useState('₹45,000/month in burned payroll per manual dialing SDR');
  const [question1, setQuestion1] = useState('How many inbound leads does your sales team handle per week?');
  const [question2, setQuestion2] = useState('Are you following up manually or through an automated pipeline?');

  // Objection Handling Playbook
  const [objectionBusy, setObjectionBusy] = useState(
    'Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?'
  );
  const [objectionSkeptical, setObjectionSkeptical] = useState(
    'Aapne hamare partner network par rate inquiry check ki thi. Main bas confirm kar raha tha ki aapko genuine details mili ya nahi.'
  );
  const [objectionNotInterested, setObjectionNotInterested] = useState(
    'Totally understand! Would you be opposed if I just kept your contact handy for when your loan renewal comes up?'
  );

  const applyPreset = (preset: 'loans' | 'saas' | 'cards') => {
    if (preset === 'loans') {
      setName('Q4 Priority Auto Loan Refinance');
      setCompanyName('FinEdge Capital');
      setMotto('reducing vehicle financing rates from 14% down to 8.4%');
      setOffer('a complimentary 5-minute portfolio interest audit this Thursday');
      setPrimaryPainPoint('Paying predatory double-digit interest rates on vehicle loans');
      setValueGap('₹4,200/month in avoidable interest overpayments');
      setQuestion1('What interest rate are you currently paying on your primary vehicle loan?');
      setQuestion2('Has your vehicle been registered for over 12 months with clean repayment?');
      setObjectionBusy('Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?');
      setObjectionSkeptical('Aapne hamare partner network par rate comparison check kiya tha. Main bas confirm kar raha tha ki aapko fair rate mila ya nahi.');
      setObjectionNotInterested('Totally understand! Would you be opposed if I just kept your contact handy for when your loan renewal comes up?');
    } else if (preset === 'saas') {
      setName('Inbound Sales AI Qualification');
      setCompanyName('Resonology AI');
      setMotto('qualifying high-intent inbound leads within 60 seconds');
      setOffer('a 14-day zero-risk trial with 100 free qualification calls');
      setPrimaryPainPoint('Sales reps wasting 3-4 hours daily manually dialing dial tones');
      setValueGap('₹45,000/month in burned payroll per manual dialing SDR');
      setQuestion1('How many inbound leads does your sales team handle per week?');
      setQuestion2('Are you following up manually or through an automated pipeline?');
      setObjectionBusy('Understood! Would tomorrow at 11 AM or 3 PM work better for a brief 2-minute sync?');
      setObjectionSkeptical('You requested information regarding automated sales pipeline workflows on our website.');
      setObjectionNotInterested('No problem at all. Would you be opposed if I emailed you our 1-page ROI benchmark?');
    } else {
      setName('Titanium Wealth Credit Card Upgrade');
      setCompanyName('Apex Financial');
      setMotto('unlocking zero forex markup and 5x airport lounge privileges');
      setOffer('a lifetime zero-annual-fee upgrade package dispatched to your door');
      setPrimaryPainPoint('Paying 3.5% foreign exchange fees on international business expenses');
      setValueGap('₹35,000 yearly lost to transaction markup');
      setQuestion1('Do you currently travel internationally or make foreign currency payments?');
      setQuestion2('Would having complimentary unlimited airport lounge access be valuable?');
      setObjectionBusy('Completely understand. Should I follow up via WhatsApp with the upgrade summary?');
      setObjectionSkeptical('This is exclusively for our priority account holders eligible for pre-approved lifetime waivers.');
      setObjectionNotInterested('Understood! Would you mind if we hold the zero-annual-fee tier on your file until month-end?');
    }
    toast('Loaded campaign strategy template', 'info');
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setName('Inbound Lead Qualification');
    setAgentId(agents[0]?.id || '');
    setDailyBudget(5000);
    setConcurrencyLimit(10);
    setCallingStart('09:00');
    setCallingEnd('19:00');
    setStrategy('direct_qualification');
    setConfidenceThreshold(80);
    applyPreset('saas');
    setModalOpen(true);
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCampaign(camp);
    setName(camp.name || '');
    setAgentId((camp as any).agent_id || camp.agentId || agents[0]?.id || '');
    const budget = (camp as any).daily_budget ?? (camp.rules?.budgetCapPaise ? camp.rules.budgetCapPaise / 100 : 5000);
    setDailyBudget(Number(budget));
    const concurrency = (camp as any).concurrency_limit ?? camp.rules?.concurrency ?? 10;
    setConcurrencyLimit(Number(concurrency));
    setCallingStart((camp as any).calling_hours_start || camp.rules?.windowStart || '09:00');
    setCallingEnd((camp as any).calling_hours_end || camp.rules?.windowEnd || '19:00');
    setStrategy((camp as any).strategy || 'direct_qualification');
    setConfidenceThreshold(
      (camp as any).confidence_threshold !== undefined
        ? Number((camp as any).confidence_threshold)
        : (camp as any).confidenceThreshold !== undefined
          ? Number((camp as any).confidenceThreshold)
          : 80
    );

    // Extract strategy config
    const cfg = camp.strategyConfig || (camp as any).strategy_config || {};
    setCompanyName(camp.companyName || (camp as any).company_name || cfg.companyName || cfg.company_name || 'Resonology AI');
    setMotto(camp.motto || cfg.motto || '');
    setOffer(camp.offer || cfg.offer || '');
    setPrimaryPainPoint(camp.primaryPainPoint || (camp as any).primary_pain_point || cfg.primaryPainPoint || cfg.primary_pain_point || '');
    setValueGap(camp.valueGap || (camp as any).value_gap || cfg.valueGap || cfg.value_gap_statement || '');
    
    const questions = camp.qualificationQuestions || (camp as any).qualification_questions || cfg.qualifyingQuestions || cfg.qualifying_questions || [];
    setQuestion1(questions[0] || '');
    setQuestion2(questions[1] || '');

    const playbook = camp.objectionPlaybook || (camp as any).objection_playbook || cfg.objectionPlaybook || cfg.objection_playbook || {};
    setObjectionBusy(playbook.busy || 'Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?');
    setObjectionSkeptical(playbook.skeptical || 'Aapne hamare partner network par rate comparison check kiya tha.');
    setObjectionNotInterested(playbook.not_interested || 'Totally understand! Would you be opposed if I just kept your contact handy?');

    setModalOpen(true);
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const nextStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign.mutateAsync({
        id: campaign.id,
        updates: { status: nextStatus },
      });
      toast(`Campaign ${nextStatus === 'active' ? 'resumed' : 'paused'}`, 'info');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast('Campaign title is required', 'error');
      return;
    }
    if (dailyBudget < 0) {
      toast('Daily budget cannot be negative', 'error');
      return;
    }
    if (concurrencyLimit < 1) {
      toast('Max concurrency limit must be at least 1 line', 'error');
      return;
    }
    if (confidenceThreshold < 0 || confidenceThreshold > 100) {
      toast('Confidence threshold must be between 0 and 100%', 'error');
      return;
    }

    const qualificationQuestions = [question1.trim(), question2.trim()].filter(Boolean);
    const objectionPlaybook = {
      busy: objectionBusy.trim(),
      skeptical: objectionSkeptical.trim(),
      not_interested: objectionNotInterested.trim(),
    };

    const strategyConfig = {
      company_name: companyName.trim() || 'Resonology AI',
      companyName: companyName.trim() || 'Resonology AI',
      motto: motto.trim(),
      offer: offer.trim(),
      primary_pain_point: primaryPainPoint.trim(),
      primaryPainPoint: primaryPainPoint.trim(),
      value_gap_statement: valueGap.trim(),
      value_gap: valueGap.trim(),
      valueGap: valueGap.trim(),
      qualifying_questions: qualificationQuestions,
      qualifyingQuestions: qualificationQuestions,
      objection_playbook: objectionPlaybook,
      objectionPlaybook: objectionPlaybook,
    };

    const payload = {
      name: name.trim(),
      agent_id: agentId || undefined,
      daily_budget: Number(dailyBudget),
      concurrency_limit: Number(concurrencyLimit),
      calling_hours_start: callingStart,
      calling_hours_end: callingEnd,
      strategy,
      confidence_threshold: Number(confidenceThreshold),
      company_name: companyName.trim(),
      companyName: companyName.trim(),
      motto: motto.trim(),
      offer: offer.trim(),
      primary_pain_point: primaryPainPoint.trim(),
      primaryPainPoint: primaryPainPoint.trim(),
      value_gap: valueGap.trim(),
      valueGap: valueGap.trim(),
      qualification_questions: qualificationQuestions,
      qualificationQuestions: qualificationQuestions,
      objection_playbook: objectionPlaybook,
      objectionPlaybook: objectionPlaybook,
      strategy_config: strategyConfig,
      strategyConfig,
    };

    try {
      if (editingCampaign) {
        await updateCampaign.mutateAsync({
          id: editingCampaign.id,
          updates: payload as any,
        });
        toast('Campaign updated successfully', 'success');
      } else {
        await createCampaign.mutateAsync({
          ...payload,
          status: 'active',
        } as any);
        toast('New campaign launched', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Outbound Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Outbound Campaigns
          </h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Orchestrate automated outreach, value propositions, calling schedules, and AI voice persona assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/campaigns/wizard')}
          >
            <Sparkles size={14} className="mr-1.5 text-purple-400" />
            Launch Wizard
          </Button>
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={14} className="mr-1.5" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4">
              <Skeleton width="50%" height={24} />
              <Skeleton width="100%" height={48} />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={36} />}
          title="No campaigns created"
          description="Create your first campaign to begin automated calling to leads in your CRM."
          action={{
            label: 'Create Campaign',
            onClick: openCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((camp) => {
            const assignedAgent = agents.find((a) => a.id === ((camp as any).agent_id || camp.agentId));
            const budgetDisplay = (camp as any).daily_budget
              ? formatCurrency((camp as any).daily_budget)
              : camp.rules?.budgetCapPaise
              ? formatCurrency(camp.rules.budgetCapPaise / 100)
              : 'Unlimited';
            const windowStart = (camp as any).calling_hours_start || camp.rules?.windowStart || '09:00';
            const windowEnd = (camp as any).calling_hours_end || camp.rules?.windowEnd || '19:00';
            const concurrency = (camp as any).concurrency_limit ?? camp.rules?.concurrency ?? 10;
            const cfg = camp.strategyConfig || (camp as any).strategy_config || {};
            const compName = camp.companyName || (camp as any).company_name || cfg.companyName || cfg.company_name;
            const mottoText = camp.motto || cfg.motto;
            const offerText = camp.offer || cfg.offer;
            const questions = camp.qualificationQuestions || (camp as any).qualification_questions || cfg.qualifyingQuestions || cfg.qualifying_questions || [];

            return (
              <div
                key={camp.id}
                className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] space-y-4 shadow-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-[var(--color-border-default)] transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)]">
                          {camp.name}
                        </h3>
                        {compName && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-[11px]">
                            {compName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        ID: {camp.id}
                      </span>
                    </div>
                    <StatusChip status={camp.status} type="campaign" />
                  </div>

                  {/* Strategic Value Proposition Preview */}
                  {(mottoText || offerText) && (
                    <div className="p-3 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-1.5 text-xs">
                      {mottoText && (
                        <p className="text-[var(--color-text-secondary)] italic">
                          "{mottoText}"
                        </p>
                      )}
                      {offerText && (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                          <Sparkles size={12} />
                          <span>Offer: {offerText}</span>
                        </div>
                      )}
                      {questions.length > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)] block font-mono">
                          {questions.length} diagnostic discovery question{questions.length > 1 ? 's' : ''} configured
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Assigned Agent
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        {assignedAgent?.name || 'Unassigned'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Daily Budget
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                        {budgetDisplay}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Calling Window
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                        {windowStart} - {windowEnd}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-[var(--color-bg-sunken)]">
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase block">
                        Max Concurrency
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)] font-mono">
                        {concurrency} lines
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
                  <Button
                    variant={camp.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleToggleStatus(camp)}
                    disabled={updateCampaign.isPending}
                  >
                    {camp.status === 'active' ? (
                      <>
                        <Pause size={13} className="mr-1.5" /> Pause Campaign
                      </>
                    ) : (
                      <>
                        <Play size={13} className="mr-1.5" /> Launch Campaign
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(camp)}
                    disabled={updateCampaign.isPending}
                  >
                    <Settings size={13} className="mr-1.5" /> Edit Campaign
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Campaign */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCampaign ? 'Edit Outbound Campaign' : 'Create Outbound Campaign'}
      >
        <form onSubmit={handleSave} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Quick Presets */}
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb size={13} className="text-amber-400" />
              <span>Quick Strategy Presets</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('loans')}
                className="px-2.5 py-1 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-primary)] font-medium cursor-pointer"
              >
                🚘 Auto Loan Refinance
              </button>
              <button
                type="button"
                onClick={() => applyPreset('saas')}
                className="px-2.5 py-1 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-primary)] font-medium cursor-pointer"
              >
                ⚡ Inbound B2B SaaS
              </button>
              <button
                type="button"
                onClick={() => applyPreset('cards')}
                className="px-2.5 py-1 rounded bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-primary)] font-medium cursor-pointer"
              >
                💳 Wealth Card Upgrade
              </button>
            </div>
          </div>

          <Input
            label="Campaign Title"
            placeholder="e.g. Q4 Auto Loan Refinancing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Strategic Chameleon Settings */}
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-3">
            <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Briefcase size={14} className="text-blue-400" />
              <span>Conversational Strategy & Brand Identity</span>
            </span>
            
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Company / Brand Name"
                placeholder="e.g. FinEdge Capital"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Cost of Inaction / Value Gap"
                placeholder="e.g. ₹4,200/mo avoidable interest"
                value={valueGap}
                onChange={(e) => setValueGap(e.target.value)}
              />
            </div>

            <Input
              label="Mission / Motto (Delivered in Turn 2)"
              placeholder="e.g. reducing vehicle financing rates from 14% down to 8.4%"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              required
            />

            <Input
              label="Target Offer / Next Step"
              placeholder="e.g. a complimentary 5-minute portfolio interest audit this Thursday"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              required
            />

            <Input
              label="Diagnostic Discovery Question 1"
              placeholder="e.g. What interest rate are you currently paying on your primary vehicle loan?"
              value={question1}
              onChange={(e) => setQuestion1(e.target.value)}
            />

            <Input
              label="Diagnostic Discovery Question 2"
              placeholder="e.g. Has your vehicle been registered for over 12 months with clean repayment?"
              value={question2}
              onChange={(e) => setQuestion2(e.target.value)}
            />
          </div>

          {/* Objection Playbook Configuration */}
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-3">
            <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-emerald-400" />
              <span>Objection Handling Playbook (Psychological Reframes)</span>
            </span>

            <Input
              label="When Prospect is Busy / Driving / In a Hurry"
              placeholder="Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?"
              value={objectionBusy}
              onChange={(e) => setObjectionBusy(e.target.value)}
            />

            <Input
              label="When Prospect is Skeptical ('Who gave you my number?')"
              placeholder="Aapne hamare partner network par inquiry check ki thi..."
              value={objectionSkeptical}
              onChange={(e) => setObjectionSkeptical(e.target.value)}
            />

            <Input
              label="When Prospect says 'Not Interested'"
              placeholder="Totally understand! Would you be opposed if I just kept your contact handy...?"
              value={objectionNotInterested}
              onChange={(e) => setObjectionNotInterested(e.target.value)}
            />
          </div>

          <Select
            label="Assign AI Voice Agent"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            options={[
              { value: '', label: 'Unassigned (None)' },
              ...agents.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.roleTitle || (a as any).role_title || 'Consultant'} • ${a.voiceModel || (a as any).voice_model || a.voice || 'Aoede'})`,
              })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Daily Budget (INR)"
              type="number"
              min={0}
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
            />
            <Input
              label="Max Concurrency Limit"
              type="number"
              min={1}
              value={concurrencyLimit}
              onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calling Hours Start (24h)"
              type="time"
              value={callingStart}
              onChange={(e) => setCallingStart(e.target.value)}
            />
            <Input
              label="Calling Hours End (24h)"
              type="time"
              value={callingEnd}
              onChange={(e) => setCallingEnd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Dialing & Conversation Strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              options={[
                { value: 'direct_qualification', label: 'Direct Qualification' },
                { value: 'aggressive_followup', label: 'Aggressive Follow-up' },
                { value: 'appointment_booking', label: 'Appointment Booking' },
                { value: 'conversational_survey', label: 'Conversational Survey' },
              ]}
            />
            <Input
              label="Confidence Threshold (%)"
              type="number"
              min={1}
              max={100}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border-subtle)]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={createCampaign.isPending || updateCampaign.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={editingCampaign ? updateCampaign.isPending : createCampaign.isPending}
              disabled={createCampaign.isPending || updateCampaign.isPending}
            >
              {editingCampaign ? 'Save Changes' : 'Launch Campaign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CampaignsPage;
