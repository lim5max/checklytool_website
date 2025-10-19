-- Создание политик Storage для bucket 'submissions'
-- Migration: 021_create_submissions_bucket_policies

-- Удаляем старые политики если они существуют
DROP POLICY IF EXISTS "Public read access for submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update in submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from submissions bucket" ON storage.objects;

-- Policy 1: Public read access (все могут читать)
CREATE POLICY "Public read access for submissions bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- Policy 2: Authenticated users can upload (аутентифицированные пользователи могут загружать)
CREATE POLICY "Authenticated users can upload to submissions bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

-- Policy 3: Authenticated users can update their files (пользователи могут обновлять свои файлы)
CREATE POLICY "Authenticated users can update in submissions bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'submissions')
WITH CHECK (bucket_id = 'submissions');

-- Policy 4: Authenticated users can delete their files (пользователи могут удалять свои файлы)
CREATE POLICY "Authenticated users can delete from submissions bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'submissions');
