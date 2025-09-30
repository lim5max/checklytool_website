'use client'

import { memo } from 'react'
import { ChevronRight } from 'lucide-react'
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
		label: 'Проверка',
		color: 'bg-[#096ff5]',
	},
	test: {
		label: 'Тест',
		color: 'bg-purple-500',
	},
}

/**
 * Универсальный компонент списка для проверок и тестов
 * Дизайн в стиле Airbnb с табами внутри карточки
 */
export const UnifiedListItem = memo(function UnifiedListItem({
	id,
	title,
	type,
	createdAt,
	onClick,
}: UnifiedListItemProps) {
	const config = typeConfig[type]

	// Мемоизация форматирования даты
	const formattedDate = formatDistanceToNow(new Date(createdAt), {
		addSuffix: true,
		locale: ru,
	})

	return (
		<button
			onClick={() => onClick(id, type)}
			className="w-full bg-slate-50 rounded-[42px] p-7 hover:bg-slate-100 transition-colors text-left group"
		>
			{/* Заголовок и стрелка */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="font-nunito font-extrabold text-[24px] leading-tight text-slate-800 pr-4">
					{title}
				</h3>
				<ChevronRight className="w-6 h-6 text-slate-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
			</div>

			{/* Бейджи */}
			<div className="flex gap-2">
				<div className={`px-4 py-2 ${config.color} text-white rounded-full`}>
					<span className="font-inter font-medium text-sm">
						{config.label}
					</span>
				</div>
				<div className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full">
					<span className="font-inter font-medium text-sm">
						{formattedDate}
					</span>
				</div>
			</div>
		</button>
	)
})
