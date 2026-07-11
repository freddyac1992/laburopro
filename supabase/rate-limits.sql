-- Run this once in the Supabase SQL editor for existing production databases.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  action             text NOT NULL,
  identifier_hash    text NOT NULL,
  window_started_at  timestamptz NOT NULL DEFAULT now(),
  request_count      integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (action, identifier_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window
  ON public.api_rate_limits(window_started_at);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.api_rate_limits FROM anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert provider reports" ON public.provider_reports;

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
