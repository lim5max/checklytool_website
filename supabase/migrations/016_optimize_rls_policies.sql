-- ============================================
-- ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ: RLS Политики
-- Исправление auth.email() на (SELECT auth.email())
-- ============================================
-- Дата: 2025-10-19
-- ПРИОРИТЕТ: ВЫСОКИЙ
-- ПРОБЛЕМА: auth.email() вызывается для КАЖДОЙ строки
-- ОЖИДАЕМЫЙ ПРИРОСТ: 30-70% на больших выборках
-- РЕШЕНИЕ: Обернуть в SELECT для вызова 1 раз на запрос
-- ============================================

-- ============================================
-- 1. ОПТИМИЗАЦИЯ ПОЛИТИК НА CHECKS
-- ============================================

-- Текущая проблема: auth.email() вызывается 4 раза для каждой строки
-- После оптимизации: 1 раз на весь запрос

-- Пересоздать политику просмотра проверок
DROP POLICY IF EXISTS "Users can view own checks" ON public.checks;
CREATE POLICY "Users can view own checks"
ON public.checks
FOR SELECT
USING (user_id = (SELECT auth.email()));

-- Пересоздать политику создания проверок
DROP POLICY IF EXISTS "Users can create checks" ON public.checks;
CREATE POLICY "Users can create checks"
ON public.checks
FOR INSERT
WITH CHECK (user_id = (SELECT auth.email()));

-- Пересоздать политику обновления проверок
DROP POLICY IF EXISTS "Users can update own checks" ON public.checks;
CREATE POLICY "Users can update own checks"
ON public.checks
FOR UPDATE
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));

-- Пересоздать политику удаления проверок
DROP POLICY IF EXISTS "Users can delete own checks" ON public.checks;
CREATE POLICY "Users can delete own checks"
ON public.checks
FOR DELETE
USING (user_id = (SELECT auth.email()));

-- ============================================
-- 2. ОПТИМИЗАЦИЯ ПОЛИТИК НА VARIANT_ANSWERS
-- ============================================

DROP POLICY IF EXISTS "Users can manage variant answers for own checks" ON public.variant_answers;
CREATE POLICY "Users can manage variant answers for own checks"
ON public.variant_answers
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM check_variants cv
		JOIN checks c ON c.id = cv.check_id
		WHERE cv.id = variant_answers.variant_id
			AND c.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 3. ОПТИМИЗАЦИЯ ПОЛИТИК НА GENERATED_TESTS
-- ============================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own tests" ON public.generated_tests;
DROP POLICY IF EXISTS "Users can insert own tests" ON public.generated_tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.generated_tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.generated_tests;

-- Создаем одну оптимизированную политику
CREATE POLICY "Users can manage own tests"
ON public.generated_tests
FOR ALL
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));

-- ============================================
-- 4. ОПТИМИЗАЦИЯ ПОЛИТИК НА CHECK_USAGE_HISTORY
-- ============================================

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can read own usage history" ON public.check_usage_history;
DROP POLICY IF EXISTS "Users can insert own usage history" ON public.check_usage_history;

-- Создаем одну оптимизированную политику
CREATE POLICY "Users can manage own usage history"
ON public.check_usage_history
FOR ALL
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));

-- ============================================
-- 5. ОПТИМИЗАЦИЯ ПОЛИТИК НА USER_PROFILES
-- ============================================

-- Удаляем небезопасные политики
DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all profile operations" ON public.user_profiles;

-- Создаем безопасные и оптимизированные политики
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (email = (SELECT auth.email()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (email = (SELECT auth.email()))
WITH CHECK (email = (SELECT auth.email()));

-- Разрешить service role управлять всеми профилями
CREATE POLICY "Service role can manage all profiles"
ON public.user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. ОПТИМИЗАЦИЯ ПОЛИТИК НА CHECK_VARIANTS
-- ============================================

DROP POLICY IF EXISTS "Users can manage variants for own checks" ON public.check_variants;
CREATE POLICY "Users can manage variants for own checks"
ON public.check_variants
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM checks
		WHERE checks.id = check_variants.check_id
			AND checks.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 7. ОПТИМИЗАЦИЯ ПОЛИТИК НА GRADING_CRITERIA
-- ============================================

DROP POLICY IF EXISTS "Users can manage criteria for own checks" ON public.grading_criteria;
CREATE POLICY "Users can manage criteria for own checks"
ON public.grading_criteria
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM checks
		WHERE checks.id = grading_criteria.check_id
			AND checks.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 8. ОПТИМИЗАЦИЯ ПОЛИТИК НА STUDENT_SUBMISSIONS
-- ============================================

DROP POLICY IF EXISTS "Users can manage submissions for own checks" ON public.student_submissions;
CREATE POLICY "Users can manage submissions for own checks"
ON public.student_submissions
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM checks
		WHERE checks.id = student_submissions.check_id
			AND checks.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 9. ОПТИМИЗАЦИЯ ПОЛИТИК НА EVALUATION_RESULTS
-- ============================================

DROP POLICY IF EXISTS "Users can view results for own submissions" ON public.evaluation_results;
CREATE POLICY "Users can view results for own submissions"
ON public.evaluation_results
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM student_submissions s
		JOIN checks c ON c.id = s.check_id
		WHERE s.id = evaluation_results.submission_id
			AND c.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 10. ОПТИМИЗАЦИЯ ПОЛИТИК НА CHECK_STATISTICS
-- ============================================

DROP POLICY IF EXISTS "Users can view stats for own checks" ON public.check_statistics;
CREATE POLICY "Users can view stats for own checks"
ON public.check_statistics
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM checks
		WHERE checks.id = check_statistics.check_id
			AND checks.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- 11. ОПТИМИЗАЦИЯ ПОЛИТИК НА ESSAY_GRADING_CRITERIA
-- ============================================

DROP POLICY IF EXISTS "Users can manage their own essay criteria" ON public.essay_grading_criteria;
CREATE POLICY "Users can manage their own essay criteria"
ON public.essay_grading_criteria
FOR ALL
USING (
	EXISTS (
		SELECT 1
		FROM checks
		WHERE checks.id = essay_grading_criteria.check_id
			AND checks.user_id = (SELECT auth.email())
	)
);

-- ============================================
-- КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- ============================================

COMMENT ON POLICY "Users can view own checks" ON public.checks IS
'Оптимизированная политика просмотра: auth.email() вызывается 1 раз';

COMMENT ON POLICY "Users can manage own tests" ON public.generated_tests IS
'Единая оптимизированная политика для всех операций с тестами';

COMMENT ON POLICY "Users can manage own usage history" ON public.check_usage_history IS
'Единая оптимизированная политика для истории использования';

COMMENT ON POLICY "Users can view own profile" ON public.user_profiles IS
'Безопасная политика просмотра профиля';

COMMENT ON POLICY "Users can update own profile" ON public.user_profiles IS
'Безопасная политика обновления профиля';

-- ============================================
-- МИГРАЦИЯ ЗАВЕРШЕНА
-- ============================================
-- ✓ Оптимизировано 11 таблиц
-- ✓ auth.email() теперь вызывается 1 раз вместо N раз
-- ✓ Удалены небезопасные политики "Allow all operations"
-- ✓ Удалены дублирующие политики
-- ✓ Ожидаемый прирост производительности: 30-70%
-- ============================================
