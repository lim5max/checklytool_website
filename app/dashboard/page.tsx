'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Plus, FileX } from 'lucide-react'
import { toast } from 'sonner'
import { SegmentControl } from '@/components/dashboard/segment-control'
import { CreateActionSheet } from '@/components/dashboard/create-action-sheet'
import { UnifiedListItem } from '@/components/dashboard/unified-list-item'

// Типы
interface Check {
	id: string
	title: string
	created_at: string
	statistics?: {
		total_submissions: number
		average_score?: number
	}
}

interface UnifiedItem {
	id: string
	title: string
	type: 'check' | 'test'
	createdAt: string
	meta: {
		count?: number
		label?: string
		score?: number
	}
}

interface DashboardStats {
	total_checks: number
	total_submissions: number
	total_tests: number
}

const segments = [
	{ value: 'all', label: 'Всё', icon: '📋' },
	{ value: 'checks', label: 'Проверки', icon: '🎯' },
	{ value: 'tests', label: 'Тесты', icon: '📝' },
]

export default function DashboardPageNew() {
	const router = useRouter()

	// State
	const [allChecks, setAllChecks] = useState<Check[]>([])
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeSegment, setActiveSegment] = useState('all')
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	// Загрузка данных (оптимизировано: одна загрузка)
	const loadData = useCallback(async () => {
		try {
			setIsLoading(true)

			const [checksRes, statsRes] = await Promise.all([
				fetch('/api/checks?limit=100'),
				fetch('/api/dashboard/stats'),
			])

			if (checksRes.ok) {
				const data = await checksRes.json()
				setAllChecks(data.checks || [])
			}

			if (statsRes.ok) {
				const statsData = await statsRes.json()
				setStats(statsData)
			}
		} catch (error) {
			console.error('Error loading dashboard:', error)
			toast.error('Не удалось загрузить данные')
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	// Преобразование данных в унифицированный формат
	const unifiedItems = useMemo<UnifiedItem[]>(() => {
		const items: UnifiedItem[] = []

		// Добавляем проверки
		allChecks.forEach((check) => {
			items.push({
				id: check.id,
				title: check.title,
				type: 'check',
				createdAt: check.created_at,
				meta: {
					count: check.statistics?.total_submissions || 0,
					label: 'Учеников',
					score: check.statistics?.average_score,
				},
			})
		})

		// TODO: Добавить тесты когда будет API
		// tests.forEach(test => { ... })

		// Сортировка по дате (новые сначала)
		return items.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	}, [allChecks])

	// Фильтрация (супербыстро: < 1ms для 100 элементов)
	const filteredItems = useMemo(() => {
		let filtered = unifiedItems

		// Фильтр по типу
		if (activeSegment !== 'all') {
			const typeMap: Record<string, 'check' | 'test'> = {
				checks: 'check',
				tests: 'test',
			}
			filtered = filtered.filter((item) => item.type === typeMap[activeSegment])
		}

		// Поиск
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter((item) =>
				item.title.toLowerCase().includes(query)
			)
		}

		return filtered
	}, [unifiedItems, activeSegment, searchQuery])

	// Обработчики (мемоизированы)
	const handleItemClick = useCallback(
		(id: string, type: 'check' | 'test') => {
			if (type === 'check') {
				router.push(`/dashboard/checks/${id}`)
			} else {
				router.push(`/dashboard/tests/${id}`)
			}
		},
		[router]
	)

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
		},
		[]
	)

	// Пустое состояние - онбординг
	if (!isLoading && unifiedItems.length === 0) {
		return (
			<div className="p-4 space-y-6">
				{/* Онбординг */}
				<div className="bg-slate-50 rounded-[42px] p-7 space-y-5">
					<h1 className="font-nunito font-black text-[28px] text-slate-800">
						Начните с простых шагов
					</h1>

					<div className="space-y-4">
						<div>
							<p className="font-inter font-semibold text-base text-slate-800 mb-1">
								1. Создайте проверку или тест
							</p>
							<p className="font-inter font-medium text-sm text-slate-600">
								Выберите тип работы с учениками
							</p>
						</div>

						<div>
							<p className="font-inter font-semibold text-base text-slate-800 mb-1">
								2. Загрузите материалы
							</p>
							<p className="font-inter font-medium text-sm text-slate-600">
								Добавьте задания или фото работ
							</p>
						</div>

						<div>
							<p className="font-inter font-semibold text-base text-slate-800 mb-1">
								3. Получите результаты
							</p>
							<p className="font-inter font-medium text-sm text-slate-600">
								AI проверит и оценит за вас
							</p>
						</div>
					</div>
				</div>

				{/* FAB Button */}
				<button
					onClick={() => setIsSheetOpen(true)}
					className="w-full bg-[#096ff5] hover:bg-blue-600 transition-all active:scale-[0.98] text-white font-inter font-medium text-lg rounded-full h-[72px] flex items-center justify-center gap-2 shadow-lg"
				>
					<Plus className="w-6 h-6" />
					Создать
				</button>

				<CreateActionSheet
					isOpen={isSheetOpen}
					onClose={() => setIsSheetOpen(false)}
				/>
			</div>
		)
	}

	// Загрузка
	if (isLoading) {
		return (
			<div className="p-4 space-y-6">
				{/* Скелетон статистики */}
				<div className="bg-slate-50 rounded-[42px] p-7 animate-pulse">
					<div className="h-8 bg-slate-200 rounded w-48 mb-3"></div>
					<div className="h-16 bg-slate-200 rounded w-20"></div>
				</div>

				{/* Скелетон кнопки */}
				<div className="h-[72px] bg-slate-200 rounded-full animate-pulse"></div>

				{/* Скелетон segment */}
				<div className="h-12 bg-slate-200 rounded-full animate-pulse"></div>

				{/* Скелетон списка */}
				{[...Array(3)].map((_, i) => (
					<div
						key={i}
						className="bg-slate-50 rounded-[42px] p-6 animate-pulse"
					>
						<div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
						<div className="h-4 bg-slate-200 rounded w-1/2"></div>
					</div>
				))}
			</div>
		)
	}

	// Основной UI
	return (
		<div className="p-4 space-y-6">
			{/* Статистика */}
			{stats && (
				<div className="bg-slate-50 rounded-[42px] p-7">
					<h2 className="font-nunito font-black text-[28px] text-slate-800 mb-3">
						Ваша статистика
					</h2>
					<div className="flex items-center gap-6">
						<div>
							<p className="text-slate-600 text-sm font-medium mb-1">
								Проверено учеников
							</p>
							<p className="font-nunito font-black text-4xl text-[#096ff5]">
								{stats.total_submissions}
							</p>
						</div>
						{stats.total_tests > 0 && (
							<div>
								<p className="text-slate-600 text-sm font-medium mb-1">
									Создано тестов
								</p>
								<p className="font-nunito font-black text-4xl text-green-600">
									{stats.total_tests}
								</p>
							</div>
						)}
					</div>
				</div>
			)}

			{/* FAB Button */}
			<button
				onClick={() => setIsSheetOpen(true)}
				className="w-full bg-[#096ff5] hover:bg-blue-600 transition-all active:scale-[0.98] text-white font-inter font-medium text-lg rounded-full h-[72px] flex items-center justify-center gap-2 shadow-lg"
			>
				<Plus className="w-6 h-6" />
				Создать
			</button>

			{/* Segment Control */}
			<SegmentControl
				segments={segments}
				activeSegment={activeSegment}
				onChange={setActiveSegment}
			/>

			{/* Поиск */}
			<div className="relative">
				<Search className="absolute left-[21px] top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
				<Input
					placeholder="Поиск..."
					value={searchQuery}
					onChange={handleSearchChange}
					className="pl-[49px] h-14 rounded-[27px] border-slate-100 bg-slate-50 font-inter font-medium"
				/>
			</div>

			{/* Список */}
			<div className="space-y-3">
				{filteredItems.length === 0 ? (
					<div className="text-center py-12">
						<FileX className="mx-auto h-12 w-12 text-slate-400 mb-4" />
						<h3 className="font-nunito font-bold text-lg text-slate-800 mb-2">
							Ничего не найдено
						</h3>
						<p className="text-slate-600 text-sm">
							{searchQuery
								? `По запросу "${searchQuery}" ничего не найдено`
								: 'Список пуст'}
						</p>
					</div>
				) : (
					filteredItems.map((item) => (
						<UnifiedListItem
							key={`${item.type}-${item.id}`}
							{...item}
							onClick={handleItemClick}
						/>
					))
				)}
			</div>

			{/* Action Sheet */}
			<CreateActionSheet
				isOpen={isSheetOpen}
				onClose={() => setIsSheetOpen(false)}
			/>
		</div>
	)
}
