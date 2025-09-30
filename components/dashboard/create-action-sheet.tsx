'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileCheck, FileText, BarChart3 } from 'lucide-react'

interface CreateActionSheetProps {
	isOpen: boolean
	onClose: () => void
}

const actions = [
	{
		id: 'check',
		title: 'Проверка работ',
		description: 'Загрузи фото — получи оценки',
		icon: FileCheck,
		color: 'bg-blue-500',
		route: '/dashboard/checks/create',
	},
	{
		id: 'test',
		title: 'Создать тест',
		description: 'Конструктор тестов с AI',
		icon: FileText,
		color: 'bg-green-500',
		route: '/dashboard/test-builder',
	},
	{
		id: 'analytics',
		title: 'Анализ успеваемости',
		description: 'Скоро появится',
		icon: BarChart3,
		color: 'bg-purple-500',
		disabled: true,
	},
]

/**
 * iOS-style Action Sheet для выбора типа создания
 * Оптимизирован: Lazy render + AnimatePresence
 */
export const CreateActionSheet = memo(function CreateActionSheet({
	isOpen,
	onClose,
}: CreateActionSheetProps) {
	const router = useRouter()

	const handleAction = (route?: string) => {
		if (route) {
			router.push(route)
		}
		onClose()
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
						className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
					/>

					{/* Sheet */}
					<motion.div
						initial={{ y: '100%' }}
						animate={{ y: 0 }}
						exit={{ y: '100%' }}
						transition={{ type: 'spring', stiffness: 400, damping: 40 }}
						className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl pb-safe-area"
					>
						{/* Handle */}
						<div className="flex justify-center pt-3 pb-4">
							<div className="w-10 h-1 bg-slate-300 rounded-full" />
						</div>

						{/* Header */}
						<div className="flex items-center justify-between px-6 pb-4">
							<h2 className="font-nunito font-bold text-2xl text-slate-900">
								Создать
							</h2>
							<button
								onClick={onClose}
								className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
							>
								<X className="w-5 h-5 text-slate-600" />
							</button>
						</div>

						{/* Actions */}
						<div className="px-4 pb-6 space-y-3">
							{actions.map((action) => {
								const Icon = action.icon
								const isDisabled = action.disabled

								return (
									<button
										key={action.id}
										onClick={() => !isDisabled && handleAction(action.route)}
										disabled={isDisabled}
										className={`
											w-full flex items-center gap-4 p-4 rounded-[24px] transition-all
											${
												isDisabled
													? 'bg-slate-50 opacity-50 cursor-not-allowed'
													: 'bg-slate-50 hover:bg-slate-100 active:scale-[0.98]'
											}
										`}
									>
										{/* Icon */}
										<div
											className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center flex-shrink-0`}
										>
											<Icon className="w-6 h-6 text-white" />
										</div>

										{/* Text */}
										<div className="flex-1 text-left">
											<h3 className="font-inter font-semibold text-base text-slate-900">
												{action.title}
											</h3>
											<p className="font-inter text-sm text-slate-600">
												{action.description}
											</p>
										</div>

										{/* Badge */}
										{isDisabled && (
											<span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
												Скоро
											</span>
										)}
									</button>
								)
							})}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
})
