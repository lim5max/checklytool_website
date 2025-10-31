# Настройка Vault Секретов в Supabase

Этот документ объясняет как настроить секреты в Supabase Vault для работы системы автоматических платежей и email уведомлений.

## 🔑 Что Такое Vault Секреты?

**Vault** - это безопасное хранилище в Supabase для чувствительных данных (API ключи, пароли и т.д.).

Наши Supabase функции используют эти секреты чтобы знать:
- **Куда отправлять HTTP запросы** (`subscription_api_url`)
- **Как аутентифицироваться** (`subscription_api_key`)

## 📋 Какие Секреты Нужно Настроить

Вам нужно создать **2 секрета** в Vault:

### 1. `subscription_api_url`
**Назначение:** URL вашего сервера для API вызовов

**Откуда взять:** Из вашего `.env` файла - переменная `NEXT_PUBLIC_SITE_URL`

**Примеры значений:**
- Для локальной разработки: `http://localhost:3000`
- Для тестового сервера: `http://your-test-server.com`
- Для продакшена: `https://checklytool.com`

### 2. `subscription_api_key`
**Назначение:** Секретный API ключ для защиты endpoints от несанкционированного доступа

**Откуда взять:** Из вашего `.env` файла - переменная `SUBSCRIPTION_RENEWAL_API_KEY`

**Как сгенерировать (если еще нет):**
```bash
# В терминале выполните:
openssl rand -base64 32

# Пример результата:
# Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z
```

Скопируйте этот ключ и добавьте в `.env` файл:
```env
SUBSCRIPTION_RENEWAL_API_KEY=Kx9mP2vN8jQwR4tYuI5oL1aS3dF6gH7z
```

## 🚀 Пошаговая Инструкция по Настройке

### Шаг 1: Откройте Supabase Dashboard

1. Перейдите на [https://app.supabase.com](https://app.supabase.com)
2. Выберите ваш проект
3. В левом меню найдите **"Project Settings"** (иконка шестеренки внизу)

### Шаг 2: Перейдите в Vault

1. В настройках проекта найдите раздел **"Vault"**
2. Нажмите на него - откроется страница управления секретами

### Шаг 3: Добавьте Первый Секрет - `subscription_api_url`

1. Нажмите кнопку **"New secret"** (или "Add new secret")
2. Заполните форму:
   - **Name:** `subscription_api_url`
   - **Secret:** Ваш URL сервера (например `https://checklytool.com`)
   - **Description (опционально):** "API URL для системы рекуррентных платежей"
3. Нажмите **"Save"** или **"Create"**

### Шаг 4: Добавьте Второй Секрет - `subscription_api_key`

1. Снова нажмите **"New secret"**
2. Заполните форму:
   - **Name:** `subscription_api_key`
   - **Secret:** Ваш API ключ из `.env` файла (переменная `SUBSCRIPTION_RENEWAL_API_KEY`)
   - **Description (опционально):** "API ключ для аутентификации рекуррентных платежей"
3. Нажмите **"Save"** или **"Create"**

### Шаг 5: Проверьте Настройки

После создания вы должны увидеть оба секрета в списке:

```
📋 Vault Secrets:
✅ subscription_api_url
✅ subscription_api_key
```

## 🔍 Проверка Через SQL

Вы можете проверить что секреты созданы через SQL Editor:

```sql
-- Проверяем наличие секретов (без значений)
SELECT
    name,
    description,
    created_at
FROM vault.secrets
WHERE name IN ('subscription_api_url', 'subscription_api_key')
ORDER BY name;
```

**Ожидаемый результат:**
```
name                     | description                             | created_at
-------------------------|-----------------------------------------|-------------------
subscription_api_key     | API ключ для рекуррентных платежей     | 2024-10-31 ...
subscription_api_url     | API URL для рекуррентных платежей      | 2024-10-31 ...
```

## 🔧 Применение Миграции

После настройки Vault секретов, примените новую миграцию:

```bash
# В корне проекта выполните:
supabase db push

# Или через Supabase Dashboard:
# SQL Editor -> вставьте содержимое файла supabase/migrations/028_add_reminder_email_api_call.sql
```

## ✅ Тестирование

После настройки секретов и применения миграции, протестируйте систему:

### Тест 1: Проверка Функции

```sql
-- Вызовите функцию напоминаний вручную
SELECT auto_expire_subscriptions();
```

**Ожидаемый результат в логах:**
```
NOTICE:  API URL and API KEY configured successfully
NOTICE:  Reminder emails sent: X
NOTICE:  Charge requests sent: X
...
```

**Если увидите:**
```
WARNING:  API URL or API KEY not configured. Skipping recurrent operations.
```
Значит секреты настроены неправильно - вернитесь к Шагу 3-4.

### Тест 2: Отправка Email Напоминания

Используйте SQL скрипт из `scripts/test-recurrent-payments.sql`:

```sql
-- TEST #1: Reminder 1 day before
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes'
WHERE email = 'test@mail.ru';

-- Подождите 2-3 минуты, затем:
SELECT auto_expire_subscriptions();
```

**Ожидаемый результат:**
- ✅ Email приходит на test@mail.ru
- ✅ Запись появляется в таблице `subscription_notifications`
- ✅ В логах приложения: `[Email] Renewal reminder sent successfully`

## 🔄 Обновление Секретов

Если нужно изменить секрет (например, сменился URL сервера):

1. Откройте **Supabase Dashboard -> Project Settings -> Vault**
2. Найдите секрет который хотите обновить
3. Нажмите на иконку **"Edit"** (карандаш)
4. Введите новое значение
5. Нажмите **"Save"**

**Важно:** После изменения секретов НЕ нужно перезапускать Supabase - изменения применяются мгновенно!

## 🔐 Безопасность

**⚠️ ВАЖНО:**

1. **Никогда не коммитьте** файл `.env` в git репозиторий
2. **Используйте разные API ключи** для тестового и продакшн серверов
3. **Регулярно меняйте** API ключи (раз в 3-6 месяцев)
4. **Проверяйте логи** на подозрительную активность

## 🆘 Troubleshooting

### Проблема: "API URL or API KEY not configured"

**Причины:**
- Секреты не созданы в Vault
- Неправильные имена секретов (опечатки)
- Vault не доступен (редко)

**Решение:**
1. Проверьте имена секретов - должны быть ТОЧНО `subscription_api_url` и `subscription_api_key`
2. Пересоздайте секреты заново
3. Запустите тестовый SQL: `SELECT * FROM vault.secrets WHERE name LIKE '%subscription%'`

### Проблема: "Invalid API key" в логах приложения

**Причины:**
- API ключ в Vault НЕ совпадает с `SUBSCRIPTION_RENEWAL_API_KEY` в `.env` файле

**Решение:**
1. Проверьте значение в `.env`: `cat .env | grep SUBSCRIPTION_RENEWAL_API_KEY`
2. Обновите секрет в Vault чтобы значения совпадали

### Проблема: "Connection refused" в логах Supabase

**Причины:**
- Неправильный URL в `subscription_api_url`
- Сервер недоступен
- Файервол блокирует исходящие HTTP запросы

**Решение:**
1. Проверьте URL: `curl https://your-domain.com/api/notifications/send-reminder`
2. Убедитесь что сервер запущен
3. Проверьте файервол настройки

## 📚 Дополнительные Ресурсы

- [Supabase Vault Documentation](https://supabase.com/docs/guides/database/vault)
- [Supabase Functions Documentation](https://supabase.com/docs/guides/database/functions)
- Полная документация по тестированию: `docs/TESTING_RECURRENT_PAYMENTS.md`

## 💡 Краткая Памятка

```bash
# 1. Сгенерировать API ключ
openssl rand -base64 32

# 2. Добавить в .env
SUBSCRIPTION_RENEWAL_API_KEY=your-generated-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 3. Создать в Supabase Vault:
#    - subscription_api_url = https://your-domain.com
#    - subscription_api_key = your-generated-key

# 4. Применить миграцию
supabase db push

# 5. Протестировать
SELECT auto_expire_subscriptions();
```

---

**Готово!** 🎉 Теперь система автоматических платежей и email уведомлений полностью настроена.
