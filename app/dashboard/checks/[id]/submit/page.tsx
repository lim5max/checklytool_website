'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Loader2
} from 'lucide-react'
import { ImageUpload, type UploadedFile } from '@/components/submission/ImageUpload'
import { CameraScanner } from '@/components/submission/CameraScanner'
import { SubmissionUploader, type Student } from '@/components/submission/SubmissionUploader'
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
  const [useNewUploader, setUseNewUploader] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  const loadCheckInfo = useCallback(async () => {
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
  }, [checkId, router])

  useEffect(() => {
    if (checkId) {
      loadCheckInfo()
    }
  }, [checkId, loadCheckInfo])

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  const handleCameraPhotos = (photos: File[]) => {
    const newFiles: UploadedFile[] = photos.map(photo => ({
      file: photo,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(photo),
      status: 'completed', // Файлы с камеры сразу готовы к отправке
      progress: 100
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setActiveTab('upload') // Переключаемся на вкладку загрузки
  }

  const handleMultiStudentSubmit = async (students: Student[]) => {
    if (students.length === 0 || students.every(s => s.photos.length === 0)) {
      toast.error('Загрузите хотя бы одну фотографию')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      const submissions: { student: Student; submissionId: string }[] = []
      const totalStudents = students.filter(s => s.photos.length > 0).length
      let completedStudents = 0

      for (const student of students) {
        if (student.photos.length === 0) continue

        const formData = new FormData()
        formData.append('student_name', student.name)
        formData.append('student_class', studentClass)
        
        // Convert base64 photos to files
        student.photos.forEach((photoDataUrl, index) => {
          const byteString = atob(photoDataUrl.split(',')[1])
          const mimeString = photoDataUrl.split(',')[0].split(':')[1].split(';')[0]
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([ab], { type: mimeString })
          const file = new File([blob], `photo_${index + 1}.jpg`, { type: mimeString })
          formData.append('images', file)
        })

        setUploadProgress((completedStudents / totalStudents) * 80)

        const response = await fetch(`/api/checks/${checkId}/submissions`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Ошибка при загрузке работы ${student.name}: ${error.error || 'Неизвестная ошибка'}`)
        }

        const result = await response.json()
        submissions.push(result.submission)
        completedStudents++
      }

      setUploadProgress(90)
      
      toast.success(`Успешно загружено ${submissions.length} работ!`)
      
      // Start processing for all submissions
      setUploadProgress(100)
      
      setTimeout(async () => {
        try {
          const evaluationPromises = submissions.map((submission: { student: Student; submissionId: string }) => 
            fetch(`/api/submissions/${submission.submissionId}/evaluate`, { method: 'POST' })
          )
          
          await Promise.all(evaluationPromises)
          toast.success('Обработка всех работ завершена')
          router.push(`/dashboard/checks/${checkId}/results`)
        } catch (evalError) {
          console.error('Error during batch evaluation:', evalError)
          toast.error('Ошибка при обработке некоторых работ')
          router.push(`/dashboard/checks/${checkId}`)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Error in batch submission:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при загрузке работ')
      setUploadProgress(0)
    } finally {
      setIsSubmitting(false)
    }
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

      setUploadProgress(90)

      toast.success('Работа успешно загружена!')

      // Start processing immediately without timeout
      try {
        console.log('Starting evaluation for submission:', result.submission.id)

        const evalResponse = await fetch(`/api/submissions/${result.submission.id}/evaluate`, {
          method: 'POST'
        })

        setUploadProgress(100)

        if (evalResponse.ok) {
          const evalResult = await evalResponse.json()
          console.log('Evaluation completed:', evalResult)
          toast.success('Обработка работы завершена')
          // Плавный переход через состояние загрузки
          setTimeout(() => {
            router.push(`/dashboard/checks/${checkId}/results?highlight=${result.submission.id}`)
          }, 500)
        } else {
          const errorData = await evalResponse.json()
          console.error('Evaluation failed:', errorData)
          toast.error(`Ошибка при обработке: ${errorData.error || 'Неизвестная ошибка'}`)
          setTimeout(() => {
            router.push(`/dashboard/checks/${checkId}`)
          }, 500)
        }
      } catch (evalError) {
        console.error('Error starting evaluation:', evalError)
        toast.error('Не удалось запустить обработку работы')
        setTimeout(() => {
          router.push(`/dashboard/checks/${checkId}`)
        }, 500)
      }
      
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
  const canSubmit = totalFiles > 0 && studentName.trim() && !isSubmitting

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

        {/* Upload Mode Toggle */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Режим загрузки</h3>
                <p className="text-sm text-gray-600">
                  Выберите удобный способ загрузки работ
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!useNewUploader ? 'default' : 'outline'}
                  onClick={() => setUseNewUploader(false)}
                  disabled={isSubmitting}
                >
                  Один студент
                </Button>
                <Button
                  variant={useNewUploader ? 'default' : 'outline'}
                  onClick={() => setUseNewUploader(true)}
                  disabled={isSubmitting}
                >
                  Несколько студентов
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {useNewUploader ? (
          /* Multi-student uploader */
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-green-700 font-medium">Режим загрузки для нескольких студентов активен</p>
                </div>
              </CardContent>
            </Card>
            <SubmissionUploader
              onSubmit={handleMultiStudentSubmit}
              maxStudents={10}
              maxPhotosPerStudent={5}
            />
          </div>
        ) : (
          /* Original single-student uploader */
          <>
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
          </>
        )}

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

        {/* Сводка - показываем только для одиночного режима */}
        {!useNewUploader && totalFiles > 0 && (
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