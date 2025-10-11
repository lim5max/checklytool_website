-- Исправление foreign key constraint для каскадного удаления submissions
-- Проблема: при удалении submission ошибка из-за связи с check_usage_history
-- Решение: добавить ON DELETE CASCADE для автоматического удаления связанных записей

-- Удаляем старый constraint
ALTER TABLE check_usage_history
DROP CONSTRAINT IF EXISTS check_usage_history_submission_id_fkey;

-- Создаем новый constraint с каскадным удалением
ALTER TABLE check_usage_history
ADD CONSTRAINT check_usage_history_submission_id_fkey
FOREIGN KEY (submission_id)
REFERENCES student_submissions(id)
ON DELETE CASCADE;

-- Аналогично для evaluation_results
ALTER TABLE evaluation_results
DROP CONSTRAINT IF EXISTS evaluation_results_submission_id_fkey;

ALTER TABLE evaluation_results
ADD CONSTRAINT evaluation_results_submission_id_fkey
FOREIGN KEY (submission_id)
REFERENCES student_submissions(id)
ON DELETE CASCADE;

-- Комментарий для документации
COMMENT ON CONSTRAINT check_usage_history_submission_id_fkey ON check_usage_history IS
'Каскадное удаление: при удалении submission автоматически удаляются связанные записи истории';

COMMENT ON CONSTRAINT evaluation_results_submission_id_fkey ON evaluation_results IS
'Каскадное удаление: при удалении submission автоматически удаляются связанные результаты оценки';
