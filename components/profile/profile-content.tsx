'use client'

import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { User, Zap, Check, TrendingUp, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { UserProfile as UserProfileType } from '../../types/check'

interface ProfileContentProps {
	userProfile: UserProfileType
}

interface SubscriptionPlan {
	id: string
	name: string
	display_name: string
	check_credits: number
	price: number
	is_active: boolean
}

export default function ProfileContent({ userProfile }: ProfileContentProps) {
	const [processingPayment, setProcessingPayment] = useState<string | null>(null)

	const formatDate = (dateString: string | null) => {
		if (!dateString) return null
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		})
	}

	const isExpired =
		userProfile.subscription_expires_at &&
		new Date(userProfile.subscription_expires_at) < new Date()

	async function handlePayment(planId: string) {
		setProcessingPayment(planId)

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
			setProcessingPayment(null)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex items-center gap-6">
						<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
							{userProfile.avatar_url ? (
								<Image
									src={userProfile.avatar_url}
									alt={userProfile.name || 'Аватар'}
									width={80}
									height={80}
									className="w-full h-full rounded-2xl object-cover"
								/>
							) : (
								<User className="w-10 h-10 text-white" />
							)}
						</div>
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-900">
								{userProfile.name || 'Пользователь'}
							</h1>
							<p className="text-gray-600 mt-1">{userProfile.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Balance Card */}
				<Card className="overflow-hidden">
					<div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-blue-100 text-sm font-medium">
									Доступно проверок
								</p>
								<p className="text-5xl font-bold mt-2">
									{userProfile.check_balance}
								</p>
							</div>
							<div className="bg-white/20 p-3 rounded-xl backdrop-blur">
								<Zap className="w-7 h-7" />
							</div>
						</div>

						<div className="mt-8 pt-6 border-t border-white/20">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-blue-100">Тест (1 лист)</p>
									<p className="font-semibold mt-1">0,5 проверки</p>
								</div>
								<div>
									<p className="text-blue-100">Сочинение (1 лист)</p>
									<p className="font-semibold mt-1">1 проверка</p>
								</div>
							</div>
						</div>
					</div>

					{/* Current Plan */}
					{userProfile.subscription_plan_id && (
						<div className="p-6 bg-gray-50 border-t">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm text-gray-600">Текущая подписка</p>
									<p className="font-semibold text-gray-900 mt-1">
										{userProfile.subscription_plan_id
											? 'Plus / Pro'
											: 'Бесплатный тариф'}
									</p>
									{userProfile.subscription_expires_at && (
										<p className="text-sm text-gray-500 mt-1">
											{isExpired ? 'Истекла ' : 'До '}
											{formatDate(userProfile.subscription_expires_at)}
										</p>
									)}
								</div>
								{isExpired && (
									<Link href="#plans">
										<Button size="sm">Продлить</Button>
									</Link>
								)}
							</div>
						</div>
					)}
				</Card>

				{/* Stats */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
					<Card className="p-6">
						<div className="flex items-center gap-3">
							<div className="bg-green-100 p-3 rounded-xl">
								<TrendingUp className="w-5 h-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Всего проверок</p>
								<p className="text-2xl font-bold text-gray-900 mt-1">
									{userProfile.total_checks}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-6">
						<div className="flex items-center gap-3">
							<div className="bg-purple-100 p-3 rounded-xl">
								<Calendar className="w-5 h-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">С нами с</p>
								<p className="text-lg font-semibold text-gray-900 mt-1">
									{formatDate(userProfile.created_at)}
								</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Available Plans */}
				<div id="plans" className="mt-12">
					<h2 className="text-2xl font-bold text-gray-900 mb-6">
						Доступные тарифы
					</h2>
					<SubscriptionPlans
						currentPlanId={userProfile.subscription_plan_id}
						onSelectPlan={handlePayment}
						processingPlanId={processingPayment}
					/>
				</div>
			</div>
		</div>
	)
}

// Subscription Plans Component
function SubscriptionPlans({
	onSelectPlan,
	processingPlanId,
}: {
	currentPlanId?: string | null
	onSelectPlan: (planId: string) => void
	processingPlanId: string | null
}) {
	const [plans, setPlans] = useState<SubscriptionPlan[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchPlans()
	}, [])

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

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
			</div>
		)
	}

	const paidPlans = plans.filter((plan) => plan.name !== 'FREE' && plan.is_active)

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{paidPlans.map((plan, index) => {
				const isPopular = index === 1 // Второй план (Pro) - популярный
				const colors = [
					'from-blue-500 to-blue-600',
					'from-purple-500 to-purple-600',
				]

				return (
					<Card
						key={plan.id}
						className={`relative overflow-hidden ${isPopular ? 'ring-2 ring-purple-500' : ''}`}
					>
						{isPopular && (
							<div className="absolute top-4 right-4">
								<span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
									Популярный
								</span>
							</div>
						)}

						<div className="p-8">
							<h3 className="text-2xl font-bold text-gray-900">
								{plan.display_name}
							</h3>
							<div className="mt-4 flex items-baseline">
								<span className="text-4xl font-bold text-gray-900">
									{plan.price.toLocaleString('ru-RU')} ₽
								</span>
								<span className="ml-2 text-gray-600">/мес</span>
							</div>

							<ul className="mt-6 space-y-3">
								<li className="flex items-center gap-3">
									<Check className="w-5 h-5 text-green-600 flex-shrink-0" />
									<span className="text-gray-700">
										{plan.check_credits} проверок/мес
									</span>
								</li>
								<li className="flex items-center gap-3">
									<Check className="w-5 h-5 text-green-600 flex-shrink-0" />
									<span className="text-gray-700">Все типы тестов</span>
								</li>
								<li className="flex items-center gap-3">
									<Check className="w-5 h-5 text-green-600 flex-shrink-0" />
									<span className="text-gray-700">AI-оценка</span>
								</li>
								{isPopular && (
									<li className="flex items-center gap-3">
										<Check className="w-5 h-5 text-green-600 flex-shrink-0" />
										<span className="text-gray-700">
											Приоритетная поддержка
										</span>
									</li>
								)}
							</ul>

							<Button
								className={`w-full mt-8 bg-gradient-to-r ${colors[index] || colors[0]} hover:opacity-90`}
								size="lg"
								onClick={() => onSelectPlan(plan.id)}
								disabled={processingPlanId !== null}
							>
								{processingPlanId === plan.id ? (
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										<span>Обработка...</span>
									</div>
								) : (
									`Выбрать ${plan.display_name}`
								)}
							</Button>
						</div>
					</Card>
				)
			})}
		</div>
	)
}
