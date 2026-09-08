-- ============================================================
-- LaburoPro — Security fixes (2026-07-06)
-- Run this in your Supabase SQL editor on the existing database.
-- Fixes:
--   1. Signup could self-assign role 'admin' via user metadata
--   2. Users could UPDATE their own profiles.role to 'admin'
--   3. Providers could self-approve/self-verify their provider
--      profile and fake rating/review_count
--   4. is_admin() missing pinned search_path (SECURITY DEFINER)
-- ============================================================

-- 1. Never trust client-supplied metadata for the role.
--    Admins are promoted manually:
--    UPDATE public.profiles SET role = 'admin' WHERE email = '...';
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
    'provider'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Pin search_path on SECURITY DEFINER helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Block role changes by non-admins
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

-- 3. Only admins can moderate publication. Identity and reputation are
--    reserved for private server processes using service_role.
CREATE OR REPLACE FUNCTION public.protect_provider_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_approved   := false;
      NEW.is_verified   := false;
      NEW.is_active     := true;
      NEW.rating        := 0;
      NEW.review_count  := 0;
    ELSIF public.is_admin() THEN
      NEW.is_verified   := OLD.is_verified;
      NEW.rating        := OLD.rating;
      NEW.review_count  := OLD.review_count;
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
