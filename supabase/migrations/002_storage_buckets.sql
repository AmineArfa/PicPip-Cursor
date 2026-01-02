-- Storage Buckets Setup
-- Run this in Supabase SQL Editor

-- Create guest-uploads bucket (public, 24hr expiry)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guest-uploads',
  'guest-uploads',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Create private-media bucket (private, RLS protected)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-media',
  'private-media',
  false,
  52428800, -- 50MB limit for videos
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- Guest uploads policies (public read, anyone can upload)
CREATE POLICY "Anyone can upload to guest-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'guest-uploads');

CREATE POLICY "Anyone can read guest-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'guest-uploads');

-- Private media policies (authenticated users only)
CREATE POLICY "Authenticated users can upload to private-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'private-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can read own files from private-media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'private-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.jwt() ->> 'role' = 'service_role')
);

-- Note: For 24-hour lifecycle policy on guest-uploads,
-- configure this in Supabase Dashboard or via the API:
-- Storage > guest-uploads > Settings > Lifecycle Policy

