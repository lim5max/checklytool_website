'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { clearDraft, setDraftStudents, getTempFailedNames, clearTempFailedNames, addTempFailedName } from '@/lib/drafts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Settings, Menu, Trash2 } from 'lucide-react'

type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface EvaluationResult {
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
}

interface StudentSubmission {
  id: string
  student_name?: string
  student_class?: string
  submission_images: string[]
  created_at: string
  updated_at: string
  status: SubmissionStatus
  evaluation_results?: EvaluationResult[]
  error_message?: string
  error_details?: Record<string, unknown>
}

interface PostCheckSummaryProps {
  checkId: string
  title?: string
  onOpenCamera?: () => void
}

export function PostCheckSummary({ checkId, title = 'Контрольная по информатике', onOpenCamera }: PostCheckSummaryProps) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        console.log('[POST_CHECK_SUMMARY] Loading submissions for checkId:', checkId)
        const res = await fetch(`/api/checks/${checkId}/submissions`)
        console.log('[POST_CHECK_SUMMARY] API response status:', res.status)
        console.log('[POST_CHECK_SUMMARY] API response headers:', Object.fromEntries(res.headers.entries()))
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('[POST_CHECK_SUMMARY] API error response:', errorText)
          throw new Error('Не удалось загрузить отправленные работы')
        }
        
        const data: { submissions: StudentSubmission[] } = await res.json()
        console.log('[POST_CHECK_SUMMARY] Raw API response data:', data)
        console.log('[POST_CHECK_SUMMARY] Submissions array length:', data.submissions?.length || 0)
        
        if (data.submissions) {
          data.submissions.forEach((s, i) => {
            console.log(`[POST_CHECK_SUMMARY] Submission ${i} detailed:`, {
              id: s.id,
              student_name: s.student_name,
              student_class: s.student_class,
              status: s.status,
              error_message: s.error_message,
              error_details: s.error_details,
              evaluation_results: s.evaluation_results,
              created_at: s.created_at,
              updated_at: s.updated_at,
              submission_images: s.submission_images
            })
          })
          
          const failedSubs = data.submissions.filter(s => s.status === 'failed')
          const completedSubs = data.submissions.filter(s => s.status === 'completed')
          const pendingSubs = data.submissions.filter(s => s.status === 'pending')
          const processingSubs = data.submissions.filter(s => s.status === 'processing')
          
          console.log('[POST_CHECK_SUMMARY] Status breakdown:', {
            total: data.submissions.length,
            failed: failedSubs.length,
            completed: completedSubs.length,
            pending: pendingSubs.length,
            processing: processingSubs.length
          })
          
          console.log('[POST_CHECK_SUMMARY] Failed submissions detailed:', failedSubs.map(s => ({
            id: s.id,
            student_name: s.student_name,
            error_message: s.error_message,
            error_details: s.error_details,
            hasErrorMessage: !!s.error_message,
            errorMessageLength: s.error_message?.length || 0
          })))
          
          console.log('[POST_CHECK_SUMMARY] Completed submissions detailed:', completedSubs.map(s => ({
            id: s.id,
            student_name: s.student_name,
            hasEvaluationResults: !!s.evaluation_results,
            evaluationCount: s.evaluation_results?.length || 0
          })))
        }
        
        setSubmissions(data.submissions || [])
      } catch (e) {
        console.error('[POST_CHECK_SUMMARY] Error loading submissions:', e)
        console.error('[POST_CHECK_SUMMARY] Error details:', {
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined
        })
        toast.error('Ошибка загрузки списка работ')
      } finally {
        setLoading(false)
      }
    }
    load()
    
    // Обновляем данные при получении отчетов об ошибках
    let reloadTimeout: NodeJS.Timeout | null = null
    
    const onEvaluationComplete = () => {
      console.log('[POST_CHECK_SUMMARY] Evaluation completed, scheduling reload...')
      
      // Отменяем предыдущий таймер если он есть
      if (reloadTimeout) {
        clearTimeout(reloadTimeout)
      }
      
      // Устанавливаем новый таймер
      reloadTimeout = setTimeout(() => {
        console.log('[POST_CHECK_SUMMARY] Actually reloading data now')
        load()
        reloadTimeout = null
      }, 2500) // Немного увеличиваем задержку
    }
    
    const onSubmissionsUploaded = () => {
      console.log('[POST_CHECK_SUMMARY] Submissions uploaded, clearing temp errors and reloading...')
      // Очищаем временные ошибки из localStorage так как отправка прошла успешно
      clearTempFailedNames(checkId)
      // Перезагружаем данные
      setTimeout(() => load(), 500)
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('evaluation:complete', onEvaluationComplete)
      window.addEventListener('submissions:uploaded', onSubmissionsUploaded)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('evaluation:complete', onEvaluationComplete)
        window.removeEventListener('submissions:uploaded', onSubmissionsUploaded)
        // Очищаем таймер при размонтировании
        if (reloadTimeout) {
          clearTimeout(reloadTimeout)
        }
      }
    }
  }, [checkId])

  const failedSubs = useMemo(() => {
    const failed = submissions.filter((s) => s.status === 'failed')
    
    // Добавляем временные ошибки из localStorage (500 ошибки при отправке)
    const tempFailedNames = getTempFailedNames(checkId)
    const tempFailedSubs: StudentSubmission[] = tempFailedNames.map(name => ({
      id: `temp-${name}-${Date.now()}`,
      student_name: name,
      student_class: '',
      submission_images: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'failed' as SubmissionStatus,
      error_message: 'Ошибка при отправке фотографий на сервер (500)',
      error_details: { type: 'upload_error', isTemporary: true }
    }))
    
    // Убираем дубли - если есть и серверная ошибка и временная для одного имени
    const allFailed = [...failed, ...tempFailedSubs]
    const uniqueFailed = allFailed.filter((sub, index, self) => 
      index === self.findIndex(s => s.student_name === sub.student_name)
    )
    
    console.log('[POST_CHECK_SUMMARY] useMemo failedSubs:', {
      totalSubmissions: submissions.length,
      failedCount: uniqueFailed.length,
      failedIds: uniqueFailed.map(s => s.id),
      failedNames: uniqueFailed.map(s => s.student_name),
      tempFailedCount: tempFailedSubs.length,
      tempFailedNames: tempFailedNames
    })
    
    return uniqueFailed
  }, [submissions, checkId])

  const completedSubs = useMemo(() => {
    const completed = submissions.filter((s) => s.status === 'completed')
    console.log('[POST_CHECK_SUMMARY] useMemo completedSubs:', {
      totalSubmissions: submissions.length,
      completedCount: completed.length,
      completedIds: completed.map(s => s.id),
      completedNames: completed.map(s => s.student_name)
    })
    return completed
  }, [submissions])

  const handleOpenCamera = () => {
    onOpenCamera?.()
  }

  const handleReshoot = async () => {
    try {
      // Собираем только неудачные имена из сервера
      const serverFailedNames = failedSubs
        .map((s) => (s.student_name || '').trim())
        .filter((n) => n.length > 0)

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

      onOpenCamera?.()
    } catch (e) {
      console.error(e)
      toast.error('Не удалось подготовить пересъемку')
    }
  }

  const handleDeleteFailedSubmission = async (submission: StudentSubmission) => {
    try {
      const isTemporary = submission.error_details?.isTemporary === true

      if (isTemporary) {
        // Временная ошибка - удаляем из localStorage
        const tempFailedNames = getTempFailedNames(checkId)
        const updatedNames = tempFailedNames.filter(name => name !== submission.student_name)
        clearTempFailedNames(checkId)
        updatedNames.forEach(name => addTempFailedName(checkId, name))

        toast.success(`Работа "${submission.student_name}" удалена`)

        // Обновляем состояние (не перезагружаем весь список)
        setSubmissions(prev => prev.filter(s => s.id !== submission.id))
      } else {
        // Серверная ошибка - удаляем через API
        const response = await fetch(`/api/submissions/${submission.id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Не удалось удалить работу')
        }

        toast.success(`Работа "${submission.student_name}" удалена`)

        // Обновляем состояние
        setSubmissions(prev => prev.filter(s => s.id !== submission.id))
      }
    } catch (error) {
      console.error('Error deleting failed submission:', error)
      toast.error('Не удалось удалить работу')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
              <div className="h-10 bg-gray-200 rounded animate-pulse w-10" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-6" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-6" />
            </div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="space-y-2">
              <div className="h-16 bg-gray-200 rounded-[24px] animate-pulse" />
              <div className="h-16 bg-gray-200 rounded-[24px] animate-pulse" />
              <div className="h-16 bg-gray-200 rounded-[24px] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const hasErrors = failedSubs.length > 0

  console.log('[POST_CHECK_SUMMARY] Render state:', {
    loading,
    hasErrors,
    failedSubsLength: failedSubs.length,
    completedSubsLength: completedSubs.length,
    submissionsLength: submissions.length,
    willRenderErrorsSection: !loading && hasErrors,
    failedSubsDetailed: failedSubs.map(s => ({
      id: s.id,
      name: s.student_name,
      error_message: s.error_message,
      isTemporary: s.error_details?.isTemporary
    }))
  })

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        {/* Brand header (logo + burger) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/images/logo.png"
              alt="ChecklyTool"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <button
            className="w-[42px] h-[42px] flex items-center justify-center"
            aria-label="Меню"
          >
            <Menu className="w-6 h-6 text-slate-900" />
          </button>
        </div>

        {/* Local nav like empty state: X left, gear right */}
        <div className="flex items-center justify-between -mt-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Закрыть и вернуться на главную"
          >
            <X className="w-6 h-6 text-slate-800" />
          </button>
          <button
            onClick={() => {}}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Настройки"
          >
            <Settings className="w-6 h-6 text-slate-800" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-[28px] font-black leading-[1.2] text-slate-800">{title}</h1>
        </div>

        {/* Ошибки проверки + Переснять */}
        {hasErrors && (() => {
          console.log('[POST_CHECK_SUMMARY] ===== RENDERING ERRORS SECTION =====')
          console.log('[POST_CHECK_SUMMARY] hasErrors:', hasErrors)
          console.log('[POST_CHECK_SUMMARY] failedSubs.length:', failedSubs.length)
          console.log('[POST_CHECK_SUMMARY] failedSubs:', failedSubs)
          console.log('[POST_CHECK_SUMMARY] About to render', failedSubs.length, 'error cards')
          return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between w-full">
              <div className="font-medium text-slate-800 text-[16px] leading-[1.5]">
                <p>Ошибки проверки</p>
              </div>
              <button
                className="bg-[#096ff5] rounded-[180px] h-9 px-4 text-white text-[16px] font-medium"
                onClick={handleReshoot}
                aria-label="Переснять"
              >
                Переснять
              </button>
            </div>

            <div className="flex flex-col gap-2.5 items-center justify-start w-[343px] max-w-full">
              {failedSubs.map((s, index) => {
                console.log('[POST_CHECK_SUMMARY] Rendering error card for submission:', {
                  index,
                  id: s.id,
                  student_name: s.student_name,
                  error_message: s.error_message,
                  error_details: s.error_details,
                  hasErrorMessage: !!s.error_message
                })
                return (
                  <div key={s.id} className="flex items-center gap-2 w-full">
                    <div className="bg-slate-50 flex flex-col gap-2.5 items-start justify-start px-6 py-[18px] rounded-[24px] flex-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="font-medium text-slate-800 text-[18px] leading-[1.6]">
                            <p>{s.student_name || 'Студент'}</p>
                          </div>
                        </div>
                        {/* маленькая красная точка как в макете */}
                        <div className="h-2 w-2 rounded-full bg-[#e33629]" />
                      </div>
                      {/* Показываем описание ошибки */}
                      <div className="text-[14px] text-slate-600 leading-[1.4]">
                        <p>
                          {s.error_message || 'Ошибка при проверке работы. Попробуйте переснять фотографии.'}
                        </p>
                        {/* Debug: показываем error_details если есть */}
                        {process.env.NODE_ENV === 'development' && s.error_details && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer">Debug: error_details</summary>
                            <pre className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">
                              {JSON.stringify(s.error_details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteFailedSubmission(s)}
                      className="shrink-0 h-[74px] w-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                      aria-label={`Удалить работу ${s.student_name}`}
                    >
                      <Trash2 className="w-5 h-5 text-[#e33629]" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          )
        })()}

        {/* Успешно проверенные - показываем только если есть завершенные работы */}
        {completedSubs.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="font-medium text-slate-800 text-[16px] leading-[1.5]">
              <p>Успешно проверенные</p>
            </div>

            <div className="flex flex-col gap-2.5 items-center justify-start w-[343px] max-w-full">
              {completedSubs.map((s) => {
                const grade = s.evaluation_results?.[0]?.final_grade
                return (
                  <div key={s.id} className="bg-slate-50 flex flex-col gap-2.5 items-start justify-start px-6 py-[18px] rounded-[24px] w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-slate-800 text-[18px] leading-[1.6]">
                          <p>{s.student_name || 'Студент'}</p>
                        </div>
                      </div>
                      {typeof grade === 'number' ? (
                        <div className="font-extrabold text-[20px] leading-[1.2] text-[#319f43]">
                          <p>{grade}</p>
                        </div>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom single button as in Figma */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-[18px] py-3">
        <button
          className={`w-full h-14 rounded-[180px] px-[43px] text-[16px] font-medium ${
            hasErrors 
              ? 'bg-slate-100 text-slate-800' 
              : 'bg-[#096ff5] text-white'
          }`}
          onClick={() => onOpenCamera?.()}
        >
          Загрузить работы
        </button>
      </div>

    </div>
  )
}