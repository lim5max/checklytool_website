'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning'
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	Plus,
	Trash2,
	Download,
	CheckCircle2,
	Circle,
	GripVertical,
	Eye,
	AlertCircle,
	Copy,
	List,
	Check,
	FileText,
	ChevronDown,
	Minus,
} from 'lucide-react'
import type { TestQuestion, TestOption, GeneratedTest, PDFGenerationRequest } from '@/types/check'

interface TestConstructorProps {
	initialTest?: GeneratedTest
	onSave?: (test: GeneratedTest, silent?: boolean) => void
	className?: string
	onUnsavedChanges?: (hasChanges: boolean) => void
	onRequestShowValidation?: (callback: () => void) => void
}

export default function TestConstructor({
	initialTest,
	onSave,
	className = '',
	onUnsavedChanges,
	onRequestShowValidation
}: TestConstructorProps) {
	const [test, setTest] = useState<GeneratedTest>(
		initialTest || {
			id: `test_${Date.now()}`,
			title: '',
			description: '',
			subject: '',
			questions: [],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	)

	const selectedVariant = 1
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
	const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
	const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
	const [showBottomBar, setShowBottomBar] = useState(true)

	// Ref для хранения актуального состояния test
	const testRef = useRef(test)
	useEffect(() => {
		testRef.current = test
	}, [test])

	// Инициализируем isSaved как true (ничего не изменено) и сохраняем начальный хэш
	const [isSaved, setIsSaved] = useState(true)
	const [lastSavedTestHash, setLastSavedTestHash] = useState<string>(() => {
		// Создаем начальный хэш из начального состояния теста
		return JSON.stringify(initialTest || test)
	})

	// Отслеживание изменений теста для состояния сохранения
	useEffect(() => {
		// Создаем хэш текущего состояния теста
		const currentHash = JSON.stringify(test)

		// Если текущий хэш отличается от сохраненного - значит были изменения
		if (currentHash !== lastSavedTestHash) {
			setIsSaved(false)
			// Уведомляем родительский компонент о несохраненных изменениях
			if (onUnsavedChanges) {
				onUnsavedChanges(true)
			}
		}
	}, [test, lastSavedTestHash, onUnsavedChanges])

	// Предупреждение при выходе со страницы с несохраненными изменениями
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			// Показываем предупреждение ВСЕГДА если тест не сохранен
			// Даже если вопросы не заполнены - пользователь должен явно выбрать "не сохранять"
			if (!isSaved) {
				e.preventDefault()
				e.returnValue = 'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?'
				return e.returnValue
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [isSaved])

	// Предупреждение при навигации внутри приложения
	// Показываем ВСЕГДА если тест не сохранен (даже с пустыми вопросами)
	useUnsavedChangesWarning(
		!isSaved,
		'У вас есть несохраненные изменения в тесте. Вы уверены, что хотите покинуть страницу?'
	)

	// Передаем функцию показа валидации родительскому компоненту только один раз при монтировании
	useEffect(() => {
		if (onRequestShowValidation) {
			onRequestShowValidation(() => {
				// Эта функция будет вызвана только при попытке выхода
				// Помечаем все поля как "touched" чтобы показать ошибки
				const allFields = new Set(['title'])
				// Используем актуальное состояние test из ref
				testRef.current.questions.forEach(q => {
					allFields.add(`question_${q.id}`)
				})
				setTouchedFields(allFields)
			})
		}
	}, [onRequestShowValidation])

	// Drag and drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event

		if (over && active.id !== over.id) {
			setTest(prev => {
				const oldIndex = prev.questions.findIndex(q => q.id === active.id)
				const newIndex = prev.questions.findIndex(q => q.id === over.id)

				return {
					...prev,
					questions: arrayMove(prev.questions, oldIndex, newIndex),
					updated_at: new Date().toISOString()
				}
			})
		}
	}, [])

	// АВТОСОХРАНЕНИЕ ОТКЛЮЧЕНО по просьбе пользователя
	// Пользователь сохраняет тест вручную через кнопку "Сохранить"

	// Скрывать нижний бар при открытии клавиатуры на мобильных
	useEffect(() => {
		let visualViewport: VisualViewport | null = null

		const handleResize = () => {
			if (window.visualViewport) {
				const viewportHeight = window.visualViewport.height
				const windowHeight = window.innerHeight
				// Если высота viewport меньше высоты окна на 150+ пикселей, значит клавиатура открыта
				setShowBottomBar(windowHeight - viewportHeight < 150)
			}
		}

		if (window.visualViewport) {
			visualViewport = window.visualViewport
			visualViewport.addEventListener('resize', handleResize)
		}

		return () => {
			if (visualViewport) {
				visualViewport.removeEventListener('resize', handleResize)
			}
		}
	}, [])

	// Валидация в реальном времени (только для затронутых полей)
	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {}

		// Валидируем название только если поле было затронуто (независимо от количества вопросов)
		if (touchedFields.has('title') && !test.title.trim()) {
			errors.title = 'Укажите название теста'
		}

		test.questions.forEach((q, idx) => {
			// Валидируем только если вопрос был затронут
			const questionTouched = touchedFields.has(`question_${q.id}`)

			if (questionTouched && !q.question.trim()) {
				errors[`q${idx}_text`] = 'Укажите текст вопроса'
			}

			if (questionTouched && q.type !== 'open') {
				if (q.options.some(opt => !opt.text.trim())) {
					errors[`q${idx}_options`] = 'Заполните все варианты'
				}

				const correctCount = q.options.filter(opt => opt.isCorrect).length
				if (correctCount === 0) {
					errors[`q${idx}_correct`] = 'Выберите правильный ответ'
				}
			}

			// Валидация для открытых вопросов с ручной проверкой
			if (questionTouched && q.type === 'open') {
				if (!q.correctAnswer || !q.correctAnswer.trim()) {
					errors[`q${idx}_answer`] = 'Укажите правильный ответ'
				}
			}
		})

		return errors
	}, [test, touchedFields])

	const isValid = Object.keys(validationErrors).length === 0 && test.questions.length > 0

	const addQuestion = useCallback(() => {
		const newQuestion: TestQuestion = {
			id: `q_${Date.now()}`,
			question: '',
			type: 'single',
			options: [
				{ id: `opt_${Date.now()}_1`, text: '', isCorrect: false }
			],
			explanation: '',
			hideOptionsInPDF: false,
			points: 1,
			correctAnswer: '',
			// useAIGrading удалено - теперь всегда используется ИИ с допуском отклонений
		}

		setTest(prev => ({
			...prev,
			questions: [...prev.questions, newQuestion],
			updated_at: new Date().toISOString()
		}))

		setExpandedQuestion(newQuestion.id)
	}, [])

	const duplicateQuestion = useCallback((questionId: string) => {
		const question = test.questions.find(q => q.id === questionId)
		if (!question) return

		const newQuestion: TestQuestion = {
			...question,
			id: `q_${Date.now()}`,
			options: question.options.map(opt => ({
				...opt,
				id: `opt_${Date.now()}_${Math.random()}`
			}))
		}

		const index = test.questions.findIndex(q => q.id === questionId)
		const newQuestions = [...test.questions]
		newQuestions.splice(index + 1, 0, newQuestion)

		setTest(prev => ({
			...prev,
			questions: newQuestions,
			updated_at: new Date().toISOString()
		}))

		toast.success('Вопрос продублирован')
	}, [test.questions])

	const updateQuestion = useCallback((questionId: string, updates: Partial<TestQuestion>) => {
		setTest(prev => ({
			...prev,
			questions: prev.questions.map(q =>
				q.id === questionId ? { ...q, ...updates } : q
			),
			updated_at: new Date().toISOString()
		}))
	}, [])

	const deleteQuestion = useCallback((questionId: string) => {
		setTest(prev => ({
			...prev,
			questions: prev.questions.filter(q => q.id !== questionId),
			updated_at: new Date().toISOString()
		}))

		toast.success('Вопрос удалён')
	}, [])

	const updateOption = useCallback((questionId: string, optionId: string, updates: Partial<TestOption>) => {
		setTest(prev => ({
			...prev,
			questions: prev.questions.map(q =>
				q.id === questionId
					? {
							...q,
							options: q.options.map(opt =>
								opt.id === optionId ? { ...opt, ...updates } : opt
							)
						}
					: q
			),
			updated_at: new Date().toISOString()
		}))
	}, [])

	const addOption = useCallback((questionId: string) => {
		const question = test.questions.find(q => q.id === questionId)
		if (!question || question.options.length >= 6) return

		const newOption: TestOption = {
			id: `opt_${Date.now()}`,
			text: '',
			isCorrect: false
		}

		updateQuestion(questionId, {
			options: [...question.options, newOption]
		})
	}, [test.questions, updateQuestion])

	const removeOption = useCallback((questionId: string, optionId: string) => {
		const question = test.questions.find(q => q.id === questionId)
		if (!question || question.options.length <= 1) return

		updateQuestion(questionId, {
			options: question.options.filter(opt => opt.id !== optionId)
		})
	}, [test.questions, updateQuestion])

	const toggleCorrectAnswer = useCallback((questionId: string, optionId: string) => {
		const question = test.questions.find(q => q.id === questionId)
		if (!question) return

		const option = question.options.find(opt => opt.id === optionId)
		if (!option) return

		if (question.type === 'single') {
			updateQuestion(questionId, {
				options: question.options.map(opt => ({
					...opt,
					isCorrect: opt.id === optionId
				}))
			})
		} else {
			updateOption(questionId, optionId, { isCorrect: !option.isCorrect })
		}
	}, [test.questions, updateQuestion, updateOption])


	const validateTest = useCallback(() => {
		if (!test.title.trim()) {
			toast.error('Укажите название теста')
			return false
		}

		if (test.questions.length === 0) {
			toast.error('Добавьте хотя бы один вопрос')
			return false
		}

		for (const [index, question] of test.questions.entries()) {
			if (!question.question.trim()) {
				toast.error(`Вопрос ${index + 1}: Укажите текст вопроса`)
				return false
			}

			if (question.type !== 'open') {
				if (question.options.some(opt => !opt.text.trim())) {
					toast.error(`Вопрос ${index + 1}: Все варианты ответов должны быть заполнены`)
					return false
				}

				const correctCount = question.options.filter(opt => opt.isCorrect).length
				if (correctCount === 0) {
					toast.error(`Вопрос ${index + 1}: Выберите хотя бы один правильный ответ`)
					return false
				}
			}

			// Валидация для открытых вопросов с ручной проверкой
			if (question.type === 'open') {
				if (!question.correctAnswer || !question.correctAnswer.trim()) {
					toast.error(`Вопрос ${index + 1}: Укажите правильный ответ для проверки`)
					return false
				}
			}
		}

		return true
	}, [test])

	// Ручное сохранение с валидацией
	const handleManualSave = useCallback(() => {
		const errors: string[] = []

		// Проверяем название
		if (!test.title.trim()) {
			errors.push('Укажите название теста')
		}

		// Проверяем наличие вопросов
		if (test.questions.length === 0) {
			errors.push('Добавьте хотя бы один вопрос')
		}

		// Проверяем каждый вопрос
		test.questions.forEach((question, index) => {
			const questionNum = index + 1

			// Текст вопроса
			if (!question.question.trim()) {
				errors.push(`Вопрос ${questionNum}: Укажите текст вопроса`)
			}

			// Для вопросов с вариантами
			if (question.type !== 'open') {
				// Проверяем заполненность вариантов
				if (question.options.some(opt => !opt.text.trim())) {
					errors.push(`Вопрос ${questionNum}: Заполните все варианты ответов`)
				}

				// Проверяем наличие правильного ответа
				const correctCount = question.options.filter(opt => opt.isCorrect).length
				if (correctCount === 0) {
					errors.push(`Вопрос ${questionNum}: Выберите правильный ответ`)
				}
			}

			// Для открытых вопросов с ручной проверкой
			if (question.type === 'open') {
				if (!question.correctAnswer || !question.correctAnswer.trim()) {
					errors.push(`Вопрос ${questionNum}: Укажите правильный ответ`)
				}
			}
		})

		// Если есть ошибки
		if (errors.length > 0) {
			// Помечаем все поля как "touched" чтобы показать ошибки
			const allFields = new Set(['title'])
			test.questions.forEach(q => {
				allFields.add(`question_${q.id}`)
			})
			setTouchedFields(allFields)

			// Показываем toast с ошибками
			if (errors.length === 1) {
				toast.error(errors[0])
			} else {
				toast.error(
					<div className="space-y-1">
						<div className="font-semibold">Исправьте ошибки:</div>
						<ul className="list-disc list-inside space-y-1 text-sm">
							{errors.slice(0, 5).map((error, idx) => (
								<li key={idx}>{error}</li>
							))}
							{errors.length > 5 && (
								<li>и ещё {errors.length - 5}...</li>
							)}
						</ul>
					</div>
				)
			}

			return false
		}

		// Если всё ок - сохраняем
		if (onSave) {
			onSave(test, false) // false = не тихое сохранение
			toast.success('Тест успешно сохранён!')

			// Обновляем состояние сохранения
			const savedHash = JSON.stringify(test)
			setLastSavedTestHash(savedHash)
			setIsSaved(true)

			// Уведомляем родительский компонент что изменения сохранены
			if (onUnsavedChanges) {
				onUnsavedChanges(false)
			}
		}

		return true
	}, [test, onSave, onUnsavedChanges])

	const generatePDF = useCallback(async (variantNumber?: number) => {
		if (!validateTest()) return

		const targetVariant = variantNumber || selectedVariant

		setIsGeneratingPDF(true)
		try {
			const request: PDFGenerationRequest = {
				testId: test.id,
				title: test.title,
				description: test.description,
				questions: test.questions,
				format: 'A4',
				answerType: 'squares',
				variant: targetVariant
			}

			const response = await fetch('/api/generate-test-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(request)
			})

			const result = await response.json()

			if (result.success && result.htmlContent) {
				const printWindow = window.open('', '_blank')
				if (printWindow) {
					printWindow.document.write(result.htmlContent)
					printWindow.document.close()
					printWindow.focus()

					toast.success(`PDF бланк для варианта ${targetVariant} готов!`)
				} else {
					const blob = new Blob([result.htmlContent], { type: 'text/html' })
					const url = URL.createObjectURL(blob)
					const link = document.createElement('a')
					link.href = url
					link.download = `${test.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_variant_${targetVariant}.html`
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
					URL.revokeObjectURL(url)

					toast.success(`HTML файл для варианта ${targetVariant} скачан!`)
				}
			} else {
				throw new Error(result.error || 'Ошибка генерации PDF')
			}
		} catch (error) {
			console.error('PDF generation error:', error)
			toast.error('Не удалось сгенерировать PDF')
		} finally {
			setIsGeneratingPDF(false)
		}
	}, [test, validateTest, selectedVariant])

	const getOptionLabel = (index: number) => {
		return (index + 1).toString() // 1, 2, 3, 4, ...
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Основная информация о тесте */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="space-y-6"
			>
				{/* Название и предмет */}
				<div className="space-y-4">
					<div>
						<label htmlFor="test-title" className="block text-sm font-semibold text-slate-700 mb-2">
							Название теста
						</label>
						<Input
							id="test-title"
							value={test.title}
							onChange={(e) => setTest(prev => ({
								...prev,
								title: e.target.value,
								updated_at: new Date().toISOString()
							}))}
							onBlur={() => {
								// Помечаем поле как "затронутое" только при потере фокуса
								setTouchedFields(prev => new Set(prev).add('title'))
							}}
							placeholder="Например: Контрольная работа по математике"
							variant={validationErrors.title ? 'error' : 'default'}
						/>
						{validationErrors.title && (
							<p className="text-sm text-red-600 mt-1">{validationErrors.title}</p>
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="test-subject" className="block text-sm font-semibold text-slate-700 mb-2">
								Предмет
							</label>
							<Input
								id="test-subject"
								value={test.subject || ''}
								onChange={(e) => setTest(prev => ({
									...prev,
									subject: e.target.value,
									updated_at: new Date().toISOString()
								}))}
								placeholder="Математика, Физика..."
							/>
						</div>

						<div>
							<label htmlFor="test-class" className="block text-sm font-semibold text-slate-700 mb-2">
								Класс
							</label>
							<Input
								id="test-class"
								value={test.class_level || ''}
								onChange={(e) => setTest(prev => ({
									...prev,
									class_level: e.target.value,
									updated_at: new Date().toISOString()
								}))}
								placeholder="8А, 9Б..."
							/>
						</div>
					</div>
				</div>

				{/* Список вопросов */}
				<div className="space-y-4">
					<h3 className="font-nunito font-bold text-3xl text-slate-900 mb-6">
						Вопросы
					</h3>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={test.questions.map(q => q.id)}
							strategy={verticalListSortingStrategy}
						>
							{test.questions.map((question, questionIndex) => (
								<SortableQuestionCard
									key={question.id}
									question={question}
									questionIndex={questionIndex}
									isExpanded={expandedQuestion === question.id}
									onToggleExpand={() => setExpandedQuestion(
										expandedQuestion === question.id ? null : question.id
									)}
									onUpdate={(updates) => updateQuestion(question.id, updates)}
									onDelete={() => deleteQuestion(question.id)}
									onDuplicate={() => duplicateQuestion(question.id)}
									onToggleCorrect={toggleCorrectAnswer}
									onUpdateOption={updateOption}
									onAddOption={() => addOption(question.id)}
									onRemoveOption={removeOption}
									validationErrors={validationErrors}
									getOptionLabel={getOptionLabel}
									onMarkTouched={() => {
										setTouchedFields(prev => new Set(prev).add(`question_${question.id}`))
									}}
								/>
							))}
						</SortableContext>
					</DndContext>

					{test.questions.length === 0 && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300"
						>
							<List className="w-16 h-16 text-slate-400 mb-4" />
							<h3 className="font-nunito font-bold text-xl text-slate-700 mb-2">
								Начните создание теста
							</h3>
							<p className="text-slate-600 mb-6 text-center max-w-md">
								Добавьте первый вопрос, чтобы начать работу с конструктором
							</p>
							<Button onClick={addQuestion} size="lg" className="gap-2">
								<Plus className="w-5 h-5" />
								Добавить первый вопрос
							</Button>
						</motion.div>
					)}

					{test.questions.length > 0 && (
						<div className="flex justify-center pt-4">
							<Button onClick={addQuestion} className="gap-2" size="lg" variant="outline">
								<Plus className="w-4 h-4" />
								Добавить вопрос
							</Button>
						</div>
					)}
				</div>

				{/* Spacer для нижнего бара */}
				{test.questions.length > 0 && (
					<div className="h-24" />
				)}
			</motion.div>

			{/* Нижний закрепленный бар */}
			{test.questions.length > 0 && showBottomBar && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: 'spring', damping: 25, stiffness: 300 }}
					className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50"
				>
					<div className="max-w-7xl mx-auto px-4 py-4">
						<div className="flex flex-col gap-3">
							{/* Кнопки действий - горизонтально всегда */}
							<div className="flex gap-2">
								{/* Кнопка сохранения */}
								<Button
									onClick={handleManualSave}
									disabled={isSaved}
									size="lg"
									variant="outline"
									className="flex-1 gap-2 h-12 text-sm sm:text-base border-2"
								>
									<Check className="w-4 h-4 sm:w-5 sm:h-5" />
									<span className="hidden sm:inline">{isSaved ? 'Сохранено' : 'Сохранить'}</span>
									<span className="inline sm:hidden text-xs">{isSaved ? 'Готово' : 'Сохранить'}</span>
								</Button>

								{/* Кнопка генерации PDF */}
								<Button
									onClick={() => generatePDF()}
									disabled={isGeneratingPDF || !isValid}
									size="lg"
									className="flex-1 gap-2 h-12 text-sm sm:text-base"
								>
									{isGeneratingPDF ? (
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
									) : (
										<Download className="w-4 h-4 sm:w-5 sm:h-5" />
									)}
									<span className="hidden sm:inline">
										{isGeneratingPDF ? 'Генерация PDF...' : `Скачать PDF (Вариант ${selectedVariant})`}
									</span>
									<span className="inline sm:hidden text-xs">
										{isGeneratingPDF ? 'PDF...' : 'PDF'}
									</span>
								</Button>
							</div>

							{!isValid && (
								<p className="text-sm text-orange-600 flex items-center justify-center gap-2">
									<AlertCircle className="w-4 h-4" />
									Исправьте ошибки перед скачиванием
								</p>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</div>
	)
}

// Sortable wrapper для вопроса
function SortableQuestionCard(props: QuestionCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: props.question.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<div ref={setNodeRef} style={style} className="mb-4">
			<QuestionCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
		</div>
	)
}

// Компонент выбора баллов как в Airbnb
interface PointsSelectorProps {
	value: number
	onChange: (points: number) => void
	min?: number
	max?: number
}

function PointsSelector({ value, onChange, min = 1, max = 100 }: PointsSelectorProps) {
	const handleDecrement = () => {
		if (value > min) {
			onChange(value - 1)
		}
	}

	const handleIncrement = () => {
		if (value < max) {
			onChange(value + 1)
		}
	}

	return (
		<div className="flex items-center gap-0 h-12 border-2 border-slate-200 rounded-xl overflow-hidden">
			<button
				type="button"
				onClick={handleDecrement}
				disabled={value <= min}
				className="h-full px-4 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
			>
				<Minus className="w-4 h-4 text-slate-600" />
			</button>

			<div className="flex-1 h-full flex items-center justify-center border-x-2 border-slate-200 bg-white">
				<span className="font-semibold text-slate-900 text-lg min-w-[3ch] text-center">
					{value}
				</span>
			</div>

			<button
				type="button"
				onClick={handleIncrement}
				disabled={value >= max}
				className="h-full px-4 flex items-center justify-center hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
			>
				<Plus className="w-4 h-4 text-slate-600" />
			</button>
		</div>
	)
}

// GradingModeSelector удален - теперь ИИ всегда проверяет открытые вопросы с допуском отклонений

// Компонент выбора типа вопроса
interface QuestionTypeSelectorProps {
	value: TestQuestion['type']
	onChange: (type: TestQuestion['type']) => void
}

const questionTypes: Array<{
	value: TestQuestion['type']
	label: string
	description: string
	icon: React.ReactNode
}> = [
	{
		value: 'single',
		label: 'Один ответ',
		description: 'Только один правильный вариант',
		icon: <CheckCircle2 className="w-5 h-5" />,
	},
	{
		value: 'multiple',
		label: 'Несколько ответов',
		description: 'Несколько правильных вариантов',
		icon: <Check className="w-5 h-5" />,
	},
	{
		value: 'open',
		label: 'Открытый вопрос',
		description: 'Свободный ответ студента',
		icon: <FileText className="w-5 h-5" />,
	},
]

function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
	const [isOpen, setIsOpen] = useState(false)
	const selected = questionTypes.find(t => t.value === value) || questionTypes[0]

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full h-12 px-4 flex items-center justify-between bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div className="text-slate-600">{selected.icon}</div>
					<span className="font-medium text-slate-900">{selected.label}</span>
				</div>
				<ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
			</button>

			<AnimatePresence>
				{isOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40"
							onClick={() => setIsOpen(false)}
						/>
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.15 }}
							className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl overflow-hidden z-50"
						>
							{questionTypes.map((type) => (
								<button
									key={type.value}
									type="button"
									onClick={() => {
										onChange(type.value)
										setIsOpen(false)
									}}
									className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
										type.value === value ? 'bg-blue-50' : ''
									}`}
								>
									<div className={`mt-0.5 ${type.value === value ? 'text-blue-600' : 'text-slate-600'}`}>
										{type.icon}
									</div>
									<div className="flex-1 text-left">
										<div className={`font-semibold ${type.value === value ? 'text-blue-600' : 'text-slate-900'}`}>
											{type.label}
										</div>
										<div className="text-xs text-slate-600 mt-0.5">
											{type.description}
										</div>
									</div>
									{type.value === value && (
										<Check className="w-5 h-5 text-blue-600 mt-0.5" />
									)}
								</button>
							))}
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	)
}

// Компонент карточки вопроса
interface QuestionCardProps {
	question: TestQuestion
	questionIndex: number
	isExpanded: boolean
	onToggleExpand: () => void
	onUpdate: (updates: Partial<TestQuestion>) => void
	onDelete: () => void
	onDuplicate: () => void
	onToggleCorrect: (questionId: string, optionId: string) => void
	onUpdateOption: (questionId: string, optionId: string, updates: Partial<TestOption>) => void
	onAddOption: () => void
	onRemoveOption: (questionId: string, optionId: string) => void
	validationErrors: Record<string, string>
	getOptionLabel: (index: number) => string
	dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
	onMarkTouched: () => void
}

function QuestionCard({
	question,
	questionIndex,
	isExpanded,
	onToggleExpand,
	onUpdate,
	onDelete,
	onDuplicate,
	onToggleCorrect,
	onUpdateOption,
	onAddOption,
	onRemoveOption,
	validationErrors,
	getOptionLabel,
	dragHandleProps,
	onMarkTouched,
}: QuestionCardProps) {
	const hasError = Object.keys(validationErrors).some(key => key.startsWith(`q${questionIndex}_`))

	return (
		<div
			className={`bg-white rounded-2xl border-2 transition-all ${
				hasError ? 'border-red-400' : 'border-slate-200'
			} ${isExpanded ? 'shadow-lg' : 'hover:border-slate-300'}`}
		>
			{/* Заголовок вопроса */}
			<div className="p-4 sm:p-6 select-none">
				{/* Mobile layout */}
				<div className="sm:hidden">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
								<GripVertical className="w-5 h-5 text-slate-400" />
							</div>
							<span className="text-slate-900 font-bold text-base whitespace-nowrap">
								Задание {questionIndex + 1}
							</span>
						</div>
						<div className="flex items-center gap-2">
							{hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
							<motion.div
								animate={{ rotate: isExpanded ? 180 : 0 }}
								transition={{ duration: 0.2 }}
								onClick={onToggleExpand}
								className="cursor-pointer"
							>
								<Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
							</motion.div>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 pl-7">
						<span className="px-2.5 py-1 bg-slate-100 rounded-full font-medium whitespace-nowrap">
							{question.type === 'single' ? 'Один ответ' : question.type === 'multiple' ? 'Несколько ответов' : 'Открытый'}
						</span>
						<span className="font-medium whitespace-nowrap">{question.points || 1} балл</span>
					</div>
				</div>

				{/* Desktop layout */}
				<div className="hidden sm:flex items-center gap-4">
					<div className="flex items-center gap-3 flex-shrink-0">
						<div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
							<GripVertical className="w-5 h-5 text-slate-400" />
						</div>
						<span className="text-slate-900 font-bold text-lg whitespace-nowrap">
							Задание {questionIndex + 1}
						</span>
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
							<span className="px-3 py-1.5 bg-slate-100 rounded-full font-medium whitespace-nowrap">
								{question.type === 'single' ? 'Один ответ' : question.type === 'multiple' ? 'Несколько ответов' : 'Открытый'}
							</span>
							<span className="font-medium whitespace-nowrap">{question.points || 1} балл</span>
							{question.hideOptionsInPDF && (
								<span className="text-orange-600 font-medium whitespace-nowrap">Без вариантов в PDF</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2 flex-shrink-0">
						{hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
						<motion.div
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={{ duration: 0.2 }}
							onClick={onToggleExpand}
							className="cursor-pointer"
						>
							<Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
						</motion.div>
					</div>
				</div>
			</div>

			{/* Развёрнутое содержимое */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="px-6 pb-6 space-y-6 border-t border-slate-100 pt-6">
							{/* Текст вопроса */}
							<div>
								<label className="block text-sm font-semibold text-slate-700 mb-2">
									Текст вопроса
								</label>
								<Textarea
									value={question.question}
									onChange={(e) => onUpdate({ question: e.target.value })}
									onBlur={onMarkTouched}
									placeholder="Введите текст вопроса"
									className={`min-h-[100px] resize-none ${validationErrors[`q${questionIndex}_text`] ? 'border-red-400 bg-red-50' : ''}`}
									rows={3}
								/>
							</div>

							{/* Настройки вопроса */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">
										Тип вопроса
									</label>
									<QuestionTypeSelector
										value={question.type}
										onChange={(type) => onUpdate({ type })}
									/>
								</div>

								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">
										Баллы
									</label>
									<PointsSelector
										value={question.points || 1}
										onChange={(points) => onUpdate({ points })}
										min={1}
										max={100}
									/>
								</div>
							</div>

							{/* Дополнительные опции - только для вопросов с вариантами */}
							{question.type !== 'open' && (
								<div className="space-y-3 bg-slate-50 rounded-xl p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="font-semibold text-sm text-slate-800">
												Скрыть варианты в PDF
											</p>
											<p className="text-xs text-slate-600 mt-1">
												В PDF будет только вопрос, без вариантов ответа
											</p>
										</div>
										<Switch
											checked={question.hideOptionsInPDF || false}
											onCheckedChange={(checked) => onUpdate({ hideOptionsInPDF: checked })}
										/>
									</div>
								</div>
							)}

							{/* Режим проверки для открытых вопросов */}
							{question.type === 'open' && (
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-semibold text-slate-700 mb-2">
											Правильный ответ
										</label>
										<Textarea
											value={question.correctAnswer || ''}
											onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
											onBlur={onMarkTouched}
											placeholder="Введите правильный ответ для сравнения..."
											className={`min-h-[80px] resize-none ${validationErrors[`q${questionIndex}_answer`] ? 'border-red-400 bg-red-50' : ''}`}
											rows={2}
										/>
										{validationErrors[`q${questionIndex}_answer`] && (
											<p className="text-sm text-red-600 mt-1">
												{validationErrors[`q${questionIndex}_answer`]}
											</p>
										)}
									</div>

									{/* Информация о проверке ИИ */}
									<div className="flex items-start gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
										<AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
										<div>
											<p className="font-semibold text-sm text-blue-900 mb-1">
												Проверка с помощью ИИ
											</p>
											<p className="text-xs text-blue-800 leading-relaxed">
												ИИ сравнит ответ ученика с вашим эталоном, допуская небольшие отклонения в формулировке, орфографии и полноте ответа.
											</p>
										</div>
									</div>
								</div>
							)}

							{/* Варианты ответов */}
							{question.type !== 'open' && (
								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-3">
										Варианты ответов
									</label>
									<div className="space-y-2">
										{question.options.map((option, optionIndex) => (
											<motion.div
												key={option.id}
												layout
												className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
													option.isCorrect
														? 'border-green-400 bg-green-50'
														: 'border-slate-200 bg-slate-50'
												}`}
											>
												<button
													type="button"
													onClick={() => onToggleCorrect(question.id, option.id)}
													className="flex-shrink-0 transition-transform hover:scale-110"
												>
													{option.isCorrect ? (
														<CheckCircle2 className="w-6 h-6 text-green-600" />
													) : (
														<Circle className="w-6 h-6 text-slate-400" />
													)}
												</button>

												<span className="w-8 text-sm font-bold text-slate-700 flex-shrink-0">
													{getOptionLabel(optionIndex)}
												</span>

												<Input
													value={option.text}
													onChange={(e) => onUpdateOption(question.id, option.id, { text: e.target.value })}
													placeholder={`Вариант ${getOptionLabel(optionIndex)}`}
													className={`flex-1 border-0 ${option.isCorrect ? 'bg-white' : 'bg-white'}`}
												/>

												{question.options.length > 1 && (
													<button
														onClick={() => onRemoveOption(question.id, option.id)}
														className="flex-shrink-0 p-2 rounded-lg hover:bg-red-100 transition-colors"
													>
														<Trash2 className="w-4 h-4 text-red-600" />
													</button>
												)}
											</motion.div>
										))}
									</div>

									{question.options.length < 6 && (
										<Button
											onClick={onAddOption}
											variant="outline"
											size="sm"
											className="w-full mt-3 border-dashed"
										>
											<Plus className="w-4 h-4 mr-2" />
											Добавить вариант
										</Button>
									)}
								</div>
							)}

							{/* Действия с вопросом */}
							<div className="flex items-center gap-2 pt-4 border-t border-slate-100">
								<Button
									onClick={onDuplicate}
									variant="outline"
									size="sm"
									className="gap-2"
								>
									<Copy className="w-4 h-4" />
									Дублировать
								</Button>

								<div className="flex-1" />

								<Button
									onClick={onDelete}
									variant="ghost"
									size="sm"
									className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
								>
									<Trash2 className="w-4 h-4" />
									Удалить вопрос
								</Button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
