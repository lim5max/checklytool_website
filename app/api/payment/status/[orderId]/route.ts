import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/payment/status/[orderId]
 * Получение статуса платежа по ID заказа
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ orderId: string }> }
) {
	try {
		// Проверка аутентификации
		const session = await auth()
		if (!session?.user?.email) {
			return NextResponse.json(
				{ error: 'Необходима авторизация' },
				{ status: 401 }
			)
		}

		const { orderId } = await params

		if (!orderId) {
			return NextResponse.json(
				{ error: 'ID заказа не указан' },
				{ status: 400 }
			)
		}

		// Создаем Supabase клиент
		const supabase = await createClient()
		const userId = session.user.email

		// Получаем информацию о заказе
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: order, error: orderError } = await (supabase as any)
			.from('payment_orders')
			.select('*')
			.eq('order_id', orderId)
			.eq('user_id', userId) // Проверяем, что заказ принадлежит текущему пользователю
			.single()

		if (orderError || !order) {
			console.error('[Payment Status] Order not found:', orderError)
			return NextResponse.json(
				{ error: 'Заказ не найден' },
				{ status: 404 }
			)
		}

		// Возвращаем информацию о заказе
		return NextResponse.json({
			orderId: order.order_id,
			status: order.status,
			amount: order.amount,
			paymentId: order.payment_id,
			createdAt: order.created_at,
			updatedAt: order.updated_at,
		})
	} catch (error) {
		console.error('[Payment Status] Unexpected error:', error)
		return NextResponse.json(
			{
				error: 'Произошла непредвиденная ошибка',
				details: error instanceof Error ? error.message : 'Неизвестная ошибка',
			},
			{ status: 500 }
		)
	}
}
