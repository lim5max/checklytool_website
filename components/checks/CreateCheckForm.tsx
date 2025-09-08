'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Smartphone } from 'lucide-react'

export function CreateCheckForm() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to mobile-first flow after a brief delay
    const timer = setTimeout(() => {
      router.push('/dashboard/checks/create')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  const handleRedirect = () => {
    router.push('/dashboard/checks/create')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-primary-blue rounded-full flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold">Переход на новый интерфейс</h1>
        <p className="text-gray-600">
          Мы улучшили процесс создания проверочных работ! Теперь он стал более удобным и интуитивным.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Новый мобильный интерфейс
          </CardTitle>
          <CardDescription>
            Создавайте проверочные работы быстрее с нашим обновленным пошаговым интерфейсом
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-800 font-medium">Пошаговый процесс создания</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-800 font-medium">Адаптивный дизайн для всех устройств</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-800 font-medium">Улучшенная настройка критериев оценки</span>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleRedirect} className="w-full" size="lg">
              Перейти к новому интерфейсу
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Автоматический переход через 3 секунды...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
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