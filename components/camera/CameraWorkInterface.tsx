'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X, Camera, RotateCcw, ChevronDown, Plus, Upload, Trash2, Edit3, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
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
  onSubmit: (students: Student[]) => void
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
  onSubmit,
  maxPhotosPerStudent = 5
}: CameraWorkInterfaceProps) {
  // Camera state
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')
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
  const navRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  // Serialize camera starts to avoid double inits on view switch
  const isStartingRef = useRef(false)

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      console.log('[CAMERA] startCamera called')
      console.log('[CAMERA] isStartingRef.current:', isStartingRef.current)
      console.log('[CAMERA] streamRef.current?.active:', streamRef.current?.active)

      if (isStartingRef.current) {
        console.log('[CAMERA] Start blocked - already starting')
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
        console.log('[CAMERA] Stopping existing stream')
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

      console.log('[CAMERA] Requesting media with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      console.log('[CAMERA] Media stream obtained:', stream.id)

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

  const switchCamera = useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)

    if (isStreaming) {
      stopCamera()
      setTimeout(() => startCamera(), 100)
    }
  }, [currentFacingMode, isStreaming, stopCamera, startCamera])

  const capturePhoto = useCallback(async () => {
    console.log('[CAMERA] capturePhoto called, checking conditions...')
    console.log('[CAMERA] videoRef.current:', !!videoRef.current)
    console.log('[CAMERA] canvasRef.current:', !!canvasRef.current)
    console.log('[CAMERA] isCapturing:', isCapturing)
    console.log('[CAMERA] isStreaming:', isStreaming)

    if (!videoRef.current || !canvasRef.current || isCapturing) {
      console.log('[CAMERA] Capture blocked - missing refs or already capturing')
      return
    }

    if (!isStreaming) {
      console.log('[CAMERA] Capture blocked - camera not streaming')
      toast.error('Камера не готова, попробуйте еще раз')
      return
    }

    const activeStudent = students[activeStudentIndex]
    if (activeStudent.photos.length >= maxPhotosPerStudent) {
      console.log('[CAMERA] Capture blocked - max photos reached')
      toast.error(`Максимум ${maxPhotosPerStudent} фотографий на ученика`)
      return
    }

    console.log('[CAMERA] Starting photo capture...')
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

      console.log('[CAMERA] Video dimensions:', video.videoWidth, 'x', video.videoHeight)

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
        toast.warning('Изображение получилось очень маленьким. Попробуйте сфотографировать ближе.')
      }

      const bundle = addPhotoDraft(checkId, activeStudentIndex, dataUrl)
      setStudents(mapDraftToLocal(bundle.students))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('drafts:updated'))
      }
      toast.success('Фотография сделана!')
      console.log('[CAMERA] Photo saved to drafts')
    } catch (err) {
      console.error('[CAMERA] Error capturing photo:', err)
      console.error('[CAMERA] Camera state - isStreaming:', isStreaming)
      console.error('[CAMERA] Video readyState:', videoRef.current?.readyState)
      console.error('[CAMERA] Stream active:', streamRef.current?.active)
      
      toast.error('Не удалось сделать фотографию. Попробуйте еще раз.')
      
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
  }, [isCapturing, isStreaming, students, activeStudentIndex, maxPhotosPerStudent, checkId, startCamera, stopCamera])

  // File upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const activeStudent = students[activeStudentIndex]
    const remainingSlots = maxPhotosPerStudent - activeStudent.photos.length

    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxPhotosPerStudent} фотографий на ученика`)
      return
    }

    const filesToProcess = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots)

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
        const dataUrl = await readAsDataUrl(file)
        lastBundle = addPhotoDraft(checkId, activeStudentIndex, dataUrl)
      } catch {
        // skip file on error
      }
    }

    if (lastBundle) {
      setStudents(mapDraftToLocal(lastBundle.students))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('drafts:updated'))
      }
    }

    if (filesToProcess.length > 0) {
      toast.success(`Добавлено ${filesToProcess.length} фотографий`)
    }

    // Clear input
    event.target.value = ''
  }, [students, activeStudentIndex, maxPhotosPerStudent, checkId])

  // Student management
  const addStudent = useCallback(() => {
    const { bundle, index } = addStudentDraft(checkId, `Ученик ${students.length + 1}`)
    setStudents(mapDraftToLocal(bundle.students))
    setActiveStudentIndex(index)
    toast.success('Ученик добавлен')
  }, [students.length, checkId])

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

    toast.success('Фотография удалена')
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

  // Keep active student centered in horizontal strip
  useEffect(() => {
    if (!navRef.current || !itemRefs.current[activeStudentIndex]) return
    const container = navRef.current
    const item = itemRefs.current[activeStudentIndex]!

    const center = () => {
      try {
        // Force layout recalculation for mobile
        container.offsetHeight
        item.offsetLeft
        
        // Get container's scroll area (without padding)
        const containerWidth = container.clientWidth
        const scrollWidth = container.scrollWidth
        
        // Calculate item position relative to scroll area
        const itemCenter = item.offsetLeft + (item.offsetWidth / 2)
        
        // Target: put item center at container center
        const targetScroll = itemCenter - (containerWidth / 2)
        
        // Apply scroll with bounds checking
        const maxScroll = scrollWidth - containerWidth
        const finalScroll = Math.max(0, Math.min(targetScroll, maxScroll))
        
        // Use both methods for better mobile compatibility
        container.scrollLeft = finalScroll
        container.scrollTo({ left: finalScroll, behavior: 'smooth' })
      } catch (error) {
        console.warn('[CAMERA] Centering error:', error)
      }
    }

    // Multiple attempts for different browser timing and slow devices
    requestAnimationFrame(() => {
      center()
      setTimeout(center, 100)
      setTimeout(center, 300) // Extra delay for slow mobile devices
    })
  }, [activeStudentIndex, students.length, isOpen, viewMode])



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
        {/* Header - Name pill centered; Done text on top-right */}
        <div className="flex items-center justify-between gap-3 p-4 pt-[env(safe-area-inset-top)]">
          {/* Name pill — слева, занимает всю доступную ширину, не перекрывает «Готово» */}
          <div className="flex-1 min-w-0">
            <div className="rounded-[52px] px-4 py-2 border-2 border-[#4f4f4f] bg-transparent">
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
                  className="bg-transparent text-white text-[20px] font-extrabold outline-none w-full text-left truncate"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-white text-[20px] font-extrabold truncate">
                    {activeStudent.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditName(activeStudent.name)
                      setEditingName(true)
                    }}
                    className="text-white hover:bg-white/20 h-auto p-1 flex-shrink-0"
                    aria-label="Редактировать имя"
                  >
                    <Edit3 className="w-4 h-4" strokeWidth={2.25} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Готово — справа, в обычном потоке */}
          <button
            className="text-white text-lg font-semibold flex-shrink-0"
            onClick={() => {
              setViewMode('camera')
            }}
            aria-label="Готово"
          >
            Готово
          </button>
        </div>

        {/* Photo display */}
        <div className="px-4 pt-4">
          {currentPhoto && (
            <div
              className="mx-auto mb-4 bg-white rounded-[42px] overflow-hidden ring-1 ring-white/10 max-h-[calc(100vh-260px)]"
              style={{ width: 'min(92vw, 560px)', aspectRatio: '2 / 3' }}
            >
              <Image
                src={currentPhoto.dataUrl}
                alt="Фотография работы"
                width={560}
                height={840}
                className="w-full h-full object-contain"
              />
            </div>
          )}

        </div>

        {/* Photo thumbnails */}
        {activeStudent.photos.length > 0 && (
          <div className="px-4 pb-28">
            <div className="flex items-center justify-center gap-2">
              {activeStudent.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`h-[66px] w-[44px] rounded-[8px] overflow-hidden border-2 ${index === currentPhotoIndex ? 'border-white' : 'border-white/40 opacity-60'}`}
                >
                  <Image
                    src={photo.dataUrl}
                    alt={`Фото ${index + 1}`}
                    width={44}
                    height={66}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="sticky bottom-0 bg-black px-7 py-[calc(1.5rem+env(safe-area-inset-bottom))] z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Переснять */}
            <div className="flex flex-col items-center gap-1 w-[75px]">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setViewMode('camera')
                }}
              >
                <Camera className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
              </Button>
              <span className="text-white text-[14px] font-medium">Переснять</span>
            </div>

            {/* Center: Еще страница */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 w-[99px]">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setViewMode('camera')
                }}
              >
                <Plus className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
              </Button>
              <span className="text-white text-[14px] font-medium">Еще страница</span>
            </div>

            {/* Удалить */}
            <div className="flex flex-col items-center gap-1 w-[58px]">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => currentPhoto && deletePhoto(currentPhoto.id)}
              >
                <Trash2 className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
              </Button>
              <span className="text-white text-[14px] font-medium">Удалить</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Camera mode
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{ minHeight: '100dvh', height: '100dvh' }}>
      {/* Video area with absolute overlay controls (Rotate, Close) */}
      <div className="relative overflow-hidden" style={{ height: 'calc(100dvh - 160px)' }}>
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

        {/* Overlay controls */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-6 text-white hover:bg-white/20 w-14 h-14"
          onClick={switchCamera}
          disabled={!isStreaming}
          aria-label="Переключить камеру"
        >
          <RotateCcw className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] right-7 text-white hover:bg-white/20 w-14 h-14"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
        </Button>
      </div>

      {/* Bottom controls and navigation adjusted per Figma */}
      <div className="bg-black px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex-shrink-0" style={{ minHeight: '100px' }}>
        {/* Bottom controls - centered trio */}
        <div className="flex items-center justify-center gap-10 mt-1">
          {/* Upload from gallery */}
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full text-white hover:bg-white/20"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Загрузить из галереи"
          >
            <Upload className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
          </Button>

          {/* Capture button (center) - circular without icon */}
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-white hover:bg-white disabled:opacity-50 ring-2 ring-[#f8bd00]"
            onClick={(e) => {
              console.log('[CAMERA] Capture button clicked')
              e.preventDefault()
              e.stopPropagation()
              capturePhoto()
            }}
            disabled={!isStreaming || isCapturing || !canAddMorePhotos}
            aria-label="Сделать снимок"
          >
            <span className="sr-only">Сделать снимок</span>
          </Button>

          {/* Add student */}
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 rounded-full text-white hover:bg-white/20"
            onClick={addStudent}
            aria-label="Добавить ученика"
          >
            <UserPlus className="size-8" style={{ width: 32, height: 32 }} strokeWidth={3} />
          </Button>
        </div>

        {/* Status text */}
        {!canAddMorePhotos && (
          <div className="text-center mt-4">
            <p className="text-white text-sm opacity-60">
              Достигнуто максимальное количество фотографий для {activeStudent?.name}
            </p>
          </div>
        )}
      </div>

      {/* Student navigation moved to very bottom; arrow integrated with each student block */}
      <div className="bg-black px-4 pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex-shrink-0" style={{ minHeight: '70px' }}>
        <div className="relative w-full overflow-hidden">
          <div
            ref={navRef}
            className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth"
            style={{ 
              paddingLeft: 'calc(50vw - 60px)',
              paddingRight: 'calc(50vw - 60px)',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x'
            }}
          >
            {students.map((student, index) => (
              <div
                key={student.id}
                ref={(el) => { itemRefs.current[index] = el }}
                className="relative flex-shrink-0 flex flex-col items-center justify-start"
                style={{ 
                  minWidth: 'max-content',
                  padding: '0 6px'
                }}
              >
                <button
                  className="flex items-center justify-center"
                  style={{ gap: '3px', whiteSpace: 'nowrap', alignItems: 'center' }}
                  onClick={() => setActiveStudentIndex(index)}
                  aria-label={`Выбрать ${student.name}`}
                >
                  <span 
                    className={`text-[18px] leading-[22px] font-extrabold font-nunito tracking-tight ${
                      index === activeStudentIndex ? 'text-white' : 'text-white/40'
                    }`}
                    style={{ 
                      maxWidth: '120px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {student.name}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-[8px] h-4 w-4 text-[9px] font-bold ${
                      index === activeStudentIndex ? 'bg-[#096ff5] text-white' : 'bg-white text-black/70 opacity-40'
                    }`}
                    style={{ flexShrink: 0, lineHeight: '1' }}
                  >
                    {student.photos.length}
                  </span>
                </button>
                <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Button
                    variant="ghost"
                    className={`p-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity ${
                      activeStudentIndex === index 
                        ? 'text-white hover:bg-white/20 opacity-100' 
                        : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={activeStudentIndex === index ? handlePhotoClick : undefined}
                    aria-label="Открыть просмотр и редактирование"
                  >
                    <ChevronDown className="size-6" style={{ width: 24, height: 24 }} strokeWidth={3} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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