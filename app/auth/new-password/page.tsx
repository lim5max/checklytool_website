'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { NewPasswordForm } from '@/components/auth/NewPasswordForm'

function NewPasswordContent() {
	const searchParams = useSearchParams()
	const [token, setToken] = useState<string | null>(null)
	const [isValidating, setIsValidating] = useState(true)

	useEffect(() => {
		const tokenParam = searchParams.get('token')

		if (!tokenParam) {
			setIsValidating(false)
			return
		}

		setToken(tokenParam)
		setIsValidating(false)
	}, [searchParams])

	if (isValidating) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center space-y-4">
					<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-slate-600 font-inter">Проверяем ссылку...</p>
				</div>
			</div>
		)
	}

	if (!token) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="text-center space-y-6"
			>
				<div className="flex justify-center">
					<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
						<AlertCircle className="w-6 h-6 text-red-600" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="text-2xl font-nunito font-black text-slate-900">
						Недействительная ссылка
					</h1>
					<p className="text-slate-600 font-inter">
						Ссылка для сброса пароля отсутствует или некорректна
					</p>
				</div>

				<div className="space-y-3">
					<Link
						href="/auth/reset-password"
						className="block w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-inter"
					>
						Запросить новую ссылку
					</Link>
					<Link
						href="/auth/login"
						className="block text-sm text-blue-600 hover:text-blue-800 font-inter"
					>
						← Вернуться к входу
					</Link>
				</div>
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
					Создайте новый пароль
				</h1>
				<p className="text-slate-600 font-inter">
					Введите новый пароль для вашей учетной записи
				</p>
			</div>

			<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
				<p className="font-medium">⏱️ Ссылка действительна 15 минут</p>
			</div>

			<NewPasswordForm token={token} />

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

export default function NewPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center space-y-4">
						<div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
						<p className="text-slate-600 font-inter">Загрузка...</p>
					</div>
				</div>
			}
		>
			<NewPasswordContent />
		</Suspense>
	)
}
