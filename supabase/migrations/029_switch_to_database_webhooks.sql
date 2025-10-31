-- Миграция: Переход на Database Webhooks для отправки email
-- Упрощаем систему: вместо HTTP запросов из функции, просто INSERT в таблицу
-- Database Webhook автоматически вызовет Edge Function при INSERT

-- ============================================================================
-- 1. УДАЛЕНИЕ СТАРЫХ ФУНКЦИЙ HTTP ЗАПРОСОВ
-- ============================================================================

-- Удаляем функцию отправки HTTP запросов (больше не нужна)
DROP FUNCTION IF EXISTS send_renewal_reminder(TEXT, TEXT, TEXT, NUMERIC, TIMESTAMP WITH TIME ZONE, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT);

-- Удаляем функцию charge_subscription если она использовала HTTP (оставляем если нужна)
-- DROP FUNCTION IF EXISTS charge_subscription(TEXT, TEXT, TEXT);

COMMENT ON TABLE subscription_notifications IS
'Таблица для логирования уведомлений пользователям.
При INSERT в эту таблицу Database Webhook автоматически вызовет Edge Function для отправки email.';

-- ============================================================================
-- 2. ОБНОВЛЕНИЕ auto_expire_subscriptions() - УПРОЩЕННАЯ ВЕРСИЯ
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_free_plan_id UUID;
	v_updated_count INT;
	v_charged_count INT := 0;
	v_reminder_count INT := 0;
	v_retry_count INT := 0;
	v_user RECORD;
	v_api_url TEXT;
	v_api_key TEXT;
BEGIN
	-- Получаем API ключ из Vault для защиты Edge Function
	SELECT decrypted_secret INTO v_api_key
	FROM vault.decrypted_secrets
	WHERE name = 'subscription_api_key'
	LIMIT 1;

	-- Если API ключ не настроен, прерываем выполнение email операций
	IF v_api_key IS NULL THEN
		RAISE WARNING 'API KEY not configured in Vault. Email notifications will be skipped.';
		RAISE NOTICE 'Please add subscription_api_key to Supabase Vault';
	END IF;

	-- ============================================================================
	-- 1. НАПОМИНАНИЯ ЗА 1 ДЕНЬ ДО СПИСАНИЯ
	-- ============================================================================
	IF v_api_key IS NOT NULL THEN
		FOR v_user IN
			SELECT
				up.user_id,
				up.email,
				up.name,
				up.subscription_expires_at,
				sp.price,
				sp.display_name as plan_name
			FROM user_profiles up
			JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
			WHERE
				up.subscription_auto_renew = true
				AND up.rebill_id IS NOT NULL
				AND up.subscription_status = 'active'
				AND up.subscription_expires_at > NOW()
				AND up.subscription_expires_at <= NOW() + INTERVAL '1 day' + INTERVAL '2 hours'
				AND up.subscription_expires_at >= NOW() + INTERVAL '1 day' - INTERVAL '2 hours'
				-- Проверяем, что уведомление еще не отправлено
				AND NOT EXISTS (
					SELECT 1
					FROM subscription_notifications sn
					WHERE sn.user_id = up.user_id
						AND sn.notification_type = 'renewal_reminder'
						AND sn.subscription_expires_at = up.subscription_expires_at
				)
		LOOP
			-- Просто вставляем запись в таблицу - Database Webhook вызовет Edge Function
			INSERT INTO subscription_notifications (
				user_id,
				notification_type,
				subscription_expires_at,
				metadata
			) VALUES (
				v_user.user_id,
				'renewal_reminder',
				v_user.subscription_expires_at,
				jsonb_build_object(
					'email', v_user.email,
					'userName', v_user.name,
					'amount', v_user.price,
					'renewalDate', v_user.subscription_expires_at,
					'planName', v_user.plan_name,
					'subscriptionExpiresAt', v_user.subscription_expires_at
				)
			);

			v_reminder_count := v_reminder_count + 1;
			RAISE NOTICE 'Reminder notification queued for user %', v_user.user_id;
		END LOOP;

		RAISE NOTICE 'Reminder notifications queued: %', v_reminder_count;
	END IF;

	-- ============================================================================
	-- 2. АВТОМАТИЧЕСКОЕ СПИСАНИЕ (В ДЕНЬ ИСТЕЧЕНИЯ)
	-- ============================================================================
	IF v_api_key IS NOT NULL THEN
		FOR v_user IN
			SELECT
				user_id,
				subscription_expires_at
			FROM user_profiles
			WHERE
				subscription_auto_renew = true
				AND rebill_id IS NOT NULL
				AND subscription_status = 'active'
				-- Истекает сегодня (в пределах ±2 часов)
				AND subscription_expires_at <= NOW() + INTERVAL '2 hours'
				AND subscription_expires_at >= NOW() - INTERVAL '2 hours'
				AND payment_retry_count = 0 -- Первая попытка
		LOOP
			-- Пытаемся списать средства через API
			IF charge_subscription(v_user.user_id, v_api_url, v_api_key) THEN
				v_charged_count := v_charged_count + 1;
			END IF;
		END LOOP;

		RAISE NOTICE 'Charge requests sent: %', v_charged_count;

		-- ============================================================================
		-- 3. ПОВТОРНАЯ ПОПЫТКА СПИСАНИЯ (ЧЕРЕЗ 3 ДНЯ)
		-- ============================================================================
		FOR v_user IN
			SELECT
				user_id,
				payment_failed_at
			FROM user_profiles
			WHERE
				subscription_auto_renew = true
				AND rebill_id IS NOT NULL
				AND subscription_status = 'active'
				AND payment_retry_count = 1 -- Вторая попытка
				AND payment_failed_at IS NOT NULL
				-- Прошло 3 дня с первой неудачи (±2 часа)
				AND payment_failed_at <= NOW() - INTERVAL '3 days' + INTERVAL '2 hours'
				AND payment_failed_at >= NOW() - INTERVAL '3 days' - INTERVAL '2 hours'
		LOOP
			-- Пытаемся списать средства повторно
			IF charge_subscription(v_user.user_id, v_api_url, v_api_key) THEN
				v_retry_count := v_retry_count + 1;
			END IF;
		END LOOP;

		RAISE NOTICE 'Retry charge requests sent: %', v_retry_count;
	END IF;

	-- ============================================================================
	-- 4. ИСТЕЧЕНИЕ ПОДПИСОК БЕЗ АВТОПРОДЛЕНИЯ
	-- ============================================================================
	-- Получаем ID бесплатного плана
	SELECT id INTO v_free_plan_id
	FROM subscription_plans
	WHERE name = 'FREE'
	LIMIT 1;

	IF v_free_plan_id IS NULL THEN
		RAISE EXCEPTION 'FREE plan not found in subscription_plans table';
	END IF;

	-- Обновляем пользователей с истекшими подписками БЕЗ автопродления
	WITH updated AS (
		UPDATE user_profiles
		SET
			subscription_plan_id = v_free_plan_id,
			subscription_status = 'active', -- FREE план всегда active
			updated_at = NOW()
		WHERE
			subscription_expires_at IS NOT NULL
			AND subscription_expires_at < NOW()
			AND subscription_plan_id != v_free_plan_id
			AND (subscription_auto_renew = false OR rebill_id IS NULL) -- Без автопродления
		RETURNING id
	)
	SELECT COUNT(*) INTO v_updated_count FROM updated;

	RAISE NOTICE 'Subscriptions auto-expired (no auto-renew): %', v_updated_count;

	-- ============================================================================
	-- ИТОГОВАЯ СВОДКА
	-- ============================================================================
	RAISE NOTICE '=== Subscription Management Summary ===';
	RAISE NOTICE 'Renewal reminder notifications queued: %', v_reminder_count;
	RAISE NOTICE 'Charge requests sent: %', v_charged_count;
	RAISE NOTICE 'Retry requests sent: %', v_retry_count;
	RAISE NOTICE 'Expired subscriptions: %', v_updated_count;
	RAISE NOTICE 'Email notifications will be sent by Database Webhook → Edge Function';
END;
$$;

COMMENT ON FUNCTION auto_expire_subscriptions() IS
'Управляет жизненным циклом подписок:
- Создает записи в subscription_notifications для отправки email напоминаний (Database Webhook вызовет Edge Function)
- Автоматически списывает средства в день истечения через API
- Повторяет попытку через 3 дня при неудаче
- Переводит на FREE план при истечении без автопродления';

-- ============================================================================
-- 3. СОЗДАНИЕ ФУНКЦИИ ДЛЯ РУЧНОГО ТЕСТИРОВАНИЯ EMAIL
-- ============================================================================

CREATE OR REPLACE FUNCTION test_send_email_notification(
	p_user_id TEXT,
	p_notification_type TEXT DEFAULT 'renewal_reminder'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_user RECORD;
	v_notification_id BIGINT;
BEGIN
	-- Получаем данные пользователя
	SELECT
		up.user_id,
		up.email,
		up.name,
		up.subscription_expires_at,
		sp.price,
		sp.display_name as plan_name
	INTO v_user
	FROM user_profiles up
	JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
	WHERE up.user_id = p_user_id;

	IF v_user.user_id IS NULL THEN
		RETURN jsonb_build_object(
			'success', false,
			'error', 'User not found'
		);
	END IF;

	-- Создаем тестовую запись в subscription_notifications
	INSERT INTO subscription_notifications (
		user_id,
		notification_type,
		subscription_expires_at,
		metadata
	) VALUES (
		v_user.user_id,
		p_notification_type,
		v_user.subscription_expires_at,
		jsonb_build_object(
			'email', v_user.email,
			'userName', v_user.name,
			'amount', v_user.price,
			'renewalDate', v_user.subscription_expires_at,
			'planName', v_user.plan_name,
			'subscriptionExpiresAt', v_user.subscription_expires_at,
			'retryCount', 1
		)
	) RETURNING id INTO v_notification_id;

	RETURN jsonb_build_object(
		'success', true,
		'message', 'Test notification created. Database Webhook will trigger Edge Function.',
		'notificationId', v_notification_id,
		'email', v_user.email,
		'type', p_notification_type
	);
END;
$$;

COMMENT ON FUNCTION test_send_email_notification(TEXT, TEXT) IS
'Функция для ручного тестирования отправки email уведомлений.
Создает запись в subscription_notifications, которая триггерит Database Webhook.
Пример использования: SELECT test_send_email_notification(''user-id'', ''renewal_reminder'');';
