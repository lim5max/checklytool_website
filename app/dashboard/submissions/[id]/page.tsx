'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { GradeCircle } from '@/components/submission/grade-circle'
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
		check_type?: 'test' | 'essay' | 'written_work'
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
		written_work_feedback?: {
			brief_summary: string
			errors_found: Array<{
				question_number: number
				error_description: string
			}>
		}
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
	const isWrittenWork = submission.checks.check_type === 'written_work'
	const isTest = submission.checks.check_type === 'test'

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

				{/* Hero Section - Имя ученика, оценка и статистика */}
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

						{/* Оценка и счетчики */}
						{evaluation && (
							<div className="flex flex-col items-center gap-6">
								<GradeCircle grade={evaluation.final_grade} />
								<div className="text-center">
									<div className="text-2xl font-bold text-slate-900 mb-1">
										{evaluation.percentage_score}%
									</div>
									<p className="text-sm text-slate-500 mb-3">
										{isEssay ? 'Качество работы' : 'Процент выполнения'}
									</p>
								</div>

								{/* Счетчики для тестов и контрольных */}
								{!isEssay && (
									<div className="flex gap-3">
										<div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
											<CheckCircle className="w-5 h-5 text-green-600" />
											<span className="font-semibold text-green-700">
												{evaluation.correct_answers}
											</span>
										</div>
										<div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100">
											<XCircle className="w-5 h-5 text-red-600" />
											<span className="font-semibold text-red-700">
												{evaluation.incorrect_answers}
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Общее резюме для сочинений */}
				{isEssay && evaluation?.detailed_answers && evaluation.detailed_answers.length > 0 && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							Оценка работы
						</h2>
						<div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
							{evaluation.detailed_answers.map((answer, index) => (
								<div key={index} className="space-y-2">
									{answer.feedback && (
										<p className="text-slate-700 leading-relaxed">{answer.feedback}</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Анализ контрольной работы - для written_work */}
				{isWrittenWork && evaluation?.written_work_feedback && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							Анализ работы
						</h2>
						<div className="space-y-4">
							{/* Краткое резюме */}
							<div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
										<BarChart3 className="w-5 h-5 text-white" />
									</div>
									<div className="flex-1">
										<h3 className="font-semibold text-lg text-blue-900 mb-2">
											Общая оценка
										</h3>
										<p className="text-blue-800 leading-relaxed">
											{evaluation.written_work_feedback.brief_summary}
										</p>
									</div>
								</div>
							</div>

							{/* Список ошибок */}
							{evaluation.written_work_feedback.errors_found.length > 0 && (
								<div className="bg-white rounded-2xl border border-slate-200 p-6">
									<h3 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
										<XCircle className="w-5 h-5 text-red-600" />
										Найденные ошибки и замечания
									</h3>
									<div className="space-y-3">
										{evaluation.written_work_feedback.errors_found.map((error, index) => (
											<div
												key={index}
												className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100"
											>
												<div className="font-semibold text-red-700 flex-shrink-0">
													Задание {error.question_number}:
												</div>
												<p className="text-red-800 flex-1">
													{error.error_description}
												</p>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Детализация по вопросам для тестов */}
				{isTest && evaluation?.detailed_answers && evaluation.detailed_answers.length > 0 && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							Детализация по вопросам
						</h2>
						<div className="space-y-3">
							{evaluation.detailed_answers.map((answer, index) => {
								const questionNum = answer.question_number || (index + 1)
								return (
									<div
										key={index}
										className={`bg-white rounded-2xl border-2 p-6 transition-all ${
											answer.is_correct
												? 'border-green-200 bg-green-50'
												: 'border-red-200 bg-red-50'
										}`}
									>
										<div className="flex items-start gap-4">
											<div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
												answer.is_correct ? 'bg-green-500' : 'bg-red-500'
											}`}>
												{answer.is_correct ? (
													<CheckCircle className="w-6 h-6 text-white" />
												) : (
													<XCircle className="w-6 h-6 text-white" />
												)}
											</div>
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between">
													<h3 className="font-semibold text-lg text-slate-900">
														Вопрос {questionNum}
													</h3>
													<span className={`px-3 py-1 rounded-full text-sm font-medium ${
														answer.is_correct
															? 'bg-green-100 text-green-700'
															: 'bg-red-100 text-red-700'
													}`}>
														{answer.is_correct ? '✓ Верно' : '✗ Неверно'}
													</span>
												</div>
												{answer.student_answer && (
													<div>
														<p className="text-sm font-medium text-slate-600 mb-1">
															Ответ ученика:
														</p>
														<p className="text-slate-900 font-medium">
															{answer.student_answer}
														</p>
													</div>
												)}
												{answer.correct_answer && !answer.is_correct && (
													<div>
														<p className="text-sm font-medium text-slate-600 mb-1">
															Правильный ответ:
														</p>
														<p className="text-green-700 font-medium">
															{answer.correct_answer}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* Детализация по заданиям для written_work */}
				{isWrittenWork && evaluation?.detailed_answers && evaluation.detailed_answers.length > 0 && (
					<div>
						<h2 className="font-nunito font-bold text-2xl text-slate-900 mb-6">
							Детализация по заданиям
						</h2>
						<div className="space-y-3">
							{evaluation.detailed_answers.map((answer, index) => {
								const questionNum = answer.question_number || (index + 1)
								return (
									<div
										key={index}
										className={`bg-white rounded-2xl border-2 p-6 ${
											answer.is_correct
												? 'border-green-200 bg-green-50'
												: 'border-red-200 bg-red-50'
										}`}
									>
										<div className="flex items-start gap-4">
											<div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
												answer.is_correct ? 'bg-green-500' : 'bg-red-500'
											}`}>
												{answer.is_correct ? (
													<CheckCircle className="w-6 h-6 text-white" />
												) : (
													<XCircle className="w-6 h-6 text-white" />
												)}
											</div>
											<div className="flex-1 space-y-2">
												<div className="flex items-center justify-between">
													<h3 className="font-semibold text-lg text-slate-900">
														Задание {questionNum}
													</h3>
													<span className={`px-3 py-1 rounded-full text-sm font-medium ${
														answer.is_correct
															? 'bg-green-100 text-green-700'
															: 'bg-red-100 text-red-700'
													}`}>
														{answer.is_correct ? 'Верно' : 'Неверно'}
													</span>
												</div>
												{answer.student_answer && (
													<div>
														<p className="text-sm font-medium text-slate-600 mb-1">
															Ответ ученика:
														</p>
														<p className="text-slate-900 font-medium">
															{answer.student_answer}
														</p>
													</div>
												)}
												{answer.correct_answer && !answer.is_correct && (
													<div>
														<p className="text-sm font-medium text-slate-600 mb-1">
															Правильный ответ:
														</p>
														<p className="text-green-700 font-medium">
															{answer.correct_answer}
														</p>
													</div>
												)}
												{answer.feedback && (
													<div className="pt-2 border-t border-slate-200">
														<p className="text-sm text-slate-600">
															{answer.feedback}
														</p>
													</div>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>
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
