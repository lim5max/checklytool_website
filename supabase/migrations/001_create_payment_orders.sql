-- Создание таблицы для заказов на оплату подписок
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  order_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_id TEXT,
  payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_payment_id ON payment_orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Триггер для автообновления updated_at
CREATE OR REPLACE FUNCTION update_payment_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_orders_updated_at_trigger
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_orders_updated_at();

-- Комментарии к таблице
COMMENT ON TABLE payment_orders IS 'Заказы на оплату подписок через Т-Банк';
COMMENT ON COLUMN payment_orders.order_id IS 'Уникальный ID заказа для Т-Банк API';
COMMENT ON COLUMN payment_orders.amount IS 'Сумма в копейках';
COMMENT ON COLUMN payment_orders.payment_id IS 'ID платежа в системе Т-Банк';
COMMENT ON COLUMN payment_orders.payment_url IS 'Ссылка на платежную форму Т-Банк';
