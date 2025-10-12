'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import TestConstructor from '@/components/TestConstructor'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { GeneratedTest } from '@/types/check'

export default function TestBuilderPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)

  // Загружаем данные пользователя (аналогично checks page)
  useEffect(() => {
    setIsUserLoading(true)
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user)
        } else {
          router.push('/auth/login')
          return
        }
      })
      .catch(console.error)
      .finally(() => setIsUserLoading(false))
  }, [router])

  const [isSaving, setIsSaving] = useState(false)

  /**
   * Обработчик сохранения теста с улучшенной обработкой ошибок
   * @param test - Объект теста для сохранения
   * @param silent - Тихое автосохранение без тостов
   */
  const handleSaveTest = async (test: GeneratedTest, silent = false) => {
    if (isSaving) {
      if (!silent) {
        toast.warning('Сохранение уже выполняется, подождите...')
      }
      return
    }

    // Валидация перед сохранением
    if (!test.title.trim()) {
      if (!silent) toast.error('Не указано название теста')
      return
    }

    if (test.questions.length === 0) {
      if (!silent) toast.error('Нельзя сохранить пустой тест')
      return
    }

    try {
      setIsSaving(true)

      // Показываем индикатор начала сохранения только если не silent
      if (!silent) {
        toast.loading('Сохраняем тест...', { id: 'saving-test' })
      }

      const response = await fetch('/api/tests/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: test.id,
          title: test.title,
          description: test.description,
          subject: test.subject,
          questions: test.questions
        })
      })

      const result = await response.json()

      // Удаляем loading toast
      if (!silent) {
        toast.dismiss('saving-test')
      }

      if (result.success) {
        // Показываем успешный тост только если не silent
        if (!silent) {
          toast.success(`Тест "${result.test.title}" успешно сохранен!`, {
            description: `Создано ${result.test.questionsCount} вопросов`,
            duration: 4000
          })
        }
      } else {
        console.error('Server error:', result.error)
        if (!silent) {
          toast.error('Ошибка на сервере', {
            description: result.error || 'Неизвестная ошибка сервера',
            duration: 6000
          })
        }
      }
    } catch (error) {
      console.error('Network error:', error)
      if (!silent) {
        toast.dismiss('saving-test')

        if (error instanceof Error) {
          toast.error('Ошибка соединения', {
            description: 'Проверьте интернет-соединение и попробуйте снова',
            duration: 6000
          })
        } else {
          toast.error('Непредвиденная ошибка', {
            description: 'Попробуйте обновить страницу и повторить попытку',
            duration: 6000
          })
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackClick = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Unified Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          variant="dashboard"
          user={user}
          isUserLoading={isUserLoading}
          className="py-4"
        />
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pb-[100px]">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к дашборду
            </Button>
          </div>

          <div className="space-y-2">
            <h1 className="font-nunito font-black text-3xl text-slate-900">
              Конструктор тестов
            </h1>
            <p className="text-slate-600 text-lg">
              Создавайте стандартизированные тесты с автоматической генерацией PDF бланков для точной проверки ИИ
            </p>
          </div>
        </div>

        {/* Конструктор тестов */}
        <TestConstructor onSave={handleSaveTest} className="" />

        {/* Информационная панель */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-8">
          <h3 className="font-nunito font-black text-xl text-blue-900 mb-6 flex items-center gap-3">
            💡 Как это работает?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold mb-3">1</div>
              <h4 className="font-semibold text-blue-900 mb-2">Создание вопросов</h4>
              <p className="text-blue-800 text-sm">
                Добавьте вопросы с вариантами ответов 1, 2, 3, 4 и отметьте правильные
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold mb-3">2</div>
              <h4 className="font-semibold text-blue-900 mb-2">Варианты тестов</h4>
              <p className="text-blue-800 text-sm">
                Создавайте несколько вариантов для различных групп учащихся
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold mb-3">3</div>
              <h4 className="font-semibold text-blue-900 mb-2">PDF бланки</h4>
              <p className="text-blue-800 text-sm">
                Скачайте стандартизированные бланки для печати
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold mb-3">4</div>
              <h4 className="font-semibold text-blue-900 mb-2">Проведение теста</h4>
              <p className="text-blue-800 text-sm">
                В ChecklyTool создайте проверку типа &quot;Тест&quot; и загружайте фото бланков
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold mb-3">5</div>
              <h4 className="font-semibold text-blue-900 mb-2">Автоматическая проверка</h4>
              <p className="text-blue-800 text-sm">
                ИИ точно распознает ответы и выставит оценки
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold mb-3">✓</div>
              <h4 className="font-semibold text-green-900 mb-2">Готово!</h4>
              <p className="text-green-800 text-sm">
                Получайте результаты и статистику автоматически
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}