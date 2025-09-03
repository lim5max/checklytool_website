'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye
} from 'lucide-react'
import { ImageUpload, type UploadedFile } from '@/components/submission/ImageUpload'
import { CameraScanner } from '@/components/submission/CameraScanner'
import { toast } from 'sonner'

interface CheckInfo {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  variant_count: number
  total_questions?: number
}

interface SubmissionPageProps {
  params: Promise<{ id: string }>
}

export default function SubmissionPage({ params }: SubmissionPageProps) {
  const router = useRouter()
  const [checkInfo, setCheckInfo] = useState<CheckInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [checkId, setCheckId] = useState<string>('')
  
  // Форма данных
  const [studentName, setStudentName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('upload')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadCheckInfo()
    }
  }, [checkId])

  const loadCheckInfo = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/checks/${checkId}`)
      
      if (!response.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const data = await response.json()
      setCheckInfo(data.check)
      
    } catch (error) {
      console.error('Error loading check info:', error)
      toast.error('Не удалось загрузить информацию о работе')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  const handleCameraPhotos = (photos: File[]) => {
    const newFiles: UploadedFile[] = photos.map(photo => ({
      file: photo,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(photo),
      status: 'pending',
      progress: 0
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setActiveTab('upload') // Переключаемся на вкладку загрузки
  }

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Загрузите хотя бы одно изображение')
      return
    }

    if (!studentName.trim()) {
      toast.error('Введите имя студента')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Create FormData for submission
      const formData = new FormData()
      formData.append('student_name', studentName)
      formData.append('student_class', studentClass)
      
      uploadedFiles.forEach((uploadedFile) => {
        formData.append('images', uploadedFile.file)
      })

      setUploadProgress(25)

      // Send to server
      const response = await fetch(`/api/checks/${checkId}/submissions`, {
        method: 'POST',
        body: formData
      })

      setUploadProgress(75)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при загрузке работы')
      }

      const result = await response.json()
      
      setUploadProgress(100)
      
      toast.success('Работа успешно загружена!')
      
      // Start processing
      setTimeout(async () => {
        try {
          const evalResponse = await fetch(`/api/submissions/${result.submission.id}/evaluate`, {
            method: 'POST'
          })
          
          if (evalResponse.ok) {
            toast.success('Обработка работы запущена')
            router.push(`/dashboard/checks/${checkId}/results?highlight=${result.submission.id}`)
          }
        } catch (evalError) {
          console.error('Error starting evaluation:', evalError)
          router.push(`/dashboard/checks/${checkId}`)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error submitting work:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при отправке')
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!checkInfo) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
                <Button onClick={() => router.push('/dashboard')}>
                  Вернуться к списку
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed').length
  const totalFiles = uploadedFiles.length
  const canSubmit = totalFiles > 0 && completedFiles === totalFiles && studentName.trim()

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/dashboard/checks/${checkId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Загрузка работ студентов</h1>
            <p className="text-gray-600 mt-1">{checkInfo.title}</p>
          </div>
        </div>

        {/* Информация о работе */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о проверочной работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Предмет</Label>
                <p className="mt-1">
                  {checkInfo.subject ? (
                    <Badge variant="secondary">{checkInfo.subject}</Badge>
                  ) : (
                    'Не указан'
                  )}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Класс</Label>
                <p className="mt-1">
                  {checkInfo.class_level ? (
                    <Badge variant="outline">{checkInfo.class_level}</Badge>
                  ) : (
                    'Не указан'
                  )}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Вариантов</Label>
                <p className="mt-1 text-lg font-semibold">{checkInfo.variant_count}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Заданий</Label>
                <p className="mt-1 text-lg font-semibold">{checkInfo.total_questions || 'Не указано'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Форма загрузки */}
        <Card>
          <CardHeader>
            <CardTitle>Данные студента</CardTitle>
            <CardDescription>
              Введите информацию о студенте, чья работа загружается
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentName">Имя студента *</Label>
                <Input
                  id="studentName"
                  placeholder="Фамилия Имя"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <Label htmlFor="studentClass">Класс</Label>
                <Input
                  id="studentClass"
                  placeholder="9А, 10Б, и т.д."
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Загрузка изображений */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Загрузить файлы
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="h-4 w-4 mr-2" />
              Сканировать камерой
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <ImageUpload
              onFilesChange={handleFilesChange}
              maxFiles={20}
              disabled={isSubmitting}
            />
          </TabsContent>

          <TabsContent value="camera">
            <CameraScanner
              onPhotosCapture={handleCameraPhotos}
              maxPhotos={20}
              disabled={isSubmitting}
            />
          </TabsContent>
        </Tabs>

        {/* Прогресс загрузки */}
        {isSubmitting && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Загрузка работы...</span>
                  <span className="text-sm text-gray-500">{uploadProgress}%</span>
                </div>
                
                <Progress value={uploadProgress} className="h-2" />
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {uploadProgress < 80 && 'Загрузка изображений...'}
                    {uploadProgress >= 80 && uploadProgress < 95 && 'Обработка данных...'}
                    {uploadProgress >= 95 && 'Завершение...'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Сводка */}
        {totalFiles > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {completedFiles === totalFiles ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    )}
                    <span className="font-medium">
                      Файлов готово: {completedFiles} из {totalFiles}
                    </span>
                  </div>
                  
                  {studentName && (
                    <div className="text-sm text-gray-600">
                      Студент: {studentName} {studentClass && `(${studentClass})`}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting}
                  className="min-w-[150px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загружаем...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Отправить работу
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}