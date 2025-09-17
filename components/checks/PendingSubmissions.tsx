'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getDraft, type DraftBundle, removeStudent } from '@/lib/drafts'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface PendingSubmissionsProps {
  checkId: string
  isSecondaryView?: boolean // Флаг для режима второстепенного отображения
}

export function PendingSubmissions({ checkId, isSecondaryView = false }: PendingSubmissionsProps) {
  const [bundle, setBundle] = useState<DraftBundle | null>(null)

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

  if (!bundle || bundle.students.length === 0) {
    // Fallback to nothing; parent page can decide to show empty state
    return null
  }

  return (
      <div className={isSecondaryView ? "flex flex-col gap-6" : "max-w-md mx-auto flex flex-col gap-6"}>
        {/* Навигация убрана - теперь она в PostCheckSummary */}

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


        {/* Кнопки убираем - они будут глобальными на странице */}
      </div>
  )
}