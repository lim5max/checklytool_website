'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { clearDraft, getTempFailedNames, clearTempFailedNames, setDraftStudents } from '@/lib/drafts'

interface CheckInfo {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  variant_count: number
  total_questions?: number
}

interface StudentSubmission {
  id: string
  student_name?: string
  student_class?: string
  submission_images: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  error_details?: {
    error_type?: 'inappropriate_content' | 'ai_failure' | 'image_processing' | 'validation_error'
    content_type_detected?: string
    ai_message?: string
    [key: string]: any
  }
  evaluation_results?: Array<{
    id: string
    total_questions: number
    correct_answers: number
    incorrect_answers: number
    percentage_score: number
    final_grade: number
    variant_used?: number
  }>
  created_at: string
  updated_at: string
}

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const router = useRouter()
  const [checkInfo, setCheckInfo] = useState<CheckInfo | null>(null)
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [checkId, setCheckId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadData()
    }
  }, [checkId])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      const [checkResponse, submissionsResponse] = await Promise.all([
        fetch(`/api/checks/${checkId}`),
        fetch(`/api/checks/${checkId}/submissions`)
      ])
      
      if (!checkResponse.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const checkData = await checkResponse.json()
      setCheckInfo(checkData.check)
      
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions || [])
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Не удалось загрузить информацию о работе')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
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

  const handleLoadMore = () => {
    router.push(`/dashboard/checks/${checkId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">Загрузка...</div>
      </div>
    )
  }

  if (!checkInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
          <Button onClick={() => router.push('/dashboard')}>
            Вернуться к списку
          </Button>
        </div>
      </div>
    )
  }

  const failedSubmissions = submissions.filter(s => s.status === 'failed')
  const completedSubmissions = submissions.filter(s => s.status === 'completed')
  const hasFailedSubmissions = failedSubmissions.length > 0

  const getGradeColor = (grade: number) => {
    if (grade >= 5) return 'text-[#319f43]' // зеленый для 5
    if (grade >= 4) return 'text-[#319f43]' // зеленый для 4
    if (grade >= 3) return 'text-[#e33629]' // красный для 3
    return 'text-[#e33629]' // красный для 2
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 bg-gray-200 rounded"></div>
          <div className="text-sm font-medium">CHECKLY</div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-[34px] h-1 bg-slate-900 rounded-[12px]"></div>
          <div className="w-[34px] h-1 bg-slate-900 rounded-[12px]"></div>
        </div>
      </div>

      {/* Navigation Icons */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/checks/${checkId}`)}
          className="w-8 h-8"
        >
          <X className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Title */}
      <h1 className="font-black text-[28px] text-slate-800 leading-[1.2] mb-6">
        {checkInfo.title}
      </h1>

      {/* Error Section - Only show if there are failed submissions */}
      {hasFailedSubmissions && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-medium text-[16px] text-slate-800">
              Ошибки проверки
            </div>
            <Button
              onClick={handleReshoot}
              className="bg-[#096ff5] text-white rounded-[180px] h-9 px-4 text-[16px] font-medium hover:bg-[#096ff5]/90"
            >
              Переснять
            </Button>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {failedSubmissions.map((submission) => (
              <div key={submission.id} className="bg-slate-50 flex items-center justify-between px-6 py-[18px] rounded-[24px]">
                <div className="flex items-center gap-3">
                  <div className="font-medium text-[18px] text-slate-800">
                    {submission.student_name || 'Студент'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#e33629]"></div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Section - Only show if there are completed submissions */}
      {completedSubmissions.length > 0 && (
        <div className="mb-6">
          {hasFailedSubmissions && (
            <div className="font-medium text-[16px] text-slate-800 mb-4">
              Успешно проверенные
            </div>
          )}
          
          <div className="flex flex-col gap-2.5">
            {completedSubmissions.map((submission) => (
              <div key={submission.id} className="bg-slate-50 flex items-center justify-between px-6 py-[18px] rounded-[24px]">
                <div className="font-medium text-[18px] text-slate-800">
                  {submission.student_name || 'Студент'}
                </div>
                <div className={`font-extrabold text-[20px] ${getGradeColor(submission.evaluation_results?.[0]?.final_grade || 2)}`}>
                  {submission.evaluation_results?.[0]?.final_grade || '?'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-[18px] py-3">
        <Button
          onClick={handleLoadMore}
          className={`w-full h-14 rounded-[180px] text-[16px] font-medium ${
            hasFailedSubmissions 
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' 
              : 'bg-[#096ff5] text-white hover:bg-[#096ff5]/90'
          }`}
        >
          Загрузить работы
        </Button>
      </div>
    </div>
  )
}