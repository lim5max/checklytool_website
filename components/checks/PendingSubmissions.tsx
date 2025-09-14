'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDraft, type DraftBundle, removeStudent, clearDraft } from '@/lib/drafts'
import { submitStudents, evaluateAll } from '@/lib/upload-submissions'
import { toast } from 'sonner'
import { X, Settings, Trash2 } from 'lucide-react'

interface PendingSubmissionsProps {
  checkId: string
  title?: string
  onOpenCamera?: () => void
}

export function PendingSubmissions({ checkId, title = 'Контрольная по информатике', onOpenCamera }: PendingSubmissionsProps) {
  const router = useRouter()
  const [bundle, setBundle] = useState<DraftBundle | null>(null)
  const [sending, setSending] = useState(false)

  // Load drafts on mount and when camera closes
  const reload = () => {
    const b = getDraft(checkId)
    setBundle(b)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkId])

  // Live update when camera writes drafts
  useEffect(() => {
    const onDraftsUpdated = () => reload()
    if (typeof window !== 'undefined') {
      window.addEventListener('drafts:updated', onDraftsUpdated)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('drafts:updated', onDraftsUpdated)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalPhotos = useMemo(
    () => bundle?.students.reduce((sum, s) => sum + s.photos.length, 0) ?? 0,
    [bundle]
  )

  const canSend = (bundle?.students ?? []).some((s) => s.photos.length > 0)

  const handleOpenCamera = () => {
    onOpenCamera?.()
  }

  const handleSendAll = async () => {
    if (!bundle || !canSend) {
      toast.error('Нет работ для отправки')
      return
    }
    try {
      setSending(true)
      const { items } = await submitStudents(checkId, bundle.students)
      // Запускаем проверку, но не блокируем переход (экран 2790:494)
      evaluateAll(items.map((i) => ({ submissionId: i.submissionId }))).catch((err) => {
        console.error('Evaluate errors:', err)
      })
      clearDraft(checkId)
      // Вместо перенаправления, уведомляем родителя о завершении upload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submissions:uploaded', { 
          detail: { checkId, items }
        }))
      }
    } catch (e) {
      console.error('Submit error:', e)
      // Даже при ошибках уведомляем о завершении
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submissions:uploaded', { 
          detail: { checkId, items: [] }
        }))
      }
    } finally {
      setSending(false)
    }
  }

  if (!bundle || bundle.students.length === 0) {
    // Fallback to nothing; parent page can decide to show empty state
    return null
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        {/* Local nav like Empty state: X left, gear right */}
        <div className="flex items-center justify-between mb-2">
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
          <h1 className="font-nunito font-black text-[28px] leading-[1.1] tracking-[-0.4px] text-slate-800 mt-1">{title}</h1>
        </div>

        {/* Section label like Figma */}
        <div className="font-medium text-slate-800 text-[16px] leading-[1.5]">
          <p>Работы к проверке</p>
        </div>

        {/* Students list */}
        <div className="flex flex-col gap-2.5">
          {(bundle.students ?? []).map((student) => (
            <div key={student.id} className="flex items-center gap-2 w-full">
              {/* Card 64px height */}
              <Card className="bg-slate-50 rounded-[24px] flex-1 py-0">
                <CardContent className="relative px-6 py-0">
                  <div className="flex items-center h-16">
                    {/* reserve space for left status dot */}
                    <div className="pl-8 min-w-0">
                      <div className="text-[18px] text-slate-800 leading-[1.4] font-medium">
                        <p className="truncate">{student.name}</p>
                      </div>
                    </div>
                    {/* yellow status dot — 8px diameter, aligned to left edge of content */}
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 block h-2 w-2 rounded-full bg-[#f59e09]" />
                  </div>
                </CardContent>
              </Card>

              {/* Delete button next to the card (not overlayed) */}
              <button
                onClick={() => {
                  console.log('[PENDING_SUBMISSIONS] Removing student:', student.name)
                  removeStudent(checkId, student.id)
                  toast.success(`Удалены черновики для "${student.name}"`)
                  reload()
                  // Отправляем событие об обновлении черновиков
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('drafts:updated'))
                  }
                }}
                className="shrink-0 h-16 w-8 flex items-center justify-center rounded-lg hover:bg-red-50"
                aria-label={`Удалить черновики для ${student.name}`}
              >
                <Trash2 className="w-5 h-5 text-[#e33629]" />
              </button>
            </div>
          ))}
        </div>


        {/* Bottom actions — stacked like Figma */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-[18px] py-3">
          <div className="flex flex-col gap-2">
            <Button
              className="w-full rounded-[180px] h-14"
              onClick={handleSendAll}
              disabled={!canSend || sending}
            >
              Проверить работы
            </Button>
            <Button
              className="w-full rounded-[180px] h-14"
              variant="secondary"
              onClick={handleOpenCamera}
              disabled={sending}
            >
              Загрузить работы
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}