'use client'

import { useState, useEffect } from 'react'
import { X, Zap, Check, Sparkles } from 'lucide-react'
import { Button } from './ui/button'

interface SubscriptionPlan {
	id: string
	name: string
	display_name: string
	check_credits: number
	price: number
	is_active: boolean
}

interface SubscriptionModalProps {
	isOpen: boolean
	onClose: () => void
	message?: string
	requiredCredits?: number
	availableCredits?: number
}

export default function SubscriptionModal({
	isOpen,
	onClose,
	message,
	requiredCredits,
	availableCredits,
}: SubscriptionModalProps) {
	const [plans, setPlans] = useState<SubscriptionPlan[]>([])
	const [loading, setLoading] = useState(true)
	const [processingPayment, setProcessingPayment] = useState(false)

	useEffect(() => {
		if (isOpen) {
			fetchPlans()
		}
	}, [isOpen])

	async function fetchPlans() {
		try {
			const response = await fetch('/api/subscription/plans')
			const data = await response.json()
			setPlans(data.plans || [])
		} catch (error) {
			console.error('Error fetching plans:', error)
		} finally {
			setLoading(false)
		}
	}

	async function handlePayment(planId: string) {
		setProcessingPayment(true)

		try {
			// Инициализация платежа
			const response = await fetch('/api/payment/init', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ planId }),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Ошибка при создании платежа')
			}

			const data = await response.json()

			// Редирект на страницу оплаты Т-Банк
			if (data.paymentUrl) {
				window.location.href = data.paymentUrl
			} else {
				throw new Error('Не получена ссылка на оплату')
			}
		} catch (error) {
			console.error('Payment error:', error)
			alert(
				error instanceof Error
					? error.message
					: 'Произошла ошибка при инициализации платежа'
			)
			setProcessingPayment(false)
		}
	}

	if (!isOpen) return null

	const paidPlans = plans.filter((plan) => plan.name !== 'FREE' && plan.is_active)

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
			></div>

			{/* Modal */}
			<div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="sticky top-0 bg-white border-b px-6 py-6">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							{/* Success Icon */}
							<div className="mb-4 w-14 h-14 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
								<Sparkles className="w-7 h-7 text-white" />
							</div>

							<h2 className="text-3xl font-bold text-gray-900 mb-2">
								Отлично! Ваши работы готовы к проверке
							</h2>

							{requiredCredits !== undefined && availableCredits !== undefined && (
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3 mb-2">
									<div className="flex items-center gap-2 text-blue-900">
										<Zap className="w-4 h-4" />
										<p className="text-sm font-medium">
											Для оценки потребуется <span className="font-bold">{requiredCredits}</span> {requiredCredits === 1 ? 'проверка' : 'проверок'}
										</p>
									</div>
									{availableCredits === 0 && (
										<p className="text-xs text-blue-700 mt-1 ml-6">
											Текущий баланс: {availableCredits} проверок
										</p>
									)}
								</div>
							)}

							<p className="text-gray-600 mt-2">
								{message || 'Выберите подходящий тариф для продолжения работы'}
							</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
						>
							<X className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{paidPlans.map((plan) => (
								<div
									key={plan.id}
									className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-colors"
								>
									<div className="flex items-start justify-between mb-4">
										<div>
											<h3 className="text-xl font-bold text-gray-900">
												{plan.display_name}
											</h3>
											<p className="text-3xl font-bold text-gray-900 mt-2">
												{plan.price.toLocaleString('ru-RU')} ₽
												<span className="text-sm font-normal text-gray-600">
													/мес
												</span>
											</p>
										</div>
										<div className="bg-blue-100 p-2 rounded-lg">
											<Zap className="w-6 h-6 text-blue-600" />
										</div>
									</div>

									<div className="space-y-3 mb-6">
										<div className="flex items-center gap-2 text-gray-700">
											<Check className="w-5 h-5 text-green-600" />
											<span>
												{plan.check_credits} проверок в месяц
											</span>
										</div>
										<div className="flex items-center gap-2 text-gray-700">
											<Check className="w-5 h-5 text-green-600" />
											<span>Тесты (1 лист = 0,5 проверки)</span>
										</div>
										<div className="flex items-center gap-2 text-gray-700">
											<Check className="w-5 h-5 text-green-600" />
											<span>Сочинения (1 лист = 1 проверка)</span>
										</div>
										<div className="flex items-center gap-2 text-gray-700">
											<Check className="w-5 h-5 text-green-600" />
											<span>Неограниченное создание тестов</span>
										</div>
									</div>

									<Button
										className="w-full"
										size="lg"
										onClick={() => handlePayment(plan.id)}
										disabled={processingPayment}
									>
										{processingPayment ? (
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												<span>Обработка...</span>
											</div>
										) : (
											`Выбрать ${plan.display_name}`
										)}
									</Button>
								</div>
							))}
						</div>
					)}

					{/* Info */}
					<div className="mt-6 p-4 bg-blue-50 rounded-lg">
						<p className="text-sm text-gray-700">
							💡 <strong>Обратите внимание:</strong> Создание тестов в
							конструкторе бесплатно и доступно всем пользователям.
							Проверки тратятся только при оценке работ учеников.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
