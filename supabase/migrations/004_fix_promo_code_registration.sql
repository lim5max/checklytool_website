-- Исправление для пользователей с промокодом, у которых check_balance = 0

-- Сначала проверим структуру subscription_plans
-- Если у вас нет таблицы subscription_plans, создадим её
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  check_quota INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0, -- цена в копейках
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Добавляем планы, если их нет
INSERT INTO subscription_plans (name, display_name, check_quota, price, is_active)
VALUES
  ('FREE', 'Бесплатный', 0, 0, true),
  ('PLUS', 'Plus', 50, 49900, true),
  ('PRO', 'Pro', 100, 99900, true)
ON CONFLICT (name) DO NOTHING;

-- Обновляем баланс для пользователя test@mail.ru с промокодом
UPDATE user_profiles
SET check_balance = (
  SELECT check_quota
  FROM subscription_plans
  WHERE id = user_profiles.subscription_plan_id
)
WHERE email = 'test@mail.ru'
  AND subscription_plan_id IS NOT NULL
  AND check_balance = 0;

-- Проверим результат
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
