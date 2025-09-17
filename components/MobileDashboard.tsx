"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'

import {
  Search,
  ChevronRight,
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
  total_questions?: number
  created_at: string
  updated_at: string
  statistics?: {
    total_submissions: number
    completed_submissions: number
    average_score?: number
  }
}

interface DashboardStats {
  total_checks: number
  total_submissions: number
  avg_completion_rate: number
}

// Мемоизированный компонент элемента списка
const CheckItem = React.memo<{
  check: Check & { completionRate: number }
  onCheckClick: (checkId: string) => void
  formatDate: (dateString: string) => string
}>(function CheckItem({ check, onCheckClick, formatDate }) {
  return (
    <div
      onClick={() => onCheckClick(check.id)}
      className="bg-slate-50 border-0 rounded-figma-lg p-4 cursor-pointer hover:bg-slate-100 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-nunito font-extrabold text-[20px] leading-[1.2] text-slate-700 truncate">
            {check.title}
          </h3>
        </div>

        <div className="w-6 h-6 flex-shrink-0">
          <ChevronRight className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <div className="flex items-start gap-1.5">
          <span className="font-inter font-medium text-[16px] leading-[1.5] text-slate-500">
            Средний балл
          </span>
          <span className="font-inter font-medium text-[16px] leading-[1.5] text-slate-800">
            {check.statistics?.average_score ? check.statistics.average_score.toFixed(1) : '0.0'}
          </span>
        </div>

        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>

        <div className="flex items-start gap-1.5">
          <span className="font-inter font-medium text-[16px] leading-[1.5] text-slate-500">
            Учеников
          </span>
          <span className="font-inter font-medium text-[16px] leading-[1.5] text-slate-800">
            {check.statistics?.total_submissions || 0}
          </span>
        </div>
      </div>

      <div className="mt-2.5">
        <span className="font-inter font-medium text-[14px] leading-[1.6] text-slate-600">
          {formatDate(check.created_at)}
        </span>
      </div>
    </div>
  )
})

function MobileDashboard() {
  const router = useRouter()
  const [checks, setChecks] = useState<Check[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'updated_at'>('created_at')

  // Мемоизируем загрузку данных для предотвращения лишних запросов
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
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
  }, [searchQuery, subjectFilter, sortBy])

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

  // Мемоизируем вычисление предметов для предотвращения ререндеров
  const subjects = useMemo(() => {
    const subjectsSet = new Set(
      checks.map(check => check.subject).filter(Boolean) as string[]
    )
    return Array.from(subjectsSet)
  }, [checks])

  // Мемоизируем вычисление рейтингов и статистики
  const checksWithStats = useMemo(() =>
    checks.map(check => ({
      ...check,
      completionRate: (!check.statistics || check.statistics.total_submissions === 0)
        ? 0
        : Math.round((check.statistics.completed_submissions / check.statistics.total_submissions) * 100)
    })),
    [checks]
  )

  // Мемоизируем обработчики событий
  const handleCreateCheck = useCallback(() => {
    router.push('/dashboard/checks/create')
  }, [router])

  const handleCheckClick = useCallback((checkId: string) => {
    router.push(`/dashboard/checks/${checkId}`)
  }, [router])

  const handleSubjectFilter = useCallback((subject: string) => {
    setSubjectFilter(subject)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        {/* Loading stats */}
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-[42px] p-7 animate-pulse">
            <div className="h-7 bg-slate-200 rounded w-48 mb-3"></div>
            <div className="flex items-start gap-3">
              <div className="h-16 bg-slate-200 rounded w-20"></div>
              <div className="h-4 bg-slate-200 rounded w-16 mt-4"></div>
            </div>
          </div>

          <div className="w-full h-28 bg-slate-200 rounded-[180px] animate-pulse"></div>
        </div>

        {/* Loading search section */}
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 rounded w-40 animate-pulse"></div>
          <div className="bg-slate-50 h-14 rounded-[27px] animate-pulse">
            <div className="flex items-center gap-2 h-14 px-[21px] py-[11px]">
              <div className="w-[18px] h-[18px] bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading checks */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
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
              <div className="absolute top-11 left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              </div>
              
              {/* Вторая линия */}
              <div className="absolute top-[59px] left-2.5 w-1 h-[39px] bg-slate-200"></div>
              
              {/* Третья иконка */}
              <div className="absolute top-[88px] left-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              </div>
              
              {/* Третья линия с градиентом */}
              <div className="absolute top-[108px] left-2.5 w-1 h-[43px] bg-gradient-to-b from-slate-200 to-white"></div>
              
              {/* Финальная иконка */}
              <div className="absolute top-[131px] left-[1.59px] w-[21.037px] h-[21.037px] bg-center bg-cover bg-no-repeat rounded-full bg-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* Правая колонка с текстом */}
            <div className="flex flex-col gap-[19px] text-[16px] w-[221px]">
              <p className="font-inter font-medium text-slate-800 leading-[1.5]">
                Создайте проверку
              </p>
              <p className="font-inter font-medium text-slate-800 leading-[1.5] text-center">
                Загрузите работы учеников
              </p>
              <p className="font-inter font-medium text-slate-800 leading-[1.5]">
                Получите оценки
              </p>
              <p className="font-inter font-semibold text-green-500 leading-[1.5] tracking-[-0.32px]">
                А потом можно отдыхать
              </p>
            </div>
          </div>
        </div>
        
        {/* Кнопка создания */}
        <button
          onClick={handleCreateCheck}
          className="w-full bg-[#096ff5] hover:bg-blue-600 transition-colors text-white font-inter font-medium text-[18px] rounded-[180px] h-28 flex items-center justify-center"
        >
          Создать проверку
        </button>
        
        {/* Секция с поиском для пустого состояния */}
        <div className="space-y-[18px]">
          <div className="space-y-3">
            <h2 className="font-nunito font-black text-[24px] leading-[1.2] text-slate-800">
              Прошлые работы
            </h2>
            
            <div className="bg-slate-50 h-14 rounded-[27px] relative">
              <div className="flex items-center gap-2 h-14 px-[21px] py-[11px]">
                <Search className="w-[18px] h-[18px] text-slate-500" />
                <span className="font-inter font-medium text-[16px] text-slate-500 leading-[1.6]">
                  Поиск работ
                </span>
              </div>
              <div className="absolute inset-0 border border-slate-100 rounded-[27px] pointer-events-none"></div>
            </div>
          </div>
          
          <p className="font-inter font-medium text-[16px] text-slate-500 leading-[1.6] text-center">
            Тут пока пусто
          </p>
        </div>
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
          <div className="absolute inset-0 border border-slate-100 rounded-[27px] pointer-events-none"></div>
        </div>
        
        {subjects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleSubjectFilter('')}
              className={`px-4 py-2 rounded-figma-full font-inter font-medium text-[14px] whitespace-nowrap transition-colors ${
                !subjectFilter
                  ? 'bg-[#096ff5] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Все
            </button>
            {subjects.map((subject) => (
              <button
                key={subject}
                onClick={() => handleSubjectFilter(subject)}
                className={`px-4 py-2 rounded-figma-full font-inter font-medium text-[14px] whitespace-nowrap transition-colors ${
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
        {checksWithStats.map((check) => (
          <CheckItem
            key={check.id}
            check={check}
            onCheckClick={handleCheckClick}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  )
}

// Экспортируем мемоизированный компонент для оптимизации производительности
export default React.memo(MobileDashboard)