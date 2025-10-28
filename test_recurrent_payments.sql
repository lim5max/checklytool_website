-- ============================================
-- ТЕСТИРОВАНИЕ СИСТЕМЫ АВТОПРОДЛЕНИЯ
-- ============================================
-- Выполните этот скрипт в Supabase Dashboard → SQL Editor

-- 1. Изменить дату истечения на "завтра" для теста напоминания
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '1 day'
WHERE user_id = 'sadsad@mail.ru'
RETURNING
  user_id,
  subscription_expires_at,
  subscription_status,
  subscription_auto_renew,
  rebill_id;

-- 2. Вызвать функцию для проверки напоминаний (должен отправиться email)
SELECT auto_expire_subscriptions();

-- 3. Проверить, что уведомление записалось
SELECT
  user_id,
  notification_type,
  subscription_expires_at,
  sent_at,
  metadata
FROM subscription_notifications
WHERE user_id = 'sadsad@mail.ru'
ORDER BY sent_at DESC
LIMIT 5;

-- ============================================
-- ТЕСТ АВТОМАТИЧЕСКОГО СПИСАНИЯ
-- ============================================

-- 4. Изменить дату истечения на "сегодня" для теста автосписания
UPDATE user_profiles
SET subscription_expires_at = NOW() - INTERVAL '1 hour'
WHERE user_id = 'sadsad@mail.ru'
RETURNING
  user_id,
  subscription_expires_at,
  subscription_status,
  rebill_id;

-- 5. Вызвать функцию для автосписания (попытается списать деньги)
SELECT auto_expire_subscriptions();

-- 6. Проверить результат
SELECT
  user_id,
  subscription_status,
  subscription_expires_at,
  subscription_auto_renew,
  check_balance,
  payment_retry_count,
  payment_failed_at
FROM user_profiles
WHERE user_id = 'sadsad@mail.ru';

-- 7. Проверить уведомления
SELECT
  user_id,
  notification_type,
  subscription_expires_at,
  sent_at,
  metadata
FROM subscription_notifications
WHERE user_id = 'sadsad@mail.ru'
ORDER BY sent_at DESC
LIMIT 10;

-- ============================================
-- ВОССТАНОВЛЕНИЕ РЕАЛЬНЫХ ДАННЫХ
-- ============================================

-- 8. Вернуть реальную дату истечения (через 30 дней)
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = 'sadsad@mail.ru'
RETURNING
  user_id,
  subscription_expires_at;
