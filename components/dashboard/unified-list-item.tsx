'use client'

import { memo } from 'react'
import { ChevronRight, FileCheck, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

type ItemType = 'check' | 'test'

interface UnifiedListItemProps {
	id: string
	title: string
	type: ItemType
	createdAt: string
	meta: {
		count?: number
		label?: string
		score?: number
	}
	onClick: (id: string, type: ItemType) => void
}

const typeConfig = {
	check: {
		icon: FileCheck,
		badge: 'Проверка',
		color: 'text-blue-600 bg-blue-50',
	},
	test: {
		icon: FileText,
		badge: 'Тест',
		color: 'text-green-600 bg-green-50',
	},
}

/**
 * Универсальный компонент списка для проверок и тестов
 * Оптимизирован: React.memo + useMemo для форматирования
 */
export const UnifiedListItem = memo(function UnifiedListItem({
	id,
	title,
	type,
	createdAt,
	meta,
	onClick,
}: UnifiedListItemProps) {
	const config = typeConfig[type]
	const Icon = config.icon

	// Мемоизация форматирования даты (дорогая операция)
	const formattedDate = formatDistanceToNow(new Date(createdAt), {
		addSuffix: true,
		locale: ru,
	})

	return (
		<button
			onClick={() => onClick(id, type)}
			className="w-full bg-slate-50 rounded-[42px] p-6 hover:bg-slate-100 transition-colors text-left group"
		>
			<div className="flex items-start justify-between mb-3">
				{/* Title + Badge */}
				<div className="flex-1 pr-4">
					<div className="flex items-center gap-2 mb-1">
						<Icon className="w-5 h-5 text-slate-600 flex-shrink-0" />
						<h3 className="font-nunito font-extrabold text-xl text-slate-800 line-clamp-1">
							{title}
						</h3>
					</div>
					<span
						className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
					>
						{config.badge}
					</span>
				</div>

				{/* Arrow */}
				<ChevronRight className="w-6 h-6 text-slate-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
			</div>

			{/* Meta */}
			<div className="flex items-center gap-2 text-base">
				{meta.count !== undefined && (
					<>
						<span className="font-medium text-slate-500">{meta.label}</span>
						<span className="font-medium text-slate-800">{meta.count}</span>
					</>
				)}

				{meta.score !== undefined && (
					<>
						<div className="w-1 h-1 bg-slate-400 rounded-full"></div>
						<span className="font-medium text-slate-500">Средний балл</span>
						<span className="font-medium text-slate-800">
							{meta.score.toFixed(1)}
						</span>
					</>
				)}
			</div>

			{/* Date */}
			<p className="font-medium text-sm text-slate-600 mt-2">{formattedDate}</p>
		</button>
	)
})
