'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  X, 
  RotateCcw, 
  Flashlight, 
  FlashlightOff, 
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  SwitchCamera
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface CapturedPhoto {
  id: string
  blob: Blob
  url: string
  timestamp: Date
}

interface CameraScannerProps {
  onPhotosCapture: (photos: File[]) => void
  maxPhotos?: number
  disabled?: boolean
  className?: string
}

export function CameraScanner({
  onPhotosCapture,
  maxPhotos = 20,
  disabled = false,
  className = ''
}: CameraScannerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')
  const [hasFlash, setHasFlash] = useState(false)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Проверяем доступность камеры
  const checkCameraAvailability = useCallback(async () => {
    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Camera access requires HTTPS or localhost')
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        throw new Error('Камера не найдена')
      }

      return videoDevices
    } catch (err) {
      console.error('Error checking camera availability:', err)
      throw new Error('Не удается получить доступ к камере')
    }
  }, [])

  // Запуск камеры
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Проверяем доступность камеры
      await checkCameraAvailability()

      // Останавливаем предыдущий поток
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

        // Проверяем поддержку вспышки
        const videoTrack = stream.getVideoTracks()[0]
        const capabilities = videoTrack.getCapabilities()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setHasFlash(!!(capabilities as any).torch)
      }
    } catch (err) {
      console.error('Error starting camera:', err)
      setError('Не удается получить доступ к камере. Проверьте разрешения.')
      setIsStreaming(false)
    }
  }, [currentFacingMode, checkCameraAvailability])

  // Остановка камеры
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

  // Переключение камеры
  const switchCamera = useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)
    
    if (isStreaming) {
      stopCamera()
      setTimeout(() => startCamera(), 100)
    }
  }, [currentFacingMode, isStreaming, stopCamera, startCamera])

  // Включение/выключение вспышки
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !hasFlash) return

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0]
      await videoTrack.applyConstraints({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        advanced: [{ torch: !isFlashOn } as any]
      })
      setIsFlashOn(!isFlashOn)
    } catch (err) {
      console.error('Error toggling flash:', err)
      toast.error('Не удается управлять вспышкой')
    }
  }, [hasFlash, isFlashOn])

  // Захват фото
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Не удается получить контекст canvas')
      }

      // Устанавливаем размеры canvas равными размеру видео
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Рисуем текущий кадр на canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Конвертируем в blob
      return new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Не удается создать изображение'))
            return
          }

          const photo: CapturedPhoto = {
            id: Math.random().toString(36).substr(2, 9),
            blob,
            url: URL.createObjectURL(blob),
            timestamp: new Date()
          }

          setCapturedPhotos(prev => [...prev, photo])
          toast.success('Фото захвачено!')
          resolve()
        }, 'image/jpeg', 0.9)
      })
    } catch (err) {
      console.error('Error capturing photo:', err)
      toast.error('Ошибка при захвате фото')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing])

  // Удаление фото
  const removePhoto = useCallback((photoId: string) => {
    setCapturedPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== photoId)
      // Освобождаем URL для удаленного фото
      const removedPhoto = prev.find(photo => photo.id === photoId)
      if (removedPhoto) {
        URL.revokeObjectURL(removedPhoto.url)
      }
      return updated
    })
  }, [])

  // Сохранение всех фото
  const savePhotos = useCallback(() => {
    const files = capturedPhotos.map((photo, index) => {
      return new File([photo.blob], `photo_${index + 1}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })
    })
    
    onPhotosCapture(files)
    
    // Очищаем захваченные фото
    capturedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.url)
    })
    setCapturedPhotos([])
    
    toast.success(`Сохранено ${files.length} фото`)
  }, [capturedPhotos, onPhotosCapture])

  // Очистка всех фото
  const clearPhotos = useCallback(() => {
    capturedPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.url)
    })
    setCapturedPhotos([])
  }, [capturedPhotos])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopCamera()
      capturedPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.url)
      })
    }
  }, [stopCamera, capturedPhotos])

  const canCaptureMore = capturedPhotos.length < maxPhotos

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Сканирование работ
            </span>
            {capturedPhotos.length > 0 && (
              <Badge variant="secondary">
                {capturedPhotos.length} / {maxPhotos}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Камера */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {isStreaming ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  {error ? (
                    <div className="space-y-2">
                      <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm">{error}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm">Нажмите &quot;Включить камеру&quot; для начала</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Оверлей с элементами управления */}
            {isStreaming && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Рамка для фокусировки */}
                <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
                
                {/* Контролы */}
                <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={switchCamera}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                  >
                    <SwitchCamera className="h-4 w-4" />
                  </Button>
                  
                  {hasFlash && (
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={toggleFlash}
                      className="bg-black/50 hover:bg-black/70 text-white border-0"
                    >
                      {isFlashOn ? <Flashlight className="h-4 w-4" /> : <FlashlightOff className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Управление камерой */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isStreaming ? (
              <Button
                onClick={startCamera}
                disabled={disabled}
                className="min-w-[150px]"
              >
                <Camera className="h-4 w-4 mr-2" />
                Включить камеру
              </Button>
            ) : (
              <>
                <Button
                  onClick={capturePhoto}
                  disabled={!canCaptureMore || isCapturing}
                  className="min-w-[150px]"
                >
                  {isCapturing ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Сделать фото
                </Button>
                
                <Button
                  onClick={stopCamera}
                  variant="outline"
                >
                  Закрыть камеру
                </Button>
              </>
            )}
          </div>

          {/* Захваченные фото */}
          {capturedPhotos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Захваченные фото</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearPhotos}
                  >
                    Очистить
                  </Button>
                  <Button
                    size="sm"
                    onClick={savePhotos}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Сохранить ({capturedPhotos.length})
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {capturedPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={photo.url}
                        alt={`Захваченное фото ${index + 1}`}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {!canCaptureMore && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-orange-700">
                    Достигнуто максимальное количество фото ({maxPhotos})
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Скрытый canvas для захвата фото */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}