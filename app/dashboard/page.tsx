'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, Plus, FileX } from 'lucide-react'
import { toast } from 'sonner'
import { SegmentControl } from '@/components/dashboard/segment-control'
import { CreateActionSheet } from '@/components/dashboard/create-action-sheet'
import { UnifiedListItem } from '@/components/dashboard/unified-list-item'
import { EmptyDashboard } from '@/components/dashboard/empty-dashboard'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'

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

interface Test {
	id: string
	title: string
	description?: string
	created_at: string
	question_count: number
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
	const [allTests, setAllTests] = useState<Test[]>([])
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [activeSegment, setActiveSegment] = useState('all')
	const [isSheetOpen, setIsSheetOpen] = useState(false)

	// Pagination state
	const [displayCount, setDisplayCount] = useState(5)
	const ITEMS_PER_PAGE = 5

	// Загрузка данных (оптимизировано: одна загрузка)
	const loadData = useCallback(async () => {
		try {
			setIsLoading(true)

			const [checksRes, testsRes, statsRes] = await Promise.all([
				fetch('/api/checks?limit=100'),
				fetch('/api/tests/saved'),
				fetch('/api/dashboard/stats'),
			])

			if (checksRes.ok) {
				const data = await checksRes.json()
				setAllChecks(data.checks || [])
			}

			if (testsRes.ok) {
				const testsData = await testsRes.json()
				setAllTests(Array.isArray(testsData) ? testsData : [])
			}

			if (statsRes.ok) {
				const statsData = await statsRes.json()
				console.log('[DASHBOARD] Received stats data:', statsData)
				// API возвращает { stats: { total_checks, ... } }
				setStats(statsData.stats || statsData)
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

	// Обработка результата оплаты
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const paymentStatus = params.get('payment')

		if (paymentStatus === 'success') {
			toast.success('Оплата успешна!', {
				description: 'Ваша подписка активирована. Обновите страницу, чтобы увидеть изменения.',
			})
			// Очищаем параметр из URL
			window.history.replaceState({}, '', '/dashboard')
		} else if (paymentStatus === 'failed') {
			toast.error('Ошибка оплаты', {
				description: 'Платеж не прошел. Попробуйте еще раз.',
			})
			// Очищаем параметр из URL
			window.history.replaceState({}, '', '/dashboard')
		}
	}, [])

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

		// Добавляем тесты
		allTests.forEach((test) => {
			items.push({
				id: test.id,
				title: test.title,
				type: 'test',
				createdAt: test.created_at,
				meta: {
					count: test.question_count,
					label: 'Вопросов',
				},
			})
		})

		// Сортировка по дате (новые сначала)
		return items.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
		)
	}, [allChecks, allTests])

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

	// Пагинация: показываем только первые displayCount элементов
	const visibleItems = useMemo(
		() => filteredItems.slice(0, displayCount),
		[filteredItems, displayCount]
	)

	const hasMore = filteredItems.length > displayCount

	// Обработчики (мемоизированы)
	const handleItemClick = useCallback(
		(id: string, type: 'check' | 'test', title?: string) => {
			if (type === 'check') {
				// Передаем title в URL для мгновенного отображения
				const encodedTitle = title ? encodeURIComponent(title) : ''
				const url = encodedTitle
					? `/dashboard/checks/${id}?title=${encodedTitle}`
					: `/dashboard/checks/${id}`
				router.push(url)
			} else {
				router.push(`/dashboard/tests/${id}`)
			}
		},
		[router]
	)

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setSearchQuery(e.target.value)
			setDisplayCount(5) // Сброс при поиске
		},
		[]
	)

	// Загрузка следующей порции
	const loadMore = useCallback(() => {
		if (hasMore) {
			setDisplayCount((prev) => prev + ITEMS_PER_PAGE)
		}
	}, [hasMore, ITEMS_PER_PAGE])

	// Сброс displayCount при изменении фильтров
	useEffect(() => {
		setDisplayCount(5)
	}, [activeSegment])

	// Пустое состояние - онбординг
	if (!isLoading && unifiedItems.length === 0) {
		return <EmptyDashboard onCreateTest={() => setIsSheetOpen(true)} />
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
				<DashboardStats
					totalSubmissions={stats.total_submissions}
					totalChecks={stats.total_checks}
					totalTests={stats.total_tests}
				/>
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
					<>
						{/* Рендерим только видимые элементы */}
						{visibleItems.map((item) => (
							<UnifiedListItem
								key={`${item.type}-${item.id}`}
								{...item}
								onClick={handleItemClick}
							/>
						))}

						{/* Кнопка "Показать ещё" */}
						{hasMore && (
							<button
								onClick={loadMore}
								className="w-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-inter font-medium text-base rounded-full h-14 flex items-center justify-center gap-2"
							>
								Показать ещё ({filteredItems.length - displayCount})
							</button>
						)}

						{/* Показываем сколько всего */}
						{!hasMore && filteredItems.length > 5 && (
							<p className="text-center text-slate-500 text-sm py-4">
								Показано все {filteredItems.length}
							</p>
						)}
					</>
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
