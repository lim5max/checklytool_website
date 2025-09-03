'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCheckSchema, type CreateCheckFormData } from '@/lib/validations/check'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface GradingCriterion {
  grade: '2' | '3' | '4' | '5'
  min_percentage: number
}

const SUBJECTS = [
  'Математика',
  'Русский язык',
  'Физика',
  'Химия', 
  'Биология',
  'История',
  'Обществознание',
  'География',
  'Английский язык',
  'Информатика'
]

const CLASS_LEVELS = [
  '5 класс', '6 класс', '7 класс', '8 класс', '9 класс',
  '10 класс', '11 класс'
]

export function CreateCheckForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [configureAnswers, setConfigureAnswers] = useState(true)
  
  const form = useForm<CreateCheckFormData>({
    resolver: zodResolver(createCheckSchema),
    defaultValues: {
      title: '',
      description: '',
      variant_count: 1,
      subject: '',
      class_level: '',
      total_questions: 10,
      grading_criteria: [
        { grade: 5, min_percentage: 85 },
        { grade: 4, min_percentage: 70 },
        { grade: 3, min_percentage: 55 },
        { grade: 2, min_percentage: 0 }
      ]
    }
  })

  const { fields: criteriaFields, append: appendCriteria, remove: removeCriteria } = useFieldArray({
    control: form.control,
    name: 'grading_criteria'
  })

  const onSubmit = async (data: CreateCheckFormData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Не удалось создать проверочную работу')
      }

      const result = await response.json()
      
      toast.success('Проверочная работа создана успешно!')
      
      // Navigate to check management or variant setup based on user preference
      if (configureAnswers) {
        router.push(`/dashboard/checks/${result.check.id}?tab=variants`)
      } else {
        router.push(`/dashboard/checks/${result.check.id}`)
      }
      
    } catch (error) {
      console.error('Error creating check:', error)
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  const addGradingCriterion = () => {
    const usedGrades = criteriaFields.map(field => field.grade)
    const availableGrades = [2, 3, 4, 5].filter(grade => !usedGrades.includes(grade as 2 | 3 | 4 | 5))
    
    if (availableGrades.length > 0) {
      const newGrade = availableGrades[availableGrades.length - 1] as 2 | 3 | 4 | 5
      appendCriteria({ grade: newGrade, min_percentage: 50 })
    }
  }

  const canAddMoreCriteria = criteriaFields.length < 4

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Создание проверочной работы</h1>
        <p className="text-gray-600">
          Создайте новую проверочную работу для автоматической проверки
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Введите основные данные о проверочной работе
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название работы *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: Контрольная работа по математике №1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Краткое описание проверочной работы..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Опциональное описание содержания и целей работы
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Предмет</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите предмет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="class_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Класс</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите класс" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASS_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_questions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество заданий</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="100"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseInt(e.target.value)
                            field.onChange(isNaN(value as number) ? '' : value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="variant_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество вариантов</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="20"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseInt(e.target.value)
                          field.onChange(isNaN(value as number) ? '' : value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Сколько вариантов проверочной работы будет использовано
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Критерии оценивания */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Критерии оценивания
                <Badge variant="secondary">{criteriaFields.length} из 4</Badge>
              </CardTitle>
              <CardDescription>
                Установите минимальные проценты правильных ответов для каждой оценки
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {criteriaFields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`grading_criteria.${index}.grade`}
                    render={({ field }) => (
                      <FormItem className="min-w-[120px]">
                        <FormLabel>Оценка</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value as '2' | '3' | '4' | '5')}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="5">5 (отлично)</SelectItem>
                            <SelectItem value="4">4 (хорошо)</SelectItem>
                            <SelectItem value="3">3 (удовл.)</SelectItem>
                            <SelectItem value="2">2 (неудовл.)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`grading_criteria.${index}.min_percentage`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Минимальный процент</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? '' : parseInt(e.target.value)
                                field.onChange(isNaN(value as number) ? '' : value)
                              }}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {criteriaFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCriteria(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {canAddMoreCriteria && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGradingCriterion}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Добавить критерий оценки
                </Button>
              )}

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Как работает оценка:</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>AI анализирует ответы студента и сравнивает с эталонными</li>
                    <li>Подсчитывается процент правильных ответов</li>
                    <li>Выставляется высшая оценка, для которой выполнен критерий</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Кнопки */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="configure-answers"
                checked={configureAnswers}
                onChange={(e) => setConfigureAnswers(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="configure-answers" className="text-sm font-medium text-blue-900">
                Настроить эталонные ответы сразу после создания
              </label>
            </div>
            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              ⚠️ <strong>Важно:</strong> После создания обязательно добавьте правильные ответы в разделе <br/>
              &quot;Варианты и ответы&quot; для работы нейросети.
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-[200px]">
                {isLoading ? 'Создаём...' : 'Создать проверочную работу'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}