-- Исправление таблицы subscription_plans

-- Сначала проверим, существует ли таблица, и посмотрим её структуру
-- Если таблица существует, добавляем недостающие поля
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS check_quota INTEGER NOT NULL DEFAULT 0;

-- Обновляем существующие планы
UPDATE subscription_plans SET check_quota = 0 WHERE name = 'FREE';
UPDATE subscription_plans SET check_quota = 50 WHERE name = 'PLUS';
UPDATE subscription_plans SET check_quota = 100 WHERE name = 'PRO';

-- Теперь обновляем check_balance для пользователя test@mail.ru
UPDATE user_profiles
SET check_balance = (
  SELECT check_quota
  FROM subscription_plans
  WHERE id = user_profiles.subscription_plan_id
)
WHERE email = 'test@mail.ru'
  AND subscription_plan_id IS NOT NULL
  AND (check_balance = 0 OR check_balance IS NULL);

-- Проверяем результат
SELECT
  up.email,
  up.name,
  sp.name as plan_name,
  sp.display_name as plan_display,
  sp.check_quota as plan_quota,
  up.check_balance,
  up.subscription_started_at,
  up.subscription_expires_at
FROM user_profiles up
LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
WHERE up.email = 'test@mail.ru';
