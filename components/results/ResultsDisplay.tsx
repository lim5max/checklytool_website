'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  Users,
  Award,
  Clock,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { clearDraft, setDraftStudents, getTempFailedNames, clearTempFailedNames } from '@/lib/drafts'

interface StudentSubmission {
  id: string
  student_name?: string
  student_class?: string
  submission_images: string[]
  created_at: string
  updated_at: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  evaluation_results?: Array<{
    id: string
    total_questions: number
    correct_answers: number
    incorrect_answers: number
    percentage_score: number
    final_grade: number
    variant_used?: number
    detailed_answers?: Record<string, {
      given: string
      correct: string | null
      is_correct: boolean
      confidence?: number
    }>
    ai_response?: Record<string, unknown>
    confidence_score?: number
  }>
}

interface CheckStatistics {
  total_submissions: number
  completed_submissions: number
  pending_submissions: number
  average_score?: number
  grade_distribution: Record<string, number>
  completion_rate: number
}

interface ResultsDisplayProps {
  checkId: string
  checkTitle: string
  highlightSubmissionId?: string
}

export function ResultsDisplay({ checkId, checkTitle, highlightSubmissionId }: ResultsDisplayProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [statistics, setStatistics] = useState<CheckStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null)

  // Функция для перевода технических ошибок в понятные пользователю сообщения
  const getHumanReadableError = (submission: StudentSubmission): string => {
    if (!submission.error_message) return 'Неизвестная ошибка'
    
    // Проверяем тип ошибки из error_details
    if (submission.error_details?.error_type === 'inappropriate_content') {
      const contentType = submission.error_details.content_type_detected
      if (contentType?.includes('лиц') || contentType?.includes('селфи')) {
        return '📸 Загружено фото лица вместо работы. Сфотографируйте тетрадь или лист с решениями.'
      }
      return '❌ Загружены неподходящие изображения. Нужно сфотографировать именно работу ученика.'
    }
    
    // Другие типичные ошибки AI
    if (submission.error_message.includes('Failed to parse') || submission.error_message.includes('JSON')) {
      return '🤖 Ошибка обработки ИИ. Попробуйте сфотографировать работу заново с лучшим качеством.'
    }
    
    if (submission.error_message.includes('No images') || submission.error_message.includes('empty')) {
      return '📷 Не удалось загрузить изображения. Проверьте подключение к интернету.'
    }
    
    if (submission.error_message.includes('timeout') || submission.error_message.includes('network')) {
      return '⏱️ Превышено время обработки. Попробуйте еще раз.'
    }
    
    // Для всех остальных случаев возвращаем оригинальное сообщение, но более дружелюбно
    return `⚠️ ${submission.error_message}`
  }

  useEffect(() => {
    loadResultsData()
  }, [checkId])

  const loadResultsData = async () => {
    try {
      setIsLoading(true)
      
      const [submissionsResponse, statsResponse] = await Promise.all([
        fetch(`/api/checks/${checkId}/submissions`),
        fetch(`/api/checks/${checkId}/statistics`)
      ])

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions || [])
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStatistics(statsData.statistics)
      }
      
    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Не удалось загрузить результаты')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Search filter
      const matchesSearch = !searchQuery || 
        submission.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.student_class?.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'all' || submission.status === statusFilter

      // Grade filter
      const matchesGrade = gradeFilter === 'all' || 
        (submission.evaluation_results?.[0]?.final_grade?.toString() === gradeFilter)

      return matchesSearch && matchesStatus && matchesGrade
    })
  }, [submissions, searchQuery, statusFilter, gradeFilter])

  const getStatusBadge = (status: StudentSubmission['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Готово</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Обработка</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Ошибка</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Ожидание</Badge>
    }
  }

  const getGradeBadge = (grade?: number) => {
    if (!grade) return null
    
    const colors = {
      5: 'bg-green-500 text-white',
      4: 'bg-blue-500 text-white', 
      3: 'bg-yellow-500 text-white',
      2: 'bg-red-500 text-white'
    }
    
    return (
      <Badge className={colors[grade as keyof typeof colors] || 'bg-gray-500 text-white'}>
        {grade}
      </Badge>
    )
  }

  const exportResults = () => {
    const csvContent = [
      ['Студент', 'Класс', 'Оценка', 'Процент', 'Статус', 'Дата сдачи'].join(','),
      ...filteredSubmissions.map(submission => [
        submission.student_name || 'Неизвестно',
        submission.student_class || '',
        submission.evaluation_results?.[0]?.final_grade || '',
        submission.evaluation_results?.[0]?.percentage_score ? `${submission.evaluation_results[0].percentage_score}%` : '',
        submission.status,
        new Date(submission.created_at).toLocaleDateString('ru-RU')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${checkTitle}_results.csv`
    link.click()
  }

  const handleReshoot = async () => {
    try {
      // Собираем только неудачные имена из сервера
      const serverFailedNames = submissions
        .filter(s => s.status === 'failed')
        .map(s => (s.student_name || '').trim())
        .filter(n => n.length > 0)

      // Плюс локальные имена, у которых upload дал 500
      const localFailedNames = getTempFailedNames(checkId)

      const names = Array.from(new Set([...serverFailedNames, ...localFailedNames]))

      // Перезаписываем черновики этими студентами
      clearDraft(checkId)
      if (names.length > 0) {
        setDraftStudents(checkId, names)
      }

      // Сбрасываем локальный список ошибок — он отработан
      clearTempFailedNames(checkId)

      // Переходим на страницу проверки где будет камера
      router.push(`/dashboard/checks/${checkId}`)
    } catch (e) {
      console.error(e)
      toast.error('Не удалось подготовить пересъемку')
    }
  }

  const viewSubmissionDetails = (submission: StudentSubmission) => {
    setSelectedSubmission(submission)
    console.log('Viewing submission details:', submission)
    // TODO: Implement modal or navigation to detailed view
    toast.info(`Подробности для ${submission.student_name || 'студента'}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
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
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Summary Section - Show when there are failed submissions */}
      {submissions.some(s => s.status === 'failed') && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="font-medium text-slate-800 text-[16px] leading-[1.5]">
              <p>Ошибки проверки</p>
            </div>
            <Button
              onClick={handleReshoot}
              className="bg-[#096ff5] rounded-[180px] h-9 px-4 text-white text-[16px] font-medium hover:bg-[#096ff5]/90"
            >
              Переснять
            </Button>
          </div>
          
          <div className="flex flex-col gap-2.5 items-center justify-start w-full">
            {submissions
              .filter(s => s.status === 'failed')
              .map((s) => (
                <div key={s.id} className="bg-slate-50 flex flex-col gap-2.5 items-start justify-start px-6 py-[18px] rounded-[24px] w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-slate-800 text-[18px] leading-[1.6]">
                        <p>{s.student_name || 'Студент'}</p>
                      </div>
                    </div>
                    {/* маленькая красная точка как в макете */}
                    <div className="h-2 w-2 rounded-full bg-[#e33629]" />
                  </div>
                  {s.error_message && (
                    <div className="text-sm text-red-600 mt-2">
                      {getHumanReadableError(s)}
                    </div>
                  )}
                  
                  {/* Добавляем советы для конкретных типов ошибок */}
                  {s.error_details?.error_type === 'inappropriate_content' && (
                    <div className="bg-blue-50 p-3 rounded-lg mt-2 w-full">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">💡 Как исправить:</p>
                        <p>• Сфотографируйте тетрадь или листы с решениями</p>
                        <p>• Убедитесь, что работа ученика хорошо видна</p>
                        <p>• Избегайте фотографий лиц и посторонних предметов</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
          
          {/* Общие советы по исправлению ошибок */}
          {submissions.filter(s => s.status === 'failed').length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 text-lg">💡</div>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-2">Советы по улучшению качества фотографий:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Фотографируйте при хорошем освещении</li>
                    <li>Держите камеру параллельно листу</li>
                    <li>Убедитесь, что текст читаем</li>
                    <li>Включите в кадр всю работу целиком</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего работ</p>
                  <p className="text-3xl font-bold">{statistics.total_submissions}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Проверено</p>
                  <p className="text-3xl font-bold">{statistics.completed_submissions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Средний балл</p>
                  <p className="text-3xl font-bold">
                    {statistics.average_score ? `${Math.round(statistics.average_score)}%` : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Выполнено</p>
                  <p className="text-3xl font-bold">{Math.round(statistics.completion_rate)}%</p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Distribution */}
      {statistics && Object.keys(statistics.grade_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Распределение оценок</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(statistics.grade_distribution).map(([grade, count]) => (
                <div key={grade} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600">Оценка {grade}</div>
                  <div className="text-xs text-gray-500">
                    {statistics.total_submissions > 0 
                      ? `${Math.round((count / statistics.total_submissions) * 100)}%`
                      : '0%'
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Поиск по имени или классу</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Введите имя студента или класс..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Статус</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="completed">Проверено</SelectItem>
                  <SelectItem value="processing">Обработка</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                  <SelectItem value="failed">Ошибка</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Оценка</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Результаты студентов ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            Список всех загруженных и проверенных работ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет результатов
              </h3>
              <p className="text-gray-500">
                {submissions.length === 0 
                  ? 'Пока не загружено ни одной работы'
                  : 'Нет работ, соответствующих выбранным фильтрам'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Студент</TableHead>
                    <TableHead>Класс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оценка</TableHead>
                    <TableHead>Процент</TableHead>
                    <TableHead>Дата сдачи</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow 
                      key={submission.id}
                      className={highlightSubmissionId === submission.id ? 'bg-blue-50' : ''}
                    >
                      <TableCell className="font-medium">
                        {submission.student_name || 'Неизвестно'}
                      </TableCell>
                      <TableCell>
                        {submission.student_class || '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell>
                        {getGradeBadge(submission.evaluation_results?.[0]?.final_grade)}
                      </TableCell>
                      <TableCell>
                        {submission.evaluation_results?.[0]?.percentage_score 
                          ? `${submission.evaluation_results[0].percentage_score}%`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(submission.created_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewSubmissionDetails(submission)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Подробно
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}