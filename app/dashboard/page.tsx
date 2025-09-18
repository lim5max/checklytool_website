'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

import {
  Search,
  ChevronRight,
  FileX,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'

interface Check {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  variant_count: number
  created_at: string
  updated_at: string
  statistics?: {
    total_submissions: number
    completed_submissions: number
    pending_submissions: number
    failed_submissions: number
    average_score?: number
  }
}

interface DashboardStats {
  total_checks: number
  total_submissions: number
  avg_score: number
  recent_activity: string
}

// Check item component
const CheckItem = React.memo(function CheckItem({
  check,
  onCheckClick,
  formatDate
}: {
  check: Check
  onCheckClick: (id: string) => void
  formatDate: (date: string) => string
}) {
  return (
    <div
      onClick={() => onCheckClick(check.id)}
      className="bg-slate-50 rounded-figma-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-nunito font-bold text-[16px] leading-[1.3] text-slate-800 flex-1 pr-2">
          {check.title}
        </h3>
        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-2 mb-2 text-slate-600">
        {check.subject && (
          <>
            <span className="font-inter font-medium text-[12px]">
              {check.subject}
            </span>
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          </>
        )}

        {check.class_level && (
          <>
            <span className="font-inter font-medium text-[12px]">
              {check.class_level}
            </span>
            <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          </>
        )}

        <span className="font-inter font-medium text-[12px]">
          {check.variant_count} вар.
        </span>
      </div>

      <div className="flex items-center gap-2">
        {check.statistics && (
          <span className="font-inter font-medium text-[12px] text-slate-500">
            {check.statistics.total_submissions} работ
          </span>
        )}
        <span className="font-inter font-medium text-[12px] text-slate-500">
          {formatDate(check.created_at)}
        </span>
      </div>
    </div>
  )
})

// Empty search state component
const EmptySearchState = React.memo(function EmptySearchState({ searchQuery }: { searchQuery: string }) {
  if (searchQuery) {
    return (
      <div className="text-center py-12">
        <FileX className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="font-nunito font-bold text-lg text-slate-800 mb-2">
          Ничего не найдено
        </h3>
        <p className="text-slate-600 text-sm">
          По запросу &ldquo;{searchQuery}&rdquo; работ не найдено
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <FileX className="mx-auto h-12 w-12 text-slate-400 mb-4" />
      <h3 className="font-nunito font-bold text-lg text-slate-800 mb-2">
        Нет проверенных работ
      </h3>
      <p className="text-slate-600 text-sm">
        Создайте первую проверку для начала работы
      </p>
    </div>
  )
})

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function DashboardPage() {
  const router = useRouter()
  const [checks, setChecks] = useState<Check[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'updated_at'>('created_at')

  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Мемоизируем загрузку данных для предотвращения лишних запросов
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery)
      if (subjectFilter) params.append('subject', subjectFilter)
      params.append('sort_by', sortBy)
      params.append('sort_order', 'desc')

      const [checksResponse, statsResponse] = await Promise.all([
        fetch(`/api/checks?${params}`),
        fetch('/api/dashboard/stats')
      ])

      if (!checksResponse.ok) {
        const errorData = await checksResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Ошибка загрузки работ: ${errorData.error || checksResponse.statusText}`)
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(`Ошибка загрузки статистики: ${errorData.error || statsResponse.statusText}`)
      }

      const checksData = await checksResponse.json()
      const statsData = await statsResponse.json()

      setChecks(checksData.checks || [])
      setStats(statsData.stats || null)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить данные')
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchQuery, subjectFilter, sortBy])

  // Загрузка данных
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Мемоизируем форматирование даты
  const formatDate = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ru
    })
  }, [])

  // Мемоизируем обработчики событий
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSubjectFilter = useCallback((subject: string) => {
    setSubjectFilter(subject === subjectFilter ? '' : subject)
  }, [subjectFilter])

  const handleCheckClick = useCallback((checkId: string) => {
    router.push(`/dashboard/checks/${checkId}`)
  }, [router])

  const handleCreateCheck = useCallback(() => {
    router.push('/dashboard/checks/create')
  }, [router])

  // Мемоизируем фильтрованный и обработанный список проверок
  const checksWithStats = useMemo(() => {
    return checks.map(check => ({
      ...check,
      statistics: check.statistics || {
        total_submissions: 0,
        completed_submissions: 0,
        pending_submissions: 0,
        failed_submissions: 0
      }
    }))
  }, [checks])

  // Мемоизируем уникальные предметы
  const uniqueSubjects = useMemo(() => {
    const subjects = checks
      .map(check => check.subject)
      .filter(Boolean) as string[]
    return [...new Set(subjects)]
  }, [checks])

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        {/* Скелетон статистики */}
        <div className="bg-slate-50 rounded-[42px] p-7 animate-pulse">
          <div className="space-y-3">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="flex items-start gap-3">
              <div className="h-16 bg-slate-200 rounded w-20"></div>
              <div className="h-4 bg-slate-200 rounded w-16 mt-4"></div>
            </div>
          </div>
        </div>

        {/* Скелетон кнопки */}
        <div className="h-28 bg-slate-200 rounded-[42px] animate-pulse"></div>

        {/* Скелетон поиска */}
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="h-14 bg-slate-200 rounded-[27px] animate-pulse"></div>
        </div>

        {/* Скелетон списка */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-figma-lg p-4 animate-pulse">
              <div className="flex items-start justify-between mb-2">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="w-6 h-6 bg-slate-200 rounded"></div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Пустое состояние - онбординг как в дизайне
  if (!isLoading && checks.length === 0 && !searchQuery) {
    return (
      <div className="p-4 space-y-8">
        {/* Онбординг блок */}
        <div className="bg-slate-50 rounded-[42px] p-7 pb-[38px] pt-7 space-y-5">
          <h1 className="font-nunito font-black text-[28px] leading-[1.2] text-slate-800 w-[235px]">
            Начните с простых шагов
          </h1>

          <div className="flex gap-4 items-center">
            {/* Левая колонка с иконками и линиями */}
            <div className="relative w-6 h-[152px] flex-shrink-0">
              {/* Первая иконка */}
              <div className="absolute top-0 left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              </div>

              {/* Первая линия */}
              <div className="absolute top-[23px] left-2.5 w-1 h-9 bg-slate-200"></div>

              {/* Вторая иконка */}
              <div className="absolute top-[55px] left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              </div>

              {/* Вторая линия */}
              <div className="absolute top-[78px] left-2.5 w-1 h-9 bg-slate-200"></div>

              {/* Третья иконка */}
              <div className="absolute top-[110px] left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              </div>

              {/* Третья линия */}
              <div className="absolute top-[133px] left-2.5 w-1 h-[19px] bg-slate-200"></div>
            </div>

            {/* Правая колонка с текстом */}
            <div className="space-y-6 flex-1">
              <div className="text-left">
                <p className="font-inter font-semibold text-[16px] leading-[1.4] text-slate-800 mb-1">
                  Создать проверку
                </p>
                <p className="font-inter font-medium text-[14px] leading-[1.4] text-slate-600">
                  Добавьте задания и варианты ответов
                </p>
              </div>

              <div className="text-left">
                <p className="font-inter font-semibold text-[16px] leading-[1.4] text-slate-800 mb-1">
                  Сфотографировать работы
                </p>
                <p className="font-inter font-medium text-[14px] leading-[1.4] text-slate-600">
                  Используйте камеру для снимков тетрадей
                </p>
              </div>

              <div className="text-left">
                <p className="font-inter font-semibold text-[16px] leading-[1.4] text-slate-800 mb-1">
                  Получить результаты
                </p>
                <p className="font-inter font-medium text-[14px] leading-[1.4] text-slate-600">
                  ИИ проверит и выставит оценки
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateCheck}
          className="w-full bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-[18px] rounded-[180px] h-28 flex items-center justify-center"
        >
          Создать проверку
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Статистика */}
      {stats && (
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-[42px] p-7 pb-[18px] pt-7">
            <div className="space-y-3">
              <h2 className="font-nunito font-black text-[28px] leading-[1.2] text-slate-800">Уже проверили</h2>
              <div className="flex items-start gap-3">
                <p
                  className="font-nunito font-black italic text-[64px] leading-none text-[#096ff5] mr-1"
                  style={{
                    WebkitTextStroke: '4px #096ff5'
                  }}
                >
                  {stats.total_submissions}
                </p>
                <p className="font-inter font-medium text-[14px] leading-[1.5] text-slate-700">
                  учеников
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateCheck}
            className="w-full bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-[18px] rounded-[180px] h-28 flex items-center justify-center"
          >
            Создать проверку
          </button>
        </div>
      )}

      {/* Поиск и фильтры */}
      <div className="space-y-3">
        <h2 className="font-nunito font-black text-[24px] leading-[1.2] text-slate-800">
          Прошлые работы
        </h2>

        <div className="relative">
          <Search className="absolute left-[21px] top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
          <Input
            placeholder="Поиск работ"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-[49px] h-14 rounded-[27px] border-slate-100 bg-slate-50 font-inter font-medium text-[16px] placeholder:text-slate-500"
          />
        </div>

        {/* Фильтры по предметам */}
        {uniqueSubjects.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {uniqueSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectFilter(subject)}
                className={`px-3 py-2 rounded-full font-inter font-medium text-sm transition-colors ${
                  subjectFilter === subject
                    ? 'bg-[#096ff5] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {subject}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Список работ */}
      <div className="space-y-3">
        {checksWithStats.length === 0 ? (
          <EmptySearchState searchQuery={searchQuery} />
        ) : (
          checksWithStats.map((check) => (
            <CheckItem
              key={check.id}
              check={check}
              onCheckClick={handleCheckClick}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  )
}