# Инструкция по настройке платежного модуля Т-Банк

## Что уже сделано

✅ Созданы все необходимые файлы для интеграции с Т-Банк:
- `/lib/tbank.ts` - утилиты для работы с API
- `/app/api/payment/init/route.ts` - инициализация платежа
- `/app/api/payment/webhook/route.ts` - обработка уведомлений от Т-Банк
- `/app/api/payment/status/[orderId]/route.ts` - проверка статуса платежа
- `/app/payment/success/page.tsx` - страница результата оплаты
- `components/subscription-modal.tsx` - обновлен для реальной оплаты
- `.env.example` - добавлены переменные окружения

## Что нужно сделать вручную

### 1. Выполнить миграцию базы данных

Откройте Supabase Dashboard → SQL Editor и выполните следующий SQL:

```sql
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
```

### 2. Настроить переменные окружения

Создайте файл `.env.local` (или обновите существующий) и добавьте:

```bash
# T-Bank Payment Gateway (production)
TBANK_TERMINAL_KEY=1757689436544
TBANK_PASSWORD=0SapHdSKrEQRQCN7

# T-Bank Payment Gateway (test)
TBANK_TEST_TERMINAL_KEY=1757689436304DEMO
TBANK_TEST_PASSWORD=WFgr%waXvmeK3n%j

# Payment mode: 'test' or 'production'
TBANK_MODE=test
```

⚠️ **Внимание**: Для первого запуска используйте режим `TBANK_MODE=test`

### 3. Настроить Webhook в Т-Банк

1. Войдите в личный кабинет Т-Банк для разработчиков
2. Перейдите в настройки терминала
3. Укажите URL для уведомлений:
   - Для локальной разработки (используйте ngrok или localtunnel):
     ```
     https://ваш-домен.ngrok.io/api/payment/webhook
     ```
   - Для продакшена:
     ```
     https://ваш-домен.com/api/payment/webhook
     ```

4. Убедитесь, что уведомления включены для следующих событий:
   - `CONFIRMED` - успешная оплата
   - `REJECTED` - отклонено
   - `DEADLINE_EXPIRED` - время истекло
   - `CANCELED` - отменено пользователем

### 4. Тестирование

Для тестирования используйте следующие тестовые карты:

#### Тест 1: Успешный платеж
- Номер карты: `4300 0000 0000 0777`
- Срок: любая дата в будущем (например, 12/25)
- CVV: любые 3 цифры (например, 123)
- 3-D Secure: код подтверждения `12345678`

#### Тест 2: Недостаточно средств
- Номер карты: `5000 0000 0000 0009`
- Срок: любая дата в будущем
- CVV: любые 3 цифры

#### Тест 3: Возврат платежа
- Номер карты: `4000 0000 0000 0119`
- Срок: любая дата в будущем
- CVV: любые 3 цифры

### 5. Переход в продакшен

Когда тестирование завершено:

1. Измените `TBANK_MODE=production` в `.env.local`
2. Убедитесь, что webhook настроен на ваш продакшн-домен
3. Проверьте, что RLS (Row Level Security) включена для таблицы `payment_orders`
4. Настройте мониторинг логов платежей

## Архитектура решения

```
┌─────────────────┐
│  Пользователь   │
└────────┬────────┘
         │ 1. Нажимает "Выбрать план"
         ↓
┌─────────────────────────┐
│  subscription-modal.tsx │
│  handlePayment()        │
└────────┬────────────────┘
         │ 2. POST /api/payment/init
         ↓
┌──────────────────────────┐
│  /api/payment/init       │
│  - Создает заказ в БД    │
│  - Вызывает T-Bank Init  │
└────────┬─────────────────┘
         │ 3. Возвращает paymentUrl
         ↓
┌────────────────────┐
│  Т-Банк форма      │
│  оплаты            │
└────────┬───────────┘
         │ 4. Пользователь платит
         │
         ├─────────────────────────┐
         │                         │
         │ 5a. Webhook             │ 5b. Редирект
         ↓                         ↓
┌────────────────────┐    ┌──────────────────┐
│  /api/payment/     │    │  /payment/       │
│  webhook           │    │  success         │
│  - Обновляет БД    │    │  - Показывает    │
│  - Активирует      │    │    статус        │
│    подписку        │    └──────────────────┘
└────────────────────┘
```

## Важные моменты безопасности

1. ✅ Все webhook подписываются токеном SHA-256
2. ✅ Проверка подписи в `/api/payment/webhook`
3. ✅ Аутентификация пользователя перед созданием платежа
4. ✅ Проверка, что заказ принадлежит текущему пользователю
5. ⚠️ НЕ храните пароли Т-Банк в git (используйте .env.local)
6. ⚠️ Включите HTTPS для webhook в продакшене

## Поддержка

Документация Т-Банк:
- https://developer.tbank.ru/eacq/intro/developer/setup_js/
- https://developer.tbank.ru/eacq/api/api_process

При возникновении проблем проверьте:
1. Логи в консоли браузера
2. Логи сервера (console.log в API routes)
3. Таблицу payment_orders в Supabase
4. Настройки webhook в Т-Банк
