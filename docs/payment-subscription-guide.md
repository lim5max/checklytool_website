# Руководство по Оплате и Подпискам

## Обзор системы оплаты

Система использует Т-Банк API для обработки платежей. После успешной оплаты пользователю автоматически активируется подписка с начислением проверок.

## Тарифные планы

### Текущие тарифы:

1. **FREE (Бесплатный)** - `3c8498ed-8093-44f8-97e3-b7ae4973c743`
   - 0 проверок
   - Неограниченное создание тестов
   - Работа с шаблонами тестов

2. **PRO** - `7aae118b-6cac-418e-91e9-b73290b99100`
   - 300 проверок в месяц
   - Цена: 299 ₽/мес
   - Тесты и сочинения: **1 работа = 1 проверка**
   - Неограниченное создание тестов
   - Приоритетная поддержка

## Стоимость проверок

**ВАЖНО:** С последнего обновления стоимость проверок унифицирована:

- ✅ Тесты: **1 работа = 1 проверка**
- ✅ Сочинения: **1 работа = 1 проверка**

Ранее тесты стоили 0.5 проверки, теперь все работы стоят одинаково.

## Как проверить, что пользователь оплатил?

### 1. Проверка в таблице `payment_orders`

```sql
-- Проверить статус конкретного платежа по email пользователя
SELECT
  po.order_id,
  po.status,
  po.amount,
  po.payment_id,
  po.created_at,
  po.updated_at,
  sp.display_name as plan_name
FROM payment_orders po
LEFT JOIN subscription_plans sp ON po.plan_id = sp.id
WHERE po.user_id = 'email@example.com'
ORDER BY po.created_at DESC;
```

**Статусы платежа:**
- `paid` ✅ - оплата успешно завершена
- `pending` ⏳ - ожидание оплаты
- `failed` ❌ - платеж не прошел
- `cancelled` 🚫 - платеж отменен пользователем

### 2. Проверка активной подписки пользователя

```sql
-- Проверить текущую подписку и баланс проверок
SELECT
  up.email,
  up.check_balance,
  up.subscription_started_at,
  up.subscription_expires_at,
  sp.display_name as plan_name,
  sp.check_credits as plan_credits,
  sp.price,
  CASE
    WHEN up.subscription_expires_at > NOW() THEN 'Активна'
    ELSE 'Истекла'
  END as subscription_status
FROM user_profiles up
LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
WHERE up.email = 'email@example.com';
```

**Ключевые поля в `user_profiles`:**
- `subscription_plan_id` - ID активного плана подписки
- `check_balance` - текущий баланс проверок
- `subscription_expires_at` - дата окончания подписки
- `subscription_started_at` - дата начала подписки

### 3. Просмотр всех успешных оплат

```sql
-- Список всех успешных платежей
SELECT
  po.order_id,
  up.email,
  sp.display_name as plan_name,
  po.amount / 100.0 as amount_rub,
  po.payment_id,
  po.created_at as payment_date
FROM payment_orders po
JOIN user_profiles up ON po.user_id = up.user_id
LEFT JOIN subscription_plans sp ON po.plan_id = sp.id
WHERE po.status = 'paid'
ORDER BY po.created_at DESC
LIMIT 50;
```

### 4. История использования проверок

```sql
-- Просмотр истории списания проверок пользователем
SELECT
  cuh.created_at,
  cuh.check_type,
  cuh.credits_used,
  c.title as check_name,
  ss.student_name
FROM check_usage_history cuh
LEFT JOIN checks c ON cuh.check_id = c.id
LEFT JOIN student_submissions ss ON cuh.submission_id = ss.id
WHERE cuh.user_id = 'email@example.com'
ORDER BY cuh.created_at DESC
LIMIT 20;
```

## Процесс оплаты

### Шаг 1: Инициализация платежа

**Endpoint:** `POST /api/payment/init`

```typescript
// Запрос
{
  "planId": "7aae118b-6cac-418e-91e9-b73290b99100"
}

// Ответ
{
  "orderId": "ORDER_1760123436254_mmg6at7",
  "paymentUrl": "https://pay.tbank.ru/GAe0WsJX"
}
```

После этого создается запись в `payment_orders` со статусом `pending`.

### Шаг 2: Оплата пользователем

Пользователь переходит по `paymentUrl` и производит оплату на стороне Т-Банк.

### Шаг 3: Webhook от Т-Банк

**Endpoint:** `POST /api/payment/webhook`

Т-Банк отправляет уведомление о статусе платежа:

```typescript
{
  "OrderId": "ORDER_1760123436254_mmg6at7",
  "Status": "CONFIRMED",
  "Success": true,
  "PaymentId": "7174629320"
}
```

### Шаг 4: Активация подписки

При успешной оплате (`Status: 'CONFIRMED'` и `Success: true`):

1. **Обновляется `payment_orders`:**
   - `status` → `'paid'`
   - `payment_id` → ID платежа из Т-Банк

2. **Обновляется `user_profiles`:**
   - `subscription_plan_id` → ID оплаченного плана
   - `check_balance` → количество проверок из плана (например, 300)
   - `subscription_expires_at` → дата через 30 дней

3. **Создается запись в `check_usage_history`:**
   - Отрицательное значение `credits_used` = пополнение баланса

## Webhook-статусы Т-Банк

**Успешная оплата:**
- `CONFIRMED` + `Success: true` → статус `paid`

**Отмена/ошибка:**
- `REJECTED`, `DEADLINE_EXPIRED`, `AUTH_FAIL`, `ATTEMPTS_EXPIRED` → статус `failed`

**Отмена пользователем:**
- `CANCELED` → статус `cancelled`

## Логика списания проверок

Файл: `lib/subscription.ts`

```typescript
export function calculateCreditsNeeded(
  checkType: 'test' | 'essay',
  pagesCount: number
): number {
  // И тесты, и сочинения считаются одинаково: 1 работа = 1 проверка
  return 1
}
```

При проверке работы вызывается RPC-функция `deduct_check_credits` в Supabase, которая:
1. Проверяет достаточность баланса
2. Списывает 1 проверку
3. Создает запись в `check_usage_history`

## Часто задаваемые вопросы

### Как вручную активировать подписку пользователю?

```sql
-- Активировать PRO подписку для пользователя
UPDATE user_profiles
SET
  subscription_plan_id = '7aae118b-6cac-418e-91e9-b73290b99100',
  check_balance = 300,
  subscription_expires_at = NOW() + INTERVAL '30 days',
  subscription_started_at = NOW()
WHERE email = 'email@example.com';
```

### Как пополнить баланс проверок без изменения плана?

```sql
-- Добавить 50 проверок к текущему балансу
UPDATE user_profiles
SET check_balance = check_balance + 50
WHERE email = 'email@example.com';

-- Записать в историю
INSERT INTO check_usage_history (user_id, credits_used, check_type)
VALUES ('email@example.com', -50, 'test');
```

### Как проверить, у кого истекла подписка?

```sql
-- Пользователи с истекшей подпиской
SELECT
  email,
  subscription_expires_at,
  check_balance
FROM user_profiles
WHERE subscription_expires_at < NOW()
  AND subscription_plan_id IS NOT NULL
ORDER BY subscription_expires_at DESC;
```

### Как посмотреть статистику по оплатам?

```sql
-- Статистика по оплатам за последний месяц
SELECT
  DATE(po.created_at) as payment_date,
  COUNT(*) as payments_count,
  COUNT(CASE WHEN po.status = 'paid' THEN 1 END) as successful_payments,
  SUM(CASE WHEN po.status = 'paid' THEN po.amount ELSE 0 END) / 100.0 as total_revenue_rub
FROM payment_orders po
WHERE po.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(po.created_at)
ORDER BY payment_date DESC;
```

## Безопасность

1. **Проверка подписи webhook** - каждый webhook от Т-Банк проверяется через `verifyWebhookToken()` в `lib/tbank.ts`
2. **RLS (Row Level Security)** - все таблицы защищены политиками RLS в Supabase
3. **Использование Service Role** - операции с подписками выполняются через service role для обхода RLS

## Файлы для работы с оплатой

- `components/subscription-modal.tsx` - UI модал выбора тарифа
- `app/api/payment/init/route.ts` - инициализация платежа
- `app/api/payment/webhook/route.ts` - обработка webhook от Т-Банк
- `app/api/subscription/plans/route.ts` - получение списка тарифов
- `lib/subscription.ts` - бизнес-логика подписок
- `lib/tbank.ts` - интеграция с Т-Банк API
