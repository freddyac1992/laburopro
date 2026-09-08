-- Run once in the Supabase SQL editor after schema.sql.
-- Identity documents are private and deleted after the review decision.

BEGIN;

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id         uuid NOT NULL UNIQUE REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_name          text NOT NULL CHECK (char_length(legal_name) BETWEEN 2 AND 120),
  document_type       text NOT NULL CHECK (document_type IN ('ci', 'passport')),
  document_front_path text,
  document_back_path  text,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),
  review_note         text,
  submitted_at        timestamptz NOT NULL DEFAULT now(),
  consented_at        timestamptz NOT NULL DEFAULT now(),
  reviewed_at         timestamptz,
  reviewed_by         uuid REFERENCES public.profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_pending_has_document CHECK (
    status <> 'pending' OR document_front_path IS NOT NULL
  ),
  CONSTRAINT verification_decision_has_reason CHECK (
    status NOT IN ('rejected', 'revoked') OR review_note IS NOT NULL
  )
);

-- Keep this migration safe to rerun if an earlier draft of the table exists.
DROP FUNCTION IF EXISTS public.review_verification_request(uuid, uuid, text, text);
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS review_note text;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'verification_requests'
      AND column_name = 'rejection_reason'
  ) THEN
    EXECUTE 'UPDATE public.verification_requests SET review_note = rejection_reason WHERE review_note IS NULL';
  END IF;
END;
$$;
ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_status_check;
ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS verification_rejection_has_reason;
ALTER TABLE public.verification_requests DROP CONSTRAINT IF EXISTS verification_decision_has_reason;
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'));
ALTER TABLE public.verification_requests
  ADD CONSTRAINT verification_decision_has_reason CHECK (status NOT IN ('rejected', 'revoked') OR review_note IS NOT NULL);
ALTER TABLE public.verification_requests DROP COLUMN IF EXISTS rejection_reason;

CREATE INDEX IF NOT EXISTS idx_verification_requests_status
  ON public.verification_requests(status, submitted_at DESC);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verification_requests FROM anon, authenticated;
GRANT SELECT ON public.verification_requests TO authenticated;

DROP POLICY IF EXISTS "Providers can view own verification request" ON public.verification_requests;
CREATE POLICY "Providers can view own verification request" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view verification requests" ON public.verification_requests;
CREATE POLICY "Admins can view verification requests" ON public.verification_requests
  FOR SELECT TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS set_verification_requests_updated_at ON public.verification_requests;
CREATE TRIGGER set_verification_requests_updated_at
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Keep moderation flags protected from browser clients while allowing the
-- private server client to apply an approved verification decision.
CREATE OR REPLACE FUNCTION public.protect_provider_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_approved := false;
      NEW.is_verified := false;
      NEW.is_active := true;
      NEW.rating := 0;
      NEW.review_count := 0;
    ELSIF public.is_admin() THEN
      -- Admins moderate publication, but identity and reputation only change
      -- through their dedicated private server processes.
      NEW.is_verified := OLD.is_verified;
      NEW.rating := OLD.rating;
      NEW.review_count := OLD.review_count;
    ELSE
      NEW.is_approved := OLD.is_approved;
      NEW.is_verified := OLD.is_verified;
      NEW.is_active := OLD.is_active;
      NEW.rating := OLD.rating;
      NEW.review_count := OLD.review_count;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents', 'verification-documents', false, 1048576, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage access is intentionally limited to service_role. The application
-- authenticates the owner/admin before every upload or signed download.
DROP POLICY IF EXISTS "Providers can read verification documents" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload verification documents" ON storage.objects;

CREATE OR REPLACE FUNCTION public.review_verification_request(
  p_request_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_review_note text DEFAULT NULL
)
RETURNS TABLE (front_path text, back_path text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request public.verification_requests%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_reviewer_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can review identity requests';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected', 'revoked') THEN
    RAISE EXCEPTION 'Invalid verification decision';
  END IF;

  IF p_decision IN ('rejected', 'revoked') AND NULLIF(trim(p_review_note), '') IS NULL THEN
    RAISE EXCEPTION 'A review note is required';
  END IF;

  SELECT * INTO v_request
  FROM public.verification_requests
  WHERE id = p_request_id
    AND (
      (p_decision = 'revoked' AND status = 'approved')
      OR (p_decision <> 'revoked' AND status = 'pending')
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request is not in a valid state for this decision';
  END IF;

  UPDATE public.provider_profiles
  SET is_verified = (p_decision = 'approved')
  WHERE id = v_request.provider_id;

  UPDATE public.verification_requests
  SET
    status = p_decision,
    review_note = CASE WHEN p_decision IN ('rejected', 'revoked') THEN trim(p_review_note) ELSE NULL END,
    reviewed_at = now(),
    reviewed_by = p_reviewer_id,
    document_front_path = NULL,
    document_back_path = NULL
  WHERE id = p_request_id;

  RETURN QUERY SELECT v_request.document_front_path, v_request.document_back_path;
END;
$$;

REVOKE ALL ON FUNCTION public.review_verification_request(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_verification_request(uuid, uuid, text, text) TO service_role;

COMMIT;
