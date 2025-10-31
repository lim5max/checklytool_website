# Инструкции по Деплою: Переход на Database Webhooks

## ✅ Что уже сделано

Код готов и закоммичен. Вот что было создано:

### 1. Supabase Edge Function
- **Файл:** `supabase/functions/send-email/index.ts`
- **Описание:** Отправляет email через SMTP nodemailer
- **Поддержка:** 4 типа email (renewal_reminder, payment_success, payment_failed, subscription_suspended)

### 2. Database Migration
- **Файл:** `supabase/migrations/029_switch_to_database_webhooks.sql`
- **Изменения:**
  - Удаляет старую функцию `send_renewal_reminder()`
  - Упрощает `auto_expire_subscriptions()` - теперь просто INSERT в таблицу
  - Добавляет функцию `test_send_email_notification()` для тестирования

### 3. Документация
- **docs/SETUP_EMAIL_WEBHOOKS.md** - Полная инструкция по настройке
- **docs/QUICK_START_WEBHOOKS.md** - Быстрый старт (15-20 минут)
- **supabase/functions/send-email/README.md** - Документация Edge Function

---

## 🚀 Что нужно сделать сейчас

Следуй этим шагам по порядку:

### Шаг 1: Установить Supabase CLI (5 мин)

```bash
# macOS
brew install supabase/tap/supabase

# Login
supabase login

# В корне проекта
cd /Users/maksimstil/Desktop/checklytool_website

# Link проекта (замени your-project-ref на реальный ref из Dashboard)
supabase link --project-ref your-project-ref
```

**Где найти project-ref:**
1. Открой [Supabase Dashboard](https://app.supabase.com)
2. Project Settings → General → Reference ID

---

### Шаг 2: Настроить Secrets для Edge Function (5 мин)

**⚠️ ВАЖНО:** Используй реальные данные от своего SMTP сервера!

```bash
cd /Users/maksimstil/Desktop/checklytool_website

# Установи секреты
supabase secrets set SMTP_HOST=smtp.mail.ru
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_SECURE=true
supabase secrets set SMTP_USER=твой-email@mail.ru
supabase secrets set SMTP_PASSWORD=твой-пароль
supabase secrets set SMTP_FROM="ChecklyTool <твой-email@mail.ru>"
supabase secrets set SUBSCRIPTION_API_KEY=Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z

# Проверка
supabase secrets list
```

Должно показать 7 секретов.

---

### Шаг 3: Задеплоить Edge Function (3 мин)

```bash
supabase functions deploy send-email
```

**Ожидаемый вывод:**
```
Deploying Function send-email...
Function deployed successfully!
Function URL: https://your-project-ref.supabase.co/functions/v1/send-email
```

**Сохрани этот URL** - он понадобится для webhook!

---

### Шаг 4: Применить Миграцию (2 мин)

```bash
supabase db push
```

**Если появится ошибка**, примени миграцию вручную через Dashboard:
1. Открой SQL Editor в Supabase Dashboard
2. Скопируй содержимое `supabase/migrations/029_switch_to_database_webhooks.sql`
3. Выполни SQL

---

### Шаг 5: Создать Database Webhook (5 мин)

#### Вариант A: Через Dashboard (ПРОЩЕ)

1. Открой [Supabase Dashboard](https://app.supabase.com)
2. Выбери свой проект
3. **Database** → **Webhooks** → **Create a new hook**
4. Заполни:
   - **Name:** `send-email-notification`
   - **Table:** `public.subscription_notifications`
   - **Events:** ☑️ `INSERT` (ТОЛЬКО INSERT!)
   - **Type:** `HTTP Request`
   - **Method:** `POST`
   - **URL:** `https://your-project-ref.supabase.co/functions/v1/send-email`

5. Добавь headers (кнопка "Add header"):
   - **Header 1:**
     - Key: `Content-Type`
     - Value: `application/json`
   - **Header 2:**
     - Key: `x-api-key`
     - Value: `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z`

6. **Create webhook**

#### Вариант B: Через SQL

```sql
CREATE TRIGGER send_email_on_notification_insert
AFTER INSERT ON public.subscription_notifications
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://your-project-ref.supabase.co/functions/v1/send-email',
  'POST',
  '{"Content-Type":"application/json","x-api-key":"Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z"}',
  '{}',
  '5000'
);
```

**⚠️ Замени:**
- `your-project-ref` на реальный project ref
- `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z` на твой API ключ

---

### Шаг 6: Протестировать! (5 мин)

#### Тест 1: Отправка email вручную

```sql
-- Получи user_id любого пользователя
SELECT user_id, email, name
FROM user_profiles
LIMIT 1;

-- Отправь тестовое уведомление (замени 'твой-user-id')
SELECT test_send_email_notification('твой-user-id', 'renewal_reminder');
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "message": "Test notification created. Database Webhook will trigger Edge Function.",
  "notificationId": 123,
  "email": "user@example.com",
  "type": "renewal_reminder"
}
```

#### Тест 2: Проверка логов Edge Function

1. Открой [Supabase Dashboard](https://app.supabase.com)
2. **Edge Functions** → **send-email** → **Logs**
3. Должны увидеть:
```
[Edge Function] Received request: { type: 'renewal_reminder', email: '...', userId: '...' }
[Edge Function] Creating SMTP transporter: { host: 'smtp.mail.ru', ... }
[Edge Function] Sending email to: user@example.com
[Edge Function] Email sent successfully: { messageId: '...', email: '...' }
```

#### Тест 3: Проверка почты

Проверь почтовый ящик пользователя - должно прийти письмо.

#### Тест 4: Полный тест с cron функцией

```sql
-- Обнови дату истечения на "завтра"
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes'
WHERE email = 'test@mail.ru';

-- Подожди 2-3 минуты

-- Запусти cron функцию
SELECT auto_expire_subscriptions();

-- Проверь результат
SELECT
  notification_type,
  metadata->>'email' as email,
  created_at
FROM subscription_notifications
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔧 Если что-то не работает

### Проблема: Edge Function не вызывается

**Проверь:**
1. Webhook создан: Dashboard → Database → Webhooks
2. URL webhook правильный (должен быть URL из шага 3)
3. API ключ в headers webhook совпадает с `SUBSCRIPTION_API_KEY`

**SQL для проверки:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'subscription_notifications';
```

### Проблема: Email не отправляется

**Проверь:**
1. Секреты установлены: `supabase secrets list`
2. Логи Edge Function в Dashboard показывают ошибку?
3. SMTP порт доступен: `telnet smtp.mail.ru 465`

### Проблема: "Invalid API key"

**Проверь:**
1. `supabase secrets list | grep SUBSCRIPTION_API_KEY`
2. Headers webhook содержат правильный `x-api-key`

---

## 🗑️ Очистка старого кода

После успешного тестирования:

### 1. Удали секрет из Vault (необязательно)

1. Dashboard → **Project Settings** → **Vault**
2. Найди `subscription_api_url`
3. **Delete** (этот секрет больше не нужен)

**Оставь** секрет `subscription_api_key` - он используется для защиты Edge Function!

### 2. Опционально: удали старый Next.js endpoint

Файл `app/api/notifications/send-reminder/route.ts` больше не используется в production, но можно оставить для локальной разработки.

---

## ✅ Чек-лист готовности

Проверь что все сделано:

- [ ] Supabase CLI установлен
- [ ] Проект связан через `supabase link`
- [ ] 7 секретов установлены через `supabase secrets set`
- [ ] Edge Function задеплоена
- [ ] Миграция 029 применена
- [ ] Database Webhook создан
- [ ] Тест 1 прошел (test_send_email_notification)
- [ ] Тест 2 прошел (логи Edge Function показывают успех)
- [ ] Тест 3 прошел (email пришел)
- [ ] Тест 4 прошел (auto_expire_subscriptions работает)

---

## 📚 Дополнительные ресурсы

- **docs/SETUP_EMAIL_WEBHOOKS.md** - Подробная документация
- **docs/QUICK_START_WEBHOOKS.md** - Краткая инструкция
- **supabase/functions/send-email/README.md** - Документация Edge Function
- **docs/TESTING_RECURRENT_PAYMENTS.md** - Тесты всей системы

---

## 🎉 Готово!

Теперь email уведомления работают полностью внутри Supabase через Database Webhooks + Edge Functions. Никаких проблем с сетевой доступностью!

**Следующий шаг:** Протестируй все 5 сценариев из `docs/TESTING_RECURRENT_PAYMENTS.md`.
