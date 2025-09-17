'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyCheckState } from '@/components/checks/EmptyCheckState'
import { PendingSubmissions } from '@/components/checks/PendingSubmissions'
import { PostCheckSummary } from '@/components/checks/PostCheckSummary'
import { CameraWorkInterface } from '@/components/camera/CameraWorkInterface'
import { toast } from 'sonner'
import { getDraft, getTempFailedNames } from '@/lib/drafts'

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
  const [submissionCount, setSubmissionCount] = useState<number>(0)
  const [hasAnySubmissions, setHasAnySubmissions] = useState<boolean>(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraKey, setCameraKey] = useState(0)

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
      // Aggregate count (может обновляться с лагом)
      setSubmissionCount(Number(data.submission_count || 0))
      
    } catch (error) {
      console.error('Error loading check data:', error)
      toast.error('Не удалось загрузить данные')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [checkId, router])

  // Быстрый индикатор наличия отправок (не зависит от статистики)
  const loadHasSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`/api/checks/${checkId}/submissions`)
      if (!res.ok) {
        setHasAnySubmissions(false)
        return
      }
      const data = await res.json()
      setHasAnySubmissions(Array.isArray(data.submissions) && data.submissions.length > 0)
    } catch {
      setHasAnySubmissions(false)
    }
  }, [checkId])

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
      loadHasSubmissions()
    }
  }, [checkId, loadCheckData, loadHasSubmissions])

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
    setHasAnySubmissions(true)
    loadHasSubmissions()
  }, [loadHasSubmissions])

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

  // Мемоизируем сложные вычисления для предотвращения ререндеров
  const hasResults = useMemo(() => {
    if (!checkData) {
      return false
    }

    const tempNames = getTempFailedNames(checkId)
    const hasTempFailures = tempNames.length > 0
    const hasRes = hasAnySubmissions ||
      (submissionCount && submissionCount > 0) ||
      (checkData.results && checkData.results.length > 0) ||
      hasTempFailures

    console.log('[CHECK_PAGE] Result calculation:', {
      checkId,
      hasAnySubmissions,
      submissionCount,
      checkDataResultsLength: checkData.results?.length || 0,
      tempFailedNames: tempNames,
      hasTempFailures,
      hasResults: hasRes
    })

    return hasRes
  }, [checkId, hasAnySubmissions, submissionCount, checkData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6">
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
          <p className="text-gray-600">Возможно, работа была удалена или у вас нет прав доступа</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {hasDrafts ? (
        <div className="px-4 pb-6">
          <div className="max-w-md mx-auto">
            <PendingSubmissions checkId={checkId} title={checkData.title} onOpenCamera={handleOpenCamera} />
          </div>
        </div>
      ) : hasResults ? (
        <div className="px-4 pb-6">
          <div className="max-w-md mx-auto">
            <PostCheckSummary checkId={checkId} title={checkData.title} onOpenCamera={handleOpenCamera} />
          </div>
        </div>
      ) : (
        <EmptyCheckState title={checkData.title} checkId={checkId} onOpenCamera={handleOpenCamera} />
      )}
      
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