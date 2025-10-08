-- Обновляем всех существующих пользователей без подписки
-- Устанавливаем им бесплатный план

UPDATE user_profiles
SET subscription_plan_id = (
  SELECT id FROM subscription_plans WHERE name = 'FREE' LIMIT 1
),
updated_at = NOW()
WHERE subscription_plan_id IS NULL;
