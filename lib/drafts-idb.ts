/**
 * Draft Submissions storage with IndexedDB backend
 * Drop-in replacement for drafts.ts with much larger storage capacity
 */

import * as IDB from './indexeddb-drafts'

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

// Cache for synchronous access
const cache = new Map<string, DraftBundle>()

/**
 * Initialize cache from IndexedDB
 */
async function loadToCache(checkId: string): Promise<void> {
	try {
		const idbBundle = await IDB.getDraft(checkId)
		if (!idbBundle) {
			cache.delete(checkId)
			return
		}

		// Convert Blobs to dataURLs for cache
		const students = await Promise.all(
			idbBundle.students.map(async (student) => ({
				...student,
				photos: await Promise.all(
					student.photos.map(async (photo) => ({
						id: photo.id,
						dataUrl: await IDB.blobToDataURL(photo.blob),
						createdAt: photo.createdAt,
					}))
				),
			}))
		)

		cache.set(checkId, {
			checkId: idbBundle.checkId,
			students,
			updatedAt: idbBundle.updatedAt,
		})
	} catch (error) {
		console.error('[DRAFTS-IDB] Error loading to cache:', error)
	}
}

/**
 * Save from cache to IndexedDB
 */
async function saveFromCache(checkId: string): Promise<void> {
	const bundle = cache.get(checkId)
	if (!bundle) return

	try {
		// Convert dataURLs to Blobs for IndexedDB
		const students = bundle.students.map((student) => ({
			...student,
			photos: student.photos.map((photo) => ({
				id: photo.id,
				blob: IDB.dataURLToBlob(photo.dataUrl),
				createdAt: photo.createdAt,
			})),
		}))

		await IDB.saveDraft({
			checkId: bundle.checkId,
			students,
			updatedAt: Date.now(),
		})

		console.log('[DRAFTS-IDB] Saved to IndexedDB:', {
			checkId,
			studentCount: students.length,
			totalPhotos: students.reduce((sum, s) => sum + s.photos.length, 0),
		})
	} catch (error) {
		console.error('[DRAFTS-IDB] Error saving from cache:', error)
		throw error
	}
}

/**
 * Get draft bundle (synchronous, uses cache)
 */
export function getDraft(checkId: string): DraftBundle | null {
	// Try to load from IDB in background
	loadToCache(checkId).catch(console.error)
	return cache.get(checkId) || null
}

/**
 * Upsert draft bundle
 */
export function upsertDraft(bundle: DraftBundle): void {
	cache.set(bundle.checkId, { ...bundle, updatedAt: Date.now() })
	// Save to IDB in background
	saveFromCache(bundle.checkId).catch(console.error)
}

/**
 * Clear draft bundle
 */
export function clearDraft(checkId: string): void {
	cache.delete(checkId)
	IDB.deleteDraft(checkId).catch(console.error)
}

/**
 * Mutate helper
 */
export function mutateDraft(
	checkId: string,
	fn: (bundle: DraftBundle) => DraftBundle
): DraftBundle {
	const existing = getDraft(checkId) ?? {
		checkId,
		students: [],
		updatedAt: Date.now(),
	}

	console.log('[DRAFTS-IDB] mutateDraft - existing:', {
		checkId,
		studentCount: existing.students.length,
		students: existing.students.map((s, i) => ({
			index: i,
			name: s.name,
			photoCount: s.photos.length,
		})),
	})

	const next = fn(existing)

	console.log('[DRAFTS-IDB] mutateDraft - new bundle:', {
		checkId,
		studentCount: next.students.length,
		students: next.students.map((s, i) => ({
			index: i,
			name: s.name,
			photoCount: s.photos.length,
		})),
	})

	upsertDraft(next)
	return next
}

/**
 * Ensure a student exists
 */
export function ensureStudent(
	checkId: string,
	name?: string
): { bundle: DraftBundle; index: number } {
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
 * Add photo to student
 */
export function addPhotoToStudent(
	checkId: string,
	studentIndex: number,
	dataUrl: string
): DraftBundle {
	console.log('[DRAFTS-IDB] addPhotoToStudent called:', {
		checkId,
		studentIndex,
		dataUrlLength: dataUrl.length,
	})

	return mutateDraft(checkId, (b) => {
		if (!b.students[studentIndex]) {
			console.error('[DRAFTS-IDB] Student not found at index:', studentIndex)
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

		return { ...b, students: nextStudents }
	})
}

/**
 * Delete photo
 */
export function deletePhoto(
	checkId: string,
	studentIndex: number,
	photoId: string
): DraftBundle {
	return mutateDraft(checkId, (b) => {
		if (!b.students[studentIndex]) return b
		const nextStudents = b.students.map((s, i) =>
			i === studentIndex
				? { ...s, photos: s.photos.filter((p) => p.id !== photoId) }
				: s
		)
		return { ...b, students: nextStudents }
	})
}

/**
 * Add student
 */
export function addStudent(
	checkId: string,
	name: string,
	afterIndex?: number
): { bundle: DraftBundle; index: number } {
	let newIndex = 0
	const bundle = mutateDraft(checkId, (b) => {
		const baseName = name.trim() || generateUniqueStudentName(checkId, b.students)
		const newStudent: DraftStudent = {
			id: `student_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
			name: baseName,
			photos: [],
		}
		const arr = [...b.students]
		if (
			typeof afterIndex === 'number' &&
			afterIndex >= 0 &&
			afterIndex < arr.length - 1
		) {
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
 * Remove student
 */
export function removeStudent(checkId: string, studentId: string): DraftBundle {
	return mutateDraft(checkId, (b) => {
		return { ...b, students: b.students.filter((s) => s.id !== studentId) }
	})
}

/**
 * Rename student
 */
export function renameStudent(
	checkId: string,
	studentIndex: number,
	name: string
): DraftBundle {
	return mutateDraft(checkId, (b) => {
		if (!b.students[studentIndex]) return b
		const nextStudents = b.students.map((s, i) =>
			i === studentIndex ? { ...s, name: name.trim() } : s
		)
		return { ...b, students: nextStudents }
	})
}

/**
 * Set draft students from names
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

/**
 * Generate unique student name
 */
function generateUniqueStudentName(
	checkId: string,
	existingStudents: DraftStudent[]
): string {
	const existingNames = new Set(existingStudents.map((s) => s.name.toLowerCase()))
	const tempFailedNames = getTempFailedNames(checkId)
	tempFailedNames.forEach((name) => existingNames.add(name.toLowerCase()))

	let counter = 1
	let candidateName = `Ученик ${counter}`

	while (existingNames.has(candidateName.toLowerCase())) {
		counter++
		candidateName = `Ученик ${counter}`
	}

	return candidateName
}

// Temp failed names still use localStorage as they're small
const FAIL_PREFIX = 'checklytool:failednames'

function failKey(checkId: string) {
	return `${FAIL_PREFIX}:${checkId}`
}

export function addTempFailedName(checkId: string, name: string): void {
	if (typeof window === 'undefined') return
	try {
		const existing = getTempFailedNames(checkId)
		const trimmed = (name ?? '').toString().trim()
		if (!trimmed || existing.includes(trimmed)) return

		const next = [...existing, trimmed]
		window.localStorage.setItem(failKey(checkId), JSON.stringify(next))
	} catch (e) {
		console.error('[DRAFTS-IDB] addTempFailedName error:', e)
	}
}

export function getTempFailedNames(checkId: string): string[] {
	if (typeof window === 'undefined') return []
	try {
		const raw = window.localStorage.getItem(failKey(checkId))
		const parsed = raw ? (JSON.parse(raw) as unknown) : []
		return Array.isArray(parsed)
			? parsed.map((s) => String(s)).filter((s) => s.length > 0)
			: []
	} catch (e) {
		console.error('[DRAFTS-IDB] getTempFailedNames error:', e)
		return []
	}
}

export function clearTempFailedNames(checkId: string): void {
	if (typeof window === 'undefined') return
	try {
		window.localStorage.removeItem(failKey(checkId))
	} catch {
		// ignore
	}
}
