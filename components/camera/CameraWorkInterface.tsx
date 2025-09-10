'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera, RotateCcw, ChevronLeft, ChevronRight, Plus, Upload, Trash2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'

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
  onClose: () => void
  onSubmit: (students: Student[]) => void
  checkTitle?: string
  maxPhotosPerStudent?: number
}

type ViewMode = 'camera' | 'review'

export function CameraWorkInterface({
  isOpen,
  onClose,
  onSubmit,
  checkTitle = 'Контрольная по информатике',
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

  // Camera functions
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Check if camera API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Камера недоступна. Требуется HTTPS или localhost.')
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Error starting camera:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Не удается получить доступ к камере. Проверьте разрешения или используйте HTTPS.')
      }
      setIsStreaming(false)
    }
  }, [currentFacingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
    setError(null)
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
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    const activeStudent = students[activeStudentIndex]
    if (activeStudent.photos.length >= maxPhotosPerStudent) {
      toast.error(`Максимум ${maxPhotosPerStudent} фотографий на ученика`)
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

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      const newPhoto: Photo = {
        id: Date.now().toString(),
        dataUrl,
        timestamp: Date.now()
      }

      setStudents(prev => prev.map((student, index) => 
        index === activeStudentIndex 
          ? { ...student, photos: [...student.photos, newPhoto] }
          : student
      ))
      
      toast.success('Фотография сделана!')
    } catch (err) {
      console.error('Error capturing photo:', err)
      toast.error('Не удалось сделать фотографию')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, students, activeStudentIndex, maxPhotosPerStudent])

  // File upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const activeStudent = students[activeStudentIndex]
    const remainingSlots = maxPhotosPerStudent - activeStudent.photos.length

    if (remainingSlots <= 0) {
      toast.error(`Максимум ${maxPhotosPerStudent} фотографий на ученика`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    filesToProcess.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          const newPhoto: Photo = {
            id: Date.now().toString() + Math.random(),
            dataUrl,
            timestamp: Date.now()
          }

          setStudents(prev => prev.map((student, index) => 
            index === activeStudentIndex 
              ? { ...student, photos: [...student.photos, newPhoto] }
              : student
          ))
        }
        reader.readAsDataURL(file)
      }
    })

    if (filesToProcess.length > 0) {
      toast.success(`Добавлено ${filesToProcess.length} фотографий`)
    }

    // Clear input
    event.target.value = ''
  }, [students, activeStudentIndex, maxPhotosPerStudent])

  // Student management
  const addStudent = useCallback(() => {
    const newStudent: Student = {
      id: Date.now().toString(),
      name: `Ученик ${students.length + 1}`,
      photos: []
    }
    setStudents(prev => [...prev, newStudent])
    setActiveStudentIndex(students.length)
    toast.success('Ученик добавлен')
  }, [students.length])

  const updateStudentName = useCallback((name: string) => {
    setStudents(prev => prev.map((student, index) => 
      index === activeStudentIndex 
        ? { ...student, name }
        : student
    ))
  }, [activeStudentIndex])

  const deletePhoto = useCallback((photoId: string) => {
    setStudents(prev => prev.map((student, index) => 
      index === activeStudentIndex 
        ? { ...student, photos: student.photos.filter(p => p.id !== photoId) }
        : student
    ))
    
    const activeStudent = students[activeStudentIndex]
    if (currentPhotoIndex >= activeStudent.photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, activeStudent.photos.length - 2))
    }
    
    toast.success('Фотография удалена')
  }, [students, activeStudentIndex, currentPhotoIndex])

  // Effects
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
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, viewMode, capturePhoto, onClose])

  // Handle photo click - switch to review mode
  const handlePhotoClick = useCallback(() => {
    const activeStudent = students[activeStudentIndex]
    if (activeStudent.photos.length > 0) {
      setCurrentPhotoIndex(activeStudent.photos.length - 1)
      setViewMode('review')
    }
  }, [students, activeStudentIndex])

  // Handle submit
  const handleSubmit = useCallback(() => {
    const studentsWithPhotos = students.filter(s => s.photos.length > 0)
    if (studentsWithPhotos.length === 0) {
      toast.error('Добавьте хотя бы одну фотографию')
      return
    }
    onSubmit(students)
  }, [students, onSubmit])

  if (!isOpen) return null

  const activeStudent = students[activeStudentIndex]
  const canAddMorePhotos = activeStudent?.photos.length < maxPhotosPerStudent

  // Review mode
  if (viewMode === 'review') {
    const currentPhoto = activeStudent.photos[currentPhotoIndex]
    
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-7 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-8 h-8" />
          </Button>
          
          <div className="bg-gray-500/30 rounded-full px-4 py-2 border-2 border-gray-600">
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
                className="bg-transparent text-white text-xl font-extrabold text-center outline-none"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-extrabold opacity-50">
                  {activeStudent.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditName(activeStudent.name)
                    setEditingName(true)
                  }}
                  className="text-white hover:bg-white/20 h-auto p-1"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Photo display */}
        <div className="flex-1 flex items-center justify-center relative p-4">
          {currentPhoto && (
            <img
              src={currentPhoto.dataUrl}
              alt="Фотография работы"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          )}
          
          {/* Navigation arrows */}
          {activeStudent.photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                disabled={currentPhotoIndex === 0}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={() => setCurrentPhotoIndex(Math.min(activeStudent.photos.length - 1, currentPhotoIndex + 1))}
                disabled={currentPhotoIndex === activeStudent.photos.length - 1}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}
        </div>

        {/* Photo thumbnails */}
        {activeStudent.photos.length > 1 && (
          <div className="px-4 pb-2">
            <div className="flex items-center justify-center gap-2">
              {activeStudent.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                    index === currentPhotoIndex ? 'border-white' : 'border-gray-600'
                  }`}
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="bg-black px-7 py-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setViewMode('camera')
                  if (canAddMorePhotos) {
                    startCamera()
                  }
                }}
              >
                <Camera className="w-6 h-6" />
              </Button>
              <span className="text-white text-sm font-medium">Переснять</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => currentPhoto && deletePhoto(currentPhoto.id)}
              >
                <Trash2 className="w-6 h-6" />
              </Button>
              <span className="text-white text-sm font-medium">Удалить</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setViewMode('camera')
                  if (canAddMorePhotos) {
                    startCamera()
                  }
                }}
              >
                <Plus className="w-6 h-6" />
              </Button>
              <span className="text-white text-sm font-medium">Еще страница</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Camera mode
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 text-white">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-8 h-8" />
        </Button>
        
        <h1 className="text-xl font-bold">{checkTitle}</h1>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={switchCamera}
          disabled={!isStreaming}
        >
          <RotateCcw className="w-8 h-8" />
        </Button>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white p-8 max-w-md">
              <div className="mb-6">
                <Camera className="w-16 h-16 text-white opacity-50 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Камера недоступна</h3>
                <p className="text-base mb-4 leading-relaxed">{error}</p>
              </div>
              
              <div className="space-y-3 text-sm text-white opacity-80">
                <p><strong>Решения:</strong></p>
                <ul className="text-left space-y-2">
                  <li>• Откройте сайт через <code className="bg-white/20 px-1 rounded">localhost:3000</code></li>
                  <li>• Используйте HTTPS соединение</li>
                  <li>• Проверьте разрешения браузера</li>
                </ul>
              </div>
              
              <div className="mt-6 space-y-3">
                <Button 
                  onClick={startCamera} 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-black"
                >
                  Попробовать снова
                </Button>
                
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm opacity-60">или загрузите фото с устройства</p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Выбрать файлы
                  </Button>
                </div>
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
      </div>

      {/* Student navigation */}
      <div className="bg-black px-4 py-4">
        <div className="flex items-center justify-center gap-7 mb-6">
          {students.map((student, index) => (
            <button
              key={student.id}
              className="flex items-center gap-2"
              onClick={() => setActiveStudentIndex(index)}
            >
              <span className={`text-xl font-extrabold whitespace-nowrap ${
                index === activeStudentIndex 
                  ? 'text-white' 
                  : 'text-white opacity-40'
              }`}>
                {student.name}
              </span>
              {index === activeStudentIndex && (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          ))}
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={addStudent}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-center">
          {/* Upload button */}
          <div className="absolute left-[72px]">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full text-white hover:bg-white/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6" />
            </Button>
          </div>

          {/* Last photo thumbnail */}
          {activeStudent?.photos.length > 0 && (
            <button
              onClick={handlePhotoClick}
              className="absolute left-[72px] w-12 h-12 rounded-full bg-cover bg-center bg-no-repeat overflow-hidden border-2 border-white"
            >
              <img
                src={activeStudent.photos[activeStudent.photos.length - 1].dataUrl}
                alt="Последнее фото"
                className="w-full h-full object-cover"
              />
            </button>
          )}

          {/* Capture button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-[72px] h-[72px] rounded-full bg-white hover:bg-gray-200 disabled:opacity-50"
            onClick={capturePhoto}
            disabled={!isStreaming || isCapturing || !canAddMorePhotos}
          >
            <Camera className="w-8 h-8 text-black" />
          </Button>

          {/* Submit button */}
          <div className="absolute right-[72px]">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleSubmit}
            >
              Отправить
            </Button>
          </div>
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