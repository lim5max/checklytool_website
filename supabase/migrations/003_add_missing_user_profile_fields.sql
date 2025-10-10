-- Добавление недостающих полей в таблицу user_profiles

-- Добавляем поле password_hash для хранения хешированного пароля
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Добавляем поля подписки
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS check_balance INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_plan_id ON user_profiles(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_expires_at ON user_profiles(subscription_expires_at);

-- Комментарии к новым полям
COMMENT ON COLUMN user_profiles.password_hash IS 'Хешированный пароль пользователя (bcrypt)';
COMMENT ON COLUMN user_profiles.subscription_plan_id IS 'ID плана подписки пользователя';
COMMENT ON COLUMN user_profiles.check_balance IS 'Баланс доступных проверок';
COMMENT ON COLUMN user_profiles.subscription_started_at IS 'Дата начала подписки';
COMMENT ON COLUMN user_profiles.subscription_expires_at IS 'Дата окончания подписки';
