-- ============================================================================
-- ТЕСТИРОВАНИЕ СИСТЕМЫ АВТОПРОДЛЕНИЯ ПОДПИСОК
-- ============================================================================
-- Этот файл содержит SQL скрипты для тестирования всех этапов автопродления
-- Вы можете выполнять эти скрипты через Supabase Dashboard -> SQL Editor

-- ============================================================================
-- ПОДГОТОВКА: Выберите тестового пользователя
-- ============================================================================

-- Посмотреть всех пользователей с RebillId
SELECT
    user_id,
    email,
    rebill_id,
    subscription_status,
    subscription_auto_renew,
    subscription_expires_at,
    payment_retry_count
FROM user_profiles
WHERE rebill_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Выберите email пользователя для тестов и замените в скриптах ниже:
-- ТЕСТОВЫЙ EMAIL: 'ВАШ_EMAIL@mail.ru'

-- ============================================================================
-- ТЕСТ №1: НАПОМИНАНИЕ ЗА 1 ДЕНЬ ДО СПИСАНИЯ
-- ============================================================================

-- Шаг 1: Установить дату истечения подписки на "завтра + 2 минуты"
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 day' + INTERVAL '2 minutes',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Проверить что дата установлена
SELECT
    email,
    subscription_expires_at,
    subscription_expires_at - NOW() as time_until_expiry
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Шаг 2: Вызвать функцию автопродления (имитация cron job)
SELECT auto_expire_subscriptions();

-- Шаг 3: Проверить что уведомление создано
SELECT
    user_id,
    notification_type,
    subscription_expires_at,
    sent_at,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ВАШ_EMAIL@mail.ru')
ORDER BY created_at DESC
LIMIT 5;

-- Ожидаемый результат:
-- Появится запись с notification_type = 'renewal_reminder'

-- ============================================================================
-- ТЕСТ №2: АВТОМАТИЧЕСКОЕ СПИСАНИЕ В ДЕНЬ ИСТЕЧЕНИЯ
-- ============================================================================

-- Шаг 1: Установить дату истечения на "сейчас + 1 минута"
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 minute',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0,
    payment_failed_at = NULL
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Проверить дату
SELECT
    email,
    subscription_expires_at,
    subscription_expires_at - NOW() as seconds_until_expiry,
    rebill_id
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Шаг 2: Подождать 1-2 минуты, затем вызвать функцию
-- ПОДОЖДИТЕ 1-2 МИНУТЫ!
SELECT auto_expire_subscriptions();

-- Шаг 3: Проверить результат в логах
-- Посмотреть в консоли Supabase -> Logs или через:
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Шаг 4: Проверить что подписка продлена
SELECT
    email,
    subscription_expires_at,
    check_balance,
    subscription_status,
    payment_retry_count
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Ожидаемый результат:
-- - subscription_expires_at увеличена на 30 дней
-- - check_balance пополнен
-- - payment_retry_count = 0

-- Шаг 5: Проверить payment_orders
SELECT
    order_id,
    amount,
    status,
    is_recurrent,
    rebill_id,
    created_at
FROM payment_orders
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ВАШ_EMAIL@mail.ru')
ORDER BY created_at DESC
LIMIT 5;

-- Ожидаемый результат:
-- Новый заказ с is_recurrent = true, status = 'paid'

-- Шаг 6: Проверить уведомление об успешном списании
SELECT
    notification_type,
    sent_at,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ВАШ_EMAIL@mail.ru')
ORDER BY created_at DESC
LIMIT 5;

-- Ожидаемый результат:
-- Уведомление с notification_type = 'payment_success'

-- ============================================================================
-- ТЕСТ №3: ПЕРВАЯ НЕУДАЧНАЯ ПОПЫТКА СПИСАНИЯ (имитация)
-- ============================================================================

-- Этот тест имитирует ситуацию, когда списание не прошло
-- (для полного теста нужно временно сломать RebillId или заблокировать карту)

-- Шаг 1: Установить дату истечения на "сейчас + 1 минута"
UPDATE user_profiles
SET
    subscription_expires_at = NOW() + INTERVAL '1 minute',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0,
    payment_failed_at = NULL,
    rebill_id = 'INVALID_REBILL_ID' -- Сломаем RebillId для имитации ошибки
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Шаг 2: Подождать 1-2 минуты и вызвать функцию
-- ПОДОЖДИТЕ 1-2 МИНУТЫ!
SELECT auto_expire_subscriptions();

-- Шаг 3: Проверить счетчик неудач
SELECT
    email,
    payment_retry_count,
    payment_failed_at,
    subscription_status
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Ожидаемый результат:
-- - payment_retry_count = 1
-- - payment_failed_at установлена
-- - subscription_status = 'active' (еще не приостановлена)

-- Шаг 4: Проверить уведомление о неудаче
SELECT
    notification_type,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ВАШ_EMAIL@mail.ru')
ORDER BY created_at DESC
LIMIT 3;

-- Ожидаемый результат:
-- Уведомление с notification_type = 'payment_failed'

-- ============================================================================
-- ТЕСТ №4: ПОВТОРНАЯ ПОПЫТКА ЧЕРЕЗ 3 ДНЯ
-- ============================================================================

-- Шаг 1: Имитировать что прошло 3 дня после первой неудачи
UPDATE user_profiles
SET
    payment_failed_at = NOW() - INTERVAL '3 days' + INTERVAL '1 minute',
    payment_retry_count = 1,
    rebill_id = (
        SELECT rebill_id FROM (
            SELECT rebill_id FROM user_profiles
            WHERE rebill_id IS NOT NULL
            AND rebill_id != 'INVALID_REBILL_ID'
            LIMIT 1
        ) AS valid_rebill
    ) -- Восстанавливаем правильный RebillId
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Проверить установленные значения
SELECT
    email,
    payment_failed_at,
    NOW() - payment_failed_at as days_since_failure,
    payment_retry_count,
    rebill_id
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Шаг 2: Подождать 1-2 минуты и вызвать функцию
-- ПОДОЖДИТЕ 1-2 МИНУТЫ!
SELECT auto_expire_subscriptions();

-- Шаг 3: Проверить результат
SELECT
    email,
    subscription_expires_at,
    payment_retry_count,
    subscription_status
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Ожидаемый результат (если списание прошло):
-- - subscription_expires_at продлена
-- - payment_retry_count = 0
-- - subscription_status = 'active'

-- ============================================================================
-- ТЕСТ №5: ПРИОСТАНОВКА ПОДПИСКИ ПОСЛЕ 2 НЕУДАЧ
-- ============================================================================

-- Шаг 1: Имитировать 2 неудачные попытки
UPDATE user_profiles
SET
    payment_retry_count = 1,
    payment_failed_at = NOW() - INTERVAL '3 days' + INTERVAL '1 minute',
    rebill_id = 'INVALID_REBILL_ID', -- Снова ломаем для имитации ошибки
    subscription_status = 'active'
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Шаг 2: Подождать 1-2 минуты и вызвать функцию
-- ПОДОЖДИТЕ 1-2 МИНУТЫ!
SELECT auto_expire_subscriptions();

-- Шаг 3: Проверить что подписка приостановлена
SELECT
    email,
    subscription_status,
    payment_retry_count,
    subscription_plan_id,
    check_balance
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Ожидаемый результат:
-- - subscription_status = 'suspended'
-- - Переведен на FREE план
-- - check_balance = 0

-- Шаг 4: Проверить уведомление о приостановке
SELECT
    notification_type,
    metadata
FROM subscription_notifications
WHERE user_id = (SELECT user_id FROM user_profiles WHERE email = 'ВАШ_EMAIL@mail.ru')
ORDER BY created_at DESC
LIMIT 3;

-- Ожидаемый результат:
-- Уведомление с notification_type = 'subscription_suspended'

-- ============================================================================
-- ВОССТАНОВЛЕНИЕ: Вернуть тестового пользователя в нормальное состояние
-- ============================================================================

-- Получить ID платного плана
SELECT id, name, display_name FROM subscription_plans WHERE name != 'FREE';

-- Восстановить подписку (замените ПЛАН_ID на реальный UUID)
UPDATE user_profiles
SET
    subscription_plan_id = 'ПЛАН_ID', -- Замените на UUID платного плана
    subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_auto_renew = true,
    subscription_status = 'active',
    payment_retry_count = 0,
    payment_failed_at = NULL,
    check_balance = 100,
    rebill_id = (
        SELECT rebill_id FROM (
            SELECT rebill_id FROM user_profiles
            WHERE rebill_id IS NOT NULL
            AND rebill_id != 'INVALID_REBILL_ID'
            LIMIT 1
        ) AS valid_rebill
    )
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- Проверить что все восстановлено
SELECT
    email,
    subscription_status,
    subscription_expires_at,
    subscription_auto_renew,
    check_balance,
    payment_retry_count
FROM user_profiles
WHERE email = 'ВАШ_EMAIL@mail.ru';

-- ============================================================================
-- ДОПОЛНИТЕЛЬНО: Проверка email отправки (если настроен Resend)
-- ============================================================================

-- Эти функции автоматически вызываются из Next.js API
-- Для проверки смотрите логи приложения:
-- pm2 logs checklytool | grep -E "(Email|Resend)"

-- Или проверьте в Resend Dashboard:
-- https://resend.com/emails
