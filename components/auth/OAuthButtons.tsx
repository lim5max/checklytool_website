'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../ui/button'

interface OAuthButtonsProps {
  onError: (error: string) => void
}

export default function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setLoading(provider)
      await signIn(provider, { callbackUrl })
    } catch (error: unknown) {
      onError((error as Error).message || 'Ошибка авторизации')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full h-12"
        onClick={() => handleOAuthSignIn('yandex')}
        disabled={loading !== null}
      >
        {loading === 'yandex' ? (
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c0 3.96-2.928 6.48-6.84 6.48H9.36V9.36h1.368c2.16 0 3.432-.72 3.432-2.4 0-1.56-1.08-2.4-3.192-2.4H9.36v13.92H7.2V2.64h3.768c3.6 0 5.6 1.68 5.6 4.56v.96z"/>
          </svg>
        )}
        Войти через Яндекс
      </Button>
    </div>
  )
}