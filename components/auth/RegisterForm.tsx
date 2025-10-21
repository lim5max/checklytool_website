'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import OAuthButtons from './OAuthButtons'

export default function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    if (!formData.fullName.trim()) {
      setError('Укажите ваше полное имя')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Регистрация пользователя
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        console.log('Registration successful:', data)

        // Автоматическая авторизация после регистрации
        const signInResult = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        })

        if (signInResult?.error) {
          setError('Регистрация прошла успешно, но не удалось войти. Попробуйте войти вручную.')
        } else {
          // Успешная авторизация - редирект на дашборд с параметром firstLogin
          router.push('/dashboard?firstLogin=true')
        }
      } else {
        setError(data.message || 'Ошибка при регистрации')
      }
    } catch (error: unknown) {
      console.error('Registration error:', error)
      setError('Ошибка при регистрации. Проверьте подключение к интернету.')
    } finally {
      setIsLoading(false)
    }
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
          Создать аккаунт
        </h1>
        <p className="text-slate-600 font-inter">
          Зарегистрируйтесь, чтобы начать проверять работы
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
          <Label htmlFor="fullName">Полное имя</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Иван Иванов"
            value={formData.fullName}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Создаем аккаунт...
            </>
          ) : (
            'Создать аккаунт'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">или</span>
        </div>
      </div>

      <OAuthButtons onError={setError} />

      <div className="text-center">
        <p className="text-sm text-slate-600 font-inter">
          Уже есть аккаунт?{' '}
          <Link 
            href="/auth/login" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Войти
          </Link>
        </p>
      </div>

      <div className="text-xs text-slate-500 text-center">
        Регистрируясь, вы соглашаетесь с{' '}
        <Link href="/privacy" className="underline hover:text-slate-700">
          политикой конфиденциальности
        </Link>
      </div>
    </motion.div>
  )
}