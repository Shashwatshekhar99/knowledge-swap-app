CREATE POLICY "Anyone can read desktop downloads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'downloads');