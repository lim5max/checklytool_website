# Исправление Проблемы Подключения Supabase к Серверу

## Проблема

Supabase не может подключиться к серверу по IP адресу `http://91.229.10.157` - запросы timeout на этапе TCP handshake и вообще не доходят до Nginx (в логах Nginx нет попыток подключения от Supabase).

## Диагностика

1. ✅ Nginx слушает на всех интерфейсах (0.0.0.0:80)
2. ✅ Порт 80 открыт и доступен извне (curl с Mac работает)
3. ✅ Firewall отключен (UFW inactive)
4. ✅ Нет iptables правил блокирующих порт 80
5. ✅ API endpoint работает локально и извне
6. ❌ Запросы от Supabase вообще не появляются в логах Nginx
7. ❌ Supabase показывает "TCP/SSL handshake timeout" в таблице net._http_response

**Вывод:** Проблема на сетевом уровне между Supabase и хостинг-провайдером. Возможно, IP-адреса Supabase блокируются на уровне датацентра или хостинг-провайдера.

## Решение: Использовать Домен Вместо IP

Домен `checklytool.com` работает корректно (видно в логах Nginx). Вместо IP адреса будем использовать домен.

### Шаг 1: Обновить Vault Secret в Supabase

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Project Settings → Vault**
4. Найдите секрет `subscription_api_url`
5. Нажмите **Edit** (иконка карандаша)
6. Измените значение с `http://91.229.10.157` на `https://checklytool.com`
7. Нажмите **Save**

**ВАЖНО:** Используйте именно `https://checklytool.com` (с HTTPS, а не HTTP)

### Шаг 2: Проверка

Проверьте что секрет обновлен:

```sql
SELECT
  name,
  description
FROM vault.secrets
WHERE name = 'subscription_api_url';
```

Затем проверьте расшифрованное значение (ОСТОРОЖНО - показывает реальный секрет!):

```sql
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE name = 'subscription_api_url';
-- Должно вернуть: https://checklytool.com
```

### Шаг 3: Тестирование

Запустите функцию вручную:

```sql
SELECT auto_expire_subscriptions();
```

Проверьте логи в таблице `net._http_response`:

```sql
SELECT
  id,
  status_code,
  error_msg,
  created
FROM net._http_response
ORDER BY created DESC
LIMIT 5;
```

**Ожидаемый результат:**
- `status_code` должен быть 200 или другой успешный код
- `error_msg` должен быть NULL
- Запрос должен появиться в логах Nginx на сервере

### Шаг 4: Проверка Логов на Сервере

На сервере выполните:

```bash
tail -20 /var/log/nginx/access.log | grep notifications
```

Вы должны увидеть POST запрос к `/api/notifications/send-reminder` с IP адресом от Supabase.

## Почему Это Работает?

1. **DNS резолвинг**: Supabase может резолвить домен checklytool.com
2. **HTTPS**: Использование HTTPS более надежно и не блокируется провайдерами
3. **CDN/Proxy**: Возможно, домен проходит через другую сеть, которая не блокируется
4. **Белый список**: Многие хостинг-провайдеры имеют белый список доменов, но не IP адресов

## Альтернативное Решение (Если Домен Не Работает)

Если по какой-то причине домен тоже не работает, можно использовать внешний cron сервис:

1. **Supabase Edge Functions** - создать Edge Function которая вызывает API
2. **External Cron Service** - использовать cron-job.org или similar.com для вызова API каждую минуту
3. **Cloudflare Workers** - настроить Cloudflare Worker с cron триггером

## Обновление .env.example

Обновите документацию чтобы использовался домен:

```env
# Site URL (for payment redirects and subscription API)
NEXT_PUBLIC_SITE_URL=https://checklytool.com

# В Supabase Vault:
# subscription_api_url = https://checklytool.com
# subscription_api_key = (ваш API ключ)
```

## Контрольный Список

- [ ] Обновлен секрет `subscription_api_url` в Supabase Vault на `https://checklytool.com`
- [ ] Проверено что секрет корректно сохранен (через SQL запрос)
- [ ] Запущена функция `auto_expire_subscriptions()` вручную
- [ ] Проверена таблица `net._http_response` - нет ошибок
- [ ] Проверены логи Nginx - видны запросы от Supabase
- [ ] Протестирован Test #1 из `docs/TESTING_RECURRENT_PAYMENTS.md`

## Заключение

Использование домена вместо IP адреса решает проблему сетевой блокировки между Supabase и сервером. Это более надежное и стандартное решение для production окружения.
