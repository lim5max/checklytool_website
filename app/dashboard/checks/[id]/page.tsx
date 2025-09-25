'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Settings, Trash2 } from 'lucide-react'
import Image from 'next/image'

import MobileHeader from '@/components/MobileHeader'
import DesktopHeader from '@/components/DesktopHeader'
import { CameraWorkInterface } from '@/components/camera/CameraWorkInterface'
import { Button } from '@/components/ui/button'
import { getDraft, clearDraft, setDraftStudents, getTempFailedNames, clearTempFailedNames, addTempFailedName } from '@/lib/drafts'
import { submitStudents, evaluateAll } from '@/lib/upload-submissions'

type SubmissionStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface EvaluationResult {
	id: string
	final_grade: number
	percentage_score: number
}

interface StudentSubmission {
	id: string
	student_name?: string
	student_class?: string
	submission_images: string[]
	status: SubmissionStatus
	evaluation_results?: EvaluationResult[]
	error_message?: string
	error_details?: Record<string, unknown>
}

interface DraftStudent {
	name: string
	photos: string[]
	variant?: number
}

interface CheckPageProps {
	params: Promise<{ id: string }>
}

export default function CheckPage({ params }: CheckPageProps) {
	const router = useRouter()
	const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null)
	const [isUserLoading, setIsUserLoading] = useState(true)
	const [checkId, setCheckId] = useState<string>('')
	const [checkTitle, setCheckTitle] = useState<string>('Проверочная работа')
	const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isCameraOpen, setIsCameraOpen] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [drafts, setDrafts] = useState<DraftStudent[]>([])

	// Загружаем данные пользователя
	useEffect(() => {
		setIsUserLoading(true)
		fetch('/api/auth/session')
			.then(res => res.json())
			.then(data => {
				if (data?.user) {
					setUser(data.user)
				} else {
					// Если нет пользователя, перенаправить на страницу входа
					router.push('/auth/login')
					return
				}
			})
			.catch(console.error)
			.finally(() => setIsUserLoading(false))
	}, [router])

	const handleSignOut = async () => {
		// Используем window.location для выхода, так как у нас серверная аутентификация
		window.location.href = '/api/auth/signout'
	}

	// Инициализация checkId из params
	useEffect(() => {
		const getParams = async () => {
			const resolvedParams = await params
			setCheckId(resolvedParams.id)
		}
		getParams()
	}, [params])

	// Загрузка данных проверки
	const loadCheckData = useCallback(async () => {
		if (!checkId) return

		try {
			setIsLoading(true)
			const response = await fetch(`/api/checks/${checkId}`)

			if (!response.ok) {
				throw new Error('Проверочная работа не найдена')
			}

			const data = await response.json()
			setCheckTitle(data.check.title || 'Проверочная работа')
		} catch (error) {
			console.error('Error loading check data:', error)
			toast.error('Не удалось загрузить данные')
			router.push('/dashboard')
		}
	}, [checkId, router])

	// Загрузка submissions
	const loadSubmissions = useCallback(async () => {
		if (!checkId) return

		try {
			const res = await fetch(`/api/checks/${checkId}/submissions`)
			if (!res.ok) throw new Error('Failed to load submissions')

			const data: { submissions: StudentSubmission[] } = await res.json()
			setSubmissions(data.submissions || [])
		} catch (error) {
			console.error('Error loading submissions:', error)
		} finally {
			setIsLoading(false)
		}
	}, [checkId])

	// Загрузка черновиков
	const loadDrafts = useCallback(() => {
		if (!checkId) return

		try {
			const draft = getDraft(checkId)
			const students = draft?.students || []
					// Конвертируем DraftStudent[] в нужный формат
			const validDrafts: DraftStudent[] = students
				.filter(s => s.photos.length > 0)
				.map(s => ({
					...s,
					photos: s.photos.map(p => p.dataUrl) // Конвертируем DraftPhoto[] в string[]
				}))
			setDrafts(validDrafts)
		} catch (error) {
			setDrafts([])
		}
	}, [checkId])

	// Эффекты для загрузки данных
	useEffect(() => {
		if (checkId) {
			loadCheckData()
			loadSubmissions()
			loadDrafts()
		}
	}, [checkId, loadCheckData, loadSubmissions, loadDrafts])

	// Обработчики событий
	useEffect(() => {
		const handleDraftsUpdate = () => {
			loadDrafts()
		}
		const handleSubmissionsUpload = () => {
			clearTempFailedNames(checkId)
			loadSubmissions()
			loadDrafts()
		}
		const handleEvaluationComplete = () => {
			setTimeout(() => {
				loadSubmissions()
				setIsProcessing(false) // Сбрасываем флаг обработки после завершения всех проверок
			}, 2000)
		}

		// Обработчик фокуса страницы для мобильных устройств
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				loadDrafts()
			}
		}

		const handleFocus = () => {
			loadDrafts()
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('drafts:updated', handleDraftsUpdate)
			window.addEventListener('submissions:uploaded', handleSubmissionsUpload)
			window.addEventListener('evaluation:complete', handleEvaluationComplete)
			window.addEventListener('focus', handleFocus)
			document.addEventListener('visibilitychange', handleVisibilityChange)
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('drafts:updated', handleDraftsUpdate)
				window.removeEventListener('submissions:uploaded', handleSubmissionsUpload)
				window.removeEventListener('evaluation:complete', handleEvaluationComplete)
				window.removeEventListener('focus', handleFocus)
				document.removeEventListener('visibilitychange', handleVisibilityChange)
			}
		}
	}, [checkId, loadDrafts, loadSubmissions])

	// Периодическая проверка drafts для мобильных устройств
	useEffect(() => {
		if (!checkId) return

		const interval = setInterval(() => {
			// Проверяем только если камера закрыта
			if (!isCameraOpen) {
				loadDrafts()
			}
		}, 2000) // Проверяем каждые 2 секунды

		return () => clearInterval(interval)
	}, [checkId, isCameraOpen, loadDrafts])

	// Мемоизированные состояния
	const { failedSubs, pendingSubs, completedSubs } = useMemo(() => {
		const failed = submissions.filter(s => s.status === 'failed')
		const pending = submissions.filter(s => s.status === 'pending' || s.status === 'processing')
		const completed = submissions.filter(s => s.status === 'completed')

		// Добавляем временные ошибки
		const tempFailedNames = getTempFailedNames(checkId)
		const tempFailedSubs: StudentSubmission[] = tempFailedNames.map(name => ({
			id: `temp-${name}`,
			student_name: name,
			student_class: '',
			submission_images: [],
			status: 'failed' as SubmissionStatus,
			error_message: 'Ошибка при отправке фотографий на сервер',
			error_details: { isTemporary: true }
		}))

		// Убираем дубли
		const allFailed = [...failed, ...tempFailedSubs]
		const uniqueFailed = allFailed.filter((sub, index, self) =>
			index === self.findIndex(s => s.student_name === sub.student_name)
		)

		return {
			failedSubs: uniqueFailed,
			pendingSubs: pending,
			completedSubs: completed
		}
	}, [submissions, checkId])

	// Обработчики действий
	const handleOpenCamera = () => {
		setIsCameraOpen(true)
	}

	const handleCloseCamera = () => {
		setIsCameraOpen(false)
		// Принудительно обновляем drafts после закрытия камеры (для мобильных устройств)
		setTimeout(() => {
			loadDrafts()
		}, 300)
	}

	const handleSendAll = async () => {
		if (drafts.length === 0) {
			toast.error('Нет работ для отправки')
			return
		}

		try {
			setIsProcessing(true)
			const draft = getDraft(checkId)
			const { items } = await submitStudents(checkId, draft?.students || [])

			// Запускаем проверку, но не дожидаемся ее завершения
			// isProcessing будет сброшен через событие evaluation:complete
			evaluateAll(items.map(i => ({ submissionId: i.submissionId }))).catch(console.error)
			clearDraft(checkId)

			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('submissions:uploaded', {
					detail: { checkId, items }
				}))
			}

			toast.success('Работы отправлены на проверку')
		} catch (error) {
			console.error('Submit error:', error)
			toast.error('Ошибка при отправке работ')
			// Только при ошибке отправки сбрасываем сразу
			setIsProcessing(false)
		}
	}

	const handleReshoot = () => {
		const allFailedNames = [
			...failedSubs.map(s => (s.student_name || '').trim()),
			...getTempFailedNames(checkId)
		]
		const uniqueNames = Array.from(new Set(allFailedNames)).filter(n => n.length > 0)

		clearDraft(checkId)
		if (uniqueNames.length > 0) {
			setDraftStudents(checkId, uniqueNames)
		}
		clearTempFailedNames(checkId)
		handleOpenCamera()
	}

	const handleDeleteFailed = async (submission: StudentSubmission) => {
		try {
			const isTemporary = submission.error_details?.isTemporary === true || submission.id.startsWith('temp-')

			if (isTemporary) {
				// Удаляем из временного списка
				const tempFailedNames = getTempFailedNames(checkId)
				const updatedNames = tempFailedNames.filter(name => name !== submission.student_name)
				clearTempFailedNames(checkId)
				updatedNames.forEach(name => addTempFailedName(checkId, name))

				// Принудительно перезагружаем данные
				loadSubmissions()
			} else {
				const response = await fetch(`/api/submissions/${submission.id}`, { method: 'DELETE' })
				if (!response.ok) throw new Error('Failed to delete')
				setSubmissions(prev => prev.filter(s => s.id !== submission.id))
			}

			toast.success(`Работа "${submission.student_name}" удалена`)
		} catch (error) {
			console.error('Error deleting submission:', error)
			toast.error('Не удалось удалить работу')
		}
	}

	const handleDeleteDraft = (studentName: string) => {
		try {
			const draft = getDraft(checkId)
			if (draft?.students) {
				const updatedStudents = draft.students.filter(s => s.name !== studentName)
				clearDraft(checkId)
				if (updatedStudents.length > 0) {
					setDraftStudents(checkId, updatedStudents.map(s => s.name))
				}
				loadDrafts()
				toast.success(`Работа "${studentName}" удалена`)
			}
		} catch (error) {
			console.error('Error deleting draft:', error)
			toast.error('Не удалось удалить черновик')
		}
	}

	// Вычисляем показывать ли состояние загрузки
	const showSkeleton = isLoading || isProcessing

	// Проверяем есть ли вообще какой-то контент
	const hasAnyContent = failedSubs.length > 0 || pendingSubs.length > 0 || completedSubs.length > 0 || drafts.length > 0

	return (
		<div className="min-h-screen bg-white">
			{/* Desktop Header */}
			<div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<DesktopHeader
					variant="dashboard"
					user={user}
					onSignOut={handleSignOut}
				/>
			</div>

			<div className="flex flex-col gap-6 items-center justify-start p-4 relative min-h-screen max-w-md mx-auto md:max-w-6xl">

				{/* Header */}
				<div className="flex flex-col gap-8 items-end justify-start relative w-full">
					{/* Mobile Header */}
					<MobileHeader
						variant="dashboard"
						user={user}
						onSignOut={handleSignOut}
						className="w-full md:hidden"
					/>

					{/* Debug indicator for mobile */}
					{process.env.NODE_ENV === 'development' && (
						<div className="fixed top-20 right-4 bg-red-500 text-white text-xs p-2 rounded z-50">
							Drafts: {drafts.length} | Camera: {isCameraOpen ? 'Open' : 'Closed'}
						</div>
					)}

					{/* Navigation + Title */}
					<div className="flex flex-col gap-4.5 items-start justify-start relative w-full">
						<div className="flex flex-col gap-6 items-start justify-start relative w-full">
							{/* Navigation icons */}
							<div className="flex items-center justify-between relative w-full">
								<button
									onClick={() => router.push('/dashboard')}
									className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
								>
									<X className="h-8 w-8 text-slate-600 cursor-pointer" />
								</button>
								<button className="p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors">
									<Settings className="h-8 w-8 text-slate-600 cursor-pointer" />
								</button>
							</div>

							{/* Title */}
							<h1 className="font-nunito font-black text-3xl text-slate-800 w-full leading-tight">
								{checkTitle}
							</h1>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 w-full space-y-6">
					{!hasAnyContent && !isLoading && !isProcessing ? (
						// Empty state
						<div className="flex flex-col gap-2.5 items-center justify-center py-20">
							<div className="flex justify-center items-center h-60 w-full">
								<Image
									src="/images/empty.png"
									alt="Пустой список"
									width={200}
									height={200}
									className="object-contain"
								/>
							</div>
							<p className="font-medium text-base text-center text-slate-500 max-w-xs">
								Список проверенных работ пуст
							</p>
						</div>
					) : (
						// Content sections
						<div className="space-y-6">
							{/* Ошибки проверки */}
							{failedSubs.length > 0 && (
								<div className="flex flex-col gap-4">
									<div className="flex items-center justify-between w-full">
										<h2 className="font-medium text-base text-slate-800">Ошибки проверки</h2>
										<button
											className="bg-[#096ff5] hover:bg-blue-700 text-white font-medium text-base px-4 py-2 rounded-full h-9 flex items-center justify-center transition-colors"
											onClick={handleReshoot}
										>
											Переснять
										</button>
									</div>
									<div className="flex flex-col gap-2.5">
										{failedSubs.map((sub) => (
											<div key={sub.id} className="flex gap-2 items-center justify-start w-full">
												<div className="bg-slate-50 rounded-[24px] p-6 flex-1">
													<div className="flex items-center justify-between w-full">
														<div className="flex items-center gap-3">
															<span className="font-medium text-lg text-slate-800">
																{sub.student_name || 'Студент'}
															</span>
														</div>
														<div className="h-2 w-2 bg-red-500 rounded-full" />
													</div>
													{sub.error_message && (
														<div className="text-sm text-slate-600 mt-2">
															{sub.error_message}
														</div>
													)}
												</div>
												<button
													onClick={() => handleDeleteFailed(sub)}
													className="p-3 rounded-xl hover:bg-red-100 active:bg-red-200 transition-colors"
												>
													<Trash2 className="h-6 w-6 text-red-500" />
												</button>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Работы к проверке */}
							{(drafts.length > 0 || showSkeleton) && (
								<div className="flex flex-col gap-4">
									<h2 className="font-medium text-base text-slate-800">
										{showSkeleton ? 'Проверяем работы' : 'Работы к проверке'}
									</h2>
									<div className="flex flex-col gap-2.5">
										{showSkeleton ? (
											// Скелетоны для проверяющихся работ
											Array.from({ length: Math.max(3, drafts.length) }).map((_, i) => (
												<div key={i} className="bg-slate-50 rounded-[24px] p-6 w-full">
													<div className="flex items-center justify-between w-full">
														<div className="flex items-center gap-3">
															<div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
															<div className="w-6 h-5 bg-gray-200 rounded-xl animate-pulse" />
														</div>
														<div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
													</div>
													<div className="mt-2 text-sm text-blue-600 animate-pulse">
														Проверяется...
													</div>
												</div>
											))
										) : (
											drafts.map((student, index) => (
												<div key={`${student.name}-${index}`} className="flex gap-2 items-center justify-start w-full">
													<div className="bg-slate-50 rounded-[24px] p-6 flex-1">
														<div className="flex items-center justify-between w-full">
															<div className="flex items-center gap-3">
																<span className="font-medium text-lg text-slate-800">
																	{student.name}
																</span>
																{student.variant && (
																	<span className="bg-blue-600 text-white font-extrabold text-sm rounded-xl px-1.5 py-0.5 h-5 flex items-center justify-center">
																		{student.variant}
																	</span>
																)}
															</div>
															<div className="h-2 w-2 bg-orange-500 rounded-full" />
														</div>
													</div>
													<button
														onClick={() => handleDeleteDraft(student.name)}
														className="p-3 rounded-xl hover:bg-red-100 active:bg-red-200 transition-colors"
													>
														<Trash2 className="h-6 w-6 text-red-500" />
													</button>
												</div>
											))
										)}
									</div>
								</div>
							)}

							{/* Успешно проверенные */}
							{completedSubs.length > 0 && (
								<div className="flex flex-col gap-4">
									<h2 className="font-medium text-base text-slate-800">
										Успешно проверенные
									</h2>
									<div className="flex flex-col gap-2.5">
										{completedSubs.map((sub) => {
											const grade = sub.evaluation_results?.[0]?.final_grade
											return (
												<div key={sub.id} className="bg-slate-50 rounded-[24px] p-6 w-full">
													<div className="flex items-center justify-between w-full">
														<span className="font-medium text-lg text-slate-800">
															{sub.student_name || 'Студент'}
														</span>
														{typeof grade === 'number' && (
															<span className="font-extrabold text-xl text-green-600">
																{grade}
															</span>
														)}
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Spacer для bottom bar */}
				<div className="h-20" />
			</div>

			{/* Bottom bar */}
			<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
				<div className="max-w-md mx-auto">
					<div className="flex flex-col gap-2">
						{drafts.length > 0 && (
							<Button
								className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-base px-11 py-3.5 rounded-full h-14 flex items-center justify-center w-full transition-colors"
								onClick={handleSendAll}
								disabled={isProcessing}
							>
								{isProcessing ? 'Отправляем...' : 'Проверить работы'}
							</Button>
						)}
						<Button
							className={`${drafts.length > 0 ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-blue-600 hover:bg-blue-700 text-white'} font-medium text-base px-11 py-3.5 rounded-full h-14 flex items-center justify-center w-full transition-colors`}
							onClick={handleOpenCamera}
							disabled={isProcessing}
						>
							Загрузить работы
						</Button>
					</div>
				</div>
			</div>

			{/* Camera Interface */}
			<CameraWorkInterface
				isOpen={isCameraOpen}
				checkId={checkId}
				onClose={handleCloseCamera}
				checkTitle={checkTitle}
				maxPhotosPerStudent={5}
			/>
		</div>
	)
}