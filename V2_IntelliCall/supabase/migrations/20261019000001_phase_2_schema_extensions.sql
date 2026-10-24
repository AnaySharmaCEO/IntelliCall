-- ==============================================================================
-- Migration: 20261019000001_phase_2_schema_extensions.sql
-- Description: Forward-only schema extensions for Phase 2 (compliance, call_analyses,
--              phone numbers, campaign dialing constraints, and role enum extensions).
-- ==============================================================================

-- 1. Extend user_role enum if values are not already present
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;

  BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'agent_operator';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;

  BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'viewer';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;
END $$;

-- 2. Extend campaigns table with dialing constraints
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS calling_hours_start TEXT DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS calling_hours_end TEXT DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS daily_budget NUMERIC DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS concurrency_limit INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';

-- 3. Extend calls table with direction, sentiment, quality score, and metadata
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS call_score INT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 4. Create compliance_rules table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('required_phrase', 'forbidden_phrase')),
  description TEXT,
  threshold NUMERIC NOT NULL DEFAULT 0.85,
  action_on_violation TEXT NOT NULL DEFAULT 'flag' CHECK (action_on_violation IN ('flag', 'terminate_call', 'escalate')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on compliance_rules
CREATE INDEX IF NOT EXISTS idx_compliance_rules_org ON public.compliance_rules(organization_id);

-- Enable RLS on compliance_rules
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

-- Compliance rules RLS policies
DROP POLICY IF EXISTS "Members can view organization compliance rules" ON public.compliance_rules;
CREATE POLICY "Members can view organization compliance rules"
  ON public.compliance_rules
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Admins can manage organization compliance rules" ON public.compliance_rules;
CREATE POLICY "Admins can manage organization compliance rules"
  ON public.compliance_rules
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner', 'admin')
    )
  );

-- 5. Create call_analyses table for structured Gemini extractions
CREATE TABLE IF NOT EXISTS public.call_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  sentiment_overall TEXT NOT NULL DEFAULT 'neutral',
  intent_primary TEXT NOT NULL,
  intent_confidence NUMERIC NOT NULL DEFAULT 0.8,
  resolution_status TEXT NOT NULL DEFAULT 'resolved',
  satisfaction_score INT DEFAULT 4,
  compliance_score NUMERIC NOT NULL DEFAULT 1.0,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on call_analyses
CREATE INDEX IF NOT EXISTS idx_call_analyses_call ON public.call_analyses(call_id);

-- Enable RLS on call_analyses
ALTER TABLE public.call_analyses ENABLE ROW LEVEL SECURITY;

-- Call analyses RLS policies
DROP POLICY IF EXISTS "Members can view analyses for their organization calls" ON public.call_analyses;
CREATE POLICY "Members can view analyses for their organization calls"
  ON public.call_analyses
  FOR SELECT
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      JOIN public.organization_members m ON c.organization_id = m.organization_id
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Service role or admins can insert call analyses" ON public.call_analyses;
CREATE POLICY "Service role or admins can insert call analyses"
  ON public.call_analyses
  FOR ALL
  USING (
    call_id IN (
      SELECT c.id FROM public.calls c
      JOIN public.organization_members m ON c.organization_id = m.organization_id
      WHERE m.user_id = auth.uid() AND m.status = 'active' AND m.role::text IN ('owner', 'admin', 'manager')
    )
  );

-- 6. Create phone_numbers telephony pool table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'twilio',
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('assigned', 'unassigned', 'reserved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on phone_numbers
CREATE INDEX IF NOT EXISTS idx_phone_numbers_org ON public.phone_numbers(organization_id);

-- Enable RLS on phone_numbers
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view organization phone numbers" ON public.phone_numbers;
CREATE POLICY "Members can view organization phone numbers"
  ON public.phone_numbers
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
