-- ==============================================================================
-- Migration: 20261022000001_leads_pipeline_fields.sql
-- Description: Add pipeline-specific fields to leads table for Kanban board view.
--   - estimated_value: deal value for pipeline sum tile
--   - next_action: free-text next step for the sales/ops team
--   - stage_entered_at: timestamp when lead entered current stage (used to
--     compute "days in stage" client-side without a stored computed column)
-- Author: Anay Sharma
-- ==============================================================================

-- Add pipeline-specific columns (idempotent via IF NOT EXISTS)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT now();

-- Backfill stage_entered_at for existing rows using last_activity_at or created_at
UPDATE public.leads
SET stage_entered_at = COALESCE(last_activity_at, created_at)
WHERE stage_entered_at IS NULL OR stage_entered_at = now();

-- Create an index to efficiently query leads by stage_entered_at (for "stuck" detection)
CREATE INDEX IF NOT EXISTS idx_leads_stage_entered_at
  ON public.leads(organization_id, status, stage_entered_at);
