'use client'

import { useState, useRef, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  FileImage, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Camera,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export interface UploadedFile {
  file: File
  id: string
  preview: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  url?: string
  error?: string
}

interface ImageUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // в байтах
  acceptedFileTypes?: string[]
  disabled?: boolean
  showCamera?: boolean
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/heic'
]

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function ImageUpload({
  onFilesChange,
  maxFiles = 20,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  showCamera = true,
  className = ''
}: ImageUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Обработка отклоненных файлов
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`Файл ${file.name} слишком большой (макс. ${Math.round(maxSize / 1024 / 1024)} МБ)`)
        } else if (error.code === 'file-invalid-type') {
          toast.error(`Неподдерживаемый тип файла: ${file.name}`)
        } else if (error.code === 'too-many-files') {
          toast.error(`Максимальное количество файлов: ${maxFiles}`)
        }
      })
    })

    if (acceptedFiles.length === 0) return

    // Проверяем лимит файлов
    const totalFiles = files.length + acceptedFiles.length
    if (totalFiles > maxFiles) {
      toast.error(`Максимальное количество файлов: ${maxFiles}`)
      return
    }

    // Создаем объекты для загруженных файлов
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      status: 'completed', // Файлы сразу готовы к отправке
      progress: 100
    }))

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [files, maxFiles, maxSize, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles
  })

  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(f => f.id !== fileId)
      onFilesChange(updatedFiles)
      return updatedFiles
    })
  }, [onFilesChange])

  const updateFileStatus = useCallback((fileId: string, updates: Partial<UploadedFile>) => {
    setFiles(prevFiles => {
      const updatedFiles = prevFiles.map(f => 
        f.id === fileId ? { ...f, ...updates } : f
      )
      onFilesChange(updatedFiles)
      return updatedFiles
    })
  }, [onFilesChange])

  const retryUpload = useCallback((fileId: string) => {
    updateFileStatus(fileId, { status: 'completed', error: undefined, progress: 100 })
  }, [updateFileStatus])

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      onDrop(Array.from(fileList), [])
    }
    // Очищаем input для возможности выбора тех же файлов
    event.target.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileImage className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop зона */}
      <Card className={`transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
              ${disabled || files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? 'Отпустите файлы для загрузки' 
                    : 'Перетащите изображения сюда'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  или используйте кнопки ниже
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  disabled={disabled || files.length >= maxFiles}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Выбрать файлы
                </Button>
                
                {showCamera && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openCamera}
                    disabled={disabled || files.length >= maxFiles}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Сделать фото
                  </Button>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Максимум {maxFiles} файлов, до {Math.round(maxSize / 1024 / 1024)} МБ каждый
                </p>
                <p>
                  Поддерживаемые форматы: JPEG, PNG, WebP, HEIC
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Скрытые input элементы */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFileTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Список загруженных файлов */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Загруженные файлы ({files.length}/{maxFiles})
            </h3>
            {files.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiles([])
                  onFilesChange([])
                }}
              >
                Очистить всё
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            {files.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Превью изображения */}
                  <div className="shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border">
                      <Image
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Информация о файле */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(uploadedFile.status)}
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <Badge variant="outline" className={getStatusColor(uploadedFile.status)}>
                        {uploadedFile.status === 'pending' && 'Ожидание'}
                        {uploadedFile.status === 'uploading' && 'Загрузка'}
                        {uploadedFile.status === 'completed' && 'Готово'}
                        {uploadedFile.status === 'error' && 'Ошибка'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Прогресс загрузки */}
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="mt-2" />
                    )}

                    {/* Сообщение об ошибке */}
                    {uploadedFile.status === 'error' && uploadedFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2 shrink-0">
                    {uploadedFile.status === 'error' && (
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => retryUpload(uploadedFile.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeFile(uploadedFile.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}