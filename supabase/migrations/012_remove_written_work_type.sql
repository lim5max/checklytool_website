-- Удаление функциональности written_work (контрольных работ)
-- Дата создания: 2025-10-19

-- Шаг 1: Находим все check_id для written_work
-- Создаем временную таблицу с ID записей для удаления
CREATE TEMP TABLE written_work_checks AS
SELECT id FROM checks WHERE check_type = 'written_work';

-- Шаг 2: Удаляем связанные записи из всех зависимых таблиц
-- Удаляем из check_usage_history
DELETE FROM check_usage_history
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Удаляем из evaluation_results (через submissions)
DELETE FROM evaluation_results
WHERE submission_id IN (
  SELECT id FROM student_submissions
  WHERE check_id IN (SELECT id FROM written_work_checks)
);

-- Удаляем из student_submissions
DELETE FROM student_submissions
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Удаляем из check_variants
DELETE FROM check_variants
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Удаляем из grading_criteria
DELETE FROM grading_criteria
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Удаляем из essay_grading_criteria (если есть)
DELETE FROM essay_grading_criteria
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Удаляем из check_statistics (если есть)
DELETE FROM check_statistics
WHERE check_id IN (SELECT id FROM written_work_checks);

-- Шаг 3: Теперь можем удалить сами записи checks
DELETE FROM checks WHERE check_type = 'written_work';

-- Шаг 4: Удаляем колонку written_work_feedback из evaluation_results (если существует)
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS written_work_feedback;

-- Шаг 5: Обновляем check constraint для check_type, оставляем только 'test' и 'essay'
ALTER TABLE checks DROP CONSTRAINT IF EXISTS checks_check_type_check;
ALTER TABLE checks ADD CONSTRAINT checks_check_type_check
  CHECK (check_type IN ('test', 'essay'));

-- Шаг 6: Добавляем комментарий к миграции
COMMENT ON TABLE checks IS 'Checks table - только тесты и сочинения (written_work удален)';

-- Очищаем временную таблицу
DROP TABLE IF EXISTS written_work_checks;
