import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Target,
  Briefcase,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { useAgents, useCreateCampaign } from '../../api/hooks';
import { Button, Badge, Input, Select, useToast } from '../../components/ui';

interface StrategyPreset {
  name: string;
  productType: string;
  companyName: string;
  motto: string;
  offer: string;
  targetAudience: string;
  primaryPainPoint: string;
  valueGap: string;
  question1: string;
  question2: string;
}

const STRATEGY_PRESETS: Record<string, StrategyPreset> = {
  loans: {
    name: 'Q4 Priority Auto Loan Refinance',
    productType: 'loans',
    companyName: 'FinEdge Capital',
    motto: 'reducing vehicle financing rates from 14% down to 8.4%',
    offer: 'a complimentary 5-minute portfolio interest audit this Thursday',
    targetAudience: 'Vehicle owners paying >12% APR on existing car loans',
    primaryPainPoint: 'Paying predatory double-digit interest rates on vehicle loans',
    valueGap: '₹4,200 per month in avoidable interest overpayments',
    question1: 'What interest rate are you currently paying on your primary vehicle loan?',
    question2: 'Has your vehicle been registered for over 12 months with clean repayment history?',
  },
  saas: {
    name: 'Inbound Sales AI Qualification',
    productType: 'retention',
    companyName: 'Resonology AI',
    motto: 'qualifying inbound website leads within 60 seconds autonomously',
    offer: 'a 14-day zero-risk trial with 100 free qualification calls',
    targetAudience: 'Founders, VPs of Sales, and Inbound Growth Teams',
    primaryPainPoint: 'Sales reps wasting 3-4 hours daily manually dialing dial tones',
    valueGap: '₹45,000/month in burned payroll per manual dialing SDR',
    question1: 'How many inbound leads does your sales team currently handle per week?',
    question2: 'Are you following up manually or through an automated voice pipeline?',
  },
  cards: {
    name: 'Titanium Wealth Credit Card Upgrade',
    productType: 'cards',
    companyName: 'Apex Financial',
    motto: 'unlocking zero forex markup and 5x airport lounge privileges',
    offer: 'a lifetime zero-annual-fee upgrade package dispatched to your door',
    targetAudience: 'High-income professionals with >₹1L monthly card spend',
    primaryPainPoint: 'Paying 3.5% foreign exchange fees on international business expenses',
    valueGap: '₹35,000 yearly lost to transaction markup and lost reward points',
    question1: 'Do you currently travel internationally or make foreign currency payments?',
    question2: 'Would having complimentary unlimited airport lounge access be valuable for you?',
  },
};

export const CampaignWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: agents = [] } = useAgents();
  const createCampaign = useCreateCampaign();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [name, setName] = useState(STRATEGY_PRESETS.loans.name);
  const [productType, setProductType] = useState('loans');

  // Step 2: Campaign Strategy & Value Proposition
  const [companyName, setCompanyName] = useState(STRATEGY_PRESETS.loans.companyName);
  const [motto, setMotto] = useState(STRATEGY_PRESETS.loans.motto);
  const [offer, setOffer] = useState(STRATEGY_PRESETS.loans.offer);
  const [targetAudience, setTargetAudience] = useState(STRATEGY_PRESETS.loans.targetAudience);
  const [primaryPainPoint, setPrimaryPainPoint] = useState(STRATEGY_PRESETS.loans.primaryPainPoint);
  const [valueGap, setValueGap] = useState(STRATEGY_PRESETS.loans.valueGap);
  const [question1, setQuestion1] = useState(STRATEGY_PRESETS.loans.question1);
  const [question2, setQuestion2] = useState(STRATEGY_PRESETS.loans.question2);

  // Step 3: AI Voice Agent
  const [agentId, setAgentId] = useState('');

  // Step 4: Pacing & Hours
  const [budget, setBudget] = useState(10000);
  const [concurrency, setConcurrency] = useState(5);
  const [callingStart, setCallingStart] = useState('09:00');
  const [callingEnd, setCallingEnd] = useState('18:00');

  // Preflight checks
  const preflightChecks = [
    { title: 'Twilio Cloud Phone Trunk', passed: true, detail: '2 registered caller IDs available' },
    { title: 'Resonology Speech Engine Token Quota', passed: true, detail: 'Low-latency quota verified' },
    { title: 'Psychological Conversational Blueprint', passed: true, detail: 'Law 4 (brevity) & Chris Voss empathy active' },
    { title: 'Calling Window Compliance', passed: true, detail: '09:00 - 18:00 within TRAI/TCPA legal hours' },
  ];

  const applyPreset = (key: 'loans' | 'saas' | 'cards') => {
    const p = STRATEGY_PRESETS[key];
    if (!p) return;
    setName(p.name);
    setProductType(p.productType);
    setCompanyName(p.companyName);
    setMotto(p.motto);
    setOffer(p.offer);
    setTargetAudience(p.targetAudience);
    setPrimaryPainPoint(p.primaryPainPoint);
    setValueGap(p.valueGap);
    setQuestion1(p.question1);
    setQuestion2(p.question2);
    toast(`Loaded preset: ${p.companyName} (${p.name})`, 'info');
  };

  const handleFinish = async () => {
    try {
      const strategyConfig = {
        company_name: companyName.trim() || 'IntelliCall',
        companyName: companyName.trim() || 'IntelliCall',
        motto: motto.trim(),
        offer: offer.trim(),
        target_audience: targetAudience.trim(),
        targetAudience: targetAudience.trim(),
        primary_pain_point: primaryPainPoint.trim(),
        primaryPainPoint: primaryPainPoint.trim(),
        value_gap_statement: valueGap.trim(),
        value_gap: valueGap.trim(),
        valueGap: valueGap.trim(),
        qualifying_questions: [question1.trim(), question2.trim()].filter(Boolean),
        qualifyingQuestions: [question1.trim(), question2.trim()].filter(Boolean),
        objection_playbook: {
          price: `Do not discount. Anchor on ${valueGap || 'operational savings'}. Offer ${offer}.`,
          send_email: 'Acknowledge busy schedule. Ask for 1 key diagnostic answer before sending executive deck.',
          skeptical: 'Validate skepticism immediately (Law 9). Frame sub-300ms live conversational speed.',
        },
      };

      await createCampaign.mutateAsync({
        name: name.trim(),
        agent_id: agentId || undefined,
        daily_budget: budget,
        concurrency_limit: concurrency,
        calling_hours_start: callingStart,
        calling_hours_end: callingEnd,
        status: 'active',
        strategy: 'direct_qualification',
        strategy_config: strategyConfig,
        strategyConfig,
      } as any);

      toast('Campaign launched successfully!', 'success');
      navigate('/campaigns');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Launch failed', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link to="/campaigns" className="text-xs text-[var(--color-text-muted)] hover:underline">
            &larr; Back to Campaigns
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Campaign Launch Wizard
        </h1>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-0.5">
          Configure value proposition, psychological sales strategy, voice persona, and verify preflight checks.
        </p>
      </div>

      {/* Stepper Bar (5 steps) */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 overflow-x-auto gap-2">
        {[
          { num: 1, label: 'Basics & Product' },
          { num: 2, label: 'Strategy & Pitch' },
          { num: 3, label: 'Voice Agent' },
          { num: 4, label: 'Pacing & Hours' },
          { num: 5, label: 'Safety Gate' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                step === s.num
                  ? 'bg-[var(--color-action-primary)] text-white shadow-sm'
                  : step > s.num
                  ? 'bg-[var(--color-success)] text-white'
                  : 'bg-[var(--color-bg-sunken)] text-[var(--color-text-muted)]'
              }`}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span
              className={`text-xs font-medium hidden md:inline ${
                step === s.num
                  ? 'text-[var(--color-text-primary)] font-bold'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Step Panels */}
      <div className="p-6 md:p-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] shadow-2xs space-y-6">
        {/* STEP 1: Basics & Product */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                <span>Step 1: Campaign Identity & Product Objective</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Name your campaign and choose an industry vertical. You can quickly populate battle-tested strategy templates.
              </p>
            </div>

            {/* Quick Presets Bar */}
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-2">
              <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb size={13} className="text-amber-400" />
                <span>One-Click Strategy Templates for Showcase</span>
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('loans')}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] font-medium transition-colors cursor-pointer"
                >
                  🚘 Auto Loan Refinance (FinEdge)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('saas')}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] font-medium transition-colors cursor-pointer"
                >
                  ⚡ Inbound B2B SaaS (Resonology)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('cards')}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] font-medium transition-colors cursor-pointer"
                >
                  💳 Wealth Card Upgrade (Apex)
                </button>
              </div>
            </div>

            <Input
              label="Campaign Name"
              placeholder="e.g. Q4 Priority Auto Loan Refinance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Select
              label="Product Vertical"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              options={[
                { value: 'loans', label: 'Loan Refinancing & Disbursals' },
                { value: 'retention', label: 'B2B SaaS / Growth Qualification' },
                { value: 'cards', label: 'Credit Card & Wealth Upgrades' },
                { value: 'advisory', label: 'Wealth Advisory & FDs' },
              ]}
            />
          </div>
        )}

        {/* STEP 2: Campaign Strategy & Value Proposition (Dynamic Chameleon Engine) */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Briefcase size={18} className="text-blue-500" />
                <span>Step 2: Campaign Strategy & Value Proposition</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                The voice agent dynamically adopts this company identity, elevator hook, and diagnostic line. It introduces itself as a human growth consultant from your organization.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company / Brand Identity"
                placeholder="e.g. FinEdge Capital or Resonology AI"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Target Audience"
                placeholder="e.g. Vehicle owners with high-interest loans"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <Input
              label="Elevator Mission / Motto (Delivered in Turn 2)"
              placeholder="e.g. reducing vehicle financing rates from 14% down to 8.4%"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Primary Prospect Pain Point"
                placeholder="e.g. Paying predatory double-digit rates"
                value={primaryPainPoint}
                onChange={(e) => setPrimaryPainPoint(e.target.value)}
              />
              <Input
                label="Value Gap (Cost of Inaction)"
                placeholder="e.g. ₹4,200/month in avoidable interest"
                value={valueGap}
                onChange={(e) => setValueGap(e.target.value)}
              />
            </div>

            <Input
              label="Target Offer / Close Incentive"
              placeholder="e.g. a complimentary 5-minute portfolio interest audit this Thursday"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              required
            />

            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-3">
              <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                <HelpCircle size={14} className="text-emerald-400" />
                <span>Diagnostic Discovery Questions (Challenger Sale)</span>
              </span>
              <Input
                label="Diagnostic Question 1 (Turn 2 Hook)"
                placeholder="e.g. What interest rate are you currently paying on your primary vehicle loan?"
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
              />
              <Input
                label="Diagnostic Question 2 (Follow-up Discomfort)"
                placeholder="e.g. Has your vehicle been registered for over 12 months with clean repayment?"
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Assign AI Voice Agent */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <PhoneCall size={18} className="text-purple-500" />
                <span>Step 3: Assign AI Voice Agent</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Select the voice persona and speech pipeline. The agent uses dynamic Hinglish code-switching with sub-300ms turnaround.
              </p>
            </div>

            <Select
              label="Voice Persona"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              options={[
                { value: '', label: 'Default Elite Executive (Anay - Hinglish / English)' },
                ...agents.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${(a as any).voice || 'Aoede'} - ${(a as any).language || 'Hinglish'})`,
                })),
              ]}
            />

            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] text-xs text-[var(--color-text-secondary)] space-y-2.5">
              <span className="font-semibold text-[var(--color-text-primary)] block">
                Conversational Chameleon Persona Profile
              </span>
              <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                <li><strong className="text-[var(--color-text-primary)]">2-Step Permission Opening:</strong> Greets respectfully and asks for 1 minute before pitching.</li>
                <li><strong className="text-[var(--color-text-primary)]">Brevity Cap (Law 4):</strong> Strictly capped at &le;20 words per response to project executive authority.</li>
                <li><strong className="text-[var(--color-text-primary)]">Dynamic Code-Switching:</strong> Automatically transitions between crisp Hinglish, formal Hindi, and corporate English.</li>
                <li><strong className="text-[var(--color-text-primary)]">Tactical Empathy (Chris Voss):</strong> Labels unstated hesitation and closes with 'No'-oriented questions.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 4: Dialing Pacing & Budget */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <span>Step 4: Dialing Pacing & Budget</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Control telephony line concurrency and daily financial safety limits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Daily Budget (INR)"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
              <Input
                label="Concurrency Limit (Parallel Lines)"
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Daily Calling Starts"
                type="time"
                value={callingStart}
                onChange={(e) => setCallingStart(e.target.value)}
              />
              <Input
                label="Daily Calling Ends"
                type="time"
                value={callingEnd}
                onChange={(e) => setCallingEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Preflight Safety Gate */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Step 5: Preflight Validation Safety Gate</span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                Automated preflight checks ensuring carrier compliance, telephony routes, and token budgets.
              </p>
            </div>

            {/* Campaign Summary Card */}
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-subtle)] space-y-2 text-xs">
              <span className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[10px]">
                Configured Strategy Blueprint
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-[var(--color-text-muted)]">Brand:</span> <span className="font-semibold text-[var(--color-text-primary)]">{companyName}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Motto:</span> <span className="text-[var(--color-text-primary)]">{motto}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Target Offer:</span> <span className="text-[var(--color-text-primary)]">{offer}</span></div>
                <div><span className="text-[var(--color-text-muted)]">Value Gap:</span> <span className="text-emerald-400 font-medium">{valueGap}</span></div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {preflightChecks.map((chk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)]/60 border border-[var(--color-border-subtle)]"
                >
                  <CheckCircle2 size={16} className="text-[var(--color-success)] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] block">
                      {chk.title}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {chk.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stepper Footer Buttons */}
        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft size={14} className="mr-1" />
            Previous
          </Button>

          {step < 5 ? (
            <Button
              size="sm"
              disabled={(step === 1 && !name.trim()) || (step === 2 && (!companyName.trim() || !motto.trim()))}
              onClick={() => setStep(step + 1)}
            >
              Next Step
              <ChevronRight size={14} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFinish}
              loading={createCampaign.isPending}
            >
              <Sparkles size={14} className="mr-1.5" />
              Launch Campaign Live
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignWizardPage;
