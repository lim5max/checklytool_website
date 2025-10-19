-- ============================================
-- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ БЕЗОПАСНОСТИ
-- Включение RLS на таблице payment_orders
-- ============================================
-- Дата: 2025-10-19
-- ПРИОРИТЕТ: КРИТИЧЕСКИЙ
-- ПРОБЛЕМА: Таблица payment_orders не имеет RLS!
-- РИСК: Любой пользователь может видеть платежи других пользователей
-- ============================================

-- 1. Включить Row Level Security на payment_orders
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 2. Удалить старые политики (если существуют)
DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Users can create own payment orders" ON public.payment_orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON public.payment_orders;

-- 3. Создать оптимизированную политику для просмотра своих заказов
-- Используем (SELECT auth.email()) для оптимизации
CREATE POLICY "Users can view own payment orders"
ON public.payment_orders
FOR SELECT
USING (user_id = (SELECT auth.email()));

-- 4. Создать политику для создания заказов
CREATE POLICY "Users can create own payment orders"
ON public.payment_orders
FOR INSERT
WITH CHECK (user_id = (SELECT auth.email()));

-- 5. Создать политику для обновления заказов (необходимо для обновления статуса)
CREATE POLICY "Users can update own payment orders"
ON public.payment_orders
FOR UPDATE
USING (user_id = (SELECT auth.email()))
WITH CHECK (user_id = (SELECT auth.email()));

-- 6. Разрешить service role управлять всеми заказами (для webhook от Т-Банк)
CREATE POLICY "Service role can manage all orders"
ON public.payment_orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Комментарии для документации
COMMENT ON POLICY "Users can view own payment orders" ON public.payment_orders IS
'Пользователи могут просматривать только свои платежные заказы';

COMMENT ON POLICY "Users can create own payment orders" ON public.payment_orders IS
'Пользователи могут создавать заказы только для себя';

COMMENT ON POLICY "Users can update own payment orders" ON public.payment_orders IS
'Пользователи могут обновлять только свои заказы';

COMMENT ON POLICY "Service role can manage all orders" ON public.payment_orders IS
'Service role (для webhook) может управлять всеми заказами';

-- ============================================
-- МИГРАЦИЯ ЗАВЕРШЕНА
-- ============================================
-- ✓ RLS включен на payment_orders
-- ✓ Пользователи видят только свои заказы
-- ✓ Service role может обновлять статусы через webhook
-- ============================================
