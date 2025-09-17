/**
 * Shared helpers to submit multi-student drafts and trigger evaluation.
 * Reuses existing API endpoints:
 * - POST /api/checks/[checkId]/submissions
 * - POST /api/submissions/[submissionId]/evaluate
 */
import type { DraftStudent } from './drafts'

export interface SubmitResultItem {
  student: DraftStudent
  submissionId: string
}

export interface SubmitAllResult {
  items: SubmitResultItem[]
  failedNames: string[]
}

/**
 * Convert a data URL to a File (image/jpeg by default).
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  // Try to preserve mime type from blob if possible
  const type = blob.type || 'image/jpeg'
  return new File([blob], filename, { type })
}

/**
 * Submits students' photos for a given checkId.
 * Returns an array of { student, submissionId } to be used by evaluateAll().
 */
export async function submitStudents(
  checkId: string,
  students: DraftStudent[],
  opts?: { studentClass?: string }
): Promise<SubmitAllResult> {
  const items: SubmitResultItem[] = []
  const failedNames: string[] = []

  // Only process students with at least one photo
  const validStudents = students.filter((s) => s.photos.length > 0)

  for (const student of validStudents) {
    try {
      const formData = new FormData()
      formData.append('student_name', student.name)
      if (opts?.studentClass) {
        formData.append('student_class', opts.studentClass)
      }

      // Append images as files
      let index = 0
      for (const photo of student.photos) {
        index += 1
        const file = await dataUrlToFile(photo.dataUrl, `photo_${index}.jpg`)
        formData.append('images', file)
      }

      const response = await fetch(`/api/checks/${checkId}/submissions`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Try to read error message
        let message = 'Ошибка при загрузке работы'
        try {
          const data = await response.json()
          message = data?.error || message
        } catch {
          // ignore
        }
        // mark this student as failed locally and continue
        try {
          const { addTempFailedName } = await import('./drafts')
          console.log('[UPLOAD] Adding temp failed name to localStorage:', {
            checkId,
            studentName: student.name,
            responseStatus: response.status,
            errorMessage: message
          })
          addTempFailedName(checkId, student.name)
        } catch (e) {
          console.error('[UPLOAD] Failed to add temp failed name:', e)
        }
        failedNames.push(student.name)
        continue
      }

      const result = await response.json()

      // Try to extract submission id from different possible shapes
      const submissionId: string | undefined =
        result?.submission?.id ??
        result?.submissionId ??
        result?.id ??
        result?.submission?.submissionId

      if (!submissionId) {
        // if no id — treat as failed for reshoot
        try {
          const { addTempFailedName } = await import('./drafts')
          console.log('[UPLOAD] Adding temp failed name (no submission ID):', {
            checkId,
            studentName: student.name,
            result
          })
          addTempFailedName(checkId, student.name)
        } catch (e) {
          console.error('[UPLOAD] Failed to add temp failed name (no ID):', e)
        }
        failedNames.push(student.name)
        continue
      }

      items.push({ student, submissionId })
    } catch (error) {
      // Network or unexpected error — mark as failed and continue
      try {
        const { addTempFailedName } = await import('./drafts')
        console.log('[UPLOAD] Adding temp failed name (network error):', {
          checkId,
          studentName: student.name,
          error: error instanceof Error ? error.message : String(error)
        })
        addTempFailedName(checkId, student.name)
      } catch (e) {
        console.error('[UPLOAD] Failed to add temp failed name (network error):', e)
      }
      failedNames.push(student.name)
    }
  }

  return { items, failedNames }
}

/**
 * Triggers evaluation for each submission and waits for all to finish (fire-and-wait).
 * If any request fails, throws an aggregated error after attempting all.
 */
export async function evaluateAll(submissions: Array<{ submissionId: string }>): Promise<void> {
  const errors: Array<{ id: string; error: string }> = []

  await Promise.all(
    submissions.map(async (s) => {
      try {
        const res = await fetch(`/api/submissions/${s.submissionId}/evaluate`, {
          method: 'POST',
        })
        if (!res.ok) {
          let msg = 'Ошибка при запуске проверки'
          let shouldTreatAsError = true
          
          try {
            const body = await res.json()
            msg = body?.error || msg
            
            // Если это inappropriate_content, это не техническая ошибка, а нормальный результат работы AI
            if (body?.error === 'inappropriate_content') {
              console.log(`[EVALUATE_ALL] AI detected inappropriate content for ${s.submissionId} - this is expected behavior`)
              shouldTreatAsError = false
            }
          } catch {
            // ignore JSON parse errors
          }
          
          if (shouldTreatAsError) {
            errors.push({ id: s.submissionId, error: msg })
          }
        }
      } catch (e) {
        errors.push({ id: s.submissionId, error: e instanceof Error ? e.message : 'Unknown error' })
      }
    })
  )

  // Отправляем событие о завершении оценки (даже при ошибках для обновления UI)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('evaluation:complete', {
      detail: { 
        submissionIds: submissions.map(s => s.submissionId),
        errors: errors
      }
    }))
  }

  if (errors.length) {
    const detail = errors.map((x) => `${x.id}: ${x.error}`).join('; ')
    throw new Error(`Не удалось запустить проверку для некоторых работ: ${detail}`)
  }
}