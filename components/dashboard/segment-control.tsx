'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'

interface SegmentControlProps {
	segments: Array<{ value: string; label: string; icon?: string }>
	activeSegment: string
	onChange: (value: string) => void
}

/**
 * iOS-style Segment Control
 * Оптимизирован для производительности: React.memo + CSS transitions
 */
export const SegmentControl = memo(function SegmentControl({
	segments,
	activeSegment,
	onChange,
}: SegmentControlProps) {
	const activeIndex = segments.findIndex((s) => s.value === activeSegment)

	return (
		<div className="relative flex bg-slate-100 rounded-full p-1 gap-1">
			{/* Анимированный индикатор (CSS для скорости) */}
			<motion.div
				className="absolute h-[calc(100%-8px)] rounded-full bg-white shadow-sm"
				initial={false}
				animate={{
					left: `calc(${activeIndex * (100 / segments.length)}% + 4px)`,
					width: `calc(${100 / segments.length}% - 8px)`,
				}}
				transition={{
					type: 'spring',
					stiffness: 500,
					damping: 40,
					mass: 0.8,
				}}
			/>

			{/* Кнопки */}
			{segments.map((segment) => {
				const isActive = segment.value === activeSegment

				return (
					<button
						key={segment.value}
						onClick={() => onChange(segment.value)}
						className={`
							relative z-10 flex-1 px-4 py-2.5 rounded-full
							font-inter font-medium text-sm
							transition-colors duration-200
							${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-800'}
						`}
					>
						<span className="flex items-center justify-center gap-1.5">
							{segment.icon && <span>{segment.icon}</span>}
							{segment.label}
						</span>
					</button>
				)
			})}
		</div>
	)
})
