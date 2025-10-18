'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import TestConstructor from '@/components/TestConstructor'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { GeneratedTest, TestQuestion } from '@/types/check'

interface TestPageProps {
	params: Promise<{ id: string }>
}

export default function TestPage({ params }: TestPageProps) {
	const router = useRouter()
	const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null)
	const [isUserLoading, setIsUserLoading] = useState(true)
	const [testId, setTestId] = useState<string>('')
	const [existingTest, setExistingTest] = useState<GeneratedTest | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Загружаем данные пользователя
	useEffect(() => {
		setIsUserLoading(true)
		fetch('/api/auth/session')
			.then(res => res.json())
			.then(data => {
				if (data?.user) {
					setUser(data.user)
				} else {
					router.push('/auth/login')
					return
				}
			})
			.catch(console.error)
			.finally(() => setIsUserLoading(false))
	}, [router])

	// Инициализация testId из params
	useEffect(() => {
		const getParams = async () => {
			const resolvedParams = await params
			setTestId(resolvedParams.id)
		}
		getParams()
	}, [params])

	// Загрузка данных теста
	useEffect(() => {
		if (!testId) return

		const loadTest = async () => {
			try {
				setIsLoading(true)
				const response = await fetch(`/api/tests/${testId}`)

				if (!response.ok) {
					throw new Error('Тест не найден')
				}

				const data = await response.json()

				// ОТЛАДКА: логируем загруженный тест
				console.log('=== ЗАГРУЗКА ТЕСТА ===')
				console.log('ID теста:', data.test.id)
				console.log('Название:', data.test.title)
				const openQuestions = data.test.questions?.filter((q: TestQuestion) => q.type === 'open') || []
				console.log('Открытых вопросов:', openQuestions.length)
				if (openQuestions.length > 0) {
					console.log('Первый открытый вопрос при загрузке:', openQuestions[0])
				}

				setExistingTest(data.test)
			} catch (error) {
				console.error('Error loading test:', error)
				toast.error('Не удалось загрузить тест')
				router.push('/dashboard')
			} finally {
				setIsLoading(false)
			}
		}

		loadTest()
	}, [testId, router])

	const [isSaving, setIsSaving] = useState(false)

	const handleSaveTest = async (test: GeneratedTest, silent = false) => {
		// ОТЛАДКА: Трассируем откуда вызывается сохранение
		console.trace('handleSaveTest вызван! silent:', silent)

		if (isSaving) {
			if (!silent) {
				toast.warning('Сохранение уже выполняется, подождите...')
			}
			return
		}

		// Валидация перед сохранением
		if (!test.title.trim()) {
			if (!silent) toast.error('Не указано название теста')
			return
		}

		if (test.questions.length === 0) {
			if (!silent) toast.error('Нельзя сохранить пустой тест')
			return
		}

		// ОТЛАДКА: логируем открытые вопросы перед сохранением
		const openQuestions = test.questions.filter(q => q.type === 'open')
		console.log('=== СОХРАНЕНИЕ ТЕСТА ===')
		console.log('Всего вопросов:', test.questions.length)
		console.log('Открытых вопросов:', openQuestions.length)
		if (openQuestions.length > 0) {
			console.log('Первый открытый вопрос:', openQuestions[0])
		}

		try {
			setIsSaving(true)

			// Показываем индикатор начала сохранения только если не silent
			if (!silent) {
				toast.loading('Сохраняем тест...', { id: 'saving-test' })
			}

			const response = await fetch('/api/tests/save', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: test.id,
					title: test.title,
					description: test.description,
					subject: test.subject,
					questions: test.questions
				})
			})

			const result = await response.json()

			// Удаляем loading toast
			if (!silent) {
				toast.dismiss('saving-test')
			}

			if (result.success) {
				// Показываем успешный тост только если не silent
				if (!silent) {
					toast.success(`Тест "${result.test.title}" успешно сохранен!`, {
						description: `Создано ${result.test.questionsCount} вопросов`,
						duration: 4000
					})

					// Перезагружаем тест из базы данных, чтобы убедиться что данные сохранились
					console.log('=== ПЕРЕЗАГРУЗКА ПОСЛЕ СОХРАНЕНИЯ ===')
					const reloadResponse = await fetch(`/api/tests/${testId}`)
					if (reloadResponse.ok) {
						const reloadData = await reloadResponse.json()
						setExistingTest(reloadData.test)
						console.log('Тест перезагружен из БД')
					}
				}
			} else {
				console.error('Server error:', result.error)
				if (!silent) {
					toast.error('Ошибка на сервере', {
						description: result.error || 'Неизвестная ошибка сервера',
						duration: 6000
					})
				}
			}
		} catch (error) {
			console.error('Network error:', error)
			if (!silent) {
				toast.dismiss('saving-test')

				if (error instanceof Error) {
					toast.error('Ошибка соединения', {
						description: 'Проверьте интернет-соединение и попробуйте снова',
						duration: 6000
					})
				} else {
					toast.error('Непредвиденная ошибка', {
						description: 'Попробуйте обновить страницу и повторить попытку',
						duration: 6000
					})
				}
			}
		} finally {
			setIsSaving(false)
		}
	}

	const handleBackClick = () => {
		router.push('/dashboard')
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<p className="mt-4 text-slate-600">Загрузка теста...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Unified Header */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<Header
					variant="dashboard"
					user={user}
					isUserLoading={isUserLoading}
					className="py-4"
				/>
			</div>

			{/* Main Content */}
			<main className="max-w-5xl mx-auto px-4 pb-[100px]">
				{/* Заголовок страницы */}
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleBackClick}
							className="gap-2"
						>
							<ArrowLeft className="w-4 h-4" />
							Назад к дашборду
						</Button>
					</div>

					<div className="space-y-2">
						<h1 className="font-nunito font-black text-3xl text-slate-900">
							Редактирование теста
						</h1>
						<p className="text-slate-600 text-lg">
							Редактируйте вопросы и варианты ответов
						</p>
					</div>
				</div>

				{/* Конструктор тестов с загруженными данными */}
				{existingTest && (
					<TestConstructor
						onSave={handleSaveTest}
						className=""
						initialTest={existingTest}
					/>
				)}
			</main>
		</div>
	)
}
