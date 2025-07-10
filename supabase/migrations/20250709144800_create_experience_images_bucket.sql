INSERT INTO storage.buckets (id, name, public) VALUES ('experience-images', 'experience-images', true);

CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'experience-images');

CREATE POLICY "Authenticated upload access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'experience-images' AND auth.role() = 'authenticated'); 