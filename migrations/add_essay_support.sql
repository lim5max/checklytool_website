-- Migration: Add Essay Support
-- Добавляем поддержку сочинений в базу данных

-- 1. Добавляем поле check_type для различения тестов и сочинений
ALTER TABLE checks ADD COLUMN check_type TEXT DEFAULT 'test'
CHECK (check_type IN ('test', 'essay'));

-- 2. Создаем таблицу для критериев оценки сочинений
CREATE TABLE essay_grading_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id UUID REFERENCES checks(id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    min_errors INTEGER, -- минимальное количество ошибок для этой оценки
    max_errors INTEGER, -- максимальное количество ошибок (null для самой высокой оценки)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Добавляем индекс для быстрого поиска критериев
CREATE INDEX idx_essay_grading_criteria_check_id ON essay_grading_criteria(check_id);

-- 4. Включаем RLS для новой таблицы
ALTER TABLE essay_grading_criteria ENABLE ROW LEVEL SECURITY;

-- 5. Создаем политику RLS - пользователи могут видеть только свои критерии
CREATE POLICY "Users can manage their own essay criteria" ON essay_grading_criteria
    USING (check_id IN (SELECT id FROM checks WHERE user_id = current_user));

-- 6. Добавляем шаблонные критерии для сочинений
-- (эти записи с check_id = NULL будут использоваться как дефолтные)
INSERT INTO essay_grading_criteria (check_id, grade, title, description, min_errors, max_errors)
VALUES
    (NULL, 5, 'Отлично', 'структура соблюдена, логика ясная, ошибок мало или совсем нет (не более двух грамматических ошибок)', 0, 2),
    (NULL, 4, 'Хорошо', 'структура есть, логика в целом понятна, ошибок немного (от 3 до 6 грамматических и синтаксических)', 3, 6),
    (NULL, 3, 'Удовлетворительно', 'структура нарушена (например, нет заключения), логика местами сбивается, ошибок достаточно много (более 6 ошибок грамматических и синтаксических)', 7, NULL),
    (NULL, 2, 'Неудовлетворительно', 'структура отсутствует, логики почти нет, ошибок очень много, текст трудно читать', NULL, NULL);

-- 7. Добавляем комментарии для понимания схемы
COMMENT ON COLUMN essay_grading_criteria.min_errors IS 'Минимальное количество грамматических и синтаксических ошибок для этой оценки';
COMMENT ON COLUMN essay_grading_criteria.max_errors IS 'Максимальное количество ошибок (NULL означает без верхнего ограничения)';
COMMENT ON TABLE essay_grading_criteria IS 'Критерии оценки сочинений с учетом структуры, логики и количества ошибок';

-- 8. Добавляем поле для хранения дополнительных метаданных оценки сочинения в evaluation_results
ALTER TABLE evaluation_results ADD COLUMN essay_metadata JSONB;
COMMENT ON COLUMN evaluation_results.essay_metadata IS 'Дополнительные данные для сочинений: количество ошибок, анализ структуры и логики';