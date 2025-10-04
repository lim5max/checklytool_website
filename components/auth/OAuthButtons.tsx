'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../ui/button'
import Image from 'next/image'

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
        className="w-full h-12 bg-slate-50 hover:bg-slate-100 border-slate-200"
        onClick={() => handleOAuthSignIn('yandex')}
        disabled={loading !== null}
      >
        {loading === 'yandex' ? (
          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <Image
            src="/icons/yandex_logo.svg"
            alt="Yandex"
            width={24}
            height={24}
            className="mr-2"
          />
        )}
        Войти через Яндекс
      </Button>
    </div>
  )
}