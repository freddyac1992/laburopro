-- Run this once in the Supabase SQL editor for existing production databases.

ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS profile_photo_path text,
  ADD COLUMN IF NOT EXISTS work_photo_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-images',
  'provider-images',
  true,
  1048576,
  ARRAY['image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view provider images" ON storage.objects;
CREATE POLICY "Public can view provider images" ON storage.objects
  FOR SELECT USING (bucket_id = 'provider-images');

DROP POLICY IF EXISTS "Providers can upload own fixed images" ON storage.objects;
CREATE POLICY "Providers can upload own fixed images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );

DROP POLICY IF EXISTS "Providers can replace own fixed images" ON storage.objects;
CREATE POLICY "Providers can replace own fixed images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );

DROP POLICY IF EXISTS "Providers can delete own fixed images" ON storage.objects;
CREATE POLICY "Providers can delete own fixed images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND storage.filename(name) IN ('profile.webp', 'work.webp')
  );
