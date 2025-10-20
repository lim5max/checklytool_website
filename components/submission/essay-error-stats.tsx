'use client'

import { AlertCircle, FileText, MessageCircle, Type } from 'lucide-react'

interface ErrorStats {
	spelling_errors?: number
	punctuation_errors?: number
	grammar_errors?: number
	speech_errors?: number
	syntax_errors?: number
	total_errors?: number
}

interface EssayErrorStatsProps {
	errors: ErrorStats
}

export function EssayErrorStats({ errors }: EssayErrorStatsProps) {
	const errorTypes = [
		{
			type: 'spelling',
			label: 'Орфографические',
			count: errors.spelling_errors || 0,
			icon: Type,
			color: 'blue',
			bgGradient: 'from-blue-50 to-indigo-50',
			borderColor: 'border-blue-200',
			iconBg: 'bg-blue-500',
			textColor: 'text-blue-900',
			countColor: 'text-blue-700'
		},
		{
			type: 'punctuation',
			label: 'Пунктуационные',
			count: errors.punctuation_errors || 0,
			icon: MessageCircle,
			color: 'purple',
			bgGradient: 'from-purple-50 to-pink-50',
			borderColor: 'border-purple-200',
			iconBg: 'bg-purple-500',
			textColor: 'text-purple-900',
			countColor: 'text-purple-700'
		},
		{
			type: 'grammar',
			label: 'Грамматические',
			count: errors.grammar_errors || 0,
			icon: FileText,
			color: 'orange',
			bgGradient: 'from-orange-50 to-amber-50',
			borderColor: 'border-orange-200',
			iconBg: 'bg-orange-500',
			textColor: 'text-orange-900',
			countColor: 'text-orange-700'
		},
		{
			type: 'speech',
			label: 'Речевые',
			count: errors.speech_errors || 0,
			icon: MessageCircle,
			color: 'teal',
			bgGradient: 'from-teal-50 to-cyan-50',
			borderColor: 'border-teal-200',
			iconBg: 'bg-teal-500',
			textColor: 'text-teal-900',
			countColor: 'text-teal-700'
		},
		{
			type: 'syntax',
			label: 'Синтаксические',
			count: errors.syntax_errors || 0,
			icon: AlertCircle,
			color: 'rose',
			bgGradient: 'from-rose-50 to-red-50',
			borderColor: 'border-rose-200',
			iconBg: 'bg-rose-500',
			textColor: 'text-rose-900',
			countColor: 'text-rose-700'
		}
	]

	const totalErrors = errors.total_errors || 0

	return (
		<div className="space-y-6">
			{/* Общая статистика */}
			<div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-slate-200 p-8 text-center">
				<div className="inline-flex items-center justify-center w-20 h-20 bg-slate-500 rounded-full mb-4">
					<AlertCircle className="w-10 h-10 text-white" />
				</div>
				<div className="text-5xl font-black text-slate-900 mb-2">
					{totalErrors}
				</div>
				<p className="text-lg font-semibold text-slate-600">
					{totalErrors === 0 && 'Ошибок не обнаружено'}
					{totalErrors === 1 && 'Ошибка'}
					{totalErrors > 1 && totalErrors < 5 && 'Ошибки'}
					{totalErrors >= 5 && 'Ошибок'}
				</p>
			</div>

			{/* Детальная статистика по типам */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{errorTypes.map((errorType) => {
					const Icon = errorType.icon

					return (
						<div
							key={errorType.type}
							className={`bg-gradient-to-br ${errorType.bgGradient} rounded-2xl border-2 ${errorType.borderColor} p-6 transition-all hover:shadow-lg hover:scale-105`}
						>
							<div className="flex items-start gap-4">
								<div className={`w-12 h-12 ${errorType.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
									<Icon className="w-6 h-6 text-white" />
								</div>
								<div className="flex-1">
									<h3 className={`font-bold text-lg ${errorType.textColor} mb-1`}>
										{errorType.label}
									</h3>
									<div className={`text-3xl font-black ${errorType.countColor}`}>
										{errorType.count}
									</div>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Процент от общего числа ошибок - если есть ошибки */}
			{totalErrors > 0 && (
				<div className="bg-white rounded-2xl border border-slate-200 p-6">
					<h3 className="font-semibold text-lg text-slate-900 mb-4">
						Распределение ошибок
					</h3>
					<div className="space-y-3">
						{errorTypes.filter(et => et.count > 0).map((errorType) => {
							const percentage = totalErrors > 0
								? Math.round((errorType.count / totalErrors) * 100)
								: 0

							return (
								<div key={errorType.type}>
									<div className="flex items-center justify-between mb-1">
										<span className="text-sm font-medium text-slate-700">
											{errorType.label}
										</span>
										<span className="text-sm font-semibold text-slate-900">
											{errorType.count} ({percentage}%)
										</span>
									</div>
									<div className="w-full bg-slate-100 rounded-full h-2.5">
										<div
											className={`${errorType.iconBg} h-2.5 rounded-full transition-all duration-500`}
											style={{ width: `${percentage}%` }}
										/>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
