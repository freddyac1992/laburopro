-- Run this once in the Supabase SQL editor for existing production databases.
-- The main schema.sql already includes this table for fresh installs.

CREATE TABLE IF NOT EXISTS public.provider_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      uuid REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  reason           text NOT NULL,
  details          text,
  reporter_name    text,
  reporter_contact text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_reports_status ON public.provider_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_reports_provider ON public.provider_reports(provider_id, created_at DESC);

ALTER TABLE public.provider_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert provider reports" ON public.provider_reports;

DROP POLICY IF EXISTS "Admins can manage provider reports" ON public.provider_reports;
CREATE POLICY "Admins can manage provider reports" ON public.provider_reports
  FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS set_provider_reports_updated_at ON public.provider_reports;
CREATE TRIGGER set_provider_reports_updated_at BEFORE UPDATE ON public.provider_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
