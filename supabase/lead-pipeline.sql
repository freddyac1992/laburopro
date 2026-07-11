-- Run this once in the Supabase SQL editor for existing production databases.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'converted', 'lost'));

CREATE INDEX IF NOT EXISTS idx_leads_provider_status
  ON public.leads(provider_id, status);

DROP POLICY IF EXISTS "Providers can update own lead status" ON public.leads;
CREATE POLICY "Providers can update own lead status" ON public.leads
  FOR UPDATE USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

REVOKE UPDATE ON public.leads FROM anon, authenticated;
GRANT UPDATE (status, updated_at) ON public.leads TO authenticated;
