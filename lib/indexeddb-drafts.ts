/**
 * IndexedDB-based draft storage for camera submissions
 * Supports much larger storage than localStorage (~50% of disk space)
 * Stores images as Blobs for better efficiency
 */

const DB_NAME = 'checklytool_drafts'
const DB_VERSION = 1
const STORE_NAME = 'drafts'

export interface DraftPhoto {
	id: string
	blob: Blob
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

let dbInstance: IDBDatabase | null = null

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
	if (dbInstance) return dbInstance

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onerror = () => reject(request.error)
		request.onsuccess = () => {
			dbInstance = request.result
			resolve(request.result)
		}

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'checkId' })
			}
		}
	})
}

/**
 * Get draft bundle for a checkId
 */
export async function getDraft(checkId: string): Promise<DraftBundle | null> {
	try {
		const db = await initDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_NAME], 'readonly')
			const store = transaction.objectStore(STORE_NAME)
			const request = store.get(checkId)

			request.onsuccess = () => resolve(request.result || null)
			request.onerror = () => reject(request.error)
		})
	} catch (error) {
		console.error('[IDB] Error getting draft:', error)
		return null
	}
}

/**
 * Save draft bundle
 */
export async function saveDraft(bundle: DraftBundle): Promise<void> {
	try {
		const db = await initDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_NAME], 'readwrite')
			const store = transaction.objectStore(STORE_NAME)
			const request = store.put({ ...bundle, updatedAt: Date.now() })

			request.onsuccess = () => resolve()
			request.onerror = () => reject(request.error)
		})
	} catch (error) {
		console.error('[IDB] Error saving draft:', error)
		throw error
	}
}

/**
 * Delete draft bundle
 */
export async function deleteDraft(checkId: string): Promise<void> {
	try {
		const db = await initDB()
		return new Promise((resolve, reject) => {
			const transaction = db.transaction([STORE_NAME], 'readwrite')
			const store = transaction.objectStore(STORE_NAME)
			const request = store.delete(checkId)

			request.onsuccess = () => resolve()
			request.onerror = () => reject(request.error)
		})
	} catch (error) {
		console.error('[IDB] Error deleting draft:', error)
	}
}

/**
 * Convert dataURL to Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
	const parts = dataURL.split(',')
	const mimeMatch = parts[0].match(/:(.*?);/)
	const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
	const bstr = atob(parts[1])
	const n = bstr.length
	const u8arr = new Uint8Array(n)
	for (let i = 0; i < n; i++) {
		u8arr[i] = bstr.charCodeAt(i)
	}
	return new Blob([u8arr], { type: mime })
}

/**
 * Convert Blob to dataURL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = reject
		reader.readAsDataURL(blob)
	})
}
