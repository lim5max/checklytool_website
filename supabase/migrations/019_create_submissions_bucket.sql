-- Создание bucket для хранения изображений вопросов и submissions
-- Migration: 019_create_submissions_bucket
-- Note: Storage policies need to be created through Supabase Dashboard or with proper permissions

-- Создаем bucket если его еще нет (это работает через service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'submissions',
    'submissions',
    true,
    10485760, -- 10MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']::text[];

-- Примечание: Политики Storage должны быть созданы через Dashboard:
-- 1. Перейдите в Storage -> Policies в Supabase Dashboard
-- 2. Создайте следующие политики для bucket 'submissions':
--
--    Policy 1: Public read access
--    - Operation: SELECT
--    - Policy Definition: true
--
--    Policy 2: Authenticated users can upload
--    - Operation: INSERT
--    - Target roles: authenticated
--    - Policy Definition: true
--
--    Policy 3: Authenticated users can update
--    - Operation: UPDATE
--    - Target roles: authenticated
--    - Policy Definition: true
--
--    Policy 4: Authenticated users can delete
--    - Operation: DELETE
--    - Target roles: authenticated
--    - Policy Definition: true
