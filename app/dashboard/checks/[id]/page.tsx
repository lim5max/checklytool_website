'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PendingSubmissions } from '@/components/checks/PendingSubmissions'
import { PostCheckSummary } from '@/components/checks/PostCheckSummary'
import { CameraWorkInterface } from '@/components/camera/CameraWorkInterface'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getDraft, clearDraft } from '@/lib/drafts'
import { submitStudents, evaluateAll } from '@/lib/upload-submissions'

interface StudentResult {
  id: string
  name: string
  grade: number
}

interface CheckData {
  id: string
  title: string
  results: StudentResult[]
}

interface CheckPageProps {
  params: Promise<{ id: string }>
}

export default function CheckPage({ params }: CheckPageProps) {
  const router = useRouter()
  const [checkData, setCheckData] = useState<CheckData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkId, setCheckId] = useState<string>('')
  const [hasDrafts, setHasDrafts] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraKey, setCameraKey] = useState(0)
  const [isSending, setIsSending] = useState(false)

  const handleOpenCamera = () => {
    console.log('[CHECK_PAGE] Opening camera')
    setIsCameraOpen(true)
    setCameraKey(k => k + 1)
  }

  const handleCloseCamera = () => {
    console.log('[CHECK_PAGE] Closing camera')
    setIsCameraOpen(false)
  }

  const handleCameraSubmit = async () => {
    console.log('[CHECK_PAGE] Camera submit')
    setIsCameraOpen(false)
    toast.success('Фото сохранены в черновики')
  }

  // Глобальная логика отправки на проверку
  const handleSendAll = useCallback(async () => {
    const draft = getDraft(checkId)
    const canSend = draft?.students?.some((s) => s.photos.length > 0) ?? false

    if (!draft || !canSend) {
      toast.error('Нет работ для отправки')
      return
    }

    try {
      setIsSending(true)
      const { items } = await submitStudents(checkId, draft.students)
      // Запускаем проверку, но не блокируем переход
      evaluateAll(items.map((i) => ({ submissionId: i.submissionId }))).catch((err) => {
        console.error('Evaluate errors:', err)
      })
      clearDraft(checkId)
      // Уведомляем о завершении upload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submissions:uploaded', {
          detail: { checkId, items }
        }))
      }
      toast.success('Работы отправлены на проверку')
    } catch (e) {
      console.error('Submit error:', e)
      toast.error('Ошибка при отправке работ')
      // Даже при ошибках уведомляем о завершении
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submissions:uploaded', {
          detail: { checkId, items: [] }
        }))
      }
    } finally {
      setIsSending(false)
    }
  }, [checkId])

  // Вычисляем canSend
  const canSend = useMemo(() => {
    if (!hasDrafts) return false
    const draft = getDraft(checkId)
    return draft?.students?.some((s) => s.photos.length > 0) ?? false
  }, [hasDrafts, checkId])

  // Определяем функции перед их использованием в useEffect
  const loadCheckData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/checks/${checkId}`)
      
      if (!response.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const data = await response.json()
      
      // Check if there are any results from the API
      const results = data.check.results || []
      
      setCheckData({
        id: data.check.id,
        title: data.check.title,
        results: results
      })

    } catch (error) {
      console.error('Error loading check data:', error)
      toast.error('Не удалось загрузить данные')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [checkId, router])


  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadCheckData()
    }
  }, [checkId, loadCheckData])

  // Detect local drafts for this check and toggle pending view
  useEffect(() => {
    if (!isLoading && checkId) {
      try {
        const draft = getDraft(checkId)
        const present = !!(draft && draft.students && draft.students.some((s) => s.photos.length > 0))
        setHasDrafts(present)
      } catch {
        setHasDrafts(false)
      }
    }
  }, [isLoading, checkId])

  // Мемоизируем event handlers для предотвращения лишних ререндеров
  const onDraftsUpdated = useCallback(() => {
    console.log('[CHECK_PAGE] drafts:updated event received')
    try {
      const draft = getDraft(checkId)
      const present = !!(draft && draft.students && draft.students.some((s) => s.photos.length > 0))
      console.log('[CHECK_PAGE] Draft present:', present)
      console.log('[CHECK_PAGE] Draft students count:', draft?.students?.length || 0)
      setHasDrafts(present)
    } catch {
      console.log('[CHECK_PAGE] Error reading drafts, setting to false')
      setHasDrafts(false)
    }
  }, [checkId])

  const onSubmissionsUploaded = useCallback(() => {
    console.log('[CHECK_PAGE] Submissions uploaded, updating state')
    setHasDrafts(false)
  }, [])

  const onEvaluationComplete = useCallback(() => {
    console.log('[CHECK_PAGE] Evaluation completed - PostCheckSummary will handle data reload')
  }, [])

  // Live update: react to camera/drafts changes without reload
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('drafts:updated', onDraftsUpdated)
      window.addEventListener('submissions:uploaded', onSubmissionsUploaded)
      window.addEventListener('evaluation:complete', onEvaluationComplete)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('drafts:updated', onDraftsUpdated)
        window.removeEventListener('submissions:uploaded', onSubmissionsUploaded)
        window.removeEventListener('evaluation:complete', onEvaluationComplete)
      }
    }
  }, [onDraftsUpdated, onSubmissionsUploaded, onEvaluationComplete])


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="space-y-4">
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

  if (!checkData) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
          <p className="text-gray-600">Возможно, работа была удалена или у вас нет прав доступа</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4">
      <div className="max-w-md mx-auto">
        {/* Всегда показываем результаты проверки */}
        <PostCheckSummary
          checkId={checkId}
          title={checkData.title}
          onOpenCamera={handleOpenCamera}
        />

        {/* Дополнительно показываем черновики если они есть */}
        {hasDrafts && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <PendingSubmissions
              checkId={checkId}
              isSecondaryView={true}
            />
          </div>
        )}

        {/* Глобальные кнопки внизу страницы */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-[18px] py-3">
          <div className="max-w-md mx-auto">
            <div className="flex flex-col gap-2">
              {/* Если есть черновики - показываем кнопку проверки */}
              {hasDrafts && canSend && (
                <Button
                  className="w-full rounded-[180px] h-14"
                  onClick={handleSendAll}
                  disabled={isSending}
                >
                  {isSending ? 'Отправляем...' : 'Проверить работы'}
                </Button>
              )}

              {/* Кнопка загрузки работ - всегда показываем */}
              <Button
                className={`w-full rounded-[180px] h-14 ${hasDrafts && canSend ? '' : ''}`}
                variant={hasDrafts && canSend ? 'secondary' : 'default'}
                onClick={handleOpenCamera}
                disabled={isSending}
              >
                Загрузить работы
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Camera Interface - не размонтируется при переключении состояний */}
      <CameraWorkInterface
        key={cameraKey}
        isOpen={isCameraOpen}
        checkId={checkId}
        onClose={handleCloseCamera}
        onSubmit={handleCameraSubmit}
        checkTitle={checkData.title}
        maxPhotosPerStudent={5}
      />
    </div>
  )
}