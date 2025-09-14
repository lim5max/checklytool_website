'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { EmptyCheckState } from '@/components/checks/EmptyCheckState'
import { PendingSubmissions } from '@/components/checks/PendingSubmissions'
import { PostCheckSummary } from '@/components/checks/PostCheckSummary'
import { CameraWorkInterface } from '@/components/camera/CameraWorkInterface'
import { toast } from 'sonner'
import { getDraft } from '@/lib/drafts'

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

  // Live update: react to camera/drafts changes without reload
  useEffect(() => {
    const onDraftsUpdated = () => {
      console.log('[CHECK_PAGE] drafts:updated event received')
      try {
        const draft = getDraft(checkId)
        const present = !!(draft && draft.students && draft.students.some((s) => s.photos.length > 0))
        console.log('[CHECK_PAGE] Draft present:', present, 'Current hasDrafts:', hasDrafts)
        console.log('[CHECK_PAGE] Draft students count:', draft?.students?.length || 0)
        setHasDrafts(present)
      } catch {
        console.log('[CHECK_PAGE] Error reading drafts, setting to false')
        setHasDrafts(false)
      }
    }

    const onSubmissionsUploaded = () => {
      console.log('[CHECK_PAGE] Submissions uploaded, updating state')
      // После upload обновляем состояние
      setHasDrafts(false) // черновики очищены
      setHasAnySubmissions(true) // теперь есть submissions
      loadHasSubmissions() // обновляем данные
    }

    const onEvaluationComplete = () => {
      console.log('[CHECK_PAGE] Evaluation completed - PostCheckSummary will handle data reload')
      // PostCheckSummary сам обновляет свои данные, нам не нужно дублировать загрузку
      // loadCheckData()
      // loadHasSubmissions()
    }

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
  }, [checkId, loadCheckData, loadHasSubmissions, hasDrafts])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Загрузка...</div>
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

  const hasResults = hasAnySubmissions || (submissionCount && submissionCount > 0) || (checkData.results && checkData.results.length > 0)

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