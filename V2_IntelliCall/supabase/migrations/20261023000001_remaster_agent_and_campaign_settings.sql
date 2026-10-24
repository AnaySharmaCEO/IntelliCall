-- ==============================================================================
-- Migration: 20261023000001_remaster_agent_and_campaign_settings.sql
-- Description:
--   1. Add comprehensive voice agent settings to public.agents (role_title, voice_model, brevity_words, tactics, system_prompt, greeting, voice_speed, voice_temperature, communication_style).
--   2. Add campaign strategy settings to public.campaigns (company_name, motto, offer, primary_pain_point, value_gap, qualification_questions, objection_playbook, target_audience).
--   3. Grant table access to authenticated and service_role.
--   4. Reload PostgREST schema cache.
-- Author: Anay Sharma
-- ==============================================================================

-- 1. Extend public.agents table with exact voice agent runtime attributes
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'Senior Growth Consultant',
  ADD COLUMN IF NOT EXISTS voice_model VARCHAR(50) DEFAULT 'Aoede',
  ADD COLUMN IF NOT EXISTS brevity_words INT DEFAULT 25,
  ADD COLUMN IF NOT EXISTS tactics JSONB DEFAULT '{"voss_empathy": true, "law4_brevity": true, "no_oriented_close": true, "linguistic_mirroring": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT 'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.',
  ADD COLUMN IF NOT EXISTS greeting TEXT DEFAULT 'Namaste, this is {{agent_name}} calling. Do you have a quick minute?',
  ADD COLUMN IF NOT EXISTS voice_speed NUMERIC DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS voice_temperature NUMERIC DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS communication_style VARCHAR(50) DEFAULT 'consultative';

-- Sync existing rows if any columns are null
UPDATE public.agents
SET
  role_title = COALESCE(role_title, 'Senior Growth Consultant'),
  voice_model = COALESCE(voice_model, voice, 'Aoede'),
  brevity_words = COALESCE(brevity_words, 25),
  tactics = COALESCE(tactics, '{"voss_empathy": true, "law4_brevity": true, "no_oriented_close": true, "linguistic_mirroring": true}'::jsonb),
  system_prompt = COALESCE(system_prompt, 'You are an elite conversational growth consultant. Speak like an experienced professional on a live phone call — crisp, conversational, and direct.'),
  greeting = COALESCE(greeting, 'Namaste, this is {{agent_name}} calling. Do you have a quick minute?'),
  voice_speed = COALESCE(voice_speed, 1.0),
  voice_temperature = COALESCE(voice_temperature, 0.7),
  communication_style = COALESCE(communication_style, 'consultative')
WHERE role_title IS NULL OR voice_model IS NULL;

-- 2. Extend public.campaigns table with campaign-specific agent guidance fields
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'FinEdge Capital',
  ADD COLUMN IF NOT EXISTS motto TEXT DEFAULT 'reducing vehicle financing rates from 14% down to 8.4%',
  ADD COLUMN IF NOT EXISTS offer TEXT DEFAULT 'a complimentary 5-minute portfolio interest audit this Thursday',
  ADD COLUMN IF NOT EXISTS primary_pain_point TEXT DEFAULT 'Paying predatory double-digit interest rates on vehicle loans',
  ADD COLUMN IF NOT EXISTS value_gap TEXT DEFAULT '₹4,200/month in avoidable interest overpayments',
  ADD COLUMN IF NOT EXISTS qualification_questions JSONB DEFAULT '["What interest rate are you currently paying on your primary vehicle loan?", "Has your vehicle been registered for over 12 months with clean repayment?"]'::jsonb,
  ADD COLUMN IF NOT EXISTS objection_playbook JSONB DEFAULT '{"busy": "Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?", "skeptical": "Aapne hamare partner network par rate comparison check kiya tha. Main bas confirm kar raha tha ki aapko fair rate mila ya nahi.", "not_interested": "Totally understand! Would you be opposed if I just kept your contact handy for when your loan renewal comes up?"}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'Vehicle loan holders with >12% interest';

-- Backfill existing campaigns from strategy_config where available
UPDATE public.campaigns
SET
  company_name = COALESCE(company_name, strategy_config->>'company_name', strategy_config->>'companyName', 'FinEdge Capital'),
  motto = COALESCE(motto, strategy_config->>'motto', 'reducing vehicle financing rates from 14% down to 8.4%'),
  offer = COALESCE(offer, strategy_config->>'offer', 'a complimentary 5-minute portfolio interest audit this Thursday'),
  primary_pain_point = COALESCE(primary_pain_point, strategy_config->>'primary_pain_point', strategy_config->>'primaryPainPoint', 'Paying predatory double-digit interest rates on vehicle loans'),
  value_gap = COALESCE(value_gap, strategy_config->>'value_gap', strategy_config->>'valueGap', '₹4,200/month in avoidable interest overpayments'),
  qualification_questions = COALESCE(qualification_questions, strategy_config->'qualifying_questions', strategy_config->'qualifyingQuestions', '["What interest rate are you currently paying on your primary vehicle loan?", "Has your vehicle been registered for over 12 months with clean repayment?"]'::jsonb),
  objection_playbook = COALESCE(objection_playbook, strategy_config->'objection_playbook', strategy_config->'objectionPlaybook', '{"busy": "Bilkul samajh sakta hoon ji. Should I connect tomorrow afternoon, or drop a quick WhatsApp?", "skeptical": "Aapne hamare partner network par rate comparison check kiya tha. Main bas confirm kar raha tha ki aapko fair rate mila ya nahi.", "not_interested": "Totally understand! Would you be opposed if I just kept your contact handy for when your loan renewal comes up?"}'::jsonb),
  target_audience = COALESCE(target_audience, strategy_config->>'target_audience', strategy_config->>'targetAudience', 'Vehicle loan holders with >12% interest')
WHERE company_name IS NULL OR motto IS NULL;

-- 3. Ensure Table Grants & Privileges
GRANT ALL ON TABLE public.agents TO authenticated, service_role;
GRANT SELECT ON TABLE public.agents TO anon;

GRANT ALL ON TABLE public.campaigns TO authenticated, service_role;
GRANT SELECT ON TABLE public.campaigns TO anon;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
