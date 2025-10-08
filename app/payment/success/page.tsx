'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2, XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

function PaymentSuccessContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
	const [message, setMessage] = useState('')

	const checkPaymentStatus = useCallback(async (orderId: string) => {
		try {
			const response = await fetch(`/api/payment/status/${orderId}`)
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка при проверке статуса')
			}

			if (data.status === 'paid') {
				setStatus('success')
				setMessage('Оплата прошла успешно! Подписка активирована.')
			} else if (data.status === 'failed') {
				setStatus('error')
				setMessage('Оплата не прошла. Попробуйте еще раз.')
			} else if (data.status === 'cancelled') {
				setStatus('error')
				setMessage('Оплата была отменена.')
			} else {
				setStatus('loading')
				setMessage('Ожидаем подтверждение платежа...')
				// Повторная проверка через 3 секунды
				setTimeout(() => checkPaymentStatus(orderId), 3000)
			}
		} catch (error) {
			console.error('Error checking payment status:', error)
			setStatus('error')
			setMessage(
				error instanceof Error
					? error.message
					: 'Не удалось проверить статус оплаты'
			)
		}
	}, [])

	useEffect(() => {
		// Получаем параметры из URL
		const orderId = searchParams.get('orderId')
		const success = searchParams.get('Success')

		if (!orderId) {
			setStatus('error')
			setMessage('Не удалось определить заказ')
			return
		}

		// Если параметр Success присутствует, это редирект от Т-Банк
		if (success === 'true') {
			setStatus('success')
			setMessage('Оплата прошла успешно! Подписка активирована.')
		} else if (success === 'false') {
			setStatus('error')
			setMessage('Оплата не прошла. Попробуйте еще раз.')
		} else {
			// Если параметра Success нет, проверяем статус заказа через API
			checkPaymentStatus(orderId)
		}
	}, [searchParams, checkPaymentStatus])

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				{status === 'loading' && (
					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Обработка платежа
						</h1>
						<p className="text-gray-600">{message || 'Пожалуйста, подождите...'}</p>
					</div>
				)}

				{status === 'success' && (
					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<CheckCircle className="w-16 h-16 text-green-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Оплата прошла успешно!
						</h1>
						<p className="text-gray-600 mb-6">{message}</p>
						<div className="space-y-3">
							<Button
								className="w-full"
								onClick={() => router.push('/dashboard')}
							>
								Перейти в личный кабинет
							</Button>
							<Button
								variant="outline"
								className="w-full"
								onClick={() => router.push('/dashboard/profile')}
							>
								Посмотреть подписку
							</Button>
						</div>
					</div>
				)}

				{status === 'error' && (
					<div className="text-center">
						<div className="mb-4 flex justify-center">
							<XCircle className="w-16 h-16 text-red-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Ошибка оплаты
						</h1>
						<p className="text-gray-600 mb-6">{message}</p>
						<div className="space-y-3">
							<Button
								className="w-full"
								onClick={() => router.push('/dashboard')}
							>
								<ArrowLeft className="w-4 h-4 mr-2" />
								Вернуться в личный кабинет
							</Button>
							<Button
								variant="outline"
								className="w-full"
								onClick={() => router.push('/dashboard/profile')}
							>
								Попробовать снова
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default function PaymentSuccessPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
			</div>
		}>
			<PaymentSuccessContent />
		</Suspense>
	)
}
