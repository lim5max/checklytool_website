'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Введите email')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // TODO: Implement password reset logic
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
    } catch {
      setError('Ошибка при отправке письма')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-nunito font-black text-slate-900">
            Ссылка отправлена
          </h1>
          <p className="text-slate-600 font-inter">
            Если аккаунт с таким email существует, мы отправили
            ссылку для сброса пароля.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Не забудьте проверить папку &quot;Спам&quot;
        </div>

        <Button asChild className="w-full">
          <Link href="/auth/login">
            Вернуться к входу
          </Link>
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-nunito font-black text-slate-900">
          Сбросить пароль
        </h1>
        <p className="text-slate-600 font-inter">
          Введите ваш email, и мы отправим ссылку для восстановления
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Отправляем...
            </>
          ) : (
            'Отправить ссылку'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link 
          href="/auth/login" 
          className="text-sm text-blue-600 hover:text-blue-800 font-inter"
        >
          ← Вернуться к входу
        </Link>
      </div>
    </motion.div>
  )
}