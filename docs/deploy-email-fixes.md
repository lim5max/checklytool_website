# Инструкции по Деплою Исправлений Email Уведомлений

## Что Было Исправлено

**Проблема:** Email уведомления не отправлялись во время теста #1 (напоминание за 1 день). Логи показывали ошибки "Connection timeout" при подключении к SMTP.

**Решение:**
- Добавлены таймауты подключения (10 секунд) для предотвращения зависаний
- Добавлено детальное логирование для отладки SMTP конфигурации
- Улучшены HTML шаблоны email для всех типов уведомлений
- Используется только nodemailer с SMTP (код Resend удален)

## Шаг 1: Обновление Кода на Тестовом Сервере

Подключитесь к тестовому серверу по SSH и выполните:

```bash
# Перейдите в директорию проекта
cd /path/to/checklytool_website

# Переключитесь на ветку feature/recurrent-payments
git checkout feature/recurrent-payments

# Подтяните последние изменения
git pull origin feature/recurrent-payments

# Проверьте, что изменения применились
git log --oneline -3
# Вы должны увидеть коммит: "fix: Исправить систему email уведомлений с SMTP nodemailer"
```

## Шаг 2: Проверка SMTP Конфигурации

Убедитесь, что в файле `.env` на сервере правильно настроены SMTP параметры:

```bash
# Проверьте содержимое .env
cat .env | grep SMTP
```

Должны быть заполнены следующие переменные:

```env
# SMTP Configuration (for subscription email notifications)
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-actual-email@mail.ru
SMTP_PASSWORD=your-actual-password
SMTP_FROM=ChecklyTool <your-actual-email@mail.ru>
```

**⚠️ ВАЖНО:** Замените `your-actual-email@mail.ru` и `your-actual-password` на реальные данные!

## Шаг 3: Перезапуск Приложения

```bash
# Если используете PM2
pm2 restart checklytool

# Если используете Docker
docker-compose down
docker-compose up -d --build

# Если используете обычный npm
npm run build
pm2 restart all
```

## Шаг 4: Проверка Логов Email Системы

После перезапуска проверьте логи приложения:

```bash
# Для PM2
pm2 logs checklytool --lines 50

# Для Docker
docker-compose logs -f --tail=50 app
```

При успешной конфигурации вы должны увидеть:

```
[Email] Creating transporter with config: {
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  user: 'your-email@mail.ru',
  hasPassword: true
}
```

## Шаг 5: Тестирование Отправки Email (TEST #1)

Теперь запустите тест #1 из документации по тестированию:

### A. Настройка Базы Данных

Откройте Supabase SQL Editor и выполните:

```sql
-- Установите дату истечения подписки на "завтра в это же время"
UPDATE user_profiles
SET subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes'
WHERE email = 'test@mail.ru';

-- Проверьте, что обновление применилось
SELECT
    email,
    subscription_expires_at,
    subscription_status,
    rebill_id
FROM user_profiles
WHERE email = 'test@mail.ru';
```

### B. Запуск Cron Функции

Подождите 2-3 минуты, затем вручную запустите cron функцию:

```sql
SELECT auto_expire_subscriptions();
```

### C. Проверка Результатов

1. **Проверьте логи приложения** (должны появиться записи о отправке email):

```bash
pm2 logs checklytool --lines 100 | grep Email
```

Ожидаемый вывод:
```
[Email] Creating transporter with config: {...}
[Email] Sending renewal reminder to test@mail.ru...
[Email] Renewal reminder sent successfully to test@mail.ru
[Email] Notification logged: renewal_reminder for user xxx-xxx-xxx
```

2. **Проверьте почтовый ящик** test@mail.ru - должно прийти письмо с темой:
   - "Напоминание о продлении подписки ChecklyTool"

3. **Проверьте базу данных** - запись должна появиться в таблице `subscription_notifications`:

```sql
SELECT
    notification_type,
    created_at,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'test@mail.ru')
ORDER BY created_at DESC
LIMIT 1;
```

Ожидаемый результат:
```
notification_type: renewal_reminder
created_at: (текущее время)
```

## Возможные Проблемы и Решения

### Проблема 1: "Connection timeout" всё еще появляется

**Причины:**
- Порт 465 заблокирован файерволом сервера
- smtp.mail.ru недоступен с сервера

**Решение:**
```bash
# Проверьте доступность smtp.mail.ru
telnet smtp.mail.ru 465

# Проверьте файервол
sudo ufw status
# Если порт 465 заблокирован, откройте его:
sudo ufw allow out 465/tcp
```

### Проблема 2: "Invalid login" или "Authentication failed"

**Причины:**
- Неправильный пароль в SMTP_PASSWORD
- Двухфакторная аутентификация включена на почтовом ящике

**Решение:**
1. Проверьте SMTP_USER и SMTP_PASSWORD в .env
2. Для mail.ru может потребоваться создать "пароль приложения" вместо основного пароля

### Проблема 3: Email не приходит, но ошибок нет

**Причины:**
- Email попал в спам
- Фильтры на почтовом сервере

**Решение:**
1. Проверьте папку "Спам" в почтовом ящике
2. Добавьте ваш SMTP_FROM адрес в белый список

## Следующие Шаги

После успешного прохождения теста #1:

1. **Запустите тест #2** - Автоматическое списание при истечении подписки
2. **Запустите тест #3** - Первая неудачная попытка списания
3. **Запустите тест #4** - Вторая неудачная попытка и приостановка подписки
4. **Запустите тест #5** - Отключение автопродления

Полная документация по всем тестам находится в файле:
`docs/TESTING_RECURRENT_PAYMENTS.md`

## Лог-файл для Отладки

Если возникают проблемы, создайте файл с логами и отправьте:

```bash
# Создайте файл с логами
echo "=== GIT STATUS ===" > email_debug.log
git log --oneline -5 >> email_debug.log
echo -e "\n=== ENV SMTP CONFIG ===" >> email_debug.log
cat .env | grep SMTP >> email_debug.log
echo -e "\n=== APP LOGS ===" >> email_debug.log
pm2 logs checklytool --lines 200 --nostream >> email_debug.log 2>&1
echo -e "\n=== SMTP CONNECTION TEST ===" >> email_debug.log
telnet smtp.mail.ru 465 2>&1 | head -10 >> email_debug.log

# Просмотрите файл
cat email_debug.log
```

## Контакты для Поддержки

При возникновении проблем отправьте файл `email_debug.log` разработчику.
