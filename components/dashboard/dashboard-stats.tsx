'use client'

import React from 'react'
import { TrendingUp, Users, FileText, Award } from 'lucide-react'

interface DashboardStatsProps {
	totalSubmissions: number
	totalChecks: number
	totalTests: number
}

/**
 * Компонент статистики dashboard в стиле Duolingo
 * Чистый дизайн без избыточных карточек + мотивационный статус
 */
export function DashboardStats({
	totalSubmissions,
	totalChecks,
	totalTests,
}: DashboardStatsProps) {
	// Определяем уровень активности
	const activityLevel = React.useMemo(() => {
		if (totalSubmissions === 0) return 'start'
		if (totalSubmissions < 10) return 'beginner'
		if (totalSubmissions < 50) return 'intermediate'
		return 'expert'
	}, [totalSubmissions])

	const activityConfig = {
		start: {
			title: 'Начало пути',
			color: 'text-slate-600',
			bgColor: 'bg-slate-100',
		},
		beginner: {
			title: 'Новичок',
			color: 'text-blue-600',
			bgColor: 'bg-blue-100',
		},
		intermediate: {
			title: 'Практик',
			color: 'text-purple-600',
			bgColor: 'bg-purple-100',
		},
		expert: {
			title: 'Эксперт',
			color: 'text-amber-600',
			bgColor: 'bg-amber-100',
		},
	}

	const config = activityConfig[activityLevel]

	return (
		<div className="bg-white rounded-[32px] p-6 border-2 border-slate-100">
			{/* Заголовок с бейджем статуса */}
			<div className="flex items-center justify-between mb-5">
				<h2 className="font-nunito font-black text-xl text-slate-800">
					Ваш прогресс
				</h2>
				<div
					className={`${config.bgColor} ${config.color} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5`}
				>
					<Award className="w-3.5 h-3.5" />
					{config.title}
				</div>
			</div>

			{/* Статистика в одну строку */}
			<div className="grid grid-cols-3 gap-6">
				{/* Проверено работ */}
				<div className="text-center">
					<div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-2xl mb-3 mx-auto">
						<Users className="w-6 h-6 text-green-600" />
					</div>
					<p className="font-nunito font-black text-3xl text-slate-800 mb-1">
						{totalSubmissions}
					</p>
					<p className="font-inter text-sm text-slate-600">Работ</p>
				</div>

				{/* Создано проверок */}
				<div className="text-center">
					<div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl mb-3 mx-auto">
						<TrendingUp className="w-6 h-6 text-blue-600" />
					</div>
					<p className="font-nunito font-black text-3xl text-slate-800 mb-1">
						{totalChecks}
					</p>
					<p className="font-inter text-sm text-slate-600">Проверок</p>
				</div>

				{/* Создано тестов */}
				<div className="text-center">
					<div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-2xl mb-3 mx-auto">
						<FileText className="w-6 h-6 text-purple-600" />
					</div>
					<p className="font-nunito font-black text-3xl text-slate-800 mb-1">
						{totalTests}
					</p>
					<p className="font-inter text-sm text-slate-600">Тестов</p>
				</div>
			</div>
		</div>
	)
}
