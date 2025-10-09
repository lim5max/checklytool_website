# Отчет по Оптимизации Базы Данных ChecklyTool

**Дата анализа:** 09 октября 2025
**Версия PostgreSQL:** supabase-postgres-17.4.1.074
**Статус:** Анализ завершен (БЕЗ ВНЕСЕНИЯ ИЗМЕНЕНИЙ)

---

## Оглавление

1. [Общая Оценка Состояния БД](#1-общая-оценка-состояния-бд)
2. [Анализ Текущей Схемы](#2-анализ-текущей-схемы)
3. [Критические Проблемы Безопасности](#3-критические-проблемы-безопасности)
4. [Проблемы Производительности](#4-проблемы-производительности)
5. [Рекомендации по Оптимизации](#5-рекомендации-по-оптимизации)
6. [Оценка Self-Hosting на Собственном Сервере](#6-оценка-self-hosting-на-собственном-сервере)
7. [Интеграция S3 от reg.ru](#7-интеграция-s3-от-regru)
8. [План Действий](#8-план-действий)

---

## 1. Общая Оценка Состояния БД

### 1.1. Статистика

**Основные таблицы приложения:**
- `user_profiles`: 7 записей
- `checks`: 76 записей
- `student_submissions`: 123 записи
- `evaluation_results`: 69 записей
- `check_variants`: 82 варианта
- `variant_answers`: 108 ответов
- `grading_criteria`: 248 критериев
- `essay_grading_criteria`: 60 критериев
- `check_statistics`: 45 записей
- `generated_tests`: 10 записей
- `subscription_plans`: 3 плана
- `payment_orders`: 4 заказа
- `check_usage_history`: 0 записей (таблица пустая)

**Storage:**
- Bucket `checks`: 146 файлов
- Prefixes: 49 папок

**Общий размер данных:** ~1.5 MB (очень маленький объем)

### 1.2. Общая Оценка

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| **Структура схемы** | 8/10 | Хорошо спроектирована, нормализована |
| **Индексирование** | 6/10 | Есть базовые индексы, но много неиспользуемых |
| **RLS политики** | 4/10 | КРИТИЧНО: множественные проблемы |
| **Производительность** | 7/10 | Хорошо для текущего объема, требует оптимизации для роста |
| **Безопасность** | 5/10 | Есть критические уязвимости |
| **Масштабируемость** | 6/10 | Требует доработки для миллионов записей |

**Общая оценка: 6.5/10** - База данных функциональна, но требует оптимизации перед масштабированием.

---

## 2. Анализ Текущей Схемы

### 2.1. Структура Таблиц

#### 2.1.1. Таблица `user_profiles`

**Структура:**
```sql
- id (uuid, PK)
- user_id (text, UNIQUE) -- используется email как идентификатор
- email (text, UNIQUE)
- name (text)
- avatar_url (text)
- provider (text)
- role (text, default: 'user')
- subscription_plan_id (uuid, FK)
- check_balance (numeric, default: 0)
- subscription_started_at (timestamptz)
- subscription_expires_at (timestamptz)
- first_login_at (timestamptz)
- last_login_at (timestamptz)
- total_checks (int, default: 0)
- is_active (boolean, default: true)
- created_at, updated_at (timestamptz)
```

**Индексы:**
- ✅ `user_profiles_pkey` (id)
- ✅ `user_profiles_user_id_key` (user_id) UNIQUE
- ✅ `user_profiles_email_unique` (email) UNIQUE
- ✅ `idx_user_profiles_user_id` (user_id)
- ✅ `idx_user_profiles_email` (email)
- ⚠️ `idx_user_profiles_provider` (provider) - **НЕИСПОЛЬЗУЕМЫЙ**
- ⚠️ `idx_user_profiles_role` (role) - **НЕИСПОЛЬЗУЕМЫЙ**
- ⚠️ `idx_user_profiles_created_at` (created_at DESC) - **НЕИСПОЛЬЗУЕМЫЙ**
- ❌ **ОТСУТСТВУЕТ** индекс на `subscription_plan_id` (FK) - **ВАЖНО**

**Проблемы:**
1. Дублирование индексов на `user_id` (UNIQUE constraint + дополнительный индекс)
2. Отсутствует индекс на FK `subscription_plan_id`
3. Много неиспользуемых индексов
4. Денормализация: `total_checks` дублирует данные

**Рекомендации:**
- Удалить дублирующий индекс `idx_user_profiles_user_id`
- Добавить индекс на `subscription_plan_id`
- Удалить неиспользуемые индексы `provider`, `role`, `created_at`
- Рассмотреть перенос `total_checks` в триггер или вычисляемое поле

---

#### 2.1.2. Таблица `checks`

**Структура:**
```sql
- id (uuid, PK)
- user_id (text, FK -> user_profiles.user_id)
- title (text)
- description (text)
- variant_count (int, default: 1)
- subject (text)
- class_level (text)
- total_questions (int)
- check_type (text, default: 'test', CHECK: 'test' OR 'essay')
- created_at, updated_at (timestamptz)
```

**Индексы:**
- ✅ `checks_pkey` (id)
- ✅ `idx_checks_user_id` (user_id)
- ✅ `idx_checks_created_at` (created_at DESC)

**Проблемы:**
1. Отсутствует индекс на `subject` (часто используется для фильтрации)
2. Отсутствует составной индекс `(user_id, created_at)` для пагинации
3. Множественные дублирующие RLS политики (критично для производительности)

**Рекомендации:**
- Добавить индекс на `subject` если используется фильтрация
- Добавить составной индекс `(user_id, created_at DESC)` для оптимизации листинга
- Объединить дублирующие RLS политики

---

#### 2.1.3. Таблица `student_submissions`

**Структура:**
```sql
- id (uuid, PK)
- check_id (uuid, FK -> checks.id)
- student_name (text)
- student_class (text)
- submission_images (text[]) -- массив URL подписанных ссылок
- status (text, default: 'pending')
- variant_detected (int)
- processing_started_at (timestamptz)
- processing_completed_at (timestamptz)
- error_message (text)
- error_details (jsonb)
- created_at, updated_at (timestamptz)
```

**Индексы:**
- ✅ `student_submissions_pkey` (id)
- ✅ `idx_submissions_check_id` (check_id)
- ⚠️ `idx_submissions_status` (status) - **ДУБЛИРУЕТСЯ**
- ⚠️ `idx_student_submissions_status` (status) - **ДУБЛИРУЕТСЯ**

**Проблемы:**
1. **КРИТИЧНО:** Два идентичных индекса на `status`
2. Отсутствует составной индекс `(check_id, status)` для фильтрации
3. Отсутствует индекс на `(check_id, created_at)` для сортировки
4. Массив `submission_images` содержит временные подписанные URL (истекают через 24 часа) - проблема архитектуры

**Рекомендации:**
- Удалить один из дублирующих индексов
- Добавить составной индекс `(check_id, status)`
- Добавить составной индекс `(check_id, created_at DESC)` для сортировки
- Изменить архитектуру хранения URL (хранить путь, генерировать signed URL по требованию)

---

#### 2.1.4. Таблица `evaluation_results`

**Структура:**
```sql
- id (uuid, PK)
- submission_id (uuid, FK -> student_submissions.id)
- total_questions (int)
- correct_answers (int)
- incorrect_answers (int)
- percentage_score (numeric)
- final_grade (int)
- variant_used (int)
- detailed_answers (jsonb)
- ai_response (jsonb)
- confidence_score (numeric)
- essay_metadata (jsonb)
- created_at (timestamptz)
```

**Индексы:**
- ✅ `evaluation_results_pkey` (id)
- ✅ `idx_evaluation_results_submission_id` (submission_id)

**Проблемы:**
1. Отсутствует индекс на `final_grade` для статистики
2. JSONB поля не индексированы (при необходимости поиска)

**Рекомендации:**
- Добавить индекс на `final_grade` для аналитики
- Рассмотреть GIN индекс на `detailed_answers` если требуется поиск

---

#### 2.1.5. Таблица `check_usage_history`

**Структура:**
```sql
- id (uuid, PK)
- user_id (text, FK -> user_profiles.user_id)
- check_id (uuid, FK -> checks.id)
- submission_id (uuid, FK -> student_submissions.id)
- check_type (text)
- pages_count (int, default: 1)
- credits_used (numeric)
- created_at (timestamptz)
```

**Индексы:**
- ✅ `check_usage_history_pkey` (id)
- ❌ **НЕТ индексов на FK!**

**Проблемы:**
1. **КРИТИЧНО:** Нет индексов на `user_id`, `check_id`, `submission_id` (все FK)
2. Таблица пустая (0 записей) - функциональность не используется
3. Отсутствует индекс на `created_at` для временных запросов

**Рекомендации:**
- **ОБЯЗАТЕЛЬНО:** Добавить индексы на все FK
- Добавить составной индекс `(user_id, created_at DESC)` для истории пользователя
- Рассмотреть партиционирование по времени при росте данных

---

#### 2.1.6. Таблица `payment_orders`

**Структура:**
```sql
- id (uuid, PK)
- user_id (text, FK -> user_profiles.user_id)
- plan_id (uuid, FK -> subscription_plans.id)
- order_id (text, UNIQUE)
- amount (numeric)
- status (text, default: 'pending', CHECK: pending/paid/failed/cancelled)
- payment_id (text)
- payment_url (text)
- created_at, updated_at (timestamptz)
```

**Индексы:**
- ✅ `payment_orders_pkey` (id)
- ✅ `payment_orders_order_id_key` (order_id) UNIQUE
- ⚠️ `idx_payment_orders_user_id` (user_id) - **НЕИСПОЛЬЗУЕМЫЙ**
- ⚠️ `idx_payment_orders_order_id` (order_id) - **НЕИСПОЛЬЗУЕМЫЙ** (дублирует UNIQUE)
- ⚠️ `idx_payment_orders_payment_id` (payment_id) - **НЕИСПОЛЬЗУЕМЫЙ**
- ⚠️ `idx_payment_orders_status` (status) - **НЕИСПОЛЬЗУЕМЫЙ**
- ❌ **ОТСУТСТВУЕТ** индекс на `plan_id` (FK)

**Проблемы:**
1. **КРИТИЧНО:** RLS отключен - данные платежей доступны всем!
2. Много неиспользуемых индексов
3. Отсутствует индекс на FK `plan_id`

**Рекомендации:**
- **СРОЧНО:** Включить RLS
- Удалить неиспользуемые индексы
- Добавить индекс на `plan_id`
- Добавить составной индекс `(user_id, created_at DESC)` для истории платежей

---

### 2.2. Анализ Связей (Foreign Keys)

**Отсутствующие индексы на FK (критично для производительности):**

1. ✅ `user_profiles.subscription_plan_id` → `subscription_plans.id` - **НЕТ ИНДЕКСА**
2. ✅ `check_usage_history.user_id` → `user_profiles.user_id` - **НЕТ ИНДЕКСА**
3. ✅ `check_usage_history.check_id` → `checks.id` - **НЕТ ИНДЕКСА**
4. ✅ `check_usage_history.submission_id` → `student_submissions.id` - **НЕТ ИНДЕКСА**
5. ✅ `payment_orders.plan_id` → `subscription_plans.id` - **НЕТ ИНДЕКСА**

**Влияние:** При выполнении JOIN-запросов или DELETE CASCADE операций PostgreSQL будет выполнять FULL TABLE SCAN вместо использования индекса.

---

## 3. Критические Проблемы Безопасности

### 3.1. RLS Отключен на `payment_orders`

**Проблема:** Таблица `payment_orders` содержит конфиденциальные данные о платежах, но RLS отключен.

**Риск:** КРИТИЧЕСКИЙ - Любой пользователь может получить доступ к платежной информации других пользователей через PostgREST API.

**Решение:**
```sql
-- Включить RLS
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Создать политику для пользователей
CREATE POLICY "Users can view own payment orders"
ON public.payment_orders
FOR SELECT
TO public
USING (user_id = (SELECT auth.email()));

-- Политика для вставки (через сервисную роль)
CREATE POLICY "Users can create own payment orders"
ON public.payment_orders
FOR INSERT
TO public
WITH CHECK (user_id = (SELECT auth.email()));
```

**Приоритет:** КРИТИЧЕСКИЙ
**Сложность:** Низкая
**Трудозатраты:** 30 минут

---

### 3.2. Дублирующие RLS Политики на `user_profiles`

**Проблема:** Две идентичные политики "Allow all operations" и "Allow all profile operations" разрешают ВСЕ операции для ВСЕХ пользователей.

**Риск:** ВЫСОКИЙ - Любой пользователь может изменять/удалять профили других пользователей.

**Текущие политики:**
```sql
-- Политика 1
CREATE POLICY "Allow all operations"
ON public.user_profiles
FOR ALL
TO public
USING (true);

-- Политика 2 (дублирует первую)
CREATE POLICY "Allow all profile operations"
ON public.user_profiles
FOR ALL
TO public
USING (true);
```

**Решение:**
```sql
-- Удалить обе небезопасные политики
DROP POLICY "Allow all operations" ON public.user_profiles;
DROP POLICY "Allow all profile operations" ON public.user_profiles;

-- Создать правильные политики
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO public
USING (user_id = (SELECT auth.email()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO public
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));
```

**Приоритет:** КРИТИЧЕСКИЙ
**Сложность:** Средняя
**Трудозатраты:** 1 час

---

### 3.3. Множественные Дублирующие RLS Политики на `checks`

**Проблема:** Таблица `checks` имеет 5 политик, из которых 4 дублируют функциональность политики "Users can manage own checks".

**Влияние на производительность:** При каждом SELECT/INSERT/UPDATE/DELETE PostgreSQL выполняет ВСЕ применимые политики.

**Текущие политики:**
1. "Users can manage own checks" - FOR ALL
2. "Users can view own checks" - FOR SELECT (дублирует #1)
3. "Users can create checks" - FOR INSERT (дублирует #1)
4. "Users can update own checks" - FOR UPDATE (дублирует #1)
5. "Users can delete own checks" - FOR DELETE (дублирует #1)

**Решение:**
```sql
-- Оставить только одну политику
DROP POLICY "Users can view own checks" ON public.checks;
DROP POLICY "Users can create checks" ON public.checks;
DROP POLICY "Users can update own checks" ON public.checks;
DROP POLICY "Users can delete own checks" ON public.checks;

-- Политика "Users can manage own checks" остается
```

**Приоритет:** ВЫСОКИЙ
**Сложность:** Низкая
**Трудозатраты:** 30 минут
**Ожидаемый прирост производительности:** 15-20%

---

### 3.4. Проблемы с `current_setting()` в RLS Политиках

**Проблема:** 15 RLS политик используют `current_setting('request.jwt.claims')` или `auth.email()` без подзапроса `(SELECT ...)`, что приводит к переоценке функции для КАЖДОЙ строки.

**Влияние:** При выборке 1000 записей функция выполняется 1000 раз вместо 1 раза.

**Пример проблемной политики:**
```sql
-- ПЛОХО (переоценивается для каждой строки)
user_id = current_setting('app.current_user_id', true)

-- ХОРОШО (вычисляется один раз)
user_id = (SELECT current_setting('app.current_user_id', true))
```

**Затронутые таблицы:**
- `checks` (4 политики)
- `generated_tests` (4 политики)
- `check_usage_history` (2 политики)
- `variant_answers` (1 политика)
- И другие...

**Решение:** Обернуть все вызовы в подзапрос.

**Приоритет:** ВЫСОКИЙ
**Сложность:** Низкая
**Трудозатраты:** 2 часа
**Ожидаемый прирост производительности:** 30-50% на больших выборках

---

### 3.5. Небезопасные Функции БД

**Проблема:** 14 функций имеют изменяемый `search_path`, что создает уязвимость для SQL-инъекций через подмену схемы.

**Затронутые функции:**
- `update_variant_answers_updated_at`
- `update_updated_at_column`
- `update_payment_orders_updated_at`
- `get_check_variants_with_answers`
- `add_check_variant`
- `remove_check_variant`
- `handle_new_user`
- `deduct_check_credits`
- `add_subscription`
- `update_user_profile_stats`
- `update_check_statistics`
- `trigger_update_statistics`
- `trigger_update_user_stats`
- `set_config`

**Решение:** Зафиксировать `search_path` в каждой функции.

**Пример:**
```sql
ALTER FUNCTION update_updated_at_column()
SET search_path = public, pg_temp;
```

**Приоритет:** СРЕДНИЙ
**Сложность:** Низкая
**Трудозатраты:** 1 час

---

### 3.6. Устаревшая Версия PostgreSQL

**Проблема:** Используется версия `supabase-postgres-17.4.1.074`, для которой доступны обновления безопасности.

**Рекомендация:** Обновить до последней версии через Supabase Dashboard.

**Приоритет:** СРЕДНИЙ
**Сложность:** Низкая (автоматическое обновление)
**Трудозатраты:** 15 минут + downtime

---

## 4. Проблемы Производительности

### 4.1. Отсутствующие Индексы на Foreign Keys

**Проблема:** 5 foreign key constraints не имеют индексов.

**Влияние:**
- Медленные JOIN операции
- Медленные DELETE CASCADE
- FULL TABLE SCAN вместо INDEX SCAN

**Список:**
1. `user_profiles.subscription_plan_id`
2. `check_usage_history.user_id`
3. `check_usage_history.check_id`
4. `check_usage_history.submission_id`
5. `payment_orders.plan_id`

**Решение:**
```sql
-- user_profiles
CREATE INDEX idx_user_profiles_subscription_plan_id
ON user_profiles(subscription_plan_id);

-- check_usage_history
CREATE INDEX idx_check_usage_history_user_id
ON check_usage_history(user_id);

CREATE INDEX idx_check_usage_history_check_id
ON check_usage_history(check_id);

CREATE INDEX idx_check_usage_history_submission_id
ON check_usage_history(submission_id);

-- payment_orders
CREATE INDEX idx_payment_orders_plan_id
ON payment_orders(plan_id);
```

**Приоритет:** ВЫСОКИЙ
**Сложность:** Низкая
**Трудозатраты:** 30 минут
**Ожидаемый прирост:** 50-100x для JOIN запросов

---

### 4.2. Неиспользуемые Индексы

**Проблема:** 10 индексов никогда не использовались и занимают место + замедляют INSERT/UPDATE.

**Список:**
1. `idx_payment_orders_user_id` - дублирует FK запросы
2. `idx_payment_orders_order_id` - дублирует UNIQUE constraint
3. `idx_payment_orders_payment_id` - не используется
4. `idx_payment_orders_status` - не используется
5. `idx_variant_answers_variant_id` - дублирует составной индекс
6. `idx_user_profiles_role` - не используется
7. `idx_user_profiles_provider` - не используется
8. `idx_user_profiles_created_at` - не используется
9. `idx_submissions_status` - дублирует `idx_student_submissions_status`

**Решение:** Удалить все неиспользуемые индексы.

```sql
DROP INDEX idx_payment_orders_user_id;
DROP INDEX idx_payment_orders_order_id;
DROP INDEX idx_payment_orders_payment_id;
DROP INDEX idx_payment_orders_status;
DROP INDEX idx_variant_answers_variant_id;
DROP INDEX idx_user_profiles_role;
DROP INDEX idx_user_profiles_provider;
DROP INDEX idx_user_profiles_created_at;
DROP INDEX idx_submissions_status; -- оставить idx_student_submissions_status
```

**Приоритет:** СРЕДНИЙ
**Сложность:** Низкая
**Трудозатраты:** 30 минут
**Экономия:** ~64 KB места + ускорение INSERT/UPDATE на 5-10%

---

### 4.3. Отсутствующие Составные Индексы

**Проблема:** Частые запросы с фильтрацией по нескольким колонкам не имеют оптимальных индексов.

**Рекомендуемые индексы:**

```sql
-- Для пагинации проверок пользователя
CREATE INDEX idx_checks_user_id_created_at
ON checks(user_id, created_at DESC);

-- Для фильтрации сабмишенов по статусу
CREATE INDEX idx_student_submissions_check_id_status
ON student_submissions(check_id, status);

-- Для сортировки сабмишенов по времени
CREATE INDEX idx_student_submissions_check_id_created_at
ON student_submissions(check_id, created_at DESC);

-- Для истории использования
CREATE INDEX idx_check_usage_history_user_id_created_at
ON check_usage_history(user_id, created_at DESC);

-- Для истории платежей
CREATE INDEX idx_payment_orders_user_id_created_at
ON payment_orders(user_id, created_at DESC);
```

**Приоритет:** СРЕДНИЙ
**Сложность:** Низкая
**Трудозатраты:** 1 час
**Ожидаемый прирост:** 20-40% для листинговых запросов

---

### 4.4. Проблема с Temporary Signed URLs

**Проблема:** Поле `student_submissions.submission_images` хранит подписанные URL, которые истекают через 24 часа.

**Архитектура:**
```typescript
// При загрузке файла создается signed URL на 24 часа
const { data: urlData } = await supabase.storage
  .from('checks')
  .createSignedUrl(uploadData.path, 86400) // 24 hours

// URL сохраняется в БД
submission_images: [urlData.signedUrl]
```

**Проблемы:**
1. Через 24 часа ссылки становятся недействительными
2. Требуется endpoint для обновления URL (`/api/submissions/[id]/refresh-urls`)
3. Невозможно получить старые файлы без обновления ссылок

**Решение:** Хранить постоянные пути, генерировать signed URL по требованию.

```sql
-- Вместо:
submission_images: ['https://...signed-url...']

-- Хранить:
submission_images: ['checkId/filename.jpg']

-- И генерировать signed URL в API route при запросе
```

**Приоритет:** СРЕДНИЙ
**Сложность:** Средняя
**Трудозатраты:** 4 часа (миграция + изменение API)

---

## 5. Рекомендации по Оптимизации

### 5.1. Приоритезированный Список Оптимизаций

#### Критический Приоритет (исправить немедленно)

| # | Задача | Сложность | Время | Прирост |
|---|--------|-----------|-------|---------|
| 1 | Включить RLS на `payment_orders` | Низкая | 30 мин | Безопасность |
| 2 | Исправить RLS на `user_profiles` | Средняя | 1 час | Безопасность |
| 3 | Добавить индексы на FK | Низкая | 30 мин | 50-100x |

**Общее время:** 2 часа
**Риск:** Минимальный при тестировании

---

#### Высокий Приоритет (в течение недели)

| # | Задача | Сложность | Время | Прирост |
|---|--------|-----------|-------|---------|
| 4 | Объединить дублирующие RLS на `checks` | Низкая | 30 мин | 15-20% |
| 5 | Оптимизировать RLS с `current_setting()` | Низкая | 2 часа | 30-50% |
| 6 | Удалить неиспользуемые индексы | Низкая | 30 мин | 5-10% INSERT |
| 7 | Добавить составные индексы | Низкая | 1 час | 20-40% |

**Общее время:** 4 часа
**Риск:** Низкий

---

#### Средний Приоритет (в течение месяца)

| # | Задача | Сложность | Время | Прирост |
|---|--------|-----------|-------|---------|
| 8 | Исправить `search_path` в функциях | Низкая | 1 час | Безопасность |
| 9 | Изменить архитектуру хранения URL | Средняя | 4 часа | Надежность |
| 10 | Обновить PostgreSQL | Низкая | 15 мин | Безопасность |

**Общее время:** 5 часов 15 минут
**Риск:** Средний (требует тестирования)

---

### 5.2. Миграционный Скрипт (Критические Изменения)

```sql
-- ============================================
-- КРИТИЧЕСКИЕ ИЗМЕНЕНИЯ БЕЗОПАСНОСТИ
-- ============================================

-- 1. Включить RLS на payment_orders
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment orders"
ON public.payment_orders
FOR SELECT
TO public
USING (user_id = (SELECT auth.email()));

CREATE POLICY "Service role can manage all orders"
ON public.payment_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Исправить RLS на user_profiles
DROP POLICY IF EXISTS "Allow all operations" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all profile operations" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO public
USING (user_id = (SELECT auth.email()));

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO public
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));

CREATE POLICY "Service role can manage all profiles"
ON public.user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Добавить индексы на Foreign Keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_subscription_plan_id
ON user_profiles(subscription_plan_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_usage_history_user_id
ON check_usage_history(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_usage_history_check_id
ON check_usage_history(check_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_usage_history_submission_id
ON check_usage_history(submission_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_plan_id
ON payment_orders(plan_id);

-- ============================================
-- ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- 4. Объединить дублирующие RLS политики на checks
DROP POLICY IF EXISTS "Users can view own checks" ON public.checks;
DROP POLICY IF EXISTS "Users can create checks" ON public.checks;
DROP POLICY IF EXISTS "Users can update own checks" ON public.checks;
DROP POLICY IF EXISTS "Users can delete own checks" ON public.checks;
-- Оставляем только "Users can manage own checks"

-- 5. Удалить дублирующий индекс на student_submissions
DROP INDEX IF EXISTS idx_submissions_status;

-- 6. Удалить неиспользуемые индексы
DROP INDEX IF EXISTS idx_payment_orders_user_id;
DROP INDEX IF EXISTS idx_payment_orders_order_id;
DROP INDEX IF EXISTS idx_payment_orders_payment_id;
DROP INDEX IF EXISTS idx_payment_orders_status;
DROP INDEX IF EXISTS idx_variant_answers_variant_id;
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_provider;
DROP INDEX IF EXISTS idx_user_profiles_created_at;
DROP INDEX IF EXISTS idx_user_profiles_user_id; -- дублирует UNIQUE constraint

-- 7. Добавить составные индексы
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checks_user_id_created_at
ON checks(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_submissions_check_id_status
ON student_submissions(check_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_submissions_check_id_created_at
ON student_submissions(check_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_check_usage_history_user_id_created_at
ON check_usage_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_orders_user_id_created_at
ON payment_orders(user_id, created_at DESC);

-- ============================================
-- ОПТИМИЗАЦИЯ RLS ПОЛИТИК
-- ============================================

-- 8. Оптимизировать RLS политики с current_setting()
-- Пример для checks (повторить для всех таблиц)

DROP POLICY IF EXISTS "Users can manage own checks" ON public.checks;

CREATE POLICY "Users can manage own checks"
ON public.checks
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE user_profiles.user_id = checks.user_id
      AND user_profiles.email = (SELECT auth.email())
  )
);

-- Аналогично для других таблиц...

-- ============================================
-- БЕЗОПАСНОСТЬ ФУНКЦИЙ
-- ============================================

-- 9. Зафиксировать search_path для всех функций
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION update_variant_answers_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_payment_orders_updated_at() SET search_path = public, pg_temp;
-- И т.д. для остальных функций...
```

---

### 5.3. Рекомендации для Масштабирования

#### При достижении 10,000+ записей в таблице:

**1. Партиционирование `student_submissions` по времени:**
```sql
-- Разбить на месячные партиции
CREATE TABLE student_submissions_2025_01 PARTITION OF student_submissions
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**2. Архивация старых `evaluation_results`:**
```sql
-- Переместить результаты старше 1 года в архивную таблицу
CREATE TABLE evaluation_results_archive AS
SELECT * FROM evaluation_results
WHERE created_at < NOW() - INTERVAL '1 year';
```

**3. Материализованное представление для статистики:**
```sql
CREATE MATERIALIZED VIEW user_stats_mv AS
SELECT
  u.user_id,
  COUNT(DISTINCT c.id) as total_checks,
  COUNT(DISTINCT s.id) as total_submissions,
  AVG(e.percentage_score) as avg_score
FROM user_profiles u
LEFT JOIN checks c ON c.user_id = u.user_id
LEFT JOIN student_submissions s ON s.check_id = c.id
LEFT JOIN evaluation_results e ON e.submission_id = s.id
GROUP BY u.user_id;

-- Обновлять каждый час
CREATE INDEX ON user_stats_mv(user_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_mv;
```

**4. Индексы на JSONB полях:**
```sql
-- Если требуется поиск по detailed_answers
CREATE INDEX idx_evaluation_results_detailed_answers_gin
ON evaluation_results USING GIN (detailed_answers);
```

---

## 6. Оценка Self-Hosting на Собственном Сервере

### 6.1. Компоненты Supabase, Используемые в Проекте

| Компонент | Использование | Сложность Миграции | Альтернатива |
|-----------|---------------|-------------------|--------------|
| **PostgreSQL** | ✅ Активно | Низкая | Обычный PostgreSQL |
| **PostgREST** | ❌ Не используется | - | - |
| **GoTrue (Auth)** | ✅ NextAuth.js | Низкая | Уже независим |
| **Realtime** | ❌ Не используется | - | - |
| **Storage** | ✅ Активно | Средняя | MinIO / S3 |
| **Edge Functions** | ❌ Не используется | - | - |

### 6.2. Анализ Зависимостей

#### PostgreSQL Database

**Текущее использование:**
- Service Role клиент через `@supabase/supabase-js`
- Обход RLS через service role ключ
- Все запросы через Supabase JS SDK

**Миграция:**
```typescript
// Текущий код
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// После миграции (pg или Prisma)
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

**Сложность:** Низкая
**Трудозатраты:** 8-16 часов (переписать все database helpers)

---

#### Supabase Storage

**Текущее использование:**
- Bucket `checks` для хранения изображений работ
- 146 файлов
- Signed URLs на 24 часа

**Код:**
```typescript
// Загрузка
await supabase.storage
  .from('checks')
  .upload(filePath, file)

// Получение signed URL
await supabase.storage
  .from('checks')
  .createSignedUrl(path, 86400)
```

**Альтернативы:**

1. **MinIO (S3-совместимый)**
   - Самостоятельный хостинг
   - S3-совместимый API
   - Простая миграция

2. **AWS S3 / DigitalOcean Spaces**
   - Облачное решение
   - S3-совместимый API

3. **S3 от reg.ru**
   - Российский провайдер
   - S3-совместимый API
   - Подходит для проекта

**Сложность:** Средняя
**Трудозатраты:** 4-8 часов

---

#### NextAuth.js (Аутентификация)

**Текущее использование:**
- NextAuth v5 с несколькими провайдерами (Google, Yandex, Credentials)
- Собственная таблица `user_profiles`
- JWT сессии

**Зависимость от Supabase:** ОТСУТСТВУЕТ
**Миграция:** НЕ ТРЕБУЕТСЯ

---

### 6.3. Архитектура Self-Hosted Решения

```
┌─────────────────────────────────────────────┐
│         Next.js Application                 │
│  (localhost или собственный сервер)         │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────┐
│  PostgreSQL   │   │  S3 Storage  │
│   Database    │   │  (reg.ru)    │
│               │   │              │
│ - pg driver   │   │ - AWS SDK v3 │
│ - Connection  │   │ - S3 compat  │
│   pooling     │   │              │
└───────────────┘   └──────────────┘
```

---

### 6.4. План Миграции на Self-Hosting

#### Этап 1: Подготовка (1-2 дня)

1. **Настройка PostgreSQL сервера**
   - Установить PostgreSQL 17 на сервер
   - Настроить security (firewall, SSL)
   - Создать backup стратегию

2. **Миграция схемы**
   - Экспорт схемы из Supabase
   - Импорт в новый PostgreSQL
   - Проверка всех constraints и индексов

3. **Миграция данных**
   - Экспорт данных из Supabase
   - Импорт в новый PostgreSQL
   - Проверка integrity

**Инструменты:**
```bash
# Экспорт схемы
pg_dump -s $SUPABASE_URL > schema.sql

# Экспорт данных
pg_dump -a $SUPABASE_URL > data.sql

# Импорт
psql $NEW_DATABASE_URL < schema.sql
psql $NEW_DATABASE_URL < data.sql
```

**Трудозатраты:** 16 часов

---

#### Этап 2: Изменение Кода (2-3 дня)

1. **Замена Supabase Client на pg**

```typescript
// lib/database.ts - НОВЫЙ КОД

import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
})

export async function getAuthenticatedDB() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  return {
    pool,
    userId: session.user.email
  }
}

// Пример использования
const { pool, userId } = await getAuthenticatedDB()
const result = await pool.query(
  'SELECT * FROM checks WHERE user_id = $1',
  [userId]
)
```

2. **Обновить все API routes**
   - Заменить `supabase.from('table').select()` на SQL запросы
   - Добавить prepared statements для безопасности
   - Реализовать transaction handling

**Трудозатраты:** 24 часа

---

#### Этап 3: Миграция Storage (1-2 дня)

1. **Настройка S3 от reg.ru**
2. **Миграция файлов из Supabase Storage**
3. **Обновление кода для работы с S3**

Подробности в разделе 7.

**Трудозатраты:** 16 часов

---

#### Этап 4: Тестирование (2-3 дня)

1. Unit-тесты для database helpers
2. Интеграционные тесты для API routes
3. End-to-end тесты для критических потоков
4. Performance testing

**Трудозатраты:** 24 часа

---

#### Этап 5: Развертывание (1 день)

1. Настройка production окружения
2. Настройка мониторинга (Grafana + Prometheus)
3. Настройка backups (pg_dump + S3)
4. Миграция DNS

**Трудозатраты:** 8 часов

---

### 6.5. Итоговая Оценка Self-Hosting

| Параметр | Оценка |
|----------|--------|
| **Сложность миграции** | Средняя |
| **Общие трудозатраты** | 88-104 часа (11-13 дней) |
| **Риски** | Средние |
| **Стоимость** | Зависит от сервера |
| **Поддержка** | Требует DevOps опыта |

### 6.6. Плюсы и Минусы

#### Плюсы Self-Hosting:

✅ Полный контроль над данными
✅ Нет vendor lock-in
✅ Возможность кастомизации
✅ Потенциально дешевле при масштабировании
✅ Соответствие требованиям локализации данных

#### Минусы Self-Hosting:

❌ Требует DevOps экспертизы
❌ Необходимость мониторинга 24/7
❌ Ответственность за backups
❌ Ответственность за безопасность
❌ Время на настройку и поддержку
❌ Нет автоматических обновлений

### 6.7. Рекомендация

**Для текущей стадии проекта (MVP):** Остаться на Supabase

**Причины:**
1. Малый объем данных (~1.5 MB)
2. Низкая нагрузка (7 пользователей)
3. Нет необходимости в специфичных оптимизациях
4. Экономия времени на DevOps

**Когда мигрировать:**
- При росте до 100+ активных пользователей
- При необходимости специфичных оптимизаций
- При росте расходов на Supabase > стоимости сервера
- При необходимости соответствия законодательству о хранении данных

---

## 7. Интеграция S3 от reg.ru

### 7.1. Текущее Использование Supabase Storage

**Bucket:** `checks`
**Файлов:** 146
**Структура:**
```
checks/
├── {checkId}/
│   ├── {timestamp}-0-photo_1.jpg
│   ├── {timestamp}-1-photo_2.jpg
│   └── ...
```

**Текущий код:**
```typescript
// Загрузка файла
const { data: uploadData, error } = await supabase.storage
  .from('checks')
  .upload(filePath, file, {
    contentType: file.type,
    upsert: false
  })

// Получение signed URL
const { data: urlData } = await supabase.storage
  .from('checks')
  .createSignedUrl(uploadData.path, 86400) // 24 hours
```

### 7.2. Архитектура Интеграции S3

```
┌───────────────────────────────────────┐
│      Next.js Application              │
└──────────────┬────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│    S3 Storage Abstraction Layer      │
│                                       │
│  - upload(file)                       │
│  - getSignedUrl(path)                 │
│  - delete(path)                       │
│  - list(prefix)                       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│       AWS SDK v3 S3 Client            │
│                                       │
│  Endpoint: s3.reg.ru                  │
│  Region: ru-1                         │
└───────────────────────────────────────┘
```

### 7.3. Пример Реализации

#### Шаг 1: Установить зависимости

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

#### Шаг 2: Создать S3 клиент

```typescript
// lib/storage/s3-client.ts

import { S3Client } from '@aws-sdk/client-s3'

export const s3Client = new S3Client({
  region: 'ru-1', // Регион reg.ru
  endpoint: 'https://s3.reg.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Для совместимости
})

export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'checkly-uploads'
```

#### Шаг 3: Создать Storage Helper

```typescript
// lib/storage/index.ts

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, BUCKET_NAME } from './s3-client'

export interface UploadResult {
  path: string
  url: string
}

export class StorageService {
  /**
   * Загрузить файл в S3
   */
  async upload(
    file: File,
    path: string,
    options?: { contentType?: string }
  ): Promise<UploadResult> {
    const buffer = Buffer.from(await file.arrayBuffer())

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: buffer,
      ContentType: options?.contentType || file.type,
    })

    await s3Client.send(command)

    // Вернуть path (не signed URL!)
    return {
      path,
      url: await this.getSignedUrl(path, 86400)
    }
  }

  /**
   * Получить подписанный URL
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  /**
   * Удалить файл
   */
  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
    })

    await s3Client.send(command)
  }

  /**
   * Список файлов
   */
  async list(prefix: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    })

    const response = await s3Client.send(command)
    return response.Contents?.map(obj => obj.Key || '') || []
  }
}

export const storage = new StorageService()
```

#### Шаг 4: Обновить API Route

```typescript
// app/api/checks/[id]/submissions/route.ts

import { storage } from '@/lib/storage'

// СТАРЫЙ КОД (Supabase)
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('checks')
  .upload(filePath, file, {
    contentType: file.type,
    upsert: false
  })

const { data: urlData } = await supabase.storage
  .from('checks')
  .createSignedUrl(uploadData.path, 86400)

uploadedUrls.push(urlData.signedUrl)

// НОВЫЙ КОД (S3 от reg.ru)
try {
  const result = await storage.upload(file, filePath, {
    contentType: file.type
  })

  // Сохраняем ПУТЬ, а не signed URL!
  uploadedPaths.push(result.path)
} catch (error) {
  console.error('S3 upload error:', error)
  throw new Error('Failed to upload file')
}
```

#### Шаг 5: Изменить Схему БД

```sql
-- Текущая схема
submission_images text[] -- массив signed URLs

-- НОВАЯ схема (хранить пути)
submission_file_paths text[] -- массив путей в S3

-- Миграция
ALTER TABLE student_submissions
RENAME COLUMN submission_images TO submission_file_paths;

-- Обновить данные (извлечь путь из URL)
-- ПРИМЕЧАНИЕ: Это примерный код, нужно адаптировать под реальные URLs
UPDATE student_submissions
SET submission_file_paths = ARRAY(
  SELECT regexp_replace(
    unnest(submission_file_paths),
    '^https://.*?/object/sign/checks/(.*?)\\?.*$',
    '\\1'
  )
);
```

#### Шаг 6: API для Получения Signed URLs

```typescript
// app/api/submissions/[id]/files/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { getAuthenticatedDB } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: submissionId } = await params
  const { pool, userId } = await getAuthenticatedDB()

  // Получить submission с проверкой прав
  const result = await pool.query(`
    SELECT s.submission_file_paths
    FROM student_submissions s
    JOIN checks c ON c.id = s.check_id
    WHERE s.id = $1 AND c.user_id = $2
  `, [submissionId, userId])

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const paths = result.rows[0].submission_file_paths as string[]

  // Генерируем signed URLs для всех файлов
  const signedUrls = await Promise.all(
    paths.map(path => storage.getSignedUrl(path, 3600)) // 1 час
  )

  return NextResponse.json({
    files: paths.map((path, i) => ({
      path,
      url: signedUrls[i]
    }))
  })
}
```

### 7.4. Миграция Существующих Файлов

```typescript
// scripts/migrate-storage-to-s3.ts

import { createClient } from '@supabase/supabase-js'
import { storage } from '@/lib/storage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateFiles() {
  // 1. Получить список всех файлов из Supabase Storage
  const { data: files } = await supabase.storage
    .from('checks')
    .list()

  console.log(`Found ${files?.length || 0} files to migrate`)

  // 2. Для каждого файла
  for (const file of files || []) {
    console.log(`Migrating ${file.name}...`)

    // Скачать из Supabase
    const { data: fileData } = await supabase.storage
      .from('checks')
      .download(file.name)

    if (!fileData) {
      console.error(`Failed to download ${file.name}`)
      continue
    }

    // Загрузить в S3
    const fileObject = new File([fileData], file.name, {
      type: file.metadata?.mimetype || 'application/octet-stream'
    })

    await storage.upload(fileObject, file.name, {
      contentType: fileObject.type
    })

    console.log(`✓ Migrated ${file.name}`)
  }

  console.log('Migration completed!')
}

migrateFiles()
```

### 7.5. Оценка Трудозатрат

| Задача | Время |
|--------|-------|
| Настройка S3 bucket на reg.ru | 1 час |
| Создание S3 клиента и helper | 2 часа |
| Обновление API routes | 4 часа |
| Миграция схемы БД | 1 час |
| Миграция файлов | 2 часа |
| Создание endpoint для signed URLs | 2 часа |
| Тестирование | 4 часа |
| **ИТОГО** | **16 часов** |

### 7.6. Риски и Ограничения

#### Риски:

⚠️ **Downtime при миграции файлов** - нужно выполнять в нерабочее время
⚠️ **Изменение схемы БД** - требует тщательного тестирования
⚠️ **Обратная совместимость** - старые signed URLs перестанут работать

#### Ограничения reg.ru S3:

- Квоты на запросы в секунду
- Максимальный размер объекта: 5 TB
- Максимальный размер multipart upload part: 5 GB
- Лимит на кол-во объектов: обычно неограничен

### 7.7. Альтернативные Подходы

#### Вариант 1: Двойная запись (нулевой downtime)

```typescript
// Загружать в оба хранилища во время переходного периода
await Promise.all([
  supabase.storage.from('checks').upload(path, file),
  storage.upload(file, path)
])

// Читать из S3, fallback на Supabase
let url = await storage.getSignedUrl(path)
if (!url) {
  url = await supabase.storage.from('checks').createSignedUrl(path, 3600)
}
```

#### Вариант 2: Lazy Migration

```typescript
// Мигрировать файлы только при обращении
async function getFileUrl(path: string) {
  // Проверить, есть ли в S3
  try {
    return await storage.getSignedUrl(path)
  } catch {
    // Файла нет в S3, мигрировать из Supabase
    const { data } = await supabase.storage.from('checks').download(path)
    if (data) {
      await storage.upload(new File([data], path), path)
      return await storage.getSignedUrl(path)
    }
    throw new Error('File not found')
  }
}
```

### 7.8. Рекомендации

**Для текущего проекта:**

1. **Сначала исправить архитектуру с signed URLs** (сохранять пути вместо URL)
2. **Затем выполнить миграцию на S3** в нерабочее время
3. **Использовать двойную запись** на переходный период (1 неделя)
4. **Постепенно удалить зависимость от Supabase Storage**

**Преимущества S3 от reg.ru:**
- Российский провайдер (соответствие 152-ФЗ)
- S3-совместимый API (легкая миграция)
- Конкурентные цены
- Хорошая документация

---

## 8. План Действий

### 8.1. Немедленные Действия (эта неделя)

**Приоритет: КРИТИЧЕСКИЙ**

```bash
# День 1-2: Безопасность
[ ] Включить RLS на payment_orders
[ ] Исправить RLS на user_profiles
[ ] Добавить индексы на FK

# День 3-4: Производительность
[ ] Объединить дублирующие RLS политики
[ ] Оптимизировать current_setting() в RLS
[ ] Удалить неиспользуемые индексы
[ ] Добавить составные индексы

# День 5: Тестирование
[ ] Протестировать все изменения
[ ] Проверить performance impact
[ ] Rollback plan готов
```

**Ответственный:** Backend разработчик
**Время:** 5 дней

---

### 8.2. Краткосрочные Задачи (этот месяц)

```bash
# Неделя 2: Безопасность функций
[ ] Исправить search_path в функциях
[ ] Обновить PostgreSQL до последней версии

# Неделя 3: Архитектура Storage
[ ] Изменить схему: хранить пути вместо signed URLs
[ ] Обновить API routes
[ ] Миграция данных

# Неделя 4: Тестирование и Мониторинг
[ ] Настроить performance мониторинг
[ ] Создать dashboard для метрик БД
[ ] Документировать изменения
```

**Ответственный:** Backend + DevOps
**Время:** 3 недели

---

### 8.3. Долгосрочные Задачи (следующие 3 месяца)

```bash
# Месяц 2: Подготовка к масштабированию
[ ] Реализовать партиционирование для больших таблиц
[ ] Настроить материализованные представления
[ ] Оптимизировать медленные запросы (EXPLAIN ANALYZE)

# Месяц 3: Интеграция S3
[ ] Настроить S3 bucket на reg.ru
[ ] Реализовать Storage abstraction layer
[ ] Миграция файлов из Supabase Storage

# Месяц 4: Оценка Self-Hosting
[ ] Провести cost analysis (Supabase vs Self-Hosted)
[ ] Оценить текущую нагрузку и прогнозы роста
[ ] Решение о миграции (если необходимо)
```

**Ответственный:** Full team
**Время:** 3 месяца

---

## Заключение

### Текущее Состояние

База данных ChecklyTool находится в **работоспособном состоянии** для текущего объема данных (MVP стадия), но требует **критических исправлений безопасности** и **оптимизации производительности** перед масштабированием.

### Ключевые Выводы

1. ✅ **Схема хорошо спроектирована** - нормализована, логична
2. ⚠️ **Есть критические проблемы безопасности** - RLS на payment_orders, небезопасные политики
3. ⚠️ **Производительность требует оптимизации** - отсутствующие индексы, дублирующие политики
4. ✅ **Миграция на self-hosting возможна** - средняя сложность, ~88-104 часа
5. ✅ **Интеграция S3 от reg.ru реалистична** - ~16 часов работы

### Рекомендации

**Для текущей стадии:**
1. Исправить критические проблемы безопасности (2 часа)
2. Добавить недостающие индексы (2 часа)
3. Оптимизировать RLS политики (4 часа)
4. Изменить архитектуру хранения URL (4 часа)

**Общие трудозатраты на критические исправления:** 12 часов

**Для будущего масштабирования:**
- Оставаться на Supabase до 100+ активных пользователей
- Подготовить партиционирование для больших таблиц
- Рассмотреть интеграцию S3 от reg.ru для соответствия 152-ФЗ
- Оценить self-hosting при росте расходов

### Следующие Шаги

1. **Применить миграционный скрипт** из раздела 5.2
2. **Протестировать изменения** на staging окружении
3. **Задеплоить на production** в нерабочее время
4. **Настроить мониторинг** производительности БД
5. **Запланировать интеграцию S3** через 1-2 месяца

---

**Дата:** 09 октября 2025
**Версия отчета:** 1.0
**Автор:** Claude (Database Optimization Specialist)
