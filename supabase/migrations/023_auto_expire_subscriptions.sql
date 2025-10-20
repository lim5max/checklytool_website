-- Миграция: Автоматическое истечение подписок
-- Создаёт функцию и триггер для автоматического возврата пользователей к бесплатному плану
-- при окончании срока действия платной подписки

-- 1. Создаём функцию для автоматического возврата к бесплатному плану
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_plan_id UUID;
  v_updated_count INT;
BEGIN
  -- Получаем ID бесплатного плана
  SELECT id INTO v_free_plan_id
  FROM subscription_plans
  WHERE name = 'FREE'
  LIMIT 1;

  IF v_free_plan_id IS NULL THEN
    RAISE EXCEPTION 'FREE plan not found in subscription_plans table';
  END IF;

  -- Обновляем пользователей с истёкшими подписками
  WITH updated AS (
    UPDATE user_profiles
    SET
      subscription_plan_id = v_free_plan_id,
      updated_at = NOW()
    WHERE
      subscription_expires_at IS NOT NULL
      AND subscription_expires_at < NOW()
      AND subscription_plan_id != v_free_plan_id
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated;

  -- Логируем результат
  RAISE NOTICE 'Auto-expired % subscriptions', v_updated_count;
END;
$$;

-- 2. Комментарий к функции
COMMENT ON FUNCTION auto_expire_subscriptions() IS
'Автоматически переводит пользователей с истёкшими подписками на бесплатный план';

-- 3. Создаём cron job для ежедневного запуска (требует pg_cron extension)
-- Примечание: В Supabase нужно включить pg_cron в Dashboard
-- Запускаем каждый день в 00:00 UTC
DO $$
BEGIN
  -- Проверяем наличие pg_cron
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Удаляем существующий job если есть
    PERFORM cron.unschedule('auto-expire-subscriptions');

    -- Создаём новый job
    PERFORM cron.schedule(
      'auto-expire-subscriptions',
      '0 0 * * *', -- Каждый день в полночь
      'SELECT auto_expire_subscriptions();'
    );

    RAISE NOTICE 'Cron job created successfully';
  ELSE
    RAISE NOTICE 'pg_cron extension not found. Please enable it in Supabase Dashboard or run manually';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron job: %. Please run function manually or set up external cron.', SQLERRM;
END
$$;

-- 4. Запускаем функцию первый раз для существующих истёкших подписок
SELECT auto_expire_subscriptions();
