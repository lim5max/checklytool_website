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

			{/* Modal - Airbnb style */}
			<div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
				{/* Compact Header - Fixed at top */}
				<div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
							<Sparkles className="w-5 h-5 text-white" />
						</div>
						<div>
							<h2 className="text-lg font-bold text-gray-900">
								Работы готовы к проверке
							</h2>
							{requiredCredits !== undefined && (
								<p className="text-sm text-gray-600">
									Нужно {requiredCredits} {requiredCredits === 1 ? 'проверка' : 'проверок'}
								</p>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
						aria-label="Закрыть"
					>
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				{/* Scrollable Content */}
				<div className="overflow-y-auto flex-1 px-6 py-6">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
						</div>
					) : (
						<div className="space-y-4">
							{/* Balance info if needed */}
							{availableCredits !== undefined && availableCredits === 0 && (
								<div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
									<div className="flex items-start gap-3">
										<Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
										<div>
											<p className="text-sm font-semibold text-amber-900">
												Баланс проверок исчерпан
											</p>
											<p className="text-xs text-amber-700 mt-1">
												Выберите тариф, чтобы продолжить работу
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Plans */}
							{paidPlans.map((plan, index) => (
								<div
									key={plan.id}
									className={`border-2 rounded-xl p-5 hover:border-blue-500 hover:shadow-md transition-all ${
										index === 0 ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200'
									}`}
								>
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-xl font-bold text-gray-900">
													{plan.display_name}
												</h3>
												{index === 0 && (
													<span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
														Популярный
													</span>
												)}
											</div>
											<p className="text-2xl font-bold text-gray-900">
												{plan.price.toLocaleString('ru-RU')} ₽
												<span className="text-sm font-normal text-gray-600">
													/мес
												</span>
											</p>
										</div>
										<div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
											<Zap className="w-5 h-5 text-blue-600" />
										</div>
									</div>

									<div className="space-y-2.5 mb-5">
										<div className="flex items-start gap-2.5 text-sm text-gray-700">
											<Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
											<span>
												{plan.check_credits} проверок в месяц
											</span>
										</div>
										<div className="flex items-start gap-2.5 text-sm text-gray-700">
											<Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
											<span>Тесты (1 лист = 0,5 проверки)</span>
										</div>
										<div className="flex items-start gap-2.5 text-sm text-gray-700">
											<Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
											<span>Сочинения (1 лист = 1 проверка)</span>
										</div>
										<div className="flex items-start gap-2.5 text-sm text-gray-700">
											<Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
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

							{/* Info */}
							<div className="p-4 bg-blue-50 rounded-xl">
								<p className="text-sm text-gray-700 leading-relaxed">
									💡 <strong>Обратите внимание:</strong> Создание тестов в
									конструкторе бесплатно и доступно всем пользователям.
									Проверки тратятся только при оценке работ учеников.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
