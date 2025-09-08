-- Обновление схемы базы данных для поддержки множественных вариантов
-- Выполни эти запросы в Supabase SQL Editor

-- 1. Обновляем таблицу check_variants для лучшей поддержки множественных вариантов
-- Добавляем поле name для названия варианта (если еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'check_variants' AND column_name = 'name'
    ) THEN
        ALTER TABLE check_variants 
        ADD COLUMN name TEXT NOT NULL DEFAULT 'Вариант 1';
    END IF;
END $$;

-- 2. Обновляем существующие записи с правильными названиями
UPDATE check_variants 
SET name = 'Вариант ' || variant_number
WHERE name = 'Вариант 1' OR name IS NULL;

-- 3. Создаем таблицу для хранения ответов каждого варианта (если нужно более гибкую структуру)
CREATE TABLE IF NOT EXISTS variant_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES check_variants(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id, question_number)
);

-- 4. Создаем индексы для лучшей производительности
CREATE INDEX IF NOT EXISTS idx_variant_answers_variant_id ON variant_answers(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_answers_question ON variant_answers(variant_id, question_number);

-- 5. Включаем RLS для новой таблицы
ALTER TABLE variant_answers ENABLE ROW LEVEL SECURITY;

-- 6. Создаем RLS политику для variant_answers
CREATE POLICY "Users can manage variant answers for own checks" ON variant_answers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM check_variants cv
        JOIN checks c ON c.id = cv.check_id
        WHERE cv.id = variant_answers.variant_id
        AND c.user_id = current_setting('app.current_user_id', true)
    )
);

-- 7. Создаем функцию для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_variant_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Создаем триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS trigger_update_variant_answers_updated_at ON variant_answers;
CREATE TRIGGER trigger_update_variant_answers_updated_at
    BEFORE UPDATE ON variant_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_variant_answers_updated_at();

-- 9. Мигрируем существующие данные из reference_answers в новую таблицу
INSERT INTO variant_answers (variant_id, question_number, correct_answer)
SELECT 
    cv.id as variant_id,
    (jsonb_each_text(cv.reference_answers)).key::INTEGER as question_number,
    (jsonb_each_text(cv.reference_answers)).value as correct_answer
FROM check_variants cv
WHERE cv.reference_answers IS NOT NULL 
AND jsonb_typeof(cv.reference_answers) = 'object'
ON CONFLICT (variant_id, question_number) DO NOTHING;

-- 10. Создаем функцию для получения всех вариантов проверки
CREATE OR REPLACE FUNCTION get_check_variants_with_answers(check_uuid UUID)
RETURNS TABLE (
    variant_id UUID,
    variant_name TEXT,
    variant_number INTEGER,
    answers JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.id as variant_id,
        cv.name as variant_name,
        cv.variant_number,
        COALESCE(
            jsonb_object_agg(va.question_number::TEXT, va.correct_answer),
            '{}'::jsonb
        ) as answers
    FROM check_variants cv
    LEFT JOIN variant_answers va ON va.variant_id = cv.id
    WHERE cv.check_id = check_uuid
    GROUP BY cv.id, cv.name, cv.variant_number
    ORDER BY cv.variant_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Создаем функцию для добавления нового варианта
CREATE OR REPLACE FUNCTION add_check_variant(
    check_uuid UUID,
    variant_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_variant_id UUID;
    next_variant_number INTEGER;
BEGIN
    -- Получаем следующий номер варианта
    SELECT COALESCE(MAX(variant_number), 0) + 1 
    INTO next_variant_number
    FROM check_variants 
    WHERE check_id = check_uuid;
    
    -- Устанавливаем название по умолчанию если не передано
    IF variant_name IS NULL THEN
        variant_name := 'Вариант ' || next_variant_number;
    END IF;
    
    -- Создаем новый вариант
    INSERT INTO check_variants (check_id, variant_number, name, reference_answers)
    VALUES (check_uuid, next_variant_number, variant_name, '{}'::jsonb)
    RETURNING id INTO new_variant_id;
    
    RETURN new_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Создаем функцию для удаления варианта с переименованием остальных
CREATE OR REPLACE FUNCTION remove_check_variant(
    variant_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    check_uuid UUID;
    variant_count INTEGER;
BEGIN
    -- Получаем check_id для данного варианта
    SELECT check_id INTO check_uuid
    FROM check_variants 
    WHERE id = variant_uuid;
    
    -- Проверяем количество вариантов
    SELECT COUNT(*) INTO variant_count
    FROM check_variants 
    WHERE check_id = check_uuid;
    
    -- Не удаляем если остался только один вариант
    IF variant_count <= 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Удаляем вариант
    DELETE FROM check_variants WHERE id = variant_uuid;
    
    -- Переименовываем и перенумеровываем оставшиеся варианты
    WITH numbered_variants AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY variant_number) as new_number
        FROM check_variants 
        WHERE check_id = check_uuid
    )
    UPDATE check_variants 
    SET 
        variant_number = nv.new_number,
        name = 'Вариант ' || nv.new_number
    FROM numbered_variants nv 
    WHERE check_variants.id = nv.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Выводим результат миграции
DO $$
BEGIN
    RAISE NOTICE 'Схема успешно обновлена для поддержки множественных вариантов!';
    RAISE NOTICE 'Новая таблица: variant_answers';
    RAISE NOTICE 'Новые функции: get_check_variants_with_answers(), add_check_variant(), remove_check_variant()';
    RAISE NOTICE 'Поддержка автоматического переименования вариантов при удалении';
END $$;