-- Create a public storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);

-- Allow public read access
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
