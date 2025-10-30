'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NewPasswordFormProps {
	token: string
}

export function NewPasswordForm({ token }: NewPasswordFormProps) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const [formData, setFormData] = useState({
		password: '',
		confirmPassword: '',
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		// Client-side validation
		if (formData.password.length < 6) {
			setError('Пароль должен содержать минимум 6 символов')
			return
		}

		if (formData.password !== formData.confirmPassword) {
			setError('Пароли не совпадают')
			return
		}

		try {
			setIsLoading(true)

			const response = await fetch('/api/auth/update-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					token,
					password: formData.password,
					confirmPassword: formData.confirmPassword,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Не удалось обновить пароль')
			}

			// Success - redirect to login
			router.push('/auth/login?passwordReset=true')
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Не удалось обновить пароль'
			)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="password">Новый пароль</Label>
				<div className="relative">
					<Input
						id="password"
						type={showPassword ? 'text' : 'password'}
						placeholder="Минимум 6 символов"
						value={formData.password}
						onChange={(e) =>
							setFormData({ ...formData, password: e.target.value })
						}
						disabled={isLoading}
						required
						minLength={6}
					/>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
						disabled={isLoading}
					>
						{showPassword ? (
							<EyeOff className="w-4 h-4" />
						) : (
							<Eye className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="confirmPassword">Подтвердите пароль</Label>
				<div className="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? 'text' : 'password'}
						placeholder="Повторите пароль"
						value={formData.confirmPassword}
						onChange={(e) =>
							setFormData({ ...formData, confirmPassword: e.target.value })
						}
						disabled={isLoading}
						required
						minLength={6}
					/>
					<button
						type="button"
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
						disabled={isLoading}
					>
						{showConfirmPassword ? (
							<EyeOff className="w-4 h-4" />
						) : (
							<Eye className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			<Button type="submit" size="lg" className="w-full" disabled={isLoading}>
				{isLoading ? (
					<>
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
						Обновляем пароль...
					</>
				) : (
					'Обновить пароль'
				)}
			</Button>
		</form>
	)
}
