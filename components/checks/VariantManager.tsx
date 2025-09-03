'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileImage, 
  Upload, 
  X, 
  Plus, 
  Save, 
  Eye, 
  EyeOff,
  AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface CheckVariant {
  id: string
  variant_number: number
  reference_answers?: Record<string, string>
  reference_image_urls?: string[]
}

interface VariantManagerProps {
  checkId: string
  variants: CheckVariant[]
  totalQuestions: number
  onVariantUpdate: (variants: CheckVariant[]) => void
}

const answerSchema = z.object({
  answers: z.record(z.string(), z.string().min(1, 'Ответ не может быть пустым'))
})

export function VariantManager({ 
  checkId, 
  variants, 
  totalQuestions, 
  onVariantUpdate 
}: VariantManagerProps) {
  const [currentVariant, setCurrentVariant] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showAnswers, setShowAnswers] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Проверяем, что варианты существуют и текущий индекс корректный
  const variant = variants && variants.length > 0 ? variants[currentVariant] : null
  
  const form = useForm({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answers: variant?.reference_answers || {}
    }
  })

  useEffect(() => {
    if (variant) {
      form.reset({ answers: variant.reference_answers || {} })
    }
  }, [variant, form])

  // Если варианты не загружены или пустые, показываем кнопку для создания
  if (!variants || variants.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="mb-4">Варианты не найдены</p>
            <Button 
              onClick={async () => {
                // Create variants automatically
                try {
                  setIsLoading(true)
                  
                  // First, try to fetch existing variants to see if any already exist
                  const checkResponse = await fetch(`/api/checks/${checkId}`)
                  if (checkResponse.ok) {
                    const checkData = await checkResponse.json()
                    if (checkData.check.check_variants && checkData.check.check_variants.length > 0) {
                      // Variants exist, just update the parent component
                      onVariantUpdate(checkData.check.check_variants)
                      toast.success('Варианты найдены! Можно добавлять ответы')
                      return
                    }
                  }
                  
                  // If no variants found, create a new one
                  const response = await fetch(`/api/checks/${checkId}/variants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      variant_number: 1,
                      reference_answers: {},
                      reference_image_urls: []
                    })
                  })
                  
                  if (response.ok) {
                    const result = await response.json()
                    onVariantUpdate([result.variant])
                    toast.success('Вариант создан! Теперь можно добавить ответы')
                  } else {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                    console.error('API Error:', errorData)
                    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
                  }
                } catch (error) {
                  console.error('Error creating variant:', error)
                  const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании варианта'
                  toast.error(errorMessage)
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Создаем...' : 'Создать вариант'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Проверяем, что currentVariant в пределах массива
  if (currentVariant >= variants.length) {
    setCurrentVariant(0)
    return null
  }

  // Дополнительная проверка что variant не null
  if (!variant) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Ошибка загрузки варианта</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleAnswerSave = async (data: { answers: Record<string, string> }) => {
    setIsLoading(true)
    
    try {
      console.log('[FRONTEND] Saving answers:', {
        checkId,
        variantId: variant.id,
        data,
        payload: { reference_answers: data.answers }
      })
      
      const response = await fetch(`/api/checks/${checkId}/variants/${variant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reference_answers: data.answers
        }),
      })

      if (!response.ok) {
        console.error('[FRONTEND] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        })
        
        let errorData
        try {
          const text = await response.text()
          console.error('[FRONTEND] Response body:', text)
          errorData = text ? JSON.parse(text) : { error: 'No response body' }
        } catch (parseError) {
          console.error('[FRONTEND] Failed to parse response:', parseError)
          errorData = { error: 'Invalid response format' }
        }
        
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: `/api/checks/${checkId}/variants/${variant.id}`
        })
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Update local state
      const updatedVariants = variants.map(v => 
        v.id === variant.id 
          ? { ...v, reference_answers: data.answers }
          : v
      )
      onVariantUpdate(updatedVariants)
      
      toast.success('Эталонные ответы сохранены')
      
    } catch (error) {
      console.error('Error saving answers:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при сохранении ответов')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setUploadingImages(true)
    
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`/api/checks/${checkId}/variants/${variant.id}/images`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Не удалось загрузить изображения')
      }

      const result = await response.json()
      
      // Update local state
      const updatedVariants = variants.map(v => 
        v.id === variant.id 
          ? { ...v, reference_image_urls: result.variant.reference_image_urls }
          : v
      )
      onVariantUpdate(updatedVariants)
      
      toast.success(result.message || 'Изображения загружены')
      
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при загрузке изображений')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/checks/${checkId}/variants/${variant.id}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_url: imageUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Не удалось удалить изображение')
      }

      const result = await response.json()

      // Update local state
      const updatedVariants = variants.map(v => 
        v.id === variant.id 
          ? { ...v, reference_image_urls: result.variant.reference_image_urls }
          : v
      )
      onVariantUpdate(updatedVariants)
      
      toast.success(result.message || 'Изображение удалено')
      
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error(error instanceof Error ? error.message : 'Ошибка при удалении изображения')
    }
  }

  const generateQuestionInputs = () => {
    const inputs = []
    const hasAnyAnswers = variant?.reference_answers && Object.keys(variant.reference_answers).length > 0
    
    for (let i = 1; i <= totalQuestions; i++) {
      const currentAnswer = variant?.reference_answers?.[i.toString()] || ''
      
      inputs.push(
        <div key={i} className="flex items-center gap-3">
          <Label className="min-w-[60px] text-right font-medium">{i}.</Label>
          <Input
            placeholder={`Правильный ответ на задание ${i}`}
            {...form.register(`answers.${i}`)}
            className={`flex-1 ${!currentAnswer ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}
          />
          {currentAnswer && (
            <div className="text-green-600 text-sm">✓</div>
          )}
        </div>
      )
    }
    
    // Add status indicator at the top
    const filledAnswers = Object.keys(variant?.reference_answers || {}).filter(key => 
      variant?.reference_answers?.[key]?.trim()
    ).length
    
    if (!hasAnyAnswers) {
      inputs.unshift(
        <div key="status" className="p-3 bg-orange-100 border border-orange-300 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Ответы ещё не заполнены</span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Введите правильные ответы на все {totalQuestions} заданий и нажмите &quot;Сохранить&quot;
          </p>
        </div>
      )
    } else if (filledAnswers < totalQuestions) {
      inputs.unshift(
        <div key="status" className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Заполнено {filledAnswers} из {totalQuestions} ответов</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Добавьте остальные ответы для полной настройки автоматической проверки
          </p>
        </div>
      )
    } else {
      inputs.unshift(
        <div key="status" className="p-3 bg-green-100 border border-green-300 rounded-lg mb-4">
          <div className="flex items-center gap-2 text-green-800">
            <div className="text-green-600">✅</div>
            <span className="font-medium">Все ответы заполнены!</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Автоматическая проверка AI готова к использованию
          </p>
        </div>
      )
    }
    
    return inputs
  }

  return (
    <div className="space-y-6">
      {/* Основная инструкция */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                ℹ️
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Настройка эталонных ответов
              </h3>
              <p className="text-sm text-blue-700">
                Введите правильные ответы на все задания в полях ниже. 
                Если у вас несколько вариантов, настройте ответы для каждого.
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                <span>• Ответы могут быть текстовыми (&quot;Париж&quot;) или буквенными (&quot;A&quot;)</span>
                <span>• Не забудьте нажать &quot;Сохранить ответы&quot;</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Навигация по вариантам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Управление вариантами
            <Badge variant="outline">
              {variants.length} {variants.length === 1 ? 'вариант' : 'вариантов'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Настройте эталонные ответы и изображения для каждого варианта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, index) => (
              <Button
                key={v.id}
                variant={index === currentVariant ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentVariant(index)}
              >
                Вариант {v.variant_number}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Эталонные ответы */}
      <Card className="border-green-200" data-answers-section>
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center justify-between text-green-900">
            <span className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {variant.variant_number}
              </div>
              Эталонные ответы - Вариант {variant.variant_number}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Скрыть' : 'Показать'}
            </Button>
          </CardTitle>
          <CardDescription className="text-green-700">
            Введите правильные ответы на все задания этого варианта для автоматической проверки AI
          </CardDescription>
        </CardHeader>
        {showAnswers && (
          <CardContent>
            <form onSubmit={form.handleSubmit(handleAnswerSave)} className="space-y-4">
              <div className="grid gap-3 max-h-96 overflow-y-auto p-4 border rounded-lg">
                {generateQuestionInputs()}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Всего заданий: {totalQuestions}</span>
                  <br />
                  <span className="text-xs">Ответы будут использованы для автоматической проверки</span>
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-medium"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Сохраняем...' : 'Сохранить ответы'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Эталонные изображения */}
      <Card>
        <CardHeader>
          <CardTitle>Эталонные изображения - Вариант {variant.variant_number}</CardTitle>
          <CardDescription>
            Загрузите образцы оформления работ или дополнительные материалы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Загрузка файлов */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              id={`images-${variant.id}`}
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="hidden"
              disabled={uploadingImages}
            />
            <label
              htmlFor={`images-${variant.id}`}
              className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 rounded-lg p-4"
            >
              {uploadingImages ? (
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Загружаем изображения...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">Выберите изображения</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Поддерживаются: JPEG, PNG, WebP (макс. 10 МБ каждое)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Галерея изображений */}
          {variant.reference_image_urls && variant.reference_image_urls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {variant.reference_image_urls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <Image
                      src={url}
                      alt={`Эталонное изображение ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(!variant.reference_image_urls || variant.reference_image_urls.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Эталонные изображения не загружены</p>
              <p className="text-sm mt-1">
                Загрузите образцы для сравнения с работами студентов
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}