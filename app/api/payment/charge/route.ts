import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chargeRecurrent, createReceipt } from '@/lib/tbank'
import { z } from 'zod'

// Валидация входных данных
const ChargePaymentSchema = z.object({
	userId: z.string(),
})

/**
 * POST /api/payment/charge
 * Автоматическое списание средств с сохраненной карты (рекуррентный платеж)
 *
 * Этот endpoint защищен API ключом и вызывается только из Supabase функции
 */
export async function POST(request: NextRequest) {
	try {
		// Проверка API ключа
		const apiKey = request.headers.get('x-api-key')
		const expectedApiKey = process.env.SUBSCRIPTION_RENEWAL_API_KEY

		if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
			console.error('[Payment Charge] Invalid or missing API key')
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Валидация входных данных
		const body = await request.json()
		const validation = ChargePaymentSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Некорректные данные запроса', details: validation.error },
				{ status: 400 }
			)
		}

		const { userId } = validation.data

		// Создаем Supabase клиент
		const supabase = await createClient()

		// Получаем профиль пользователя
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: userProfile, error: profileError } = await (supabase as any)
			.from('user_profiles')
			.select('*')
			.eq('user_id', userId)
			.single()

		if (profileError || !userProfile) {
			console.error('[Payment Charge] User profile not found:', userId)
			return NextResponse.json(
				{ error: 'Профиль пользователя не найден' },
				{ status: 404 }
			)
		}

		// Проверяем наличие rebill_id
		if (!userProfile.rebill_id) {
			console.error('[Payment Charge] No rebill_id for user:', userId)
			return NextResponse.json(
				{ error: 'У пользователя нет сохраненной карты для автосписания' },
				{ status: 400 }
			)
		}

		// Проверяем, что автопродление включено
		if (!userProfile.subscription_auto_renew) {
			console.log('[Payment Charge] Auto-renew disabled for user:', userId)
			return NextResponse.json(
				{ error: 'Автопродление отключено пользователем' },
				{ status: 400 }
			)
		}

		// Получаем информацию о плане подписки
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: plan, error: planError } = await (supabase as any)
			.from('subscription_plans')
			.select('*')
			.eq('id', userProfile.subscription_plan_id)
			.single()

		if (planError || !plan) {
			console.error('[Payment Charge] Plan not found:', userProfile.subscription_plan_id)
			return NextResponse.json(
				{ error: 'План подписки не найден' },
				{ status: 404 }
			)
		}

		// Генерируем уникальный ID заказа
		const orderId = `RECURRENT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

		// Сумма в копейках
		const amountInKopecks = Math.round(plan.price * 100)

		// Создаем чек для ФЗ-54 (только для продакшена)
		const isTestMode = process.env.TBANK_MODE === 'test'
		const receipt = !isTestMode ? createReceipt(
			userProfile.email,
			plan.display_name,
			amountInKopecks
		) : undefined

		console.log('[Payment Charge] Attempting recurrent charge:', {
			userId,
			orderId,
			rebillId: userProfile.rebill_id,
			amount: amountInKopecks,
			planName: plan.display_name,
		})

		// Пытаемся списать средства
		let chargeResult
		try {
			chargeResult = await chargeRecurrent(
				userProfile.rebill_id,
				orderId,
				amountInKopecks,
				`Продление подписки ${plan.display_name} - ChecklyTool`,
				receipt
			)
		} catch (chargeError) {
			console.error('[Payment Charge] Charge failed:', chargeError)

			// Обрабатываем неудачную попытку списания
			await handlePaymentFailure(supabase, userProfile, plan, chargeError)

			return NextResponse.json(
				{
					error: 'Не удалось списать средства',
					details: chargeError instanceof Error ? chargeError.message : 'Unknown error',
				},
				{ status: 500 }
			)
		}

		// Успешное списание - сохраняем заказ в базу данных
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (supabase as any)
			.from('payment_orders')
			.insert({
				user_id: userId,
				plan_id: plan.id,
				order_id: orderId,
				amount: plan.price,
				status: 'paid',
				payment_id: chargeResult.PaymentId,
				is_recurrent: true,
				rebill_id: userProfile.rebill_id,
			})

		// Продлеваем подписку
		const newExpiresAt = new Date(userProfile.subscription_expires_at)
		newExpiresAt.setDate(newExpiresAt.getDate() + 30)

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (supabase as any)
			.from('user_profiles')
			.update({
				subscription_expires_at: newExpiresAt.toISOString(),
				check_balance: Number(userProfile.check_balance) + Number(plan.check_credits),
				subscription_status: 'active',
				payment_failed_at: null,
				payment_retry_count: 0,
			})
			.eq('user_id', userId)

		// Логируем пополнение кредитов
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (supabase as any).from('check_usage_history').insert({
			user_id: userId,
			check_id: null,
			credits_used: -Number(plan.check_credits),
			description: `Автопродление: подписка ${plan.display_name}`,
		})

		console.log('[Payment Charge] Subscription renewed successfully:', {
			userId,
			newExpiresAt: newExpiresAt.toISOString(),
		})

		// Отправляем email уведомление
		try {
			const { sendPaymentSuccess, logNotification } = await import('@/lib/email')

			await sendPaymentSuccess(
				userProfile.email,
				userProfile.name,
				plan.price,
				newExpiresAt,
				plan.display_name
			)

			await logNotification(
				userId,
				'payment_success',
				newExpiresAt,
				{
					amount: plan.price,
					planName: plan.display_name,
					paymentId: chargeResult.PaymentId,
					isRecurrent: true,
				}
			)
		} catch (emailError) {
			console.error('[Payment Charge] Failed to send email:', emailError)
			// Не прерываем процесс
		}

		return NextResponse.json({
			success: true,
			orderId,
			paymentId: chargeResult.PaymentId,
			newExpiresAt: newExpiresAt.toISOString(),
		})
	} catch (error) {
		console.error('[Payment Charge] Unexpected error:', error)
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
 * Обработка неудачной попытки списания
 */
async function handlePaymentFailure(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	userProfile: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	plan: any,
	error: unknown
) {
	const currentRetryCount = userProfile.payment_retry_count || 0
	const newRetryCount = currentRetryCount + 1

	console.log('[Payment Charge] Handling payment failure:', {
		userId: userProfile.user_id,
		currentRetryCount,
		newRetryCount,
	})

	// Увеличиваем счетчик неудачных попыток
	await supabase
		.from('user_profiles')
		.update({
			payment_failed_at: new Date().toISOString(),
			payment_retry_count: newRetryCount,
		})
		.eq('user_id', userProfile.user_id)

	// Отправляем email уведомление
	try {
		const { sendPaymentFailed, logNotification, sendSubscriptionSuspended } = await import('@/lib/email')

		if (newRetryCount < 2) {
			// Первая неудача - будет повтор через 3 дня
			const retryDate = new Date()
			retryDate.setDate(retryDate.getDate() + 3)

			await sendPaymentFailed(
				userProfile.email,
				userProfile.name,
				plan.price,
				retryDate,
				1 // Осталась 1 попытка
			)

			await logNotification(
				userProfile.user_id,
				'payment_failed',
				new Date(userProfile.subscription_expires_at),
				{
					amount: plan.price,
					retryCount: newRetryCount,
					error: error instanceof Error ? error.message : 'Unknown error',
				}
			)
		} else {
			// Вторая неудача - приостанавливаем подписку и переводим на FREE
			// Получаем ID бесплатного плана
			const { data: freePlan } = await supabase
				.from('subscription_plans')
				.select('id')
				.eq('name', 'FREE')
				.single()

			if (freePlan) {
				await supabase
					.from('user_profiles')
					.update({
						subscription_plan_id: freePlan.id,
						subscription_status: 'suspended',
						check_balance: 0,
					})
					.eq('user_id', userProfile.user_id)

				console.log('[Payment Charge] User moved to FREE plan:', userProfile.user_id)
			}

			await sendSubscriptionSuspended(
				userProfile.email,
				userProfile.name
			)

			await logNotification(
				userProfile.user_id,
				'subscription_suspended',
				new Date(userProfile.subscription_expires_at),
				{
					amount: plan.price,
					retryCount: newRetryCount,
					error: error instanceof Error ? error.message : 'Unknown error',
				}
			)
		}
	} catch (emailError) {
		console.error('[Payment Charge] Failed to send failure notification:', emailError)
	}
}
