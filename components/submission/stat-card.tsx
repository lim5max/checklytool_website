'use client'

import { LucideIcon } from 'lucide-react'

interface StatCardProps {
	icon: LucideIcon
	label: string
	value: string | number
	iconColor?: string
	iconBgColor?: string
}

export function StatCard({
	icon: Icon,
	label,
	value,
	iconColor = 'text-blue-600',
	iconBgColor = 'bg-blue-50'
}: StatCardProps) {
	return (
		<div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 transition-all duration-300">
			<div className="flex flex-col items-center text-center gap-3">
				<div className={`${iconBgColor} rounded-xl p-3`}>
					<Icon className={`${iconColor} w-5 h-5 md:w-6 md:h-6`} />
				</div>
				<div className="w-full">
					<p className="text-xs md:text-sm text-slate-500 font-medium mb-1 truncate">{label}</p>
					<p className="text-xl md:text-2xl font-bold text-slate-900">{value}</p>
				</div>
			</div>
		</div>
	)
}
