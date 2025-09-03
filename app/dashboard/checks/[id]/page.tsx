'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Upload, 
  BarChart3, 
  Users, 
  FileText,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import { VariantManager } from '@/components/checks/VariantManager'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CheckData {
  id: string
  title: string
  description?: string
  subject?: string
  class_level?: string
  variant_count: number
  total_questions?: number
  created_at: string
  updated_at: string
  variants: Array<{
    id: string
    variant_number: number
    reference_answers?: Record<string, string>
    reference_image_urls?: string[]
  }>
  statistics?: {
    total_submissions: number
    completed_submissions: number
    average_score?: number
    grade_distribution?: Record<string, number>
  }
}

interface CheckPageProps {
  params: Promise<{ id: string }>
}

export default function CheckPage({ params }: CheckPageProps) {
  const router = useRouter()
  const [checkData, setCheckData] = useState<CheckData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('variants')
  const [checkId, setCheckId] = useState<string>('')

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setCheckId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (checkId) {
      loadCheckData()
    }
  }, [checkId])

  const loadCheckData = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/checks/${checkId}`)
      
      if (!response.ok) {
        throw new Error('Проверочная работа не найдена')
      }

      const data = await response.json()
      setCheckData(data.check)
      
    } catch (error) {
      console.error('Error loading check data:', error)
      toast.error('Не удалось загрузить данные')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVariantUpdate = (updatedVariants: CheckData['variants']) => {
    if (checkData) {
      setCheckData({
        ...checkData,
        variants: updatedVariants
      })
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!checkData) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Проверочная работа не найдена</h2>
                <p className="text-gray-600 mb-4">
                  Возможно, работа была удалена или у вас нет прав доступа
                </p>
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

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{checkData.title}</h1>
            {checkData.description && (
              <p className="text-gray-600 mt-1">{checkData.description}</p>
            )}
          </div>
        </div>

        {/* Информация о работе */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Предмет и класс</p>
                <div className="flex gap-2 mt-1">
                  {checkData.subject && (
                    <Badge variant="secondary">{checkData.subject}</Badge>
                  )}
                  {checkData.class_level && (
                    <Badge variant="outline">{checkData.class_level}</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Варианты</p>
                <p className="text-2xl font-bold">{checkData.variant_count}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Заданий</p>
                <p className="text-2xl font-bold">{checkData.total_questions || 'Не указано'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Создана</p>
                <p className="text-sm">
                  {formatDistanceToNow(new Date(checkData.created_at), {
                    addSuffix: true,
                    locale: ru
                  })}
                </p>
              </div>
            </div>

            {/* Статистика */}
            {checkData.statistics && checkData.statistics.total_submissions > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium mb-4">Статистика работ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {checkData.statistics.total_submissions}
                    </p>
                    <p className="text-sm text-gray-600">Всего работ</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {checkData.statistics.completed_submissions}
                    </p>
                    <p className="text-sm text-gray-600">Проверено</p>
                  </div>
                  
                  {checkData.statistics.average_score && (
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round(checkData.statistics.average_score)}%
                      </p>
                      <p className="text-sm text-gray-600">Средний балл</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => router.push(`/dashboard/checks/${checkData.id}/submit`)}
            className="h-20 flex-col gap-2"
          >
            <Upload className="h-6 w-6" />
            Загрузить работы студентов
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/checks/${checkData.id}/results`)}
            className="h-20 flex-col gap-2"
          >
            <BarChart3 className="h-6 w-6" />
            Просмотреть результаты
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setActiveTab('settings')}
            className="h-20 flex-col gap-2"
          >
            <Settings className="h-6 w-6" />
            Настройки работы
          </Button>
        </div>

        {/* Вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="variants">Варианты и ответы</TabsTrigger>
            <TabsTrigger value="submissions">Работы студентов</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="variants" className="mt-6">
            <VariantManager
              checkId={checkData.id}
              variants={checkData.variants}
              totalQuestions={checkData.total_questions || 10}
              onVariantUpdate={handleVariantUpdate}
            />
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Работы студентов</CardTitle>
                <CardDescription>
                  Здесь будет список загруженных работ студентов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Работы студентов появятся здесь после загрузки
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => router.push(`/dashboard/checks/${checkData.id}/submit`)}
                  >
                    Загрузить работы
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Настройки проверочной работы</CardTitle>
                <CardDescription>
                  Измените параметры и критерии оценивания
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">
                    Настройки будут доступны в следующем обновлении
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}