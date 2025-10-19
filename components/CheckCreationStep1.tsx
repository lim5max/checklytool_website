"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, X } from "lucide-react"
import {
  type WorkType,
  WORK_TYPES,
  getFieldErrorMessage,
  hasFieldError
} from "@/lib/check-creation-validation"
import { cn } from "@/lib/utils"

interface SavedTest {
  id: string
  title: string
  description?: string
  created_at: string
  question_count: number
}

interface CheckCreationStep1Props {
  workTitle?: string
  selectedWorkType?: WorkType | null
  selectedTest?: SavedTest | null
  onWorkTitleChange?: (title: string) => void
  onWorkTypeSelect?: (workType: WorkType) => void
  onTestSelect?: (test: SavedTest) => void
  onContinue?: () => void
  onBack?: () => void
  validationErrors?: Record<string, string[]>
}

export default function CheckCreationStep1({
  workTitle = "",
  selectedWorkType = null,
  selectedTest = null,
  onWorkTitleChange,
  onWorkTypeSelect,
  onTestSelect,
  onContinue,
  onBack,
  validationErrors = {}
}: CheckCreationStep1Props) {
  const router = useRouter()
  const [selectedWorkTypeId, setSelectedWorkTypeId] = useState<string | null>(
    selectedWorkType?.id || null
  )
  const [checkMethod, setCheckMethod] = useState<string | null>(null) // "existing" или "new"
  const [showTestModal, setShowTestModal] = useState(false)
  const [savedTests, setSavedTests] = useState<SavedTest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingTests, setIsLoadingTests] = useState(false)

  const workTypes = WORK_TYPES

  const handleWorkTypeSelect = (workType: WorkType) => {
    setSelectedWorkTypeId(workType.id)
    setCheckMethod(null) // Сбрасываем выбор метода при смене типа
    onWorkTypeSelect?.(workType)
  }

  const handleCheckMethodSelect = (method: string) => {
    setCheckMethod(method)
    if (method === 'existing') {
      setShowTestModal(true)
      loadSavedTests()
    }
  }

  const loadSavedTests = async () => {
    setIsLoadingTests(true)
    try {
      const response = await fetch('/api/tests/saved')
      if (response.ok) {
        const tests = await response.json()
        console.log('Loaded tests:', tests)
        setSavedTests(tests)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to load saved tests:', response.status, errorData)
        setSavedTests([])
      }
    } catch (error) {
      console.error('Error loading saved tests:', error)
      setSavedTests([])
    } finally {
      setIsLoadingTests(false)
    }
  }

  const filteredTests = savedTests.filter(test =>
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (test.description && test.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleTestSelect = (test: SavedTest) => {
    setShowTestModal(false)
    console.log('Selected test:', test)

    // Вызываем коллбэк родительского компонента для обработки выбора теста
    onTestSelect?.(test)
  }

  const isFormValid = () => {
    if (!selectedWorkTypeId) return false

    if (selectedWorkTypeId === 'test') {
      // Если выбран готовый тест, проверяем что тест действительно выбран
      if (checkMethod === 'existing') {
        return selectedTest !== null
      }
      // Если создание нового теста
      return checkMethod !== null
    }

    if (selectedWorkTypeId === 'essay') {
      return workTitle.trim() !== ''
    }

    return false
  }

  const handleContinue = () => {
    if (selectedWorkTypeId === 'test' && checkMethod === 'existing' && !selectedTest) {
      // Если еще не выбран тест, показываем модалку
      setShowTestModal(true)
      loadSavedTests()
      return
    }

    // Во всех остальных случаях продолжаем к следующему шагу
    onContinue?.()
  }

  return (
    <div className="bg-white flex flex-col gap-2.5 items-center justify-start p-[16px] pb-[100px] relative min-h-screen">
      <div className="flex flex-col gap-[18px] items-end justify-start relative shrink-0 w-full">
        {/* Main content */}
        <div className="flex flex-col gap-6 items-start justify-start relative shrink-0 w-full">
          {/* Title section with back arrow */}
          <div className="flex flex-col gap-6 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-[6.095px] items-start justify-start relative shrink-0">
              <button 
                onClick={onBack}
                className="relative shrink-0 size-8"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
            </div>
            <div className="font-nunito font-black leading-[0] relative shrink-0 text-[28px] text-nowrap text-slate-800">
              <p className="leading-[1.2] whitespace-pre">Создание проверки</p>
            </div>
          </div>
          

          {/* Work Type Section */}
          <div className="flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-2.5 items-center justify-start relative shrink-0 w-full">
              <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                <p className="leading-[1.2] whitespace-pre">Тип работы</p>
              </div>
            </div>

            {/* Work Type Grid - 2 карточки рядом */}
            <div className="gap-2 grid grid-cols-2 auto-rows-[160px] relative shrink-0 w-full">
              {workTypes.map((workType) => (
                <button
                  key={workType.id}
                  onClick={() => handleWorkTypeSelect(workType)}
                  className={cn(
                    "h-40 overflow-clip relative rounded-[28px] shrink-0",
                    selectedWorkTypeId === workType.id
                      ? "bg-[#096ff5]"
                      : "bg-slate-100",
                    hasFieldError(validationErrors, 'workType') && "ring-2 ring-red-500"
                  )}
                >
                  <div className={cn(
                    "absolute flex flex-col font-inter font-medium justify-center leading-[0] text-[16px] top-[50%] translate-y-[-50%] left-[50%] translate-x-[-50%]",
                    selectedWorkTypeId === workType.id ? "text-white" : "text-slate-800"
                  )}>
                    <p className="leading-[1.6] text-center">{workType.title}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Error message */}
            {hasFieldError(validationErrors, 'workType') && (
              <p className="text-red-500 text-sm font-inter text-center">
                {getFieldErrorMessage(validationErrors, 'workType')}
              </p>
            )}
          </div>

          {/* Информационный блок для выбранного теста */}
          {selectedWorkTypeId === 'test' && selectedTest && (
            <div className="bg-green-50 border border-green-200 rounded-[32px] p-6 w-full">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  ✓
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-nunito font-bold text-lg text-green-900">
                    Выбранный тест: {selectedTest.title}
                  </h3>
                  <div className="text-green-800 space-y-1">
                    {selectedTest.description && (
                      <p className="text-sm">{selectedTest.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span>Вопросов: {selectedTest.question_count}</span>
                      <span>Создан: {new Date(selectedTest.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <div className="text-sm text-green-700">
                    ✨ Этот тест будет использован для создания проверки
                  </div>
                  <button
                    onClick={() => {
                      setShowTestModal(true)
                      loadSavedTests()
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-700 underline text-sm"
                  >
                    Изменить тест
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Информационный блок для тестов - новый дизайн */}
          {selectedWorkTypeId === 'test' && !selectedTest && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full shadow-sm">
              <div className="space-y-6">
                {/* Заголовок */}
                <div>
                  <h3 className="font-nunito font-extrabold text-[20px] text-slate-700 leading-tight">
                    Мы проверяем только тесты из Конструктора
                  </h3>
                </div>

                {/* Описание */}
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  Для точной проверки ИИ используйте тесты из Конструктора со стандартизированными PDF бланками
                </p>

                {/* Преимущества */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 text-[14px] leading-relaxed">Стандартные поля для ответов (A, B, C, D)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 text-[14px] leading-relaxed">Четкая нумерация вопросов</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 text-[14px] leading-relaxed">Оптимальный формат для распознавания ИИ</span>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => router.push('/dashboard/test-builder')}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white h-14 rounded-2xl text-[16px] font-semibold transition-all shadow-sm hover:shadow-md"
                  >
                    Перейти в Конструктор тестов
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleCheckMethodSelect('existing')}
                    className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 h-14 rounded-2xl text-[16px] font-semibold transition-all border border-slate-200"
                  >
                    Выбрать готовый тест
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Поле ввода названия для сочинения */}
          {selectedWorkTypeId === 'essay' && (
            <div className="flex flex-col gap-3 items-start justify-start relative shrink-0 w-full">
              <div className="flex gap-2.5 items-center justify-start relative shrink-0 w-full">
                <div className="font-nunito font-extrabold leading-[0] relative shrink-0 text-[20px] text-nowrap text-slate-700">
                  <p className="leading-[1.2] whitespace-pre">Название проверки</p>
                </div>
              </div>

              <div className="bg-slate-50 h-14 relative rounded-[27px] shrink-0 w-full">
                <div className="box-border flex flex-col gap-2.5 h-14 items-start justify-center overflow-clip px-[21px] py-[11px] relative w-full">
                  <div className="flex gap-2 items-center justify-start relative shrink-0 w-full">
                    <Input
                      value={workTitle}
                      onChange={(e) => onWorkTitleChange?.(e.target.value)}
                      placeholder='Сочинение "Мой любимый герой"'
                      className={cn(
                        "font-inter font-medium leading-[0] text-[16px] text-slate-500 border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-slate-500",
                        hasFieldError(validationErrors, 'workTitle') && "text-red-500"
                      )}
                    />
                  </div>
                </div>
                <div className="absolute border border-slate-100 border-solid inset-0 pointer-events-none rounded-[27px]" />
              </div>

              {/* Error message */}
              {hasFieldError(validationErrors, 'workTitle') && (
                <p className="text-red-500 text-sm font-inter">
                  {getFieldErrorMessage(validationErrors, 'workTitle')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Sticky Bottom Button matching Figma exactly - обычная кнопка в блоке */}
      <div className="fixed bg-white bottom-0 box-border flex flex-col gap-2.5 h-[82px] items-center justify-center left-0 px-[18px] py-0 right-0 z-50">
        <div className="absolute border-t border-slate-200 border-solid inset-0 pointer-events-none" />
        <button
          onClick={handleContinue}
          disabled={!isFormValid()}
          className="bg-[#096ff5] box-border flex gap-2.5 h-14 items-center justify-center overflow-clip px-[43px] py-4 relative rounded-[180px] shrink-0 w-full disabled:opacity-50"
        >
          <div className="flex flex-col font-inter font-medium justify-center leading-[0] text-[16px] text-nowrap text-white">
            <p className="leading-[1.6] whitespace-pre">
              {selectedWorkTypeId === 'test' && checkMethod === 'existing' && !selectedTest
                ? 'Выбрать готовый тест'
                : 'Продолжить настройку'
              }
            </p>
          </div>
        </button>
      </div>

      {/* Модальное окно выбора теста */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Заголовок модалки */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="font-nunito font-bold text-xl text-slate-800">
                Выберите тест
              </h2>
              <button
                onClick={() => setShowTestModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Поиск */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Найти тест..."
                  className="pl-10 h-12 rounded-full border-slate-200"
                />
              </div>
            </div>

            {/* Список тестов */}
            <div className="max-h-96 overflow-y-auto">
              {isLoadingTests ? (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-600">Загружаем тесты...</p>
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-slate-600">
                    {searchQuery ? 'Тесты не найдены' : 'У вас пока нет сохраненных тестов'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => {
                        setShowTestModal(false)
                        router.push('/dashboard/test-builder')
                      }}
                      className="mt-3 text-blue-600 hover:text-blue-700 underline"
                    >
                      Создать первый тест
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredTests.map((test) => (
                    <button
                      key={test.id}
                      onClick={() => handleTestSelect(test)}
                      className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                    >
                      <h3 className="font-nunito font-semibold text-lg text-slate-800 mb-1">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-slate-600 text-sm mb-2 line-clamp-2">
                          {test.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{test.question_count} вопросов</span>
                        <span>
                          {new Date(test.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}