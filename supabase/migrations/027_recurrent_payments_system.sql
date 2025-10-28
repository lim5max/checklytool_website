-- Миграция: Система рекуррентных платежей
-- Обновляет существующую функцию auto_expire_subscriptions() для поддержки:
-- 1. Отправки email напоминаний за 1 день
-- 2. Автоматического списания средств через API
-- 3. Повторных попыток списания через 3 дня
-- 4. Приостановки подписок после неудач

-- Включаем расширение pg_net для HTTP запросов (если еще не включено)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Создаем функцию для отправки HTTP запросов к API charge endpoint
CREATE OR REPLACE FUNCTION charge_subscription(p_user_id TEXT, p_api_url TEXT, p_api_key TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id BIGINT;
  v_response RECORD;
BEGIN
  -- Отправляем POST запрос к API charge endpoint
  SELECT INTO v_request_id net.http_post(
    url := p_api_url || '/api/payment/charge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-api-key', p_api_key
    ),
    body := jsonb_build_object('userId', p_user_id)
  );

  -- Логируем запрос
  RAISE NOTICE 'Charge request sent for user %: request_id=%', p_user_id, v_request_id;

  -- Возвращаем true если запрос отправлен
  RETURN v_request_id IS NOT NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to charge subscription for user %: %', p_user_id, SQLERRM;
    RETURN false;
END;
$$;

-- Комментарий к функции
COMMENT ON FUNCTION charge_subscription(TEXT, TEXT, TEXT) IS
'Отправляет HTTP запрос к API для автоматического списания средств с карты пользователя';

-- Обновляем основную функцию auto_expire_subscriptions
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
  -- Получаем настройки API из переменных окружения или используем значения по умолчанию
  -- ВАЖНО: Эти значения нужно настроить в Supabase Dashboard -> Settings -> Vault
  SELECT decrypted_secret INTO v_api_url
  FROM vault.decrypted_secrets
  WHERE name = 'subscription_api_url'
  LIMIT 1;

  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE name = 'subscription_api_key'
  LIMIT 1;

  -- Если не настроены в Vault, используем публичную переменную (менее безопасно)
  IF v_api_url IS NULL THEN
    v_api_url := current_setting('app.settings.site_url', true);
  END IF;

  -- Если URL все еще NULL, прерываем выполнение
  IF v_api_url IS NULL OR v_api_key IS NULL THEN
    RAISE WARNING 'API URL or API KEY not configured. Skipping recurrent charges.';
    RAISE NOTICE 'Please configure in Supabase Dashboard: Project Settings -> Vault';
    RAISE NOTICE 'Add secrets: subscription_api_url and subscription_api_key';
  END IF;

  -- ============================================================================
  -- 1. НАПОМИНАНИЯ ЗА 1 ДЕНЬ ДО СПИСАНИЯ
  -- ============================================================================
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
    -- Записываем уведомление в БД (фактическая отправка email произойдет через Next.js API)
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
        'name', v_user.name,
        'amount', v_user.price,
        'plan_name', v_user.plan_name
      )
    );

    v_reminder_count := v_reminder_count + 1;
  END LOOP;

  RAISE NOTICE 'Reminder notifications queued: %', v_reminder_count;

  -- ============================================================================
  -- 2. АВТОМАТИЧЕСКОЕ СПИСАНИЕ (В ДЕНЬ ИСТЕЧЕНИЯ)
  -- ============================================================================
  IF v_api_url IS NOT NULL AND v_api_key IS NOT NULL THEN
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
  RAISE NOTICE 'Renewal reminders sent: %', v_reminder_count;
  RAISE NOTICE 'Charge requests sent: %', v_charged_count;
  RAISE NOTICE 'Retry requests sent: %', v_retry_count;
  RAISE NOTICE 'Expired subscriptions: %', v_updated_count;
END;
$$;

-- Обновляем комментарий к функции
COMMENT ON FUNCTION auto_expire_subscriptions() IS
'Управляет жизненным циклом подписок:
- Отправляет напоминания за 1 день до списания
- Автоматически списывает средства в день истечения
- Повторяет попытку через 3 дня при неудаче
- Переводит на FREE план при истечении без автопродления';

-- ============================================================================
-- НАСТРОЙКА CRON JOB (обновление существующего)
-- ============================================================================
DO $$
BEGIN
  -- Проверяем наличие pg_cron
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Удаляем существующий job
    PERFORM cron.unschedule('auto-expire-subscriptions');

    -- Создаём новый job (каждый день в 09:00 UTC = 12:00 МСК)
    PERFORM cron.schedule(
      'auto-expire-subscriptions',
      '0 9 * * *',
      'SELECT auto_expire_subscriptions();'
    );

    RAISE NOTICE 'Cron job updated successfully - runs daily at 09:00 UTC';
  ELSE
    RAISE NOTICE 'pg_cron extension not found.';
    RAISE NOTICE 'To enable automatic processing:';
    RAISE NOTICE '1. Enable pg_cron in Supabase Dashboard';
    RAISE NOTICE '2. Or call function manually: SELECT auto_expire_subscriptions();';
    RAISE NOTICE '3. Or set up external cron to call via API';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update cron job: %.', SQLERRM;
    RAISE NOTICE 'Please set up manual execution or external cron.';
END
$$;

-- ============================================================================
-- СОЗДАНИЕ API ENDPOINT ДЛЯ РУЧНОГО ЗАПУСКА (ОПЦИОНАЛЬНО)
-- ============================================================================
-- Эту функцию можно вызвать через Supabase Functions или напрямую

CREATE OR REPLACE FUNCTION trigger_subscription_renewal()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Вызываем основную функцию
  PERFORM auto_expire_subscriptions();

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Subscription renewal triggered successfully',
    'timestamp', NOW()
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
END;
$$;

COMMENT ON FUNCTION trigger_subscription_renewal() IS
'API endpoint для ручного запуска обработки подписок';

-- Запускаем функцию первый раз
SELECT auto_expire_subscriptions();
