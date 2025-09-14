'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, Smartphone } from 'lucide-react'

export function CreateCheckForm() {
  const router = useRouter()

  useEffect(() => {
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