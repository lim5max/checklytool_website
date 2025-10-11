-- Добавление колонки written_work_feedback для контрольных работ
-- Эта колонка хранит краткое резюме и список ошибок для типа written_work

ALTER TABLE evaluation_results
ADD COLUMN IF NOT EXISTS written_work_feedback jsonb;

-- Комментарий для документации
COMMENT ON COLUMN evaluation_results.written_work_feedback IS
'JSON объект с полями: brief_summary (краткое резюме) и errors_found (массив найденных ошибок) для контрольных работ';
