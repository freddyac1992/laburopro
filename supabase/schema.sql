-- ============================================================
-- LaburoPro — Initial Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- Linked to auth.users. Created automatically on signup.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text,
  full_name  text,
  role       text NOT NULL DEFAULT 'provider' CHECK (role IN ('provider', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Never trust client metadata for the role; admins are promoted manually
    'provider'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  icon        text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. CITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  department text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. PROVIDER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id      uuid REFERENCES public.categories(id),
  city_id          uuid REFERENCES public.cities(id),
  display_name     text NOT NULL,
  slug             text UNIQUE NOT NULL,
  zone             text,
  description      text,
  services         text[],
  years_experience integer CHECK (years_experience >= 0),
  price_reference  text,
  whatsapp         text,
  availability     text,
  profile_photo_path text,
  work_photo_path    text,
  is_approved      boolean NOT NULL DEFAULT false,
  is_verified      boolean NOT NULL DEFAULT false,
  is_active        boolean NOT NULL DEFAULT true,
  rating           numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count     integer DEFAULT 0 CHECK (review_count >= 0),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_category ON public.provider_profiles(category_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON public.provider_profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_approved ON public.provider_profiles(is_approved, is_active);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_slug ON public.provider_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user ON public.provider_profiles(user_id);

-- ============================================================
-- 5. LEADS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   uuid REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  message       text,
  source        text DEFAULT 'whatsapp',
  page_url      text,
  referrer      text,
  user_agent    text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status        text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'lost')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_provider_created ON public.leads(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_provider_status ON public.leads(provider_id, status);

-- ============================================================
-- PROFILE VIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  visitor_id  text,
  page_url    text,
  referrer    text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON public.profile_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_provider_created ON public.profile_views(provider_id, created_at DESC);

-- ============================================================
-- 6. REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   uuid REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  rating        integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment       text,
  reviewer_name text,
  is_approved   boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id, is_approved);

-- ============================================================
-- 7. PROVIDER REPORTS
-- ============================================================
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

-- ============================================================
-- API RATE LIMITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  action             text NOT NULL,
  identifier_hash    text NOT NULL,
  window_started_at  timestamptz NOT NULL DEFAULT now(),
  request_count      integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (action, identifier_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON public.api_rate_limits(window_started_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limits FROM anon, authenticated;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action text,
  p_identifier_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit integer;
  v_window_seconds integer;
  v_now timestamptz := clock_timestamp();
  v_request_count integer;
BEGIN
  IF p_identifier_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  CASE p_action
    WHEN 'lead' THEN
      v_limit := 10;
      v_window_seconds := 600;
    WHEN 'profile_view' THEN
      v_limit := 120;
      v_window_seconds := 3600;
    WHEN 'review' THEN
      v_limit := 3;
      v_window_seconds := 3600;
    WHEN 'provider_report' THEN
      v_limit := 5;
      v_window_seconds := 3600;
    ELSE
      RETURN false;
  END CASE;

  INSERT INTO public.api_rate_limits AS rl (
    action,
    identifier_hash,
    window_started_at,
    request_count
  )
  VALUES (p_action, p_identifier_hash, v_now, 1)
  ON CONFLICT (action, identifier_hash) DO UPDATE SET
    request_count = CASE
      WHEN rl.window_started_at <= v_now - make_interval(secs => v_window_seconds) THEN 1
      ELSE rl.request_count + 1
    END,
    window_started_at = CASE
      WHEN rl.window_started_at <= v_now - make_interval(secs => v_window_seconds) THEN v_now
      ELSE rl.window_started_at
    END
  RETURNING request_count INTO v_request_count;

  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits
    WHERE window_started_at < v_now - interval '7 days';
  END IF;

  RETURN v_request_count <= v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text) TO service_role;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- CATEGORIES policies (public read)
CREATE POLICY "Anyone can read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- CITIES policies (public read)
CREATE POLICY "Anyone can read cities" ON public.cities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage cities" ON public.cities
  FOR ALL USING (public.is_admin());

-- PROVIDER PROFILES policies
CREATE POLICY "Public can view approved active providers" ON public.provider_profiles
  FOR SELECT USING (is_approved = true AND is_active = true);

CREATE POLICY "Providers can view own profile" ON public.provider_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile" ON public.provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile" ON public.provider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all provider profiles" ON public.provider_profiles
  FOR ALL USING (public.is_admin());

-- LEADS policies
CREATE POLICY "Providers can view own leads" ON public.leads
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

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

CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT USING (public.is_admin());

-- PROFILE VIEWS policies
CREATE POLICY "Providers can view own profile views" ON public.profile_views
  FOR SELECT USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profile views" ON public.profile_views
  FOR SELECT USING (public.is_admin());

-- REVIEWS policies
CREATE POLICY "Public can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Admins can manage all reviews" ON public.reviews
  FOR ALL USING (public.is_admin());

-- PROVIDER REPORTS policies
CREATE POLICY "Admins can manage provider reports" ON public.provider_reports
  FOR ALL USING (public.is_admin());

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_provider_reports_updated_at ON public.provider_reports;
CREATE TRIGGER set_provider_reports_updated_at BEFORE UPDATE ON public.provider_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Privilege protection triggers
-- ============================================================

-- Block role changes by non-admins (RLS UPDATE policy alone would
-- let a user set their own role to 'admin')
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Only admins can set moderation/reputation columns on provider profiles;
-- for non-admins they silently keep previous values (or safe defaults on INSERT)
CREATE OR REPLACE FUNCTION public.protect_provider_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_approved   := false;
      NEW.is_verified   := false;
      NEW.is_active     := true;
      NEW.rating        := 0;
      NEW.review_count  := 0;
    ELSE
      NEW.is_approved   := OLD.is_approved;
      NEW.is_verified   := OLD.is_verified;
      NEW.is_active     := OLD.is_active;
      NEW.rating        := OLD.rating;
      NEW.review_count  := OLD.review_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_provider_flags ON public.provider_profiles;
CREATE TRIGGER protect_provider_flags
  BEFORE INSERT OR UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_provider_flags();

-- ============================================================
-- PROVIDER IMAGE STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('provider-images', 'provider-images', true, 1048576, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can view provider images" ON storage.objects
  FOR SELECT USING (bucket_id = 'provider-images');

CREATE POLICY "Providers can upload own fixed images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );

CREATE POLICY "Providers can replace own fixed images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'provider-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );

CREATE POLICY "Providers can delete own fixed images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );
