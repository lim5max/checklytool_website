'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { GradeCircle } from '@/components/submission/grade-circle'
import { StatCard } from '@/components/submission/stat-card'
import { QuestionAccordion } from '@/components/submission/question-accordion'
import { ImageGallery } from '@/components/submission/image-gallery'

interface SubmissionData {
	id: string
	student_name: string
	student_class?: string
	submission_images: string[]
	created_at: string
	status: string
	checks: {
		id: string
		title: string
		subject?: string
		class_level?: string
		total_questions?: number
		check_type?: 'test' | 'essay'
	}
	evaluation_results?: {
		final_grade: number
		percentage_score: number
		total_questions: number
		correct_answers: number
		incorrect_answers: number
		detailed_answers?: Array<{
			question_number: number
			is_correct: boolean
			student_answer?: string
			correct_answer?: string
			feedback?: string
		}>
		created_at: string
	}
}

interface PageProps {
	params: Promise<{ id: string }>
}

export default function SubmissionDetailPage({ params }: PageProps) {
	const router = useRouter()
	const [submissionId, setSubmissionId] = useState<string>('')
	const [submission, setSubmission] = useState<SubmissionData | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Получаем ID из params
	useEffect(() => {
		const getParams = async () => {
			const resolvedParams = await params
			setSubmissionId(resolvedParams.id)
		}
		getParams()
	}, [params])

	// Загружаем данные submission
	useEffect(() => {
		if (!submissionId) return

		const loadSubmission = async () => {
			try {
				setIsLoading(true)
				const res = await fetch(`/api/submissions/${submissionId}`)

				if (!res.ok) {
					throw new Error('Не удалось загрузить данные')
				}

				const data = await res.json()
				setSubmission(data)
			} catch (error) {
				console.error('Error loading submission:', error)
				toast.error('Не удалось загрузить результаты проверки')
				router.push('/dashboard')
			} finally {
				setIsLoading(false)
			}
		}

		loadSubmission()
	}, [submissionId, router])

	// Форматирование даты
	const formatDate = (dateString: string) => {
		const date = new Date(dateString)
		return new Intl.DateTimeFormat('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date)
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-white">
				<div className="max-w-4xl mx-auto px-4 py-12">
					<div className="animate-pulse space-y-8">
						<div className="h-12 bg-slate-200 rounded-xl w-3/4" />
						<div className="h-32 bg-slate-200 rounded-2xl" />
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[1, 2, 3, 4].map(i => (
								<div key={i} className="h-24 bg-slate-200 rounded-2xl" />
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!submission) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<p className="text-slate-600 text-lg">Результаты не найдены</p>
				</div>
			</div>
		)
	}

	const evaluation = submission.evaluation_results
	const isEssay = submission.checks.check_type === 'essay'

	return (
		<div className="min-h-screen bg-white">
			{/* Content */}
			<div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
				{/* Кнопка "Назад" */}
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium"
				>
					<ArrowLeft className="w-5 h-5" />
					Назад к списку
				</button>

				{/* Hero Section - Имя ученика и оценка */}
				<div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200">
					<div className="flex flex-col md:flex-row items-center gap-8">
						{/* Информация об ученике */}
						<div className="flex-1 text-center md:text-left">
							<h1 className="font-nunito font-black text-4xl md:text-5xl text-slate-900 mb-3">
								{submission.student_name}
							</h1>
							<div className="space-y-2 text-slate-600">
								{submission.student_class && (
									<p className="text-lg">{submission.student_class}</p>
								)}
								<p className="text-sm">
									{formatDate(submission.created_at)}
								</p>
								{submission.checks.title && (
									<p className="text-lg font-medium text-slate-700 mt-4">
										{submission.checks.title}
									</p>
								)}
							</div>
						</div>

						{/* Оценка */}
						{evaluation && (
							<div className="flex flex-col items-center gap-4">
								<GradeCircle grade={evaluation.final_grade} />
								<div className="text-center">
									<div className="text-2xl font-bold text-slate-900">
										{evaluation.percentage_score}%
									</div>
									<p className="text-sm text-slate-500">
										{isEssay ? 'Качество работы' : 'Процент выполнения'}
									</p>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Статистика */}
				{evaluation && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							{isEssay ? 'Оценка работы' : 'Статистика'}
						</h2>
						{isEssay ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<StatCard
									icon={BarChart3}
									label="Оценка"
									value={`${evaluation.final_grade} из 5`}
									iconColor="text-blue-600"
									iconBgColor="bg-blue-50"
								/>
								<StatCard
									icon={Clock}
									label="Качество"
									value={`${evaluation.percentage_score}%`}
									iconColor="text-purple-600"
									iconBgColor="bg-purple-50"
								/>
							</div>
						) : (
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<StatCard
									icon={CheckCircle}
									label="Правильно"
									value={evaluation.correct_answers}
									iconColor="text-green-600"
									iconBgColor="bg-green-50"
								/>
								<StatCard
									icon={XCircle}
									label="Неправильно"
									value={evaluation.incorrect_answers}
									iconColor="text-red-600"
									iconBgColor="bg-red-50"
								/>
								<StatCard
									icon={BarChart3}
									label="Всего вопросов"
									value={evaluation.total_questions}
									iconColor="text-blue-600"
									iconBgColor="bg-blue-50"
								/>
								<StatCard
									icon={Clock}
									label="Процент"
									value={`${evaluation.percentage_score}%`}
									iconColor="text-purple-600"
									iconBgColor="bg-purple-50"
								/>
							</div>
						)}
					</div>
				)}

				{/* Детализация по вопросам или комментарии к сочинению */}
				{evaluation?.detailed_answers && evaluation.detailed_answers.length > 0 && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							{isEssay ? 'Комментарии к работе' : 'Детализация по вопросам'}
						</h2>
						{isEssay ? (
							<div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
								{evaluation.detailed_answers.map((answer, index) => (
									<div key={index} className="space-y-2">
										{answer.feedback && (
											<p className="text-slate-700 leading-relaxed">{answer.feedback}</p>
										)}
									</div>
								))}
							</div>
						) : (
							<QuestionAccordion questions={evaluation.detailed_answers} />
						)}
					</div>
				)}

				{/* Галерея фотографий */}
				{submission.submission_images && submission.submission_images.length > 0 && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							Фотографии работы
						</h2>
						<ImageGallery
							images={submission.submission_images}
							alt={`Работа ${submission.student_name}`}
						/>
					</div>
				)}

				{/* Spacer для комфортного скролла */}
				<div className="h-12" />
			</div>
		</div>
	)
}
