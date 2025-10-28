import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookToken, type TBankWebhookPayload } from '@/lib/tbank'

/**
 * POST /api/payment/webhook
 * Обработка уведомлений от Т-Банк о статусе платежа
 */
export async function POST(request: NextRequest) {
	try {
		// Парсим тело запроса
		const payload: TBankWebhookPayload = await request.json()

		// ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ: Весь payload от T-Bank
		console.log('[Payment Webhook] FULL PAYLOAD:', JSON.stringify(payload, null, 2))

		console.log('[Payment Webhook] Received payload:', {
			orderId: payload.OrderId,
			status: payload.Status,
			success: payload.Success,
			rebillId: payload.RebillId, // Проверяем RebillId
		})

		// Проверяем подпись webhook
		const isValidSignature = verifyWebhookToken(payload)

		if (!isValidSignature) {
			console.error('[Payment Webhook] Invalid signature')
			return NextResponse.json(
				{ error: 'Invalid signature' },
				{ status: 403 }
			)
		}

		// Создаем Supabase клиент
		const supabase = await createClient()

		// Получаем заказ из базы данных
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: order, error: orderError } = await (supabase as any)
			.from('payment_orders')
			.select('*')
			.eq('order_id', payload.OrderId)
			.single()

		if (orderError || !order) {
			console.error('[Payment Webhook] Order not found:', payload.OrderId)
			return NextResponse.json(
				{ error: 'Order not found' },
				{ status: 404 }
			)
		}

		// Определяем новый статус заказа на основе статуса платежа
		let newStatus: 'pending' | 'paid' | 'failed' | 'cancelled' = 'pending'

		// Статусы успешной оплаты
		if (payload.Status === 'CONFIRMED' && payload.Success) {
			newStatus = 'paid'
		}
		// Статусы отмены/ошибки
		else if (['REJECTED', 'DEADLINE_EXPIRED', 'CANCELED', 'AUTH_FAIL', 'ATTEMPTS_EXPIRED'].includes(payload.Status)) {
			newStatus = 'failed'
		}
		// Статус отмены пользователем
		else if (payload.Status === 'CANCELED') {
			newStatus = 'cancelled'
		}

		// Обновляем статус заказа
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { error: updateError } = await (supabase as any)
			.from('payment_orders')
			.update({
				status: newStatus,
				payment_id: payload.PaymentId,
			})
			.eq('order_id', payload.OrderId)

		if (updateError) {
			console.error('[Payment Webhook] Failed to update order:', updateError)
			return NextResponse.json(
				{ error: 'Failed to update order' },
				{ status: 500 }
			)
		}

		// Если оплата успешна, активируем подписку
		if (newStatus === 'paid') {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { data: plan } = await (supabase as any)
				.from('subscription_plans')
				.select('check_credits, display_name')
				.eq('id', order.plan_id)
				.single()

			if (plan) {
				// Вычисляем дату окончания подписки (30 дней)
				const durationDays = 30
				const expiresAt = new Date()
				expiresAt.setDate(expiresAt.getDate() + durationDays)

				// Обновляем профиль пользователя
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const { error: profileError } = await (supabase as any)
					.from('user_profiles')
					.update({
						subscription_plan_id: order.plan_id,
						subscription_expires_at: expiresAt.toISOString(),
						check_balance: Number(plan.check_credits) || 0,
						// Рекуррентные платежи
						rebill_id: payload.RebillId || null,
						customer_key: order.user_id,
						subscription_status: 'active',
						subscription_auto_renew: true, // Включаем автопродление для новых подписок
						// Сбрасываем счетчики ошибок
						payment_failed_at: null,
						payment_retry_count: 0,
					})
					.eq('user_id', order.user_id)

				if (profileError) {
					console.error('[Payment Webhook] Failed to activate subscription:', profileError)
					// Не возвращаем ошибку, т.к. платеж уже прошел
					// Можно добавить логирование для ручной обработки
				} else {
					console.log('[Payment Webhook] Subscription activated for user:', order.user_id, {
						rebillId: payload.RebillId,
						autoRenew: true,
						expiresAt: expiresAt.toISOString(),
					})

					// Логируем использование кредитов (добавление баланса)
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					await (supabase as any).from('check_usage_history').insert({
						user_id: order.user_id,
						check_id: null, // Это пополнение, а не использование
						credits_used: -(Number(plan.check_credits) || 0), // Отрицательное значение = пополнение
						description: `Пополнение: подписка ${order.plan_id}`,
					})

					// Отправляем email уведомление об успешной оплате
					try {
						// Динамический импорт для избежания ошибок при отсутствии nodemailer
						const { sendPaymentSuccess, logNotification } = await import('@/lib/email')

						// Получаем данные пользователя для email
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const { data: userProfile } = await (supabase as any)
							.from('user_profiles')
							.select('email, name')
							.eq('user_id', order.user_id)
							.single()

						if (userProfile?.email) {
							await sendPaymentSuccess(
								userProfile.email,
								userProfile.name,
								order.amount,
								expiresAt,
								plan.display_name
							)

							// Логируем отправленное уведомление
							await logNotification(
								order.user_id,
								'payment_success',
								expiresAt,
								{
									amount: order.amount,
									planName: plan.display_name,
									paymentId: payload.PaymentId,
								}
							)
						}
					} catch (emailError) {
						console.error('[Payment Webhook] Failed to send email notification:', emailError)
						// Не прерываем процесс, т.к. платеж уже прошел
					}
				}
			}
		}

		console.log('[Payment Webhook] Order updated successfully:', {
			orderId: payload.OrderId,
			newStatus,
		})

		// Возвращаем OK для Т-Банк
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('[Payment Webhook] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
