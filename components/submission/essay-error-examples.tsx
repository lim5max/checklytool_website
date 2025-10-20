'use client'

import { useState } from 'react'
import {
	AlertCircle,
	FileText,
	MessageCircle,
	Type
} from 'lucide-react'

interface EssayErrorExamplesProps {
	examples: string[]
}

export function EssayErrorExamples({ examples }: EssayErrorExamplesProps) {
	const [isExpanded, setIsExpanded] = useState(false)

	if (!examples || examples.length === 0) {
		return null
	}

	// Группируем ошибки по типам
	const groupedErrors = examples.reduce((acc, example) => {
		const parts = example.split(' - ')
		const type = parts[0]?.trim().toLowerCase()

		if (!acc[type]) {
			acc[type] = []
		}

		acc[type].push(parts.slice(1).join(' - ').trim())
		return acc
	}, {} as Record<string, string[]>)

	const errorTypeConfig: Record<string, {
		label: string
		icon: typeof Type
		color: string
		bgColor: string
		borderColor: string
		iconBg: string
	}> = {
		'орфографическая': {
			label: 'Орфографические ошибки',
			icon: Type,
			color: 'text-blue-900',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			iconBg: 'bg-blue-500'
		},
		'пунктуационная': {
			label: 'Пунктуационные ошибки',
			icon: MessageCircle,
			color: 'text-purple-900',
			bgColor: 'bg-purple-50',
			borderColor: 'border-purple-200',
			iconBg: 'bg-purple-500'
		},
		'грамматическая': {
			label: 'Грамматические ошибки',
			icon: FileText,
			color: 'text-orange-900',
			bgColor: 'bg-orange-50',
			borderColor: 'border-orange-200',
			iconBg: 'bg-orange-500'
		},
		'речевая': {
			label: 'Речевые ошибки',
			icon: MessageCircle,
			color: 'text-teal-900',
			bgColor: 'bg-teal-50',
			borderColor: 'border-teal-200',
			iconBg: 'bg-teal-500'
		},
		'синтаксическая': {
			label: 'Синтаксические ошибки',
			icon: AlertCircle,
			color: 'text-rose-900',
			bgColor: 'bg-rose-50',
			borderColor: 'border-rose-200',
			iconBg: 'bg-rose-500'
		}
	}

	return (
		<div className="space-y-4">
			{/* Группированные ошибки */}
			{Object.entries(groupedErrors).map(([type, errors]) => {
				const config = errorTypeConfig[type] || {
					label: type,
					icon: AlertCircle,
					color: 'text-slate-900',
					bgColor: 'bg-slate-50',
					borderColor: 'border-slate-200',
					iconBg: 'bg-slate-500'
				}

				const Icon = config.icon

				return (
					<div
						key={type}
						className={`${config.bgColor} rounded-2xl border-2 ${config.borderColor} p-6`}
					>
						<div className="flex items-center gap-3 mb-4">
							<div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
								<Icon className="w-5 h-5 text-white" />
							</div>
							<div>
								<h3 className={`font-bold text-lg ${config.color}`}>
									{config.label}
								</h3>
								<p className="text-sm text-slate-600">
									{errors.length} {errors.length === 1 ? 'ошибка' : 'ошибок'}
								</p>
							</div>
						</div>

						<div className="space-y-2">
							{errors.slice(0, isExpanded ? errors.length : 3).map((error, idx) => (
								<div
									key={idx}
									className="bg-white rounded-xl border border-slate-200 p-4"
								>
									<p className="text-slate-700 leading-relaxed">
										{error}
									</p>
								</div>
							))}

							{errors.length > 3 && !isExpanded && (
								<div className="text-center pt-2">
									<button
										onClick={() => setIsExpanded(true)}
										className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
									>
										Ещё {errors.length - 3} {errors.length - 3 === 1 ? 'ошибка' : 'ошибок'}...
									</button>
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
