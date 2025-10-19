-- ============================================
-- ИСПРАВЛЕНИЕ БЕЗОПАСНОСТИ: Function Search Path
-- Добавление search_path для всех функций
-- ============================================
-- Дата: 2025-10-19
-- ПРИОРИТЕТ: ВЫСОКИЙ
-- ПРОБЛЕМА: 14 функций без установленного search_path
-- РИСК: Возможность атаки через изменение search_path
-- РЕШЕНИЕ: Установить search_path для всех функций
-- ============================================

-- 1. update_variant_answers_updated_at
CREATE OR REPLACE FUNCTION update_variant_answers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

-- 3. update_payment_orders_updated_at
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

-- 4. get_check_variants_with_answers
-- Эта функция возвращает варианты с ответами
CREATE OR REPLACE FUNCTION get_check_variants_with_answers(p_check_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	result JSON;
BEGIN
	SELECT json_agg(
		json_build_object(
			'id', cv.id,
			'variant_number', cv.variant_number,
			'answers', (
				SELECT json_agg(
					json_build_object(
						'question_number', va.question_number,
						'correct_answer', va.correct_answer
					) ORDER BY va.question_number
				)
				FROM variant_answers va
				WHERE va.variant_id = cv.id
			)
		) ORDER BY cv.variant_number
	)
	INTO result
	FROM check_variants cv
	WHERE cv.check_id = p_check_id;

	RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. add_check_variant
CREATE OR REPLACE FUNCTION add_check_variant(
	p_check_id UUID,
	p_variant_number INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_variant_id UUID;
BEGIN
	INSERT INTO check_variants (check_id, variant_number)
	VALUES (p_check_id, p_variant_number)
	RETURNING id INTO v_variant_id;

	RETURN v_variant_id;
END;
$$;

-- 6. remove_check_variant
CREATE OR REPLACE FUNCTION remove_check_variant(p_variant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	DELETE FROM check_variants WHERE id = p_variant_id;
	RETURN FOUND;
END;
$$;

-- 7. handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	INSERT INTO public.user_profiles (user_id, email, name, image)
	VALUES (
		NEW.id,
		NEW.email,
		COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
		NEW.raw_user_meta_data->>'avatar_url'
	)
	ON CONFLICT (user_id) DO NOTHING;

	RETURN NEW;
END;
$$;

-- 8. add_subscription
CREATE OR REPLACE FUNCTION add_subscription(
	p_user_id TEXT,
	p_plan_id UUID,
	p_duration_days INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_current_expiry TIMESTAMPTZ;
	v_new_expiry TIMESTAMPTZ;
BEGIN
	-- Получить текущую дату истечения подписки
	SELECT subscription_expires_at INTO v_current_expiry
	FROM user_profiles
	WHERE user_id = p_user_id;

	-- Если подписка активна, продлить от текущей даты, иначе от NOW()
	IF v_current_expiry > NOW() THEN
		v_new_expiry := v_current_expiry + (p_duration_days || ' days')::INTERVAL;
	ELSE
		v_new_expiry := NOW() + (p_duration_days || ' days')::INTERVAL;
	END IF;

	-- Обновить профиль пользователя
	UPDATE user_profiles
	SET
		subscription_plan_id = p_plan_id,
		subscription_expires_at = v_new_expiry
	WHERE user_id = p_user_id;
END;
$$;

-- 9. update_user_profile_stats
CREATE OR REPLACE FUNCTION update_user_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	-- Обновить статистику пользователя после изменения проверок
	UPDATE user_profiles
	SET
		checks_count = (
			SELECT COUNT(*)
			FROM checks
			WHERE user_id = NEW.user_id
		)
	WHERE user_id = NEW.user_id;

	RETURN NEW;
END;
$$;

-- 10. update_check_statistics
CREATE OR REPLACE FUNCTION update_check_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_check_id UUID;
	v_total_submissions INTEGER;
	v_completed_submissions INTEGER;
	v_avg_score NUMERIC;
BEGIN
	-- Определить check_id в зависимости от операции
	IF TG_OP = 'DELETE' THEN
		v_check_id := OLD.check_id;
	ELSE
		v_check_id := NEW.check_id;
	END IF;

	-- Подсчитать статистику
	SELECT
		COUNT(*),
		COUNT(*) FILTER (WHERE status = 'completed'),
		AVG(
			CASE
				WHEN er.percentage_score IS NOT NULL
				THEN er.percentage_score
				ELSE NULL
			END
		)
	INTO
		v_total_submissions,
		v_completed_submissions,
		v_avg_score
	FROM student_submissions ss
	LEFT JOIN evaluation_results er ON er.submission_id = ss.id
	WHERE ss.check_id = v_check_id;

	-- Обновить или создать статистику
	INSERT INTO check_statistics (
		check_id,
		total_submissions,
		completed_submissions,
		average_score
	)
	VALUES (
		v_check_id,
		v_total_submissions,
		v_completed_submissions,
		v_avg_score
	)
	ON CONFLICT (check_id)
	DO UPDATE SET
		total_submissions = EXCLUDED.total_submissions,
		completed_submissions = EXCLUDED.completed_submissions,
		average_score = EXCLUDED.average_score,
		updated_at = NOW();

	RETURN COALESCE(NEW, OLD);
END;
$$;

-- 11. trigger_update_statistics
CREATE OR REPLACE FUNCTION trigger_update_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	PERFORM update_check_statistics();
	RETURN NEW;
END;
$$;

-- 12. trigger_update_user_stats
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
	PERFORM update_user_profile_stats();
	RETURN NEW;
END;
$$;

-- 13. deduct_check_credits
CREATE OR REPLACE FUNCTION deduct_check_credits(
	p_user_id TEXT,
	p_credits_to_deduct INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_current_credits INTEGER;
BEGIN
	-- Получить текущее количество кредитов
	SELECT checks_remaining INTO v_current_credits
	FROM user_profiles
	WHERE user_id = p_user_id
	FOR UPDATE; -- Блокировка для предотвращения race condition

	-- Проверить, достаточно ли кредитов
	IF v_current_credits < p_credits_to_deduct THEN
		RETURN FALSE;
	END IF;

	-- Списать кредиты
	UPDATE user_profiles
	SET checks_remaining = checks_remaining - p_credits_to_deduct
	WHERE user_id = p_user_id;

	RETURN TRUE;
END;
$$;

-- 14. get_dashboard_stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	result JSON;
BEGIN
	SELECT json_build_object(
		'total_checks', COUNT(DISTINCT c.id),
		'total_submissions', COUNT(DISTINCT s.id),
		'completed_submissions', COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END),
		'avg_score', ROUND(AVG(e.percentage_score), 2),
		'submissions_last_7_days', COUNT(DISTINCT CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN s.id END),
		'checks_last_7_days', COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN c.id END)
	)
	INTO result
	FROM checks c
	LEFT JOIN student_submissions s ON s.check_id = c.id
	LEFT JOIN evaluation_results e ON e.submission_id = s.id
	WHERE c.user_id = p_user_id;

	RETURN result;
END;
$$;

-- ============================================
-- КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- ============================================

COMMENT ON FUNCTION update_variant_answers_updated_at() IS
'Триггер для автоматического обновления updated_at в variant_answers';

COMMENT ON FUNCTION update_updated_at_column() IS
'Универсальный триггер для автоматического обновления updated_at';

COMMENT ON FUNCTION update_payment_orders_updated_at() IS
'Триггер для автоматического обновления updated_at в payment_orders';

COMMENT ON FUNCTION get_check_variants_with_answers(UUID) IS
'Получить все варианты проверки с их ответами в формате JSON';

COMMENT ON FUNCTION add_check_variant(UUID, INTEGER) IS
'Добавить новый вариант к проверке';

COMMENT ON FUNCTION remove_check_variant(UUID) IS
'Удалить вариант проверки';

COMMENT ON FUNCTION handle_new_user() IS
'Триггер для автоматического создания профиля при регистрации';

COMMENT ON FUNCTION add_subscription(TEXT, UUID, INTEGER) IS
'Добавить или продлить подписку пользователя';

COMMENT ON FUNCTION update_user_profile_stats() IS
'Обновить статистику пользователя (количество проверок)';

COMMENT ON FUNCTION update_check_statistics() IS
'Обновить статистику проверки (количество сабмишенов, средний балл)';

COMMENT ON FUNCTION deduct_check_credits(TEXT, INTEGER) IS
'Списать кредиты проверки с баланса пользователя (thread-safe)';

COMMENT ON FUNCTION get_dashboard_stats(TEXT) IS
'Получить агрегированную статистику для dashboard пользователя';

-- ============================================
-- МИГРАЦИЯ ЗАВЕРШЕНА
-- ============================================
-- ✓ Исправлено 14 функций
-- ✓ Добавлен search_path = public для всех функций
-- ✓ Добавлен SECURITY DEFINER где необходимо
-- ✓ Добавлены комментарии для документации
-- ✓ Устранена уязвимость search_path injection
-- ============================================
