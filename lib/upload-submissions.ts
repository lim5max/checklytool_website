/**
 * Shared helpers to submit multi-student drafts and trigger evaluation.
 * Reuses existing API endpoints:
 * - POST /api/checks/[checkId]/submissions
 * - POST /api/submissions/[submissionId]/evaluate
 */
import type { DraftStudent } from './drafts-idb'

export interface SubmitResultItem {
  student: DraftStudent
  submissionId: string
}

export interface SubmitAllResult {
  items: SubmitResultItem[]
  failedNames: string[]
}

/**
 * Нормализует имя студента для сравнения: lowercase, trim, удаляет лишние пробелы
 */
function normalizeStudentName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ') // множественные пробелы → один пробел
}

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * Используется для определения похожести имен
 */
function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = []

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i]
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1]
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // замена
					matrix[i][j - 1] + 1,     // вставка
					matrix[i - 1][j] + 1      // удаление
				)
			}
		}
	}

	return matrix[b.length][a.length]
}

/**
 * Проверяет, являются ли два имени похожими (возможно, дубликаты)
 * Использует нормализацию и расстояние Левенштейна
 */
function areNamesSimilar(name1: string, name2: string): boolean {
	const normalized1 = normalizeStudentName(name1)
	const normalized2 = normalizeStudentName(name2)

	// Если имена идентичны после нормализации - это дубликат
	if (normalized1 === normalized2) {
		return true
	}

	// ИСКЛЮЧЕНИЕ: Шаблонные имена (Ученик N, Студент N) НЕ считаем похожими
	// Паттерн: "ученик 123", "студент 5", "student 10" и т.д.
	const templatePattern = /^(ученик|студент|student|учащийся)\s*\d+$/i
	const isTemplate1 = templatePattern.test(normalized1)
	const isTemplate2 = templatePattern.test(normalized2)

	if (isTemplate1 || isTemplate2) {
		// Шаблонные имена объединяем только если полностью идентичны
		return false
	}

	// Вычисляем расстояние Левенштейна
	const distance = levenshteinDistance(normalized1, normalized2)
	const maxLength = Math.max(normalized1.length, normalized2.length)

	// Считаем похожими если различий меньше 20% от длины
	// Например: "Хоршев Илья" и "Хорнев Илья" - 1 символ различия из 12 = 8.3%
	const similarityThreshold = 0.2
	return distance / maxLength <= similarityThreshold
}

/**
 * Дедупликация студентов - объединяет студентов с похожими именами
 * Возвращает массив уникальных студентов и логирует все случаи дубликатов
 */
function deduplicateStudents(students: DraftStudent[]): {
	deduplicated: DraftStudent[]
	duplicatesFound: Array<{ original: string; merged: string[] }>
} {
	const deduplicated: DraftStudent[] = []
	const duplicatesFound: Array<{ original: string; merged: string[] }> = []

	for (const student of students) {
		// Ищем, есть ли уже похожий студент в deduplicated
		const existingIndex = deduplicated.findIndex(s => {
			const isSimilar = areNamesSimilar(s.name, student.name)
			return isSimilar
		})

		if (existingIndex !== -1) {
			// Нашли похожего студента - объединяем их фотографии
			const existing = deduplicated[existingIndex]

			// Объединяем фотографии
			const mergedPhotos = [...existing.photos, ...student.photos]
			deduplicated[existingIndex] = {
				...existing,
				photos: mergedPhotos
			}

			// Записываем информацию о дубликате
			const existingDuplicateRecord = duplicatesFound.find(d => d.original === existing.name)
			if (existingDuplicateRecord) {
				existingDuplicateRecord.merged.push(student.name)
			} else {
				duplicatesFound.push({
					original: existing.name,
					merged: [student.name]
				})
			}
		} else {
			// Новый уникальный студент
			deduplicated.push(student)
		}
	}

	return { deduplicated, duplicatesFound }
}

/**
 * Конвертирует изображение в черно-белое (grayscale) для улучшения распознавания AI
 * Применяет увеличение контраста и highlights для лучшей читаемости текста
 * Использует Canvas API для быстрой обработки на клиенте
 */
export async function convertToBlackAndWhite(dataUrl: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image()

		img.onload = () => {
			try {
				// Создаем canvas для обработки
				const canvas = document.createElement('canvas')
				canvas.width = img.width
				canvas.height = img.height
				const ctx = canvas.getContext('2d')

				if (!ctx) {
					reject(new Error('Failed to get canvas context'))
					return
				}

				// Рисуем изображение на canvas
				ctx.drawImage(img, 0, 0)

				// Получаем пиксели изображения
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
				const data = imageData.data

				// Параметры для улучшения читаемости текста
				const contrastFactor = 2.0 // Увеличение контраста (1.0 = без изменений, >1.0 = больше контраста)
				const highlightBoost = 1.4 // Усиление светлых участков (1.0 = без изменений)
				const highlightThreshold = 120 // Порог для определения светлых участков (0-255)

				// Конвертируем каждый пиксель в grayscale с улучшениями
				for (let i = 0; i < data.length; i += 4) {
					// Weighted average: 0.299R + 0.587G + 0.114B
					// Этот метод учитывает особенности восприятия цветов человеческим глазом
					let gray = Math.round(
						data[i] * 0.299 +     // R
						data[i + 1] * 0.587 + // G
						data[i + 2] * 0.114   // B
					)

					// Убираем белый шум (очень светлые пиксели) -> чистый белый
					if (gray > 250) {
						data[i] = 255
						data[i + 1] = 255
						data[i + 2] = 255
						continue
					}

					// Применяем контраст: ((value - 128) * contrast) + 128
					gray = ((gray - 128) * contrastFactor) + 128

					// Усиливаем светлые участки (highlights) для лучшей читаемости бумаги
					if (gray > highlightThreshold) {
						const excess = gray - highlightThreshold
						gray = highlightThreshold + (excess * highlightBoost)
					}

					// Ограничиваем значения в диапазоне 0-255
					gray = Math.max(0, Math.min(255, Math.round(gray)))

					data[i] = gray     // R
					data[i + 1] = gray // G
					data[i + 2] = gray // B
					// data[i + 3] - alpha остается без изменений
				}

				// Применяем обработанные пиксели обратно на canvas
				ctx.putImageData(imageData, 0, 0)

				// Конвертируем canvas в data URL
				// Используем качество 0.9 для сохранения деталей после обработки
				const blackAndWhiteDataUrl = canvas.toDataURL('image/jpeg', 0.9)
				resolve(blackAndWhiteDataUrl)
			} catch (error) {
				reject(error)
			}
		}

		img.onerror = () => {
			reject(new Error('Failed to load image for black and white conversion'))
		}

		img.src = dataUrl
	})
}

/**
 * Convert a data URL to a File (image/jpeg by default).
 * Optionally converts to black and white for better AI recognition (for essays only).
 */
export async function dataUrlToFile(
	dataUrl: string,
	filename: string,
	options?: { convertToBlackAndWhite?: boolean }
): Promise<File> {
	let processedDataUrl = dataUrl

	// Применяем ЧБ конвертацию если запрошено
	if (options?.convertToBlackAndWhite) {
		try {
			processedDataUrl = await convertToBlackAndWhite(dataUrl)
		} catch {
			// Fallback to original image if conversion fails
			processedDataUrl = dataUrl
		}
	}

	const res = await fetch(processedDataUrl)
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
  opts?: { studentClass?: string; checkType?: 'test' | 'essay' }
): Promise<SubmitAllResult> {
  const items: SubmitResultItem[] = []
  const failedNames: string[] = []

  // Only process students with at least one photo
  const validStudents = students.filter((s) => s.photos.length > 0)

  // Дедупликация студентов перед отправкой
  const { deduplicated } = deduplicateStudents(validStudents)

  // Определяем нужна ли ЧБ конвертация (только для сочинений)
  const shouldConvertToBlackAndWhite = opts?.checkType === 'essay'

  // Используем дедуплицированный список для отправки
  for (const student of deduplicated) {
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
        const file = await dataUrlToFile(photo.dataUrl, `photo_${index}.jpg`, {
          convertToBlackAndWhite: shouldConvertToBlackAndWhite
        })
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
          const { addTempFailedName } = await import('./drafts-idb')
          addTempFailedName(checkId, student.name)
        } catch {
          // ignore
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
          const { addTempFailedName } = await import('./drafts-idb')
          addTempFailedName(checkId, student.name)
        } catch {
          // ignore
        }
        failedNames.push(student.name)
        continue
      }

      items.push({ student, submissionId })
    } catch {
      // Network or unexpected error — mark as failed and continue
      try {
        const { addTempFailedName } = await import('./drafts-idb')
        addTempFailedName(checkId, student.name)
      } catch {
        // ignore
      }
      failedNames.push(student.name)
    }
  }

  return { items, failedNames }
}

/**
 * Checks submission status to avoid re-evaluating already completed work.
 */
async function checkSubmissionStatus(submissionId: string): Promise<{ shouldEvaluate: boolean; status?: string }> {
  try {
    const res = await fetch(`/api/submissions/${submissionId}`, {
      method: 'GET',
    })

    if (!res.ok) {
      // If we can't check status, assume we should evaluate
      return { shouldEvaluate: true }
    }

    const submission = await res.json()
    const status = submission?.status

    // Don't evaluate if already completed or processing
    if (status === 'completed' || status === 'processing') {
      return { shouldEvaluate: false, status }
    }

    return { shouldEvaluate: true, status }
  } catch {
    // If status check fails, assume we should evaluate
    return { shouldEvaluate: true }
  }
}

/**
 * Triggers evaluation for each submission and waits for all to finish (fire-and-wait).
 * Only evaluates submissions that are not already completed or processing.
 * If any request fails, throws an aggregated error after attempting all.
 */
export async function evaluateAll(submissions: Array<{ submissionId: string }>): Promise<void> {
  const errors: Array<{ id: string; error: string }> = []

  // First, check status of all submissions to filter out already completed ones
  const statusChecks = await Promise.all(
    submissions.map(async (s) => ({
      submissionId: s.submissionId,
      ...(await checkSubmissionStatus(s.submissionId))
    }))
  )

  // Filter submissions that need evaluation
  const submissionsToEvaluate = statusChecks.filter(s => s.shouldEvaluate)

  // If no submissions need evaluation, just dispatch completion event
  if (submissionsToEvaluate.length === 0) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('evaluation:complete', {
        detail: {
          submissionIds: submissions.map(s => s.submissionId),
          errors: []
        }
      }))
    }
    return
  }

  await Promise.all(
    submissionsToEvaluate.map(async (s) => {
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
              shouldTreatAsError = false
            }

            // Также игнорируем ошибку "уже проверено" - это нормальное поведение
            if (body?.error === 'Submission already evaluated') {
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