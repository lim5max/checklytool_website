'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // NextAuth handles callbacks automatically
    // This page is mainly for compatibility
    // Redirect to dashboard or login
    router.push('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 font-inter">Завершаем авторизацию...</p>
      </div>
    </div>
  )
}