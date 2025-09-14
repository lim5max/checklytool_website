-- Миграция для добавления полей ошибок в таблицу student_submissions
ALTER TABLE student_submissions 
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS error_details jsonb;

-- Создание индекса для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_student_submissions_status 
ON student_submissions(status);

-- Добавление комментариев к новым полям
COMMENT ON COLUMN student_submissions.error_message IS 'Human-readable error message when submission processing fails';
COMMENT ON COLUMN student_submissions.error_details IS 'Detailed error information in JSON format (error type, AI response, etc)';