'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  photos: string[]
}

interface FullscreenCameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoDataUrl: string) => void
  students: Student[]
  activeStudentIndex: number
  onStudentChange: (index: number) => void
  maxPhotosPerStudent?: number
}

export function FullscreenCameraModal({
  isOpen,
  onClose,
  onCapture,
  students,
  activeStudentIndex,
  onStudentChange,
  maxPhotosPerStudent = 5
}: FullscreenCameraModalProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check camera availability
  const checkCameraAvailability = useCallback(async () => {
    try {
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Camera access requires HTTPS or localhost')
      }
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Camera API not available')
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found')
      }

      return videoDevices
    } catch (err) {
      console.error('Error checking camera availability:', err)
      throw new Error('Unable to access camera')
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      // Check camera availability
      await checkCameraAvailability()

      // Stop previous stream
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
      setError('Unable to access camera. Please check permissions.')
      setIsStreaming(false)
    }
  }, [currentFacingMode, checkCameraAvailability])

  // Stop camera
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

  // Switch camera
  const switchCamera = useCallback(() => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)
    
    if (isStreaming) {
      stopCamera()
      setTimeout(() => startCamera(), 100)
    }
  }, [currentFacingMode, isStreaming, stopCamera, startCamera])

  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return

    setIsCapturing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Cannot get canvas context')
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      onCapture(dataUrl)
      
      toast.success('Photo captured!')
    } catch (err) {
      console.error('Error capturing photo:', err)
      toast.error('Failed to capture photo')
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, onCapture])

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        capturePhoto()
      } else if (e.code === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, capturePhoto, onClose])

  if (!isOpen) return null

  const activeStudent = students[activeStudentIndex]
  const canAddMorePhotos = activeStudent?.photos.length < maxPhotosPerStudent

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video stream area */}
      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-lg mb-4">{error}</p>
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
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
            
            {/* Gray overlay representing viewfinder */}
            <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none" />
          </>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 right-7 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="w-8 h-8" />
        </Button>

        {/* Camera switch button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 left-64 text-white hover:bg-white/20"
          onClick={switchCamera}
          disabled={!isStreaming}
        >
          <RotateCcw className="w-8 h-8" />
        </Button>
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-4 py-6">
        {/* Student navigation */}
        <div className="flex items-center justify-center gap-7 mb-6">
          {students.map((student, index) => (
            <div
              key={student.id}
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onStudentChange(index)}
            >
              <p className={`text-[20px] font-extrabold leading-none whitespace-nowrap ${
                index === activeStudentIndex 
                  ? 'text-white' 
                  : 'text-white opacity-40'
              }`}>
                {student.name}
              </p>
              {index === activeStudentIndex && (
                <div className="w-[18px] h-[18px] text-white">
                  <ChevronRight className="w-full h-full" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Capture controls */}
        <div className="flex items-center justify-center">
          {/* Photo thumbnails */}
          <div className="absolute left-[72px]">
            {activeStudent?.photos.length > 0 && (
              <div 
                className="w-12 h-12 rounded-[24px] bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: `url('${activeStudent.photos[activeStudent.photos.length - 1]}')`
                }}
              />
            )}
          </div>

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
        </div>

        {/* Status text */}
        {!canAddMorePhotos && (
          <div className="text-center mt-4">
            <p className="text-white text-sm opacity-60">
              Maximum photos reached for {activeStudent?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}