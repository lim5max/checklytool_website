# Настройка Supabase для ChecklyTool

## 1. Создание проекта Supabase

1. Перейдите на [https://supabase.com](https://supabase.com)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новый проект:
   - Название: `checkly-tool`
   - Регион: выберите ближайший к вашим пользователям
   - Создайте надежный пароль для базы данных

## 2. Получение API ключей

После создания проекта:

1. Перейдите в Settings → API
2. Скопируйте следующие значения:
   - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Resend (уже есть)
RESEND_API_KEY=your_resend_key

# OpenRouter (уже есть)
OPENROUTER_API_KEY=your_openrouter_key
```

## 4. Создание таблиц базы данных

Перейдите в SQL Editor в Supabase и выполните следующие запросы:

### Таблица профилей пользователей
```sql
-- Создаем таблицу профилей
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свой профиль
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Политика: пользователи могут обновлять только свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Политика: профиль создается автоматически при регистрации
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

> **Примечание:** Таблицы для заданий/проверок работ будут созданы позже, когда начнем разрабатывать основной функционал приложения.

### Функция для автоматического создания профиля
```sql
-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Настройка аутентификации

### Email настройки
1. Перейдите в Authentication → Settings → Email Templates
2. Настройте шаблоны писем для:
   - Подтверждение регистрации
   - Сброс пароля
   - Изменение email

### Настройка OAuth провайдеров

#### Google OAuth
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
5. В Supabase: Authentication → Providers → Google:
   - Включите Google provider
   - Вставьте Client ID и Client Secret

#### Яндекс OAuth
1. Перейдите на [OAuth.Yandex](https://oauth.yandex.ru/)
2. Создайте новое приложение
3. Добавьте права доступа:
   - Доступ к email адресу
   - Доступ к имени пользователя
4. Callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
5. В Supabase: Authentication → Providers → Создать custom provider:
   - Provider: `yandex`
   - Client ID и Client Secret из Яндекс.OAuth

#### VK OAuth
1. Перейдите в [VK Developers](https://dev.vk.com/)
2. Создайте новое приложение типа "Веб-сайт"
3. В настройках приложения:
   - Доверенный redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
4. В Supabase: создайте custom provider для VK

## 6. Настройка CORS и безопасности

### Site URL
В Authentication → Settings → Site URL добавьте:
- `http://localhost:3000` (для разработки)
- `https://yourdomain.com` (для продакшена)

### Redirect URLs
В Authentication → Settings → Redirect URLs добавьте:
- `http://localhost:3000/auth/callback`
- `https://yourdomain.com/auth/callback`

## 7. Тестирование

После настройки:

1. Запустите приложение: `npm run dev`
2. Попробуйте зарегистрироваться через email
3. Проверьте подтверждение email
4. Протестируйте OAuth провайдеры
5. Убедитесь, что профиль пользователя создается в таблице `profiles`
6. Проверьте доступ к дашборду после авторизации

## 8. Безопасность

### Важные моменты:
- RLS включен для всех таблиц
- Каждый пользователь видит только свои данные
- API ключи находятся в переменных окружения
- Не коммитьте `.env.local` в Git

### Мониторинг
Используйте Supabase Dashboard для:
- Просмотра логов аутентификации
- Мониторинга использования API
- Анализа производительности запросов

## Готово! 

После выполнения всех шагов система авторизации будет полностью функциональна.

Следующие шаги:
1. Тестирование всех форм авторизации
2. Разработка функциональности загрузки и проверки работ
3. Создание таблиц для заданий и результатов проверки
4. Интеграция с OpenRouter для ИИ анализа работ