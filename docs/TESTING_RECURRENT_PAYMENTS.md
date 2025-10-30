# 🧪 Тестирование автоматического продления подписок

Эта инструкция поможет протестировать всю систему автопродления подписок за несколько минут (вместо ожидания месяца).

## 📋 Подготовка

### 1. Выберите тестового пользователя

Зайдите в Supabase Dashboard → SQL Editor и выполните:

```sql
SELECT
    user_id,
    email,
    rebill_id,
    subscription_status,
    subscription_expires_at
FROM user_profiles
WHERE rebill_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

**Выберите email пользователя** с активным `rebill_id` для тестов.

### 2. Замените email во всех скриптах

Откройте файл `scripts/test-recurrent-payments.sql` и замените:
```sql
WHERE email = 'ВАШ_EMAIL@mail.ru'
```

На ваш тестовый email.

---

## ✅ ТЕСТ №1: Напоминание за 1 день до списания

**Что тестируем:** Email-уведомление за сутки до окончания подписки

### Шаги:

1. **Установить дату истечения на "завтра + 2 минуты":**
```sql
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes',
    subscription_auto_renew = true,
    subscription_status = 'active'
WHERE email = 'ваш_email@mail.ru';
```

2. **Вызвать функцию автопродления:**
```sql
SELECT auto_expire_subscriptions();
```

3. **Проверить что уведомление создано:**
```sql
SELECT
    notification_type,
    sent_at,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ваш_email@mail.ru')
ORDER BY created_at DESC
LIMIT 3;
```

### ✅ Ожидаемый результат:
- Появилась запись с `notification_type = 'renewal_reminder'`
- Email отправлен пользователю (проверьте почту или Resend Dashboard)

---

## ✅ ТЕСТ №2: Автоматическое списание в день истечения

**Что тестируем:** Списание средств с карты когда подписка истекает

### Шаги:

1. **Установить дату истечения на "сейчас + 1 минута":**
```sql
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 minute',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0,
    payment_failed_at = NULL
WHERE email = 'ваш_email@mail.ru';
```

2. **Подождать 1-2 минуты!** ⏱️

3. **Вызвать функцию автопродления:**
```sql
SELECT auto_expire_subscriptions();
```

4. **Проверить что подписка продлена:**
```sql
SELECT
    email,
    subscription_expires_at,
    check_balance,
    payment_retry_count
FROM user_profiles
WHERE email = 'ваш_email@mail.ru';
```

5. **Проверить новый платеж:**
```sql
SELECT
    order_id,
    amount,
    status,
    is_recurrent,
    created_at
FROM payment_orders
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ваш_email@mail.ru')
ORDER BY created_at DESC
LIMIT 3;
```

### ✅ Ожидаемый результат:
- `subscription_expires_at` увеличена на 30 дней
- `check_balance` пополнен кредитами
- Новый заказ в `payment_orders` с `is_recurrent = true`, `status = 'paid'`
- Email об успешном списании отправлен
- В T-Bank прошла транзакция

### 🔍 Проверка в логах:
```bash
pm2 logs checklytool | grep -E "(Payment Charge|COF|Charge successful)"
```

Вы должны увидеть:
```
[Payment Charge] Creating COF payment (Init without Recurrent/CustomerKey)
[Payment Charge] COF payment created: paymentId=...
[Payment Charge] Calling Charge with PaymentId and RebillId
[Payment Charge] Charge successful: status=CONFIRMED
```

---

## ✅ ТЕСТ №3: Первая неудачная попытка

**Что тестируем:** Поведение системы когда списание не прошло (недостаточно средств)

### Шаги:

1. **Сломать RebillId для имитации ошибки:**
```sql
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 minute',
    payment_retry_count = 0,
    payment_failed_at = NULL,
    rebill_id = 'INVALID_REBILL_ID'
WHERE email = 'ваш_email@mail.ru';
```

2. **Подождать 1-2 минуты!** ⏱️

3. **Вызвать функцию:**
```sql
SELECT auto_expire_subscriptions();
```

4. **Проверить счетчик неудач:**
```sql
SELECT
    email,
    payment_retry_count,
    payment_failed_at,
    subscription_status
FROM user_profiles
WHERE email = 'ваш_email@mail.ru';
```

### ✅ Ожидаемый результат:
- `payment_retry_count = 1`
- `payment_failed_at` установлена
- `subscription_status = 'active'` (еще не приостановлена)
- Email о неудачном списании отправлен (с информацией о повторе через 3 дня)

---

## ✅ ТЕСТ №4: Повторная попытка через 3 дня

**Что тестируем:** Автоматическая повторная попытка списания

### Шаги:

1. **Имитировать что прошло 3 дня + восстановить RebillId:**
```sql
UPDATE user_profiles
SET
    payment_failed_at = NOW() - INTERVAL '3 days' + INTERVAL '1 minute',
    payment_retry_count = 1,
    rebill_id = (
        SELECT rebill_id FROM user_profiles
        WHERE rebill_id IS NOT NULL
        AND rebill_id != 'INVALID_REBILL_ID'
        LIMIT 1
    )
WHERE email = 'ваш_email@mail.ru';
```

2. **Подождать 1-2 минуты!** ⏱️

3. **Вызвать функцию:**
```sql
SELECT auto_expire_subscriptions();
```

4. **Проверить результат:**
```sql
SELECT
    email,
    subscription_expires_at,
    payment_retry_count,
    subscription_status
FROM user_profiles
WHERE email = 'ваш_email@mail.ru';
```

### ✅ Ожидаемый результат:
- Подписка продлена (если списание прошло)
- `payment_retry_count = 0`
- `subscription_status = 'active'`

---

## ✅ ТЕСТ №5: Приостановка после 2 неудач

**Что тестируем:** Перевод на FREE план после исчерпания попыток

### Шаги:

1. **Имитировать 2-ю неудачную попытку:**
```sql
UPDATE user_profiles
SET
    payment_retry_count = 1,
    payment_failed_at = NOW() - INTERVAL '3 days' + INTERVAL '1 minute',
    rebill_id = 'INVALID_REBILL_ID',
    subscription_status = 'active'
WHERE email = 'ваш_email@mail.ru';
```

2. **Подождать 1-2 минуты!** ⏱️

3. **Вызвать функцию:**
```sql
SELECT auto_expire_subscriptions();
```

4. **Проверить приостановку:**
```sql
SELECT
    email,
    subscription_status,
    subscription_plan_id,
    check_balance,
    payment_retry_count
FROM user_profiles
WHERE email = 'ваш_email@mail.ru';
```

### ✅ Ожидаемый результат:
- `subscription_status = 'suspended'`
- Переведен на FREE план
- `check_balance = 0`
- Email о приостановке подписки отправлен

---

## 🔄 Восстановление тестовых данных

После тестов верните пользователя в нормальное состояние:

```sql
-- Получить ID платного плана
SELECT id, name FROM subscription_plans WHERE name != 'FREE';

-- Восстановить подписку (замените UUID)
UPDATE user_profiles
SET
    subscription_plan_id = 'ваш_план_uuid',
    subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0,
    payment_failed_at = NULL,
    check_balance = 100,
    rebill_id = (
        SELECT rebill_id FROM user_profiles
        WHERE rebill_id IS NOT NULL
        AND rebill_id != 'INVALID_REBILL_ID'
        LIMIT 1
    )
WHERE email = 'ваш_email@mail.ru';
```

---

## 📧 Проверка email уведомлений

### Где проверить:

1. **Resend Dashboard:**
   - https://resend.com/emails
   - Все отправленные письма

2. **Логи приложения:**
```bash
pm2 logs checklytool | grep -E "(Email|Resend|sendPayment)"
```

3. **Таблица уведомлений:**
```sql
SELECT
    notification_type,
    sent_at,
    metadata->'amount' as amount,
    metadata->'planName' as plan
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ваш_email@mail.ru')
ORDER BY created_at DESC;
```

---

## 🎯 Чек-лист финальной проверки

- [ ] ✅ ТЕСТ №1: Напоминание за 1 день работает
- [ ] ✅ ТЕСТ №2: Автоматическое списание успешно
- [ ] ✅ ТЕСТ №3: Первая неудача обработана корректно
- [ ] ✅ ТЕСТ №4: Повторная попытка работает
- [ ] ✅ ТЕСТ №5: Приостановка после 2 неудач работает
- [ ] 📧 Email уведомления отправляются
- [ ] 💳 Платежи проходят в T-Bank
- [ ] 📊 Записи в БД создаются корректно
- [ ] 🔄 Тестовые данные восстановлены

---

## 🚨 Что проверять в production

После успешного тестирования убедитесь:

1. **Cron job работает:**
```sql
SELECT * FROM cron.job WHERE jobname = 'auto-expire-subscriptions';
```

2. **Настроены переменные окружения в Supabase Vault:**
   - `subscription_api_url`
   - `subscription_api_key`

3. **API endpoint защищен:**
   - `/api/payment/charge` требует `x-api-key`

4. **Мониторинг:**
```bash
# Проверяйте логи регулярно
pm2 logs checklytool | grep -E "auto_expire_subscriptions"
```

---

## 💡 Советы по тестированию

- Используйте отдельного тестового пользователя
- Не тестируйте на реальных клиентах в production
- Проверяйте T-Bank тестовый терминал после каждого списания
- Следите за балансом тестовой карты
- Сохраняйте логи всех тестовых транзакций

**Готово!** 🎉
