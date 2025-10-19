-- Делаем бакет submissions публичным для чтения
-- Migration: 022_make_submissions_bucket_public
-- Description: Изменяет настройки бакета submissions на public для корректного отображения изображений

UPDATE storage.buckets
SET public = true
WHERE id = 'submissions';
