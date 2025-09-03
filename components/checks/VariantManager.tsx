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

  // Если варианты не загружены или пустые, показываем loading или сообщение
  if (!variants || variants.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Варианты не найдены или еще загружаются</p>
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
        throw new Error('Не удалось сохранить ответы')
      }

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
      toast.error('Ошибка при сохранении ответов')
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
      formData.append('variant_id', variant.id)

      const response = await fetch(`/api/checks/${checkId}/variants/${variant.id}/images`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Не удалось загрузить изображения')
      }

      const result = await response.json()
      
      // Update local state
      const updatedVariants = variants.map(v => 
        v.id === variant.id 
          ? { ...v, reference_image_urls: result.image_urls }
          : v
      )
      onVariantUpdate(updatedVariants)
      
      toast.success('Изображения загружены')
      
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Ошибка при загрузке изображений')
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
        throw new Error('Не удалось удалить изображение')
      }

      // Update local state
      const updatedVariants = variants.map(v => 
        v.id === variant.id 
          ? { 
              ...v, 
              reference_image_urls: v.reference_image_urls?.filter(url => url !== imageUrl) 
            }
          : v
      )
      onVariantUpdate(updatedVariants)
      
      toast.success('Изображение удалено')
      
    } catch (error) {
      console.error('Error removing image:', error)
      toast.error('Ошибка при удалении изображения')
    }
  }

  const generateQuestionInputs = () => {
    const inputs = []
    for (let i = 1; i <= totalQuestions; i++) {
      inputs.push(
        <div key={i} className="flex items-center gap-3">
          <Label className="min-w-[60px] text-right">{i}.</Label>
          <Input
            placeholder="Правильный ответ"
            {...form.register(`answers.${i}`)}
            className="flex-1"
          />
        </div>
      )
    }
    return inputs
  }

  return (
    <div className="space-y-6">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Эталонные ответы - Вариант {variant.variant_number}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnswers ? 'Скрыть' : 'Показать'}
            </Button>
          </CardTitle>
          <CardDescription>
            Введите правильные ответы на все задания этого варианта
          </CardDescription>
        </CardHeader>
        {showAnswers && (
          <CardContent>
            <form onSubmit={form.handleSubmit(handleAnswerSave)} className="space-y-4">
              <div className="grid gap-3 max-h-96 overflow-y-auto p-4 border rounded-lg">
                {generateQuestionInputs()}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Всего заданий: {totalQuestions}
                </div>
                <Button type="submit" disabled={isLoading}>
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