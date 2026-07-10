-- Run this once in the Supabase SQL editor for existing production databases.

CREATE TABLE IF NOT EXISTS public.profile_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  visitor_id  text,
  page_url    text,
  referrer    text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_created_at
  ON public.profile_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_provider_created
  ON public.profile_views(provider_id, created_at DESC);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
CREATE POLICY "Anyone can insert profile views" ON public.profile_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Providers can view own profile views" ON public.profile_views;
CREATE POLICY "Providers can view own profile views" ON public.profile_views
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all profile views" ON public.profile_views;
CREATE POLICY "Admins can view all profile views" ON public.profile_views
  FOR SELECT USING (public.is_admin());
