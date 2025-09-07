'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  FileText,
  Users,
  TrendingUp,
  Clock,
  Upload,
  BarChart3
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

export default function DashboardPage() {
  const router = useRouter()
  const [checks, setChecks] = useState<Check[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'updated_at'>('created_at')

  // Загрузка данных
  useEffect(() => {
    loadDashboardData()
  }, [searchQuery, subjectFilter, sortBy])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Параметры запроса
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (subjectFilter) params.append('subject', subjectFilter)
      params.append('sort_by', sortBy)
      params.append('sort_order', 'desc')

      const [checksResponse, statsResponse] = await Promise.all([
        fetch(`/api/checks?${params}`),
        fetch('/api/dashboard/stats')
      ])

      console.log('[DASHBOARD] Checks response status:', checksResponse.status)
      console.log('[DASHBOARD] Stats response status:', statsResponse.status)

      if (!checksResponse.ok) {
        const errorData = await checksResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[DASHBOARD] Checks API error:', errorData)
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
  }

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ru
    })
  }

  const getCompletionRate = (check: Check) => {
    if (!check.statistics || check.statistics.total_submissions === 0) {
      return 0
    }
    return Math.round(
      (check.statistics.completed_submissions / check.statistics.total_submissions) * 100
    )
  }

  const getSubjects = () => {
    const subjects = new Set(checks.map(check => check.subject).filter(Boolean))
    return Array.from(subjects)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Панель управления</h1>
          <p className="text-gray-600 mt-1">
            Управляйте проверочными работами и отслеживайте результаты
          </p>
        </div>
        
        <Button onClick={() => router.push('/dashboard/checks/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Создать работу
        </Button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего работ</p>
                  <p className="text-3xl font-bold">{stats.total_checks}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего работ студентов</p>
                  <p className="text-3xl font-bold">{stats.total_submissions}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Средняя успеваемость</p>
                  <p className="text-3xl font-bold">{stats.avg_completion_rate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по названию или описанию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={subjectFilter || 'all'} onValueChange={(value) => setSubjectFilter(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Все предметы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все предметы</SelectItem>
                {getSubjects().map(subject => (
                  <SelectItem key={subject} value={subject!}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'created_at' | 'title' | 'updated_at') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">По дате создания</SelectItem>
                <SelectItem value="updated_at">По дате изменения</SelectItem>
                <SelectItem value="title">По названию</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список проверочных работ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Проверочные работы ({checks.length})
          </h2>
        </div>

        {checks.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет проверочных работ
                </h3>
                <p className="text-gray-500 mb-6">
                  Создайте первую проверочную работу для начала использования системы
                </p>
                <Button onClick={() => router.push('/dashboard/checks/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать первую работу
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {checks.map((check) => (
              <Card key={check.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Основная информация */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold hover:text-blue-600 cursor-pointer"
                            onClick={() => router.push(`/dashboard/checks/${check.id}`)}>
                          {check.title}
                        </h3>
                      </div>
                      
                      {check.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {check.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {check.subject && (
                          <Badge variant="secondary">{check.subject}</Badge>
                        )}
                        {check.class_level && (
                          <Badge variant="outline">{check.class_level}</Badge>
                        )}
                        <Badge variant="outline">
                          {check.variant_count} {check.variant_count === 1 ? 'вариант' : 'вариантов'}
                        </Badge>
                        {check.total_questions && (
                          <Badge variant="outline">
                            {check.total_questions} заданий
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(check.updated_at)}
                        </span>
                      </div>
                    </div>

                    {/* Статистика и действия */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start lg:items-end xl:items-center gap-4">
                      {/* Статистика */}
                      {check.statistics && check.statistics.total_submissions > 0 && (
                        <div className="text-center lg:text-right xl:text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {check.statistics.completed_submissions}
                          </div>
                          <div className="text-xs text-gray-500">
                            из {check.statistics.total_submissions} работ
                          </div>
                          <div className="text-xs text-gray-500">
                            {getCompletionRate(check)}% выполнено
                          </div>
                        </div>
                      )}

                      {/* Действия */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/checks/${check.id}/submit`)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/checks/${check.id}/results`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Результаты
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/checks/${check.id}`)}
                        >
                          Управление
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}