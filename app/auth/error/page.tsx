'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams?.get('error')

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'Configuration':
        return 'Ошибка конфигурации. Обратитесь к администратору.'
      case 'AccessDenied':
        return 'Доступ запрещен. Проверьте права доступа.'
      case 'Verification':
        return 'Ошибка верификации. Попробуйте еще раз.'
      default:
        return 'Произошла ошибка при входе. Попробуйте еще раз.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">
              Ошибка входа
            </h1>
            <p className="text-gray-600">
              {getErrorMessage(error)}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Попробовать снова
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                На главную
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div>Загрузка...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}