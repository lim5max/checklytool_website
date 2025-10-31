# Send Email Edge Function

Supabase Edge Function для отправки email уведомлений через SMTP nodemailer.

## Описание

Эта функция вызывается автоматически через **Database Webhook** при INSERT в таблицу `subscription_notifications`.

## Поддерживаемые типы email

1. **renewal_reminder** - Напоминание за 1 день до списания
2. **payment_success** - Успешное продление подписки
3. **payment_failed** - Ошибка при списании средств
4. **subscription_suspended** - Подписка приостановлена

## Входные данные

```typescript
{
  type: 'renewal_reminder' | 'payment_success' | 'payment_failed' | 'subscription_suspended',
  userId: string,
  email: string,
  userName: string | null,
  amount?: number,
  renewalDate?: string,  // ISO date
  planName?: string,
  subscriptionExpiresAt?: string,  // ISO date
  retryCount?: number
}
```

## Headers

- `Content-Type: application/json`
- `x-api-key: YOUR_API_KEY` - для защиты от несанкционированного доступа

## Secrets

Функция использует следующие секреты (настраиваются через `supabase secrets set`):

| Секрет | Описание | Пример |
|--------|----------|--------|
| `SMTP_HOST` | SMTP сервер | `smtp.mail.ru` |
| `SMTP_PORT` | SMTP порт | `465` |
| `SMTP_SECURE` | Использовать SSL | `true` |
| `SMTP_USER` | SMTP логин | `your-email@mail.ru` |
| `SMTP_PASSWORD` | SMTP пароль | `your-password` |
| `SMTP_FROM` | От кого письмо | `ChecklyTool <your-email@mail.ru>` |
| `SUBSCRIPTION_API_KEY` | API ключ для проверки | `your-api-key` |

## Деплой

```bash
# Установка секретов
supabase secrets set SMTP_HOST=smtp.mail.ru
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_SECURE=true
supabase secrets set SMTP_USER=your-email@mail.ru
supabase secrets set SMTP_PASSWORD=your-password
supabase secrets set SMTP_FROM="ChecklyTool <your-email@mail.ru>"
supabase secrets set SUBSCRIPTION_API_KEY=your-api-key

# Деплой функции
supabase functions deploy send-email
```

## Тестирование

### Локальное тестирование

```bash
# Запустить функцию локально
supabase functions serve send-email

# Отправить тестовый запрос
curl -X POST http://localhost:54321/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "renewal_reminder",
    "userId": "test-user-id",
    "email": "test@example.com",
    "userName": "Test User",
    "amount": 499,
    "renewalDate": "2025-11-01T10:00:00Z",
    "planName": "STUDENT",
    "subscriptionExpiresAt": "2025-11-01T10:00:00Z"
  }'
```

### Production тестирование

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "type": "renewal_reminder",
    "userId": "test-user-id",
    "email": "test@example.com",
    "userName": "Test User",
    "amount": 499,
    "renewalDate": "2025-11-01T10:00:00Z",
    "planName": "STUDENT",
    "subscriptionExpiresAt": "2025-11-01T10:00:00Z"
  }'
```

## Логи

Логи доступны в Supabase Dashboard:

1. Перейдите в **Edge Functions** → **send-email**
2. Откройте вкладку **Logs**

Логи включают:
- Входящие запросы
- SMTP конфигурацию (без пароля)
- Статус отправки email
- Ошибки если есть

## Troubleshooting

### Email не отправляется

1. Проверьте секреты:
```bash
supabase secrets list
```

2. Проверьте логи в Dashboard

3. Проверьте доступность SMTP порта:
```bash
telnet smtp.mail.ru 465
```

### "Invalid API key"

Убедитесь что `x-api-key` в запросе совпадает с `SUBSCRIPTION_API_KEY` в secrets.

### "Connection timeout"

SMTP порт может быть заблокирован. Попробуйте:
- Проверить файервол
- Использовать другой порт (587 с STARTTLS)
- Связаться с хостинг-провайдером

## См. также

- `docs/SETUP_EMAIL_WEBHOOKS.md` - Полная документация по настройке
- `docs/QUICK_START_WEBHOOKS.md` - Быстрый старт
- `supabase/migrations/029_switch_to_database_webhooks.sql` - Миграция для БД
