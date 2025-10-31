# Настройка Email Уведомлений через Database Webhooks и Edge Functions

Этот документ объясняет как настроить систему email уведомлений используя **Supabase Edge Functions** и **Database Webhooks** вместо внешних HTTP запросов к Next.js API.

## 📚 Оглавление

- [Архитектура системы](#архитектура-системы)
- [Предварительные требования](#предварительные-требования)
- [Шаг 1: Установка Supabase CLI](#шаг-1-установка-supabase-cli)
- [Шаг 2: Настройка Secrets](#шаг-2-настройка-secrets)
- [Шаг 3: Деплой Edge Function](#шаг-3-деплой-edge-function)
- [Шаг 4: Применение Миграции](#шаг-4-применение-миграции)
- [Шаг 5: Настройка Database Webhook](#шаг-5-настройка-database-webhook)
- [Шаг 6: Тестирование](#шаг-6-тестирование)
- [Troubleshooting](#troubleshooting)

---

## Архитектура системы

### Новая архитектура (Database Webhooks + Edge Functions)

```
Database Function (auto_expire_subscriptions)
    ↓
INSERT в subscription_notifications
    ↓ (автоматически)
Database Webhook
    ↓ (HTTP POST)
Supabase Edge Function (send-email)
    ↓ (SMTP)
Mail.ru SMTP Server
    ↓
Email отправлен пользователю
```

### Преимущества

- ✅ **Нет проблем с сетью** - все работает внутри Supabase
- ✅ **Автоматический retry** - webhooks имеют встроенную логику повтора при сбоях
- ✅ **Простая отладка** - логи доступны в Supabase Dashboard
- ✅ **Используем существующий SMTP** - mail.ru через nodemailer
- ✅ **Масштабируемо** - легко добавить новые типы уведомлений

---

## Предварительные требования

1. **Supabase проект** - создан и настроен
2. **SMTP настройки** - у вас есть доступ к smtp.mail.ru (или другому SMTP серверу)
3. **API ключ** - сгенерирован для защиты Edge Function (используйте существующий `SUBSCRIPTION_RENEWAL_API_KEY`)

---

## Шаг 1: Установка Supabase CLI

### macOS / Linux

```bash
brew install supabase/tap/supabase
```

Или через npm:

```bash
npm install -g supabase
```

### Проверка установки

```bash
supabase --version
```

### Логин в Supabase

```bash
supabase login
```

Это откроет браузер для авторизации.

### Link проекта

```bash
# В корне вашего проекта
supabase link --project-ref your-project-ref

# Project ref можно найти в: Supabase Dashboard -> Project Settings -> General
```

---

## Шаг 2: Настройка Secrets

Edge Function будет использовать секреты для подключения к SMTP и проверки API ключа.

### Список необходимых секретов

| Секрет | Описание | Пример значения |
|--------|----------|-----------------|
| `SMTP_HOST` | SMTP сервер | `smtp.mail.ru` |
| `SMTP_PORT` | SMTP порт | `465` |
| `SMTP_SECURE` | Использовать SSL | `true` |
| `SMTP_USER` | SMTP пользователь | `your-email@mail.ru` |
| `SMTP_PASSWORD` | SMTP пароль | `your-password` |
| `SMTP_FROM` | От кого письмо | `ChecklyTool <your-email@mail.ru>` |
| `SUBSCRIPTION_API_KEY` | API ключ для защиты | `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z` |

### Команды для установки секретов

```bash
# Перейдите в корень проекта
cd /path/to/checklytool_website

# Установите секреты один за другим
supabase secrets set SMTP_HOST=smtp.mail.ru
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_SECURE=true
supabase secrets set SMTP_USER=your-email@mail.ru
supabase secrets set SMTP_PASSWORD=your-password
supabase secrets set SMTP_FROM="ChecklyTool <your-email@mail.ru>"
supabase secrets set SUBSCRIPTION_API_KEY=Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z
```

**⚠️ ВАЖНО:** Замените `your-email@mail.ru` и `your-password` на реальные данные!

### Проверка секретов

```bash
supabase secrets list
```

Вы должны увидеть все 7 секретов в списке.

---

## Шаг 3: Деплой Edge Function

Edge Function уже создана в `supabase/functions/send-email/`.

### Деплой функции

```bash
# Из корня проекта
supabase functions deploy send-email
```

**Ожидаемый вывод:**

```
Deploying Function send-email (version xxx)
Packaging function...
Uploading function bundle...
Function deployed successfully!
Function URL: https://your-project-ref.supabase.co/functions/v1/send-email
```

### Получение URL функции

```bash
supabase functions list
```

Сохраните URL - он понадобится для настройки webhook.

---

## Шаг 4: Применение Миграции

Миграция обновляет database function для работы с webhooks.

### Применение через Supabase CLI

```bash
supabase db push
```

### Или через Supabase Dashboard

1. Откройте [SQL Editor](https://app.supabase.com) в Dashboard
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Откройте файл `supabase/migrations/029_switch_to_database_webhooks.sql`
5. Скопируйте содержимое и выполните в SQL Editor

### Проверка применения

```sql
-- Проверьте что функция test_send_email_notification создана
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'test_send_email_notification';

-- Должно вернуть: test_send_email_notification
```

---

## Шаг 5: Настройка Database Webhook

### Вариант A: Через Dashboard (РЕКОМЕНДУЕТСЯ)

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Database** → **Webhooks**
4. Нажмите **Create a new hook**
5. Заполните форму:

| Поле | Значение |
|------|----------|
| **Name** | `send-email-notification` |
| **Table** | `public.subscription_notifications` |
| **Events** | `INSERT` (только INSERT!) |
| **Type** | `HTTP Request` |
| **Method** | `POST` |
| **URL** | `https://your-project-ref.supabase.co/functions/v1/send-email` |

6. Нажмите **Add header** и добавьте 2 заголовка:

**Header 1:**
- Key: `Content-Type`
- Value: `application/json`

**Header 2:**
- Key: `x-api-key`
- Value: `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z` (ваш API ключ)

7. В разделе **Request Body** выберите **JSON** и оставьте дефолтное:
```json
{
  "type": "INSERT",
  "table": "subscription_notifications",
  "record": {},
  "schema": "public"
}
```

8. Нажмите **Create webhook**

### Вариант B: Через SQL

```sql
-- Создание webhook через supabase_functions.http_request
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

**⚠️ ВАЖНО:** Замените:
- `your-project-ref` на ваш project ref
- `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z` на ваш реальный API ключ

### Проверка webhook

```sql
-- Проверьте что trigger создан
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'subscription_notifications';

-- Должно вернуть: send_email_on_notification_insert | INSERT | subscription_notifications
```

---

## Шаг 6: Тестирование

### Тест 1: Ручная отправка email

Используем специальную функцию для тестирования:

```sql
-- Получите user_id любого пользователя
SELECT user_id, email, name
FROM user_profiles
LIMIT 1;

-- Отправьте тестовое уведомление
SELECT test_send_email_notification('your-user-id', 'renewal_reminder');

-- Результат должен быть:
-- {
--   "success": true,
--   "message": "Test notification created. Database Webhook will trigger Edge Function.",
--   "notificationId": 123,
--   "email": "user@example.com",
--   "type": "renewal_reminder"
-- }
```

### Тест 2: Проверка Edge Function логов

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Edge Functions** → **send-email**
3. Откройте вкладку **Logs**
4. Вы должны увидеть:

```
[Edge Function] Received request: { type: 'renewal_reminder', email: '...', userId: '...' }
[Edge Function] Creating SMTP transporter: { host: 'smtp.mail.ru', port: 465, ... }
[Edge Function] Sending email to: user@example.com
[Edge Function] Email sent successfully: { messageId: '...', email: '...' }
```

### Тест 3: Проверка почтового ящика

Проверьте почтовый ящик пользователя - должно прийти письмо с темой "Напоминание о продлении подписки ChecklyTool".

### Тест 4: Полный тест с auto_expire_subscriptions()

```sql
-- Обновите дату истечения подписки на "завтра"
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes'
WHERE email = 'test@mail.ru';

-- Подождите 2-3 минуты, затем запустите cron функцию
SELECT auto_expire_subscriptions();

-- Проверьте результаты
SELECT
  notification_type,
  metadata->>'email' as email,
  created_at
FROM subscription_notifications
ORDER BY created_at DESC
LIMIT 5;
```

---

## Troubleshooting

### Проблема 1: Edge Function не вызывается

**Симптомы:**
- Запись появляется в `subscription_notifications`
- Edge Function логи пустые
- Email не приходит

**Решение:**

1. Проверьте что webhook создан:
```sql
SELECT * FROM information_schema.triggers
WHERE event_object_table = 'subscription_notifications';
```

2. Проверьте URL в webhook - должен быть правильный project-ref
3. Проверьте API ключ в headers webhook

### Проблема 2: Edge Function вызывается, но email не отправляется

**Симптомы:**
- Edge Function логи показывают ошибку SMTP
- Статус код 500 в логах

**Решение:**

1. Проверьте секреты:
```bash
supabase secrets list
```

2. Проверьте SMTP настройки:
```bash
# На сервере проверьте доступность SMTP порта
telnet smtp.mail.ru 465
```

3. Проверьте логи Edge Function на детали ошибки

### Проблема 3: "Invalid API key" в логах Edge Function

**Решение:**

1. Убедитесь что `SUBSCRIPTION_API_KEY` установлен в secrets:
```bash
supabase secrets list | grep SUBSCRIPTION_API_KEY
```

2. Проверьте что API ключ в webhook headers совпадает с секретом

3. Проверьте что API ключ есть в Vault:
```sql
SELECT name FROM vault.secrets WHERE name = 'subscription_api_key';
```

### Проблема 4: Webhook вызывается несколько раз

**Симптомы:**
- Один INSERT создает несколько вызовов Edge Function
- Пользователь получает несколько одинаковых email

**Решение:**

1. Проверьте что нет дублирующих triggers:
```sql
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'subscription_notifications';
```

2. Удалите дублирующие triggers если есть:
```sql
DROP TRIGGER IF EXISTS duplicate_trigger_name ON subscription_notifications;
```

---

## Очистка старого кода

После успешного тестирования нужно удалить старый код:

### Удаление из Supabase

```sql
-- Удалить старую функцию HTTP запросов (уже удалена миграцией 029)
DROP FUNCTION IF EXISTS send_renewal_reminder(TEXT, TEXT, TEXT, NUMERIC, TIMESTAMP WITH TIME ZONE, TEXT, TIMESTAMP WITH TIME ZONE, TEXT, TEXT);
```

### Удаление секрета из Vault

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Project Settings** → **Vault**
3. Найдите секрет `subscription_api_url`
4. Нажмите **Delete** (этот секрет больше не нужен)
5. Оставьте секрет `subscription_api_key` - он используется для защиты Edge Function

### Удаление Next.js API endpoint (опционально)

Файл `/app/api/notifications/send-reminder/route.ts` больше не используется для production, но можно оставить для локальной разработки.

---

## Заключение

Теперь система email уведомлений работает полностью внутри Supabase без внешних HTTP запросов:

1. ✅ Database Function создает записи в `subscription_notifications`
2. ✅ Database Webhook автоматически вызывает Edge Function
3. ✅ Edge Function отправляет email через SMTP
4. ✅ Все работает стабильно внутри экосистемы Supabase

**Следующие шаги:**

- Протестируйте все 5 сценариев из `docs/TESTING_RECURRENT_PAYMENTS.md`
- Настройте cron job для регулярного запуска `auto_expire_subscriptions()`
- Мониторьте логи Edge Function в Dashboard

---

**Готово!** 🎉 Теперь email уведомления работают через Database Webhooks и Edge Functions.
