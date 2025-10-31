import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Валидация входных данных
const SendReminderSchema = z.object({
	userId: z.string(),
	email: z.string().email(),
	userName: z.string().nullable(),
	amount: z.number(),
	renewalDate: z.string(), // ISO date string
	planName: z.string(),
	subscriptionExpiresAt: z.string(), // ISO date string
})

/**
 * POST /api/notifications/send-reminder
 * Отправка email напоминания о предстоящем списании (за 1 день)
 *
 * Этот endpoint защищен API ключом и вызывается только из Supabase функции
 */
export async function POST(request: NextRequest) {
	try {
		// Проверка API ключа
		const apiKey = request.headers.get('x-api-key')
		const expectedApiKey = process.env.SUBSCRIPTION_RENEWAL_API_KEY

		if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
			console.error('[Send Reminder] Invalid or missing API key')
			return NextResponse.json(
				{ error: 'Unauthorized' },
				{ status: 401 }
			)
		}

		// Валидация входных данных
		const body = await request.json()
		const validation = SendReminderSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Некорректные данные запроса', details: validation.error },
				{ status: 400 }
			)
		}

		const {
			userId,
			email,
			userName,
			amount,
			renewalDate,
			planName,
			subscriptionExpiresAt,
		} = validation.data

		console.log('[Send Reminder] Sending renewal reminder:', {
			userId,
			email,
			amount,
			renewalDate,
		})

		// Отправляем email напоминание
		const { sendRenewalReminder, logNotification } = await import('@/lib/email')

		await sendRenewalReminder(
			email,
			userName,
			amount,
			new Date(renewalDate)
		)

		// Логируем отправленное уведомление
		await logNotification(
			userId,
			'renewal_reminder',
			new Date(subscriptionExpiresAt),
			{
				amount,
				planName,
				renewalDate,
			}
		)

		console.log('[Send Reminder] Reminder sent successfully:', email)

		return NextResponse.json({
			success: true,
			message: 'Reminder sent successfully',
			email,
		})
	} catch (error) {
		console.error('[Send Reminder] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Произошла непредвиденная ошибка при отправке напоминания',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		)
	}
}
