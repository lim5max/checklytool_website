'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Circle,
  Square,
  CheckSquare,
  FileText,
  AlertCircle
} from 'lucide-react'
import type { TestQuestion, TestOption, GeneratedTest, PDFGenerationRequest } from '@/types/check'

interface TestConstructorProps {
  initialTest?: GeneratedTest
  onSave?: (test: GeneratedTest) => void
  className?: string
}

export default function TestConstructor({
  initialTest,
  onSave,
  className = ''
}: TestConstructorProps) {
  const [test, setTest] = useState<GeneratedTest>(
    initialTest || {
      id: `test_${Date.now()}`,
      title: 'Новый тест',
      description: '',
      subject: '',
      questions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  )

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const selectedVariant = 1

  const addQuestion = useCallback(() => {
    const newQuestion: TestQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      type: 'single',
      options: [
        { id: `opt_${Date.now()}_1`, text: '', isCorrect: false },
        { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
        { id: `opt_${Date.now()}_3`, text: '', isCorrect: false },
        { id: `opt_${Date.now()}_4`, text: '', isCorrect: false }
      ],
      explanation: ''
    }

    setTest(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      updated_at: new Date().toISOString()
    }))
  }, [])

  const updateQuestion = useCallback((questionId: string, updates: Partial<TestQuestion>) => {
    setTest(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
      updated_at: new Date().toISOString()
    }))
  }, [])

  const deleteQuestion = useCallback((questionId: string) => {
    setTest(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
      updated_at: new Date().toISOString()
    }))
  }, [])

  const updateOption = useCallback((questionId: string, optionId: string, updates: Partial<TestOption>) => {
    setTest(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map(opt =>
                opt.id === optionId ? { ...opt, ...updates } : opt
              )
            }
          : q
      ),
      updated_at: new Date().toISOString()
    }))
  }, [])

  const addOption = useCallback((questionId: string) => {
    const question = test.questions.find(q => q.id === questionId)
    if (!question || question.options.length >= 6) return

    const newOption: TestOption = {
      id: `opt_${Date.now()}`,
      text: '',
      isCorrect: false
    }

    updateQuestion(questionId, {
      options: [...question.options, newOption]
    })
  }, [test.questions, updateQuestion])

  const removeOption = useCallback((questionId: string, optionId: string) => {
    const question = test.questions.find(q => q.id === questionId)
    if (!question || question.options.length <= 2) return

    updateQuestion(questionId, {
      options: question.options.filter(opt => opt.id !== optionId)
    })
  }, [test.questions, updateQuestion])

  const toggleCorrectAnswer = useCallback((questionId: string, optionId: string) => {
    const question = test.questions.find(q => q.id === questionId)
    if (!question) return

    const option = question.options.find(opt => opt.id === optionId)
    if (!option) return

    // Для одиночного выбора - только один правильный ответ
    if (question.type === 'single') {
      updateQuestion(questionId, {
        options: question.options.map(opt => ({
          ...opt,
          isCorrect: opt.id === optionId
        }))
      })
    } else {
      // Для множественного выбора - переключаем статус
      updateOption(questionId, optionId, { isCorrect: !option.isCorrect })
    }
  }, [test.questions, updateQuestion, updateOption])

  const validateTest = useCallback(() => {
    if (!test.title.trim()) {
      toast.error('Укажите название теста')
      return false
    }

    if (test.questions.length === 0) {
      toast.error('Добавьте хотя бы один вопрос')
      return false
    }

    for (const [index, question] of test.questions.entries()) {
      if (!question.question.trim()) {
        toast.error(`Вопрос ${index + 1}: Укажите текст вопроса`)
        return false
      }

      if (question.options.some(opt => !opt.text.trim())) {
        toast.error(`Вопрос ${index + 1}: Все варианты ответов должны быть заполнены`)
        return false
      }

      const correctCount = question.options.filter(opt => opt.isCorrect).length
      if (correctCount === 0) {
        toast.error(`Вопрос ${index + 1}: Выберите хотя бы один правильный ответ`)
        return false
      }

      if (question.type === 'single' && correctCount > 1) {
        toast.error(`Вопрос ${index + 1}: Для одиночного выбора может быть только один правильный ответ`)
        return false
      }
    }

    return true
  }, [test])

  const generatePDF = useCallback(async (variantNumber?: number) => {
    if (!validateTest()) return

    const targetVariant = variantNumber || selectedVariant

    setIsGeneratingPDF(true)
    try {
      const request: PDFGenerationRequest = {
        testId: test.id,
        title: test.title,
        description: test.description,
        questions: test.questions,
        format: 'A4',
        answerType: 'squares',
        variant: targetVariant
      }

      const response = await fetch('/api/generate-test-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      const result = await response.json()

      if (result.success && result.htmlContent) {
        // Открываем HTML в новом окне для печати/сохранения как PDF
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(result.htmlContent)
          printWindow.document.close()

          // Фокусируемся на новом окне
          printWindow.focus()

          toast.success(`PDF бланк для варианта ${targetVariant} готов! Используйте Ctrl+P для печати.`)
        } else {
          // Если окно заблокировано, создаем blob и скачиваем
          const blob = new Blob([result.htmlContent], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${test.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_variant_${targetVariant}.html`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)

          toast.success(`HTML файл для варианта ${targetVariant} скачан! Откройте его и используйте Ctrl+P.`)
        }
      } else {
        throw new Error(result.error || 'Ошибка генерации PDF')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error(`Не удалось сгенерировать PDF для варианта ${targetVariant}`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [test, validateTest, selectedVariant])

  const handleSave = useCallback(async () => {
    if (!validateTest()) return
    if (isSaving) return // Предотвращаем двойные клики

    // Если есть внешний onSave, используем его вместо собственной логики сохранения
    if (onSave) {
      onSave(test)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/tests/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Тест сохранен!')
      } else {
        throw new Error(result.error || 'Ошибка сохранения теста')
      }
    } catch (error) {
      console.error('Save test error:', error)
      toast.error('Не удалось сохранить тест')
    } finally {
      setIsSaving(false)
    }
  }, [test, validateTest, onSave, isSaving])

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index) // A, B, C, D, ...
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Заголовок и основная информация */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-nunito font-bold text-slate-900">
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="test-title" className="text-sm font-semibold text-slate-700">
                Название теста *
              </label>
              <Input
                id="test-title"
                value={test.title}
                onChange={(e) => setTest(prev => ({
                  ...prev,
                  title: e.target.value,
                  updated_at: new Date().toISOString()
                }))}
                placeholder="Введите название теста"
                className="h-11 border-slate-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="test-subject" className="text-sm font-semibold text-slate-700">
                Предмет
              </label>
              <Input
                id="test-subject"
                value={test.subject || ''}
                onChange={(e) => setTest(prev => ({
                  ...prev,
                  subject: e.target.value,
                  updated_at: new Date().toISOString()
                }))}
                placeholder="Математика, Физика, История..."
                className="h-11 border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="test-description" className="text-sm font-semibold text-slate-700">
              Описание
            </label>
            <Textarea
              id="test-description"
              value={test.description || ''}
              onChange={(e) => setTest(prev => ({
                ...prev,
                description: e.target.value,
                updated_at: new Date().toISOString()
              }))}
              placeholder="Краткое описание теста (необязательно)"
              rows={3}
              className="border-slate-300 focus:border-blue-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Вопросы */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-nunito font-bold text-slate-900">
            Вопросы теста
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {test.questions.length} {test.questions.length === 1 ? 'вопрос' :
                test.questions.length < 5 ? 'вопроса' : 'вопросов'}
            </span>
          </div>
        </div>

        {test.questions.map((question, questionIndex) => (
          <Card key={question.id} className="border-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-nunito font-bold text-slate-900">
                  Задание {questionIndex + 1}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={question.type || 'single'} onValueChange={(value) => updateQuestion(question.id, { type: value as 'single' | 'multiple' })}>
                    <SelectTrigger className="w-44">
                      <SelectValue>
                        <span className="text-sm">
                          {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Один ответ</SelectItem>
                      <SelectItem value="multiple">Несколько ответов</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label htmlFor={`question-${question.id}`} className="text-sm font-semibold text-slate-700">
                  Текст вопроса *
                </label>
                <Textarea
                  id={`question-${question.id}`}
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  placeholder="Введите текст вопроса"
                  className="min-h-[80px] border-slate-300 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Варианты ответов *
                  </label>
                  <span className="text-xs text-slate-500">
                    {question.type === 'single' ? 'Выберите один правильный ответ' : 'Выберите правильные ответы'}
                  </span>
                </div>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div key={option.id} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleCorrectAnswer(question.id, option.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                        title={option.isCorrect ? 'Правильный ответ' : 'Нажмите, чтобы сделать правильным'}
                      >
                        {question.type === 'single' ? (
                          option.isCorrect ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-slate-400" />
                          )
                        ) : (
                          option.isCorrect ? (
                            <CheckSquare className="w-6 h-6 text-green-600" />
                          ) : (
                            <Square className="w-6 h-6 text-slate-400" />
                          )
                        )}
                      </button>

                      <span className="w-8 text-sm font-bold text-slate-700 flex-shrink-0">
                        {getOptionLabel(optionIndex)})
                      </span>

                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(question.id, option.id, { text: e.target.value })}
                        placeholder={`Вариант ${getOptionLabel(optionIndex)}`}
                        className={`flex-1 border-slate-300 transition-colors ${
                          option.isCorrect
                            ? 'border-green-400 bg-green-50 focus:border-green-500'
                            : 'focus:border-blue-500'
                        }`}
                      />

                      {question.options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(question.id, option.id)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Удалить вариант"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {question.options.length < 6 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      className="gap-2 border-dashed border-slate-400 text-slate-600 hover:border-slate-600"
                    >
                      <Plus className="w-4 h-4" />
                      Добавить вариант ответа
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {test.questions.length > 0 && (
          <div className="flex justify-center pt-6">
            <Button onClick={addQuestion} size="lg" className="gap-2 px-8">
              <Plus className="w-5 h-5" />
              Добавить вопрос
            </Button>
          </div>
        )}

        {test.questions.length === 0 && (
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                Начните создание теста
              </h3>
              <p className="text-slate-500 mb-6 text-center">
                Добавьте первый вопрос, чтобы начать работу с конструктором
              </p>
              <Button onClick={addQuestion} size="lg" className="gap-2 px-8">
                <Plus className="w-5 h-5" />
                Добавить первый вопрос
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Действия */}
      <Card className="border-2 sticky bottom-4 bg-white/95 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <Button
                onClick={() => generatePDF()}
                disabled={isGeneratingPDF || test.questions.length === 0}
                size="lg"
                className="gap-2 px-6"
              >
                {isGeneratingPDF ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isGeneratingPDF ? 'Генерация PDF...' : `Скачать PDF (Вариант ${selectedVariant})`}
              </Button>

              {onSave && (
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || test.questions.length === 0}
                  size="lg"
                  className="gap-2 px-6"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {isSaving ? 'Сохранение...' : 'Сохранить тест'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600">
              {test.questions.length === 0 && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Добавьте вопросы для активации функций</span>
                </div>
              )}

              {test.questions.length > 0 && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">
                    {test.questions.length} {test.questions.length === 1 ? 'вопрос' :
                      test.questions.length < 5 ? 'вопроса' : 'вопросов'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}