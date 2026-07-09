-- Run this once in the Supabase SQL editor for existing production databases.
-- The main schema.sql already includes these columns for fresh installs.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_provider_created ON public.leads(provider_id, created_at DESC);
