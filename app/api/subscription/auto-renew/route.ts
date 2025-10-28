import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Валидация входных данных
const AutoRenewSchema = z.object({
	enabled: z.boolean(),
})

/**
 * POST /api/subscription/auto-renew
 * Включение/отключение автоматического продления подписки
 */
export async function POST(request: NextRequest) {
	try {
		// Проверка аутентификации
		const session = await auth()
		if (!session?.user?.email) {
			return NextResponse.json(
				{ error: 'Необходима авторизация' },
				{ status: 401 }
			)
		}

		const userId = session.user.email

		// Валидация входных данных
		const body = await request.json()
		const validation = AutoRenewSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Некорректные данные запроса', details: validation.error },
				{ status: 400 }
			)
		}

		const { enabled } = validation.data

		// Создаем Supabase клиент
		const supabase = await createClient()

		// Получаем текущий профиль пользователя
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: userProfile, error: profileError } = await (supabase as any)
			.from('user_profiles')
			.select('subscription_auto_renew, rebill_id, subscription_plan_id')
			.eq('user_id', userId)
			.single()

		if (profileError || !userProfile) {
			console.error('[Auto-Renew] Profile not found:', profileError)
			return NextResponse.json(
				{ error: 'Профиль пользователя не найден' },
				{ status: 404 }
			)
		}

		// Если пользователь пытается включить автопродление, проверяем наличие rebill_id
		if (enabled && !userProfile.rebill_id) {
			return NextResponse.json(
				{
					error: 'Для включения автопродления необходимо сначала оплатить подписку',
					details: 'У вас нет сохраненной карты для автоматических списаний',
				},
				{ status: 400 }
			)
		}

		// Проверяем, что у пользователя есть активная платная подписка
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: plan } = await (supabase as any)
			.from('subscription_plans')
			.select('name')
			.eq('id', userProfile.subscription_plan_id)
			.single()

		if (plan && plan.name === 'FREE') {
			return NextResponse.json(
				{
					error: 'Автопродление доступно только для платных подписок',
				},
				{ status: 400 }
			)
		}

		// Обновляем настройку автопродления
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { error: updateError } = await (supabase as any)
			.from('user_profiles')
			.update({
				subscription_auto_renew: enabled,
			})
			.eq('user_id', userId)

		if (updateError) {
			console.error('[Auto-Renew] Failed to update:', updateError)
			return NextResponse.json(
				{ error: 'Не удалось обновить настройки' },
				{ status: 500 }
			)
		}

		console.log(`[Auto-Renew] Updated for user ${userId}: ${enabled}`)

		return NextResponse.json({
			success: true,
			autoRenew: enabled,
			message: enabled
				? 'Автоматическое продление включено'
				: 'Автоматическое продление отключено',
		})
	} catch (error) {
		console.error('[Auto-Renew] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Произошла непредвиденная ошибка',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}

/**
 * GET /api/subscription/auto-renew
 * Получение текущего статуса автопродления
 */
export async function GET() {
	try {
		// Проверка аутентификации
		const session = await auth()
		if (!session?.user?.email) {
			return NextResponse.json(
				{ error: 'Необходима авторизация' },
				{ status: 401 }
			)
		}

		const userId = session.user.email

		// Создаем Supabase клиент
		const supabase = await createClient()

		// Получаем текущий профиль пользователя
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: userProfile, error: profileError } = await (supabase as any)
			.from('user_profiles')
			.select('subscription_auto_renew, rebill_id, subscription_status, subscription_expires_at')
			.eq('user_id', userId)
			.single()

		if (profileError || !userProfile) {
			console.error('[Auto-Renew] Profile not found:', profileError)
			return NextResponse.json(
				{ error: 'Профиль пользователя не найден' },
				{ status: 404 }
			)
		}

		return NextResponse.json({
			success: true,
			autoRenew: userProfile.subscription_auto_renew,
			hasRebillId: !!userProfile.rebill_id,
			subscriptionStatus: userProfile.subscription_status,
			subscriptionExpiresAt: userProfile.subscription_expires_at,
		})
	} catch (error) {
		console.error('[Auto-Renew] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Произошла непредвиденная ошибка',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
