# Quick Start: Настройка Email через Webhooks

**Время выполнения:** ~15-20 минут

## 📋 Чек-лист

- [ ] Установлен Supabase CLI
- [ ] Настроены секреты для SMTP
- [ ] Задеплоена Edge Function
- [ ] Применена миграция 029
- [ ] Создан Database Webhook
- [ ] Протестирована отправка email

---

## 1. Установка Supabase CLI (2 мин)

```bash
# macOS
brew install supabase/tap/supabase

# Login
supabase login

# Link проекта
supabase link --project-ref your-project-ref
```

---

## 2. Настройка секретов (5 мин)

```bash
cd /path/to/checklytool_website

supabase secrets set SMTP_HOST=smtp.mail.ru
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_SECURE=true
supabase secrets set SMTP_USER=your-email@mail.ru
supabase secrets set SMTP_PASSWORD=your-password
supabase secrets set SMTP_FROM="ChecklyTool <your-email@mail.ru>"
supabase secrets set SUBSCRIPTION_API_KEY=Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z

# Проверка
supabase secrets list
```

**⚠️ Замените `your-email@mail.ru` и `your-password` на реальные!**

---

## 3. Деплой Edge Function (3 мин)

```bash
supabase functions deploy send-email
```

Сохраните URL функции из вывода команды.

---

## 4. Применение миграции (2 мин)

```bash
supabase db push
```

Или через Dashboard:
1. SQL Editor
2. Скопировать `supabase/migrations/029_switch_to_database_webhooks.sql`
3. Выполнить

---

## 5. Создание Database Webhook (5 мин)

### Через Dashboard:

1. **Database** → **Webhooks** → **Create a new hook**
2. Заполните:
   - Name: `send-email-notification`
   - Table: `public.subscription_notifications`
   - Events: `INSERT` ☑️
   - Method: `POST`
   - URL: `https://your-project-ref.supabase.co/functions/v1/send-email`

3. Добавьте headers:
   - `Content-Type`: `application/json`
   - `x-api-key`: `Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z`

4. **Create webhook**

---

## 6. Тестирование (3 мин)

```sql
-- Получите user_id
SELECT user_id, email FROM user_profiles LIMIT 1;

-- Отправьте тест
SELECT test_send_email_notification('your-user-id', 'renewal_reminder');

-- Проверьте логи Edge Function в Dashboard:
-- Edge Functions → send-email → Logs

-- Проверьте почту
```

---

## ✅ Готово!

Система настроена и работает. Email уведомления теперь отправляются через:

```
Database INSERT → Webhook → Edge Function → SMTP → Email
```

---

## 🔧 Если что-то не работает

1. **Edge Function не вызывается:**
   - Проверьте что webhook создан в Dashboard
   - Проверьте URL webhook

2. **Email не отправляется:**
   - Проверьте секреты: `supabase secrets list`
   - Проверьте логи Edge Function в Dashboard
   - Проверьте доступность SMTP: `telnet smtp.mail.ru 465`

3. **"Invalid API key":**
   - Проверьте что `x-api-key` в webhook headers = `SUBSCRIPTION_API_KEY` в secrets

**Полная документация:** `docs/SETUP_EMAIL_WEBHOOKS.md`
