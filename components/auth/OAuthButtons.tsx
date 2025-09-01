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
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Войти через Google
      </Button>

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