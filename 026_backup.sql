-- Миграция для добавления поддержки рекуррентных (автоматических) платежей
-- Добавляет необходимые поля для хранения данных автосписаний через Т-Банк API

-- 1. Добавляем новые поля в user_profiles для рекуррентных платежей
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS rebill_id TEXT, -- RebillId от Т-Банк для автосписаний
ADD COLUMN IF NOT EXISTS customer_key TEXT, -- Уникальный ключ пользователя (email)
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
  CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_auto_renew BOOLEAN DEFAULT true, -- Включено ли автопродление
ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ, -- Дата последней неудачной попытки списания
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0; -- Счетчик неудачных попыток

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_profiles_rebill_id ON user_profiles(rebill_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at);

-- 2. Добавляем новые поля в payment_orders
ALTER TABLE payment_orders
ADD COLUMN IF NOT EXISTS rebill_id TEXT, -- RebillId, полученный при первом платеже
ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT false, -- Это рекуррентный платеж?
ADD COLUMN IF NOT EXISTS parent_payment_id TEXT; -- ID родительского платежа для рекуррентных

-- Создаем индекс для быстрого поиска рекуррентных платежей
CREATE INDEX IF NOT EXISTS idx_payment_orders_rebill_id ON payment_orders(rebill_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_parent_payment_id ON payment_orders(parent_payment_id);

-- 3. Создаем таблицу для отслеживания отправленных уведомлений
CREATE TABLE IF NOT EXISTS subscription_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('renewal_reminder', 'payment_success', 'payment_failed', 'subscription_suspended')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_expires_at TIMESTAMPTZ NOT NULL, -- К какому циклу относится уведомление
  metadata JSONB, -- Дополнительная информация (сумма, статус и т.д.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем индекс для быстрого поиска уведомлений пользователя
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user_id ON subscription_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_notifications_type_date ON subscription_notifications(notification_type, sent_at);

-- 4. Устанавливаем начальные значения для существующих пользователей
-- Для всех активных платных подписок ОТКЛЮЧАЕМ автопродление по умолчанию
-- (чтобы не начать списывать деньги неожиданно у существующих пользователей)
-- Новые подписки будут иметь auto_renew = true автоматически при первой оплате
UPDATE user_profiles
SET
  subscription_auto_renew = false,
  subscription_status = 'active',
  customer_key = email -- Используем email как customer_key
WHERE subscription_plan_id IS NOT NULL
  AND subscription_plan_id IN (
    SELECT id FROM subscription_plans WHERE name != 'FREE'
  )
  AND subscription_expires_at > NOW();

-- Для пользователей с FREE планом или истекшей подпиской
UPDATE user_profiles
SET
  subscription_auto_renew = false,
  subscription_status = 'active',
  customer_key = email
WHERE customer_key IS NULL;

-- 5. Комментарии к таблицам и полям для документации
COMMENT ON COLUMN user_profiles.rebill_id IS 'RebillId от Т-Банк API для автоматических списаний';
COMMENT ON COLUMN user_profiles.customer_key IS 'Уникальный ключ пользователя для рекуррентных платежей (обычно email)';
COMMENT ON COLUMN user_profiles.subscription_status IS 'Статус подписки: active - активна, suspended - приостановлена (нет средств), cancelled - отменена пользователем';
COMMENT ON COLUMN user_profiles.subscription_auto_renew IS 'Включено ли автоматическое продление подписки';
COMMENT ON COLUMN user_profiles.payment_failed_at IS 'Дата последней неудачной попытки автосписания';
COMMENT ON COLUMN user_profiles.payment_retry_count IS 'Количество неудачных попыток списания подряд';

COMMENT ON COLUMN payment_orders.rebill_id IS 'RebillId для рекуррентных платежей, получаемый при первом платеже';
COMMENT ON COLUMN payment_orders.is_recurrent IS 'Флаг, указывающий что это рекуррентный (автоматический) платеж';
COMMENT ON COLUMN payment_orders.parent_payment_id IS 'ID родительского платежа для цепочки рекуррентных платежей';

COMMENT ON TABLE subscription_notifications IS 'Журнал отправленных email уведомлений о подписках и платежах';

-- Проверка результатов миграции
DO $$
DECLARE
  users_with_auto_renew INTEGER;
  active_subscriptions INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_with_auto_renew
  FROM user_profiles
  WHERE subscription_auto_renew = true;

  SELECT COUNT(*) INTO active_subscriptions
  FROM user_profiles
  WHERE subscription_status = 'active' AND subscription_expires_at > NOW();

  RAISE NOTICE 'Миграция завершена успешно:';
  RAISE NOTICE '- Пользователей с включенным автопродлением: %', users_with_auto_renew;
  RAISE NOTICE '- Активных подписок: %', active_subscriptions;
END $$;
