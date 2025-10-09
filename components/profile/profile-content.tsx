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
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="bg-white">
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
							<h1 className="font-nunito font-black text-4xl text-slate-900">
								{userProfile.name || 'Пользователь'}
							</h1>
							<p className="text-slate-600 mt-2 text-lg">{userProfile.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Balance Card - Airbnb Style */}
				<div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
					{/* Balance Section */}
					<div className="p-8 md:p-12">
						<div className="flex items-start justify-between mb-8">
							<div>
								<p className="text-slate-500 text-sm font-medium mb-3">
									Доступно проверок
								</p>
								<p className="text-6xl md:text-7xl font-black text-slate-900">
									{userProfile.check_balance ?? 0}
								</p>
							</div>
							<div className="bg-blue-50 p-4 rounded-2xl">
								<Zap className="w-8 h-8 text-blue-600" />
							</div>
						</div>

						{/* Info Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-100">
							<div className="flex items-start gap-4">
								<div className="bg-green-50 p-3 rounded-xl flex-shrink-0">
									<Check className="w-5 h-5 text-green-600" />
								</div>
								<div>
									<p className="font-semibold text-slate-900">Тест (1 лист)</p>
									<p className="text-sm text-slate-500 mt-1">0,5 проверки за страницу</p>
								</div>
							</div>
							<div className="flex items-start gap-4">
								<div className="bg-purple-50 p-3 rounded-xl flex-shrink-0">
									<Check className="w-5 h-5 text-purple-600" />
								</div>
								<div>
									<p className="font-semibold text-slate-900">Сочинение (1 лист)</p>
									<p className="text-sm text-slate-500 mt-1">1 проверка за страницу</p>
								</div>
							</div>
						</div>
					</div>

					{/* Current Plan Section */}
					<div className="px-8 md:px-12 py-6 bg-slate-50 border-t border-slate-200">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
							<div>
								<p className="text-sm text-slate-500 mb-1">Текущая подписка</p>
								<p className="text-xl font-bold text-slate-900">
									{userProfile.subscription_plan_id
										? 'Plus / Pro'
										: 'Бесплатный тариф'}
								</p>
								{userProfile.subscription_expires_at && (
									<p className="text-sm text-slate-600 mt-2">
										{isExpired ? '⚠️ Истекла ' : '📅 Активна до '}
										{formatDate(userProfile.subscription_expires_at)}
									</p>
								)}
							</div>
							{isExpired && (
								<Link href="#plans">
									<Button
										size="lg"
										className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8"
									>
										Продлить подписку
									</Button>
								</Link>
							)}
						</div>
					</div>
				</div>

				{/* Stats - Airbnb Style */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
					<div className="bg-white rounded-3xl border border-slate-200 p-8">
						<div className="flex items-start gap-4">
							<div className="bg-green-50 p-4 rounded-2xl">
								<TrendingUp className="w-6 h-6 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-slate-500 font-medium mb-2">Всего проверок</p>
								<p className="text-4xl font-black text-slate-900">
									{userProfile.total_checks ?? 0}
								</p>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-3xl border border-slate-200 p-8">
						<div className="flex items-start gap-4">
							<div className="bg-purple-50 p-4 rounded-2xl">
								<Calendar className="w-6 h-6 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-slate-500 font-medium mb-2">С нами с</p>
								<p className="text-xl font-bold text-slate-900">
									{formatDate(userProfile.created_at) || 'Сегодня'}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Available Plans */}
				<div id="plans" className="mt-16">
					<h2 className="font-nunito font-black text-4xl text-slate-900 mb-8">
						Выберите тариф
					</h2>
					<p className="text-lg text-slate-600 mb-8">
						Начните проверять работы студентов с помощью ИИ
					</p>
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

				return (
					<div
						key={plan.id}
						className={`bg-white rounded-3xl border-2 p-8 md:p-10 transition-all duration-300 hover:shadow-xl ${
							isPopular
								? 'border-slate-900 shadow-lg'
								: 'border-slate-200 hover:border-slate-300'
						}`}
					>
						{isPopular && (
							<div className="inline-block bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-full mb-6">
								⭐ Популярный
							</div>
						)}

						<div className="mb-8">
							<h3 className="font-nunito font-black text-3xl text-slate-900 mb-4">
								{plan.display_name}
							</h3>
							<div className="flex items-baseline gap-2">
								<span className="text-5xl font-black text-slate-900">
									{plan.price.toLocaleString('ru-RU')}
								</span>
								<span className="text-xl text-slate-500">₽/мес</span>
							</div>
						</div>

						<ul className="space-y-4 mb-8">
							<li className="flex items-start gap-3">
								<div className="bg-green-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
									<Check className="w-4 h-4 text-green-600" />
								</div>
								<span className="text-slate-700 font-medium">
									<span className="font-bold text-slate-900">
										{plan.check_credits}
									</span>{' '}
									проверок в месяц
								</span>
							</li>
							<li className="flex items-start gap-3">
								<div className="bg-green-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
									<Check className="w-4 h-4 text-green-600" />
								</div>
								<span className="text-slate-700 font-medium">
									Тесты и сочинения
								</span>
							</li>
							<li className="flex items-start gap-3">
								<div className="bg-green-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
									<Check className="w-4 h-4 text-green-600" />
								</div>
								<span className="text-slate-700 font-medium">
									ИИ-оценка работ
								</span>
							</li>
							<li className="flex items-start gap-3">
								<div className="bg-green-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
									<Check className="w-4 h-4 text-green-600" />
								</div>
								<span className="text-slate-700 font-medium">
									Детальная статистика
								</span>
							</li>
							{isPopular && (
								<li className="flex items-start gap-3">
									<div className="bg-purple-50 p-1.5 rounded-full flex-shrink-0 mt-0.5">
										<Check className="w-4 h-4 text-purple-600" />
									</div>
									<span className="text-slate-700 font-medium">
										Приоритетная поддержка
									</span>
								</li>
							)}
						</ul>

						<Button
							className={`w-full py-6 text-lg font-bold rounded-2xl transition-all duration-300 ${
								isPopular
									? 'bg-slate-900 hover:bg-slate-800 text-white'
									: 'bg-slate-100 hover:bg-slate-200 text-slate-900'
							}`}
							onClick={() => onSelectPlan(plan.id)}
							disabled={processingPlanId !== null}
						>
							{processingPlanId === plan.id ? (
								<div className="flex items-center justify-center gap-2">
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									<span>Обработка...</span>
								</div>
							) : (
								`Выбрать ${plan.display_name}`
							)}
						</Button>
					</div>
				)
			})}
		</div>
	)
}
