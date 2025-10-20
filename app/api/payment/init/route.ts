import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { initPayment, createReceipt } from '@/lib/tbank'
import { z } from 'zod'

// Валидация входных данных
const InitPaymentSchema = z.object({
	planId: z.string().uuid(),
})

/**
 * POST /api/payment/init
 * Инициализация платежа через Т-Банк
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

		// Валидация входных данных
		const body = await request.json()
		const validation = InitPaymentSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Некорректные данные запроса', details: validation.error },
				{ status: 400 }
			)
		}

		const { planId } = validation.data
		const userId = session.user.email

		// Создаем Supabase клиент
		const supabase = await createClient()

		// Получаем информацию о плане подписки
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: plan, error: planError } = await (supabase as any)
			.from('subscription_plans')
			.select('*')
			.eq('id', planId)
			.single()

		if (planError || !plan) {
			console.error('[Payment Init] Plan not found:', planError)
			return NextResponse.json(
				{ error: 'План подписки не найден' },
				{ status: 404 }
			)
		}

		// Проверяем, что план активен
		if (!plan.is_active) {
			return NextResponse.json(
				{ error: 'План подписки недоступен' },
				{ status: 400 }
			)
		}

		// Генерируем уникальный ID заказа
		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

		// Сумма в копейках
		const amountInKopecks = Math.round(plan.price * 100)

		// Создаем чек для ФЗ-54 (только для продакшена)
		const isTestMode = process.env.TBANK_MODE === 'test'
		const receipt = !isTestMode ? createReceipt(
			userId,
			plan.display_name,
			amountInKopecks
		) : undefined

		// Получаем базовый URL сайта
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://checklytool.com'

		// Проверяем, является ли URL локальным
		const isLocalhost = siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')

		// Логируем параметры перед отправкой
		const paymentRequest = {
			Amount: amountInKopecks,
			OrderId: orderId,
			Description: `Подписка ${plan.display_name} - ChecklyTool`,
			...(receipt && { Receipt: receipt }),
			DATA: {
				userId,
				planId,
			},
			// URL-ы передаем только если это не localhost (T-Bank не может достучаться до localhost)
			...(!isLocalhost && {
				SuccessURL: `${siteUrl}/dashboard?payment=success`,
				FailURL: `${siteUrl}/dashboard?payment=failed`,
				NotificationURL: `${siteUrl}/api/payment/webhook`,
			}),
		}

		console.log('[Payment Init] Sending request to T-Bank:', {
			mode: process.env.TBANK_MODE,
			hasReceipt: !!receipt,
			hasURLs: !isLocalhost,
			amount: amountInKopecks,
		})

		// Инициализируем платеж в Т-Банк
		let paymentData
		try {
			paymentData = await initPayment(paymentRequest)
		} catch (error) {
			console.error('[Payment Init] T-Bank API error:', error)
			console.error('[Payment Init] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown',
				stack: error instanceof Error ? error.stack : undefined,
			})
			return NextResponse.json(
				{
					error: 'Ошибка при инициализации платежа',
					details: error instanceof Error ? error.message : 'Неизвестная ошибка',
				},
				{ status: 500 }
			)
		}

		// Сохраняем заказ в базу данных
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { error: insertError } = await (supabase as any)
			.from('payment_orders')
			.insert({
				user_id: userId,
				plan_id: planId,
				order_id: orderId,
				amount: plan.price,
				status: 'pending',
				payment_id: paymentData.PaymentId,
				payment_url: paymentData.PaymentURL,
			})

		if (insertError) {
			console.error('[Payment Init] Failed to save order:', insertError)
			// Не прерываем процесс, т.к. платеж уже создан в Т-Банк
			// Можно добавить логирование в внешний сервис
		}

		// Возвращаем данные для редиректа на страницу оплаты
		return NextResponse.json({
			success: true,
			orderId,
			paymentId: paymentData.PaymentId,
			paymentUrl: paymentData.PaymentURL,
			amount: plan.price,
		})
	} catch (error) {
		console.error('[Payment Init] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Произошла непредвиденная ошибка',
				details: error instanceof Error ? error.message : 'Неизвестная ошибка',
			},
			{ status: 500 }
		)
	}
}
