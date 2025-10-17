'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X, Camera, ChevronUp, Plus, Trash2, UserPlus, ImagePlus } from 'lucide-react'
import {
  getDraft,
  ensureStudent as ensureDraftStudent,
  addPhotoToStudent as addPhotoDraft,
  deletePhoto as deletePhotoDraft,
  addStudent as addStudentDraft,
  renameStudent as renameStudentDraft,
  type DraftStudent,
} from '@/lib/drafts'

interface Photo {
  id: string
  dataUrl: string
  timestamp: number
}

interface Student {
  id: string
  name: string
  photos: Photo[]
}

interface CameraWorkInterfaceProps {
  isOpen: boolean
  checkId: string
  onClose: () => void
  checkTitle?: string
  maxPhotosPerStudent?: number
}

type ViewMode = 'camera' | 'review'

const mapDraftToLocal = (students: DraftStudent[]): Student[] =>
  students.map((s) => ({
    id: s.id,
    name: s.name,
    photos: s.photos.map((p) => ({
      id: p.id,
      dataUrl: p.dataUrl,
      timestamp: p.createdAt,
    })),
  }))

export function CameraWorkInterface({
  isOpen,
  checkId,
  onClose,
  maxPhotosPerStudent = 5
}: CameraWorkInterfaceProps) {
  // Camera state
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  // Students and photos state
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Ученик 1', photos: [] },
    { id: '2', name: 'Ученик 2', photos: [] }
  ])
  const [activeStudentIndex, setActiveStudentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('camera')
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [editingName, setEditingName] = useState(false)
  const [editName, setEditName] = useState('')

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Students strip: center active item
  // Serialize camera starts to avoid double inits on view switch
  const isStartingRef = useRef(false)

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      if (isStartingRef.current) {
        return
      }
      isStartingRef.current = true

      setError(null)

      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера недоступна. Требуется HTTPS или localhost.')
      }

      // Stop any previous
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16 / 9 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          console.log('[CAMERA] Attempting to play video')
          await videoRef.current.play()
          console.log('[CAMERA] Video playing successfully')
        } catch (err) {
          // Some browsers require a user gesture; surface error
          console.error('[CAMERA] video.play() failed', err)
        }
        setIsStreaming(true)
        console.log('[CAMERA] Camera started successfully')
      } else {
        console.error('[CAMERA] videoRef.current is null')
      }
    } catch (err) {
      console.error('[CAMERA] Error starting camera:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Не удается получить доступ к камере. Проверьте разрешения или используйте HTTPS.')
      }
      setIsStreaming(false)
    } finally {
      isStartingRef.current = false
      console.log('[CAMERA] startCamera completed')
    }
  }, [currentFacingMode])

  const stopCamera = useCallback(() => {
    console.log('[CAMERA] stopCamera called')
    console.log('[CAMERA] streamRef.current:', !!streamRef.current)
    console.log('[CAMERA] streamRef.current?.active:', streamRef.current?.active)

    if (streamRef.current) {
      console.log('[CAMERA] Stopping stream tracks')
      streamRef.current.getTracks().forEach(track => {
        console.log('[CAMERA] Stopping track:', track.kind, track.readyState)
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      console.log('[CAMERA] Clearing video srcObject')
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    console.log('[CAMERA] stopCamera completed')
    // Не скрываем сообщение об ошибке здесь — пусть остается если было
  }, [])


  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) {
      return
    }

    if (!isStreaming) {
      console.error('Camera not ready')
      return
    }

    // Получаем актуальное состояние из draft
    const currentDraft = getDraft(checkId)
    const activeStudent = currentDraft?.students[activeStudentIndex]
    if (!activeStudent) {
      console.error('No active student found')
      return
    }

    if (activeStudent.photos.length >= maxPhotosPerStudent) {
      console.warn(`Maximum ${maxPhotosPerStudent} photos per student`)
      return
    }

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Cannot get canvas context')
      }

      // Проверяем, что видео готово
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video not ready - width or height is 0')
      }


      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

      if (!dataUrl || dataUrl.length < 100) {
        throw new Error('Generated image data is too small or empty')
      }

      console.log('[CAMERA] Photo captured successfully, data size:', dataUrl.length)
      
      // Базовая клиентская валидация - проверяем размер изображения
      // Очень маленькие изображения (меньше 50KB) могут быть проблематичными
      if (dataUrl.length < 50000) {
        console.warn('[CAMERA] Image seems too small, might be low quality')
        console.warn('Image is very small')
      }

      const bundle = addPhotoDraft(checkId, activeStudentIndex, dataUrl)
      setStudents(mapDraftToLocal(bundle.students))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('drafts:updated'))
      }
      console.log('Photo captured successfully')
      console.log('[CAMERA] Photo saved to drafts')
    } catch (err) {
      console.error('[CAMERA] Error capturing photo:', err)
      console.error('[CAMERA] Camera state - isStreaming:', isStreaming)
      console.error('[CAMERA] Video readyState:', videoRef.current?.readyState)
      console.error('[CAMERA] Stream active:', streamRef.current?.active)
      
      console.error('Failed to capture photo')
      
      // Попробуем перезапустить камеру если поток неактивен
      if (!streamRef.current?.active && isStreaming) {
        console.log('[CAMERA] Stream inactive, attempting restart...')
        setTimeout(() => {
          stopCamera()
          setTimeout(() => startCamera(), 500)
        }, 100)
      }
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, isStreaming, activeStudentIndex, maxPhotosPerStudent, checkId, startCamera, stopCamera])

  // File upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    console.log('[CAMERA] File upload started, files:', files?.length)
    if (!files) return

    // Получаем актуальное состояние из draft
    const currentDraft = getDraft(checkId)
    const activeStudent = currentDraft?.students[activeStudentIndex]
    if (!activeStudent) {
      console.error('No active student found')
      return
    }

    const remainingSlots = maxPhotosPerStudent - activeStudent.photos.length
    console.log('[CAMERA] Active student:', activeStudent.name, 'remaining slots:', remainingSlots)

    if (remainingSlots <= 0) {
      console.warn(`Maximum ${maxPhotosPerStudent} photos per student`)
      return
    }

    const filesToProcess = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots)

    console.log('[CAMERA] Files to process:', filesToProcess.length)

    const readAsDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve((e.target?.result as string) || '')
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })

    let lastBundle: ReturnType<typeof addPhotoDraft> | undefined

    for (const file of filesToProcess) {
      try {
        console.log('[CAMERA] Reading file:', file.name)
        const dataUrl = await readAsDataUrl(file)
        console.log('[CAMERA] File read, data URL length:', dataUrl.length)
        lastBundle = addPhotoDraft(checkId, activeStudentIndex, dataUrl)
        console.log('[CAMERA] Photo added to draft, bundle students:', lastBundle.students.length)
      } catch (err) {
        console.error('[CAMERA] Error processing file:', err)
      }
    }

    if (lastBundle) {
      console.log('[CAMERA] Updating local state with', lastBundle.students.length, 'students')
      setStudents(mapDraftToLocal(lastBundle.students))
      if (typeof window !== 'undefined') {
        console.log('[CAMERA] Dispatching drafts:updated event')
        window.dispatchEvent(new Event('drafts:updated'))
      }
    }

    if (filesToProcess.length > 0) {
      console.log(`[CAMERA] Successfully added ${filesToProcess.length} photos`)
    }

    // Clear input
    event.target.value = ''
  }, [activeStudentIndex, maxPhotosPerStudent, checkId])

  // Student management
  const addStudent = useCallback(() => {
    // Получаем актуальное состояние из draft вместо использования students.length
    const currentDraft = getDraft(checkId)
    const currentLength = currentDraft?.students.length || 0
    const { bundle, index } = addStudentDraft(checkId, `Ученик ${currentLength + 1}`)
    setStudents(mapDraftToLocal(bundle.students))
    setActiveStudentIndex(index)
    console.log('Student added, new index:', index, 'total students:', bundle.students.length)
  }, [checkId])

  const updateStudentName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 24) || `Ученик ${activeStudentIndex + 1}`
    const bundle = renameStudentDraft(checkId, activeStudentIndex, trimmed)
    setStudents(mapDraftToLocal(bundle.students))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('drafts:updated'))
    }
  }, [activeStudentIndex, checkId])

  const deletePhoto = useCallback((photoId: string) => {
    const bundle = deletePhotoDraft(checkId, activeStudentIndex, photoId)
    const updated = mapDraftToLocal(bundle.students)
    setStudents(updated)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('drafts:updated'))
    }

    const activeStudent = updated[activeStudentIndex]
    if (activeStudent) {
      if (currentPhotoIndex >= activeStudent.photos.length - 1) {
        setCurrentPhotoIndex(Math.max(0, activeStudent.photos.length - 2))
      }
    }

    console.log('Photo deleted')
  }, [checkId, activeStudentIndex, currentPhotoIndex])

  // Effects
  // Load drafts when opening the camera and ensure at least one student exists
  useEffect(() => {
    if (!isOpen) return
    const draft = getDraft(checkId)
    if (draft && draft.students.length > 0) {
      setStudents(mapDraftToLocal(draft.students))
      setActiveStudentIndex(0)
    } else {
      const { bundle } = ensureDraftStudent(checkId)
      setStudents(mapDraftToLocal(bundle.students))
      setActiveStudentIndex(0)
    }
  }, [isOpen, checkId])

  useEffect(() => {
    if (isOpen && viewMode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, viewMode, startCamera, stopCamera])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (viewMode === 'camera') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          capturePhoto()
        } else if (e.code === 'Escape') {
          onClose()
        }
      } else if (viewMode === 'review') {
        // In review, Esc acts like "Готово": return to camera
        if (e.code === 'Escape') {
          e.preventDefault()
          setViewMode('camera')
          // rely on effect to start camera
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, viewMode, capturePhoto, onClose])

  // Handle photo click - switch to review mode
  const handlePhotoClick = useCallback(() => {
    const activeStudent = students[activeStudentIndex]
    if (activeStudent && activeStudent.photos.length > 0) {
      setCurrentPhotoIndex(activeStudent.photos.length - 1)
      setViewMode('review')
    }
    // Don't open review mode if no photos - user should take photos first
  }, [students, activeStudentIndex])




  if (!isOpen) {
    console.log('[CAMERA] Modal is closed, isOpen:', isOpen)
    return null
  }

  const activeStudent = students[activeStudentIndex]
  const canAddMorePhotos = activeStudent?.photos.length < maxPhotosPerStudent

  // Review mode
  if (viewMode === 'review') {
    const currentPhoto = activeStudent.photos[currentPhotoIndex]

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col min-h-screen overflow-y-auto" style={{ minHeight: '100dvh', height: '100dvh' }}>
        {/* Photo area: Gray background representing photo, full screen */}
        <div className="bg-gray-500 h-screen relative flex-1">
          {/* Header overlaid at top */}
          <div className="absolute top-6 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center justify-between px-6 py-2.5 rounded-full border-2 border-slate-200 w-full">
              {editingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => {
                    updateStudentName(editName)
                    setEditingName(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateStudentName(editName)
                      setEditingName(false)
                    }
                  }}
                  className="bg-transparent font-extrabold text-xl text-white opacity-50 outline-none flex-1"
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={activeStudent.name}
                  readOnly
                  className="bg-transparent font-extrabold text-xl text-white opacity-50 outline-none flex-1"
                  onClick={() => {
                    setEditName(activeStudent.name)
                    setEditingName(true)
                  }}
                />
              )}
              <ChevronUp className="h-[18px] w-[18px] text-white opacity-50" />
            </div>
            <span className="font-extrabold text-base text-white ml-3" onClick={() => setViewMode('camera')}>Готово</span>
          </div>

          {/* Photo display */}
          {currentPhoto && (
            <div className="w-full h-full flex items-center justify-center">
              <Image
                src={currentPhoto.dataUrl}
                alt="Фотография работы"
                width={560}
                height={840}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}

          {/* Photo thumbnails overlaid at bottom */}
          {activeStudent.photos.length > 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              {activeStudent.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`${index === currentPhotoIndex ? 'w-16 h-20 bg-gray-300 rounded-lg border-2 border-white' : 'w-12 h-16 bg-gray-300 rounded-lg opacity-60'}`}
                >
                  <Image
                    src={photo.dataUrl}
                    alt={`Фото ${index + 1}`}
                    width={index === currentPhotoIndex ? 64 : 48}
                    height={index === currentPhotoIndex ? 80 : 64}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom controls bar */}
        <div className="bg-black px-[18px] py-[12px] flex items-center justify-center gap-9">
          <div className="flex flex-col items-center gap-1 w-20">
            <Camera className="w-6 h-6 text-white cursor-pointer" strokeWidth={1.5} onClick={() => setViewMode('camera')} />
            <span className="font-medium text-sm text-white text-center">Переснять</span>
          </div>
          <div className="flex flex-col items-center gap-1 w-16">
            <Trash2 className="w-6 h-6 text-white cursor-pointer" strokeWidth={1.5} onClick={() => currentPhoto && deletePhoto(currentPhoto.id)} />
            <span className="font-medium text-sm text-white text-center">Удалить</span>
          </div>
          <div className="flex flex-col items-center gap-1 w-28">
            <Plus className="w-6 h-6 text-white cursor-pointer" strokeWidth={1.5} onClick={() => setViewMode('camera')} />
            <span className="font-medium text-sm text-white text-center">Еще страница</span>
          </div>
        </div>
      </div>
    )
  }

  // Camera mode
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ minHeight: '100dvh', height: '100dvh' }}>
      {/* Video area with absolute overlay controls (Rotate, Close) */}
      <div className="relative overflow-hidden bg-gray-500 flex-1">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-6 py-8">
              <Camera className="w-14 h-14 mx-auto mb-3 opacity-80" />
              <h3 className="text-[24px] font-extrabold mb-2">Камера недоступна</h3>
              <p className="text-white/70 text-sm mb-5">
                Разрешите доступ к камере или используйте HTTPS/localhost. Вы также можете загрузить фото из галереи.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={startCamera} className="rounded-[180px] h-11 px-6">
                  Попробовать снова
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-[180px] h-11 px-6"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Загрузить из галереи
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />


            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {/* Close button or Submit button in top right */}
        {activeStudent && activeStudent.photos.length > 0 ? (
          <Button
            className="absolute top-6 right-7 bg-blue-600 hover:bg-blue-700 text-white font-medium text-base px-6 py-2.5 rounded-full h-11 flex items-center justify-center transition-colors"
            onClick={onClose}
            aria-label="К проверке"
          >
            К проверке
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-7 text-white hover:bg-white/20 w-8 h-8"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="w-10 h-10" strokeWidth={1.5} />
          </Button>
        )}

        {/* User info at bottom of video area */}
        <div className="absolute bottom-4 left-0 right-0 px-4 flex justify-between items-end">
          {/* Left student */}
          <div className="flex-1 flex justify-start">
            {students[Math.max(0, activeStudentIndex - 1)] && activeStudentIndex > 0 ? (
              <button
                className="flex items-center gap-1 opacity-50"
                onClick={() => setActiveStudentIndex(activeStudentIndex - 1)}
              >
                <span className="font-extrabold text-lg text-white">
                  {students[activeStudentIndex - 1].name}
                </span>
                <span className="bg-slate-100 text-slate-950 font-extrabold text-xs rounded-lg px-1.5 py-0.5 h-4.5 flex items-center justify-center">
                  {students[activeStudentIndex - 1].photos.length}
                </span>
              </button>
            ) : (
              <div></div>
            )}
          </div>

          {/* Center - active student with up arrow (всегда по центру) */}
          <div className="flex flex-col items-center absolute left-1/2 transform -translate-x-1/2">
            <div className="flex items-center justify-center h-6 w-6">
              <ChevronUp className="h-6 w-6 text-white" />
            </div>
            <button
              className="flex items-center gap-1"
              onClick={handlePhotoClick}
            >
              <span className="font-extrabold text-lg text-white">
                {activeStudent?.name || 'Ученик'}
              </span>
              <span className="bg-blue-600 text-white font-extrabold text-xs rounded-lg px-1.5 py-0.5 h-4.5 flex items-center justify-center">
                {activeStudent?.photos.length || 0}
              </span>
            </button>
          </div>

          {/* Right student */}
          <div className="flex-1 flex justify-end">
            {students[activeStudentIndex + 1] ? (
              <button
                className="flex items-center gap-1 opacity-50"
                onClick={() => setActiveStudentIndex(activeStudentIndex + 1)}
              >
                <span className="font-extrabold text-lg text-white">
                  {students[activeStudentIndex + 1].name}
                </span>
                <span className="bg-slate-100 text-slate-950 font-extrabold text-xs rounded-lg px-1.5 py-0.5 h-4.5 flex items-center justify-center">
                  {students[activeStudentIndex + 1].photos.length}
                </span>
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-[18px] py-[12px] flex items-center justify-center gap-9">
        {/* Upload from gallery */}
        <ImagePlus className="h-8 w-8 text-white cursor-pointer" onClick={() => fileInputRef.current?.click()} />

        {/* Capture button - white circle with orange border */}
        <div className="w-16 h-16 border-2 border-orange-500 rounded-full p-0.5 cursor-pointer"
          onClick={(e) => {
            console.log('[CAMERA] Capture button clicked')
            e.preventDefault()
            e.stopPropagation()
            capturePhoto()
          }}
        >
          <div className="w-full h-full bg-white rounded-full"></div>
        </div>

        {/* Add student */}
        <UserPlus className="h-8 w-8 text-white cursor-pointer" onClick={addStudent} />
      </div>

      {/* Status text */}
      {!canAddMorePhotos && (
        <div className="text-center mt-4">
          <p className="text-white text-sm opacity-60">
            Достигнуто максимальное количество фотографий для {activeStudent?.name}
          </p>
        </div>
      )}
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

    </div>
  )
}