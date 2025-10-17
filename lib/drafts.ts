/**
 * Draft Submissions storage (client-side)
 * Persists unsent student photos per checkId in localStorage.
 * Safe to import in Next.js client components; guards against SSR.
 */

export interface DraftPhoto {
  id: string
  dataUrl: string
  createdAt: number
}

export interface DraftStudent {
  id: string
  name: string
  photos: DraftPhoto[]
}

export interface DraftBundle {
  checkId: string
  students: DraftStudent[]
  updatedAt: number
}

const STORAGE_PREFIX = 'checklytool:drafts'

function storageKey(checkId: string) {
  return `${STORAGE_PREFIX}:${checkId}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function safeParse(json: string | null): DraftBundle | null {
  if (!json) return null
  try {
    const obj = JSON.parse(json) as DraftBundle
    // Basic shape validation
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.students) || typeof obj.checkId !== 'string') {
      return null
    }
    return obj
  } catch {
    return null
  }
}

/**
 * Read draft bundle for a checkId
 */
export function getDraft(checkId: string): DraftBundle | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(storageKey(checkId))
  return safeParse(raw)
}

/**
 * Upsert (create or replace) a draft bundle
 */
export function upsertDraft(bundle: DraftBundle): void {
  if (!isBrowser()) return
  try {
    const bundleWithTimestamp = { ...bundle, updatedAt: Date.now() }
    console.log('[DRAFTS] upsertDraft - saving bundle:', {
      checkId: bundle.checkId,
      studentCount: bundleWithTimestamp.students.length,
      students: bundleWithTimestamp.students.map((s, i) => ({
        index: i,
        name: s.name,
        photoCount: s.photos.length,
        photoSizes: s.photos.map(p => p.dataUrl.length)
      }))
    })

    const serialized = JSON.stringify(bundleWithTimestamp)
    const key = storageKey(bundle.checkId)
    console.log('[DRAFTS] upsertDraft - serialized size:', serialized.length, 'bytes')
    console.log('[DRAFTS] upsertDraft - storage key:', key)

    window.localStorage.setItem(key, serialized)
    console.log('[DRAFTS] upsertDraft - saved successfully')
  } catch (err) {
    console.error('[DRAFTS] upsertDraft - error saving:', err)
    // best-effort: ignore quota errors
  }
}

/**
 * Remove draft bundle for a checkId
 */
export function clearDraft(checkId: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(storageKey(checkId))
  } catch {
    // ignore
  }
}

/**
 * Mutate helper: reads the current draft, applies a function, persists the result, and returns it.
 * If no current draft exists, initializes an empty one.
 */
export function mutateDraft(checkId: string, fn: (bundle: DraftBundle) => DraftBundle): DraftBundle {
  const existing = getDraft(checkId) ?? { checkId, students: [], updatedAt: Date.now() }
  console.log('[DRAFTS] mutateDraft - existing bundle:', {
    checkId,
    studentCount: existing.students.length,
    students: existing.students.map((s, i) => ({
      index: i,
      name: s.name,
      photoCount: s.photos.length
    }))
  })

  const next = fn(existing)
  console.log('[DRAFTS] mutateDraft - new bundle after mutation:', {
    checkId,
    studentCount: next.students.length,
    students: next.students.map((s, i) => ({
      index: i,
      name: s.name,
      photoCount: s.photos.length
    }))
  })

  upsertDraft(next)
  console.log('[DRAFTS] mutateDraft - bundle saved to localStorage')

  // Verify save
  const verification = getDraft(checkId)
  console.log('[DRAFTS] mutateDraft - verification read from localStorage:', {
    studentCount: verification?.students.length,
    students: verification?.students.map((s, i) => ({
      index: i,
      name: s.name,
      photoCount: s.photos.length
    }))
  })

  return next
}

/**
 * Ensure a student exists in the draft and return the updated bundle and index
 */
export function ensureStudent(checkId: string, name?: string): { bundle: DraftBundle; index: number } {
  let createdIndex = -1
  const bundle = mutateDraft(checkId, (b) => {
    if (b.students.length === 0) {
      const studentName = name?.trim() || generateUniqueStudentName(checkId, b.students)
      const newStudent: DraftStudent = {
        id: `student_${Date.now()}`,
        name: studentName,
        photos: [],
      }
      createdIndex = 0
      return { ...b, students: [newStudent] }
    }
    return b
  })
  const index = createdIndex !== -1 ? createdIndex : 0
  return { bundle, index }
}

/**
 * Utility: add photo to student by index
 */
export function addPhotoToStudent(checkId: string, studentIndex: number, dataUrl: string): DraftBundle {
  console.log('[DRAFTS] addPhotoToStudent called:', {
    checkId,
    studentIndex,
    dataUrlLength: dataUrl.length
  })

  return mutateDraft(checkId, (b) => {
    console.log('[DRAFTS] Current bundle before adding photo:', {
      totalStudents: b.students.length,
      students: b.students.map((s, i) => ({
        index: i,
        name: s.name,
        photoCount: s.photos.length
      }))
    })

    if (!b.students[studentIndex]) {
      console.error('[DRAFTS] Student not found at index:', studentIndex)
      return b
    }

    const nextStudents = b.students.map((s, i) =>
      i === studentIndex
        ? {
            ...s,
            photos: [
              ...s.photos,
              {
                id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                dataUrl,
                createdAt: Date.now(),
              },
            ],
          }
        : s
    )

    console.log('[DRAFTS] Bundle after adding photo:', {
      totalStudents: nextStudents.length,
      students: nextStudents.map((s, i) => ({
        index: i,
        name: s.name,
        photoCount: s.photos.length
      }))
    })

    return { ...b, students: nextStudents }
  })
}

/**
 * Utility: delete photo by id for a student
 */
export function deletePhoto(checkId: string, studentIndex: number, photoId: string): DraftBundle {
  return mutateDraft(checkId, (b) => {
    if (!b.students[studentIndex]) return b
    const nextStudents = b.students.map((s, i) =>
      i === studentIndex ? { ...s, photos: s.photos.filter((p) => p.id !== photoId) } : s
    )
    return { ...b, students: nextStudents }
  })
}

/**
 * Generate unique student name that doesn't conflict with existing drafts or failed submissions
 */
function generateUniqueStudentName(checkId: string, existingStudents: DraftStudent[]): string {
  const existingNames = new Set(existingStudents.map(s => s.name.toLowerCase()))

  // Also check failed submissions from temp storage
  const tempFailedNames = getTempFailedNames(checkId)
  tempFailedNames.forEach(name => existingNames.add(name.toLowerCase()))

  let counter = 1
  let candidateName = `Ученик ${counter}`

  while (existingNames.has(candidateName.toLowerCase())) {
    counter++
    candidateName = `Ученик ${counter}`
  }

  return candidateName
}

/**
 * Utility: add a new student (returns its index)
 */
export function addStudent(checkId: string, name: string, afterIndex?: number): { bundle: DraftBundle; index: number } {
  let newIndex = 0
  const bundle = mutateDraft(checkId, (b) => {
    const baseName = name.trim() || generateUniqueStudentName(checkId, b.students)
    const newStudent: DraftStudent = {
      id: `student_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: baseName,
      photos: [],
    }
    const arr = [...b.students]
    if (typeof afterIndex === 'number' && afterIndex >= 0 && afterIndex < arr.length - 1) {
      newIndex = afterIndex + 1
      arr.splice(newIndex, 0, newStudent)
    } else {
      newIndex = arr.length
      arr.push(newStudent)
    }
    return { ...b, students: arr }
  })
  return { bundle, index: newIndex }
}

/**
 * Utility: remove a student by id
 */
export function removeStudent(checkId: string, studentId: string): DraftBundle {
  return mutateDraft(checkId, (b) => {
    return { ...b, students: b.students.filter((s) => s.id !== studentId) }
  })
}

/**
 * Utility: update student name by index
 */
export function renameStudent(checkId: string, studentIndex: number, name: string): DraftBundle {
  return mutateDraft(checkId, (b) => {
    if (!b.students[studentIndex]) return b
    const nextStudents = b.students.map((s, i) => (i === studentIndex ? { ...s, name: name.trim() } : s))
    return { ...b, students: nextStudents }
  })
}
/**
 * Initialize draft students list from names (no photos). Overwrites existing students for the check.
 * Returns the updated bundle.
 */
export function setDraftStudents(checkId: string, names: string[]): DraftBundle {
  const safeNames = names
    .map((n) => (n ?? '').toString().trim())
    .filter((n) => n.length > 0)

  return mutateDraft(checkId, (b) => {
    const students: DraftStudent[] = safeNames.map((name, idx) => ({
      id: `student_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.slice(0, 200),
      photos: [],
    }))
    return { ...b, students }
  })
}
/** Temporary cache for failed uploads to drive "Переснять" without backend records */
const FAIL_PREFIX = 'checklytool:failednames'
function failKey(checkId: string) {
  return `${FAIL_PREFIX}:${checkId}`
}

/** Add a single failed student name (deduplicated) */
export function addTempFailedName(checkId: string, name: string): void {
  if (!isBrowser()) {
    console.log('[DRAFTS] addTempFailedName: not in browser')
    return
  }
  try {
    const existing = getTempFailedNames(checkId)
    const trimmed = (name ?? '').toString().trim()
    console.log('[DRAFTS] addTempFailedName:', {
      checkId,
      name,
      trimmed,
      existing,
      alreadyExists: existing.includes(trimmed)
    })
    if (!trimmed) {
      console.log('[DRAFTS] addTempFailedName: empty name, returning')
      return
    }
    if (!existing.includes(trimmed)) {
      const next = [...existing, trimmed]
      const key = failKey(checkId)
      window.localStorage.setItem(key, JSON.stringify(next))
      console.log('[DRAFTS] addTempFailedName: saved to localStorage:', {
        key,
        next,
        serialized: JSON.stringify(next)
      })
    }
  } catch (e) {
    console.error('[DRAFTS] addTempFailedName error:', e)
  }
}

/** Read failed names list */
export function getTempFailedNames(checkId: string): string[] {
  if (!isBrowser()) return []
  try {
    const key = failKey(checkId)
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) as unknown : []
    const result = Array.isArray(parsed)
      ? parsed.map((s) => String(s)).filter((s) => s.length > 0)
      : []
    console.log('[DRAFTS] getTempFailedNames:', {
      checkId,
      key,
      raw,
      parsed,
      result
    })
    return result
  } catch (e) {
    console.error('[DRAFTS] getTempFailedNames error:', e)
    return []
  }
}

/** Clear failed names list */
export function clearTempFailedNames(checkId: string): void {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(failKey(checkId))
  } catch {
    // ignore
  }
}