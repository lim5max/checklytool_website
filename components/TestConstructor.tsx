'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Plus,
	Trash2,
	Download,
	CheckCircle2,
	Circle,
	GripVertical,
	Eye,
	Save,
	AlertCircle,
	Copy,
	FileText,
	List,
} from 'lucide-react'
import type { TestQuestion, TestOption, GeneratedTest, PDFGenerationRequest, TestVariant } from '@/types/check'

interface TestConstructorProps {
	initialTest?: GeneratedTest
	onSave?: (test: GeneratedTest) => void
	className?: string
}

export default function TestConstructor({
	initialTest,
	onSave,
	className = ''
}: TestConstructorProps) {
	const [test, setTest] = useState<GeneratedTest>(
		initialTest || {
			id: `test_${Date.now()}`,
			title: '',
			description: '',
			subject: '',
			questions: [],
			variants: [{ id: 'var_1', variantNumber: 1 }],
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	)

	const [selectedVariant, setSelectedVariant] = useState(1)
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
	const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

	// Автосохранение с debounce
	useEffect(() => {
		if (!initialTest) return // Не автосохраняем новые тесты

		setAutoSaveStatus('unsaved')
		const timer = setTimeout(() => {
			if (onSave && test.questions.length > 0) {
				setAutoSaveStatus('saving')
				onSave(test)
				setTimeout(() => setAutoSaveStatus('saved'), 500)
			}
		}, 2000)

		return () => clearTimeout(timer)
	}, [test, onSave, initialTest])

	// Валидация в реальном времени
	const validationErrors = useMemo(() => {
		const errors: Record<string, string> = {}

		if (!test.title.trim()) {
			errors.title = 'Укажите название теста'
		}

		test.questions.forEach((q, idx) => {
			if (!q.question.trim()) {
				errors[`q${idx}_text`] = 'Укажите текст вопроса'
			}

			if (q.type !== 'open') {
				if (q.options.some(opt => !opt.text.trim())) {
					errors[`q${idx}_options`] = 'Заполните все варианты'
				}

				const correctCount = q.options.filter(opt => opt.isCorrect).length
				if (correctCount === 0) {
					errors[`q${idx}_correct`] = 'Выберите правильный ответ'
				}
			}
		})

		return errors
	}, [test])

	const isValid = Object.keys(validationErrors).length === 0 && test.questions.length > 0

	const addQuestion = useCallback(() => {
		const newQuestion: TestQuestion = {
			id: `q_${Date.now()}`,
			question: '',
			type: 'single',
			options: [
				{ id: `opt_${Date.now()}_1`, text: '', isCorrect: false },
				{ id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
				{ id: `opt_${Date.now()}_3`, text: '', isCorrect: false },
				{ id: `opt_${Date.now()}_4`, text: '', isCorrect: false }
			],
			explanation: '',
			strictMatch: false,
			hideOptionsInPDF: false,
			points: 1
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
		if (!question || question.options.length <= 2) return

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

	const addVariant = useCallback(() => {
		const nextNumber = (test.variants?.length || 0) + 1
		const newVariant: TestVariant = {
			id: `var_${nextNumber}`,
			variantNumber: nextNumber
		}

		setTest(prev => ({
			...prev,
			variants: [...(prev.variants || []), newVariant],
			updated_at: new Date().toISOString()
		}))

		toast.success(`Вариант ${nextNumber} добавлен`)
	}, [test.variants])

	const removeVariant = useCallback((variantId: string) => {
		if ((test.variants?.length || 0) <= 1) {
			toast.error('Должен остаться хотя бы один вариант')
			return
		}

		setTest(prev => ({
			...prev,
			variants: prev.variants?.filter(v => v.id !== variantId) || [],
			updated_at: new Date().toISOString()
		}))

		toast.success('Вариант удалён')
	}, [test.variants])

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
		}

		return true
	}, [test])

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

	const handleSave = useCallback(async () => {
		if (!validateTest()) return
		if (isSaving) return

		if (onSave) {
			setIsSaving(true)
			try {
				await onSave(test)
				toast.success('Тест сохранён!')
			} catch (error) {
				console.error('Save error:', error)
				toast.error('Не удалось сохранить тест')
			} finally {
				setIsSaving(false)
			}
		}
	}, [test, validateTest, onSave, isSaving])

	const getOptionLabel = (index: number) => {
		return String.fromCharCode(65 + index) // A, B, C, D, ...
	}

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Sticky Header с статусом сохранения */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 -mx-4 px-4 py-4"
			>
				<div className="flex items-center justify-between max-w-5xl mx-auto">
					<div className="flex items-center gap-3">
						<FileText className="w-6 h-6 text-blue-600" />
						<div>
							<h2 className="font-nunito font-black text-lg text-slate-900">
								{test.title || 'Новый тест'}
							</h2>
							<div className="flex items-center gap-2 text-xs text-slate-500">
								<span>{test.questions.length} вопросов</span>
								{autoSaveStatus === 'saved' && initialTest && (
									<span className="flex items-center gap-1 text-green-600">
										<CheckCircle2 className="w-3 h-3" />
										Сохранено
									</span>
								)}
								{autoSaveStatus === 'saving' && (
									<span className="flex items-center gap-1 text-blue-600">
										<div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
										Сохранение...
									</span>
								)}
								{autoSaveStatus === 'unsaved' && initialTest && (
									<span className="flex items-center gap-1 text-orange-600">
										<AlertCircle className="w-3 h-3" />
										Есть изменения
									</span>
								)}
							</div>
						</div>
					</div>

					{isValid ? (
						<div className="flex items-center gap-1 text-green-600 text-sm font-medium">
							<CheckCircle2 className="w-4 h-4" />
							Готово к публикации
						</div>
					) : (
						<div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
							<AlertCircle className="w-4 h-4" />
							{Object.keys(validationErrors).length} проблем
						</div>
					)}
				</div>
			</motion.div>

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
							placeholder="Например: Контрольная работа по математике"
							className={`h-14 text-lg font-medium ${validationErrors.title ? 'border-red-400 bg-red-50' : ''}`}
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
								className="h-12"
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
								className="h-12"
							/>
						</div>
					</div>

					<div>
						<label htmlFor="test-description" className="block text-sm font-semibold text-slate-700 mb-2">
							Описание (необязательно)
						</label>
						<Textarea
							id="test-description"
							value={test.description || ''}
							onChange={(e) => setTest(prev => ({
								...prev,
								description: e.target.value,
								updated_at: new Date().toISOString()
							}))}
							placeholder="Краткое описание теста"
							rows={2}
							className="resize-none"
						/>
					</div>
				</div>

				{/* Управление вариантами */}
				<div className="bg-slate-50 rounded-2xl p-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h3 className="font-nunito font-bold text-lg text-slate-900">Варианты теста</h3>
							<p className="text-sm text-slate-600 mt-1">
								Создавайте разные варианты для разных групп учащихся
							</p>
						</div>
						<Button onClick={addVariant} variant="outline" size="sm" className="gap-2">
							<Plus className="w-4 h-4" />
							Добавить вариант
						</Button>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						{test.variants?.map((variant) => (
							<motion.div
								key={variant.id}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								className={`relative group p-4 rounded-xl border-2 transition-all cursor-pointer ${
									selectedVariant === variant.variantNumber
										? 'border-blue-500 bg-blue-50'
										: 'border-slate-200 bg-white hover:border-slate-300'
								}`}
								onClick={() => setSelectedVariant(variant.variantNumber)}
							>
								<div className="text-center">
									<div className="font-bold text-2xl text-slate-800">
										{variant.variantNumber}
									</div>
									<div className="text-xs text-slate-600 mt-1">
										Вариант
									</div>
								</div>

								{(test.variants?.length || 0) > 1 && (
									<button
										onClick={(e) => {
											e.stopPropagation()
											removeVariant(variant.id)
										}}
										className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-100"
									>
										<Trash2 className="w-3 h-3 text-red-600" />
									</button>
								)}
							</motion.div>
						))}
					</div>
				</div>

				{/* Список вопросов */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="font-nunito font-bold text-xl text-slate-900">
							Вопросы
						</h3>
						<Button onClick={addQuestion} className="gap-2">
							<Plus className="w-4 h-4" />
							Добавить вопрос
						</Button>
					</div>

					<AnimatePresence mode="popLayout">
						{test.questions.map((question, questionIndex) => (
							<QuestionCard
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
							/>
						))}
					</AnimatePresence>

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
				</div>

				{/* Действия */}
				{test.questions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="sticky bottom-4 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-slate-200 p-6 shadow-lg"
					>
						<div className="flex flex-col sm:flex-row gap-3">
							<Button
								onClick={() => generatePDF()}
								disabled={isGeneratingPDF || !isValid}
								size="lg"
								className="flex-1 gap-2"
							>
								{isGeneratingPDF ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<Download className="w-4 h-4" />
								)}
								{isGeneratingPDF ? 'Генерация PDF...' : `Скачать PDF (Вариант ${selectedVariant})`}
							</Button>

							{onSave && (
								<Button
									variant="outline"
									onClick={handleSave}
									disabled={isSaving || !isValid}
									size="lg"
									className="gap-2"
								>
									{isSaving ? (
										<div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
									) : (
										<Save className="w-4 h-4" />
									)}
									{isSaving ? 'Сохранение...' : 'Сохранить тест'}
								</Button>
							)}
						</div>

						{!isValid && (
							<p className="text-sm text-orange-600 mt-3 flex items-center gap-2">
								<AlertCircle className="w-4 h-4" />
								Исправьте ошибки перед сохранением
							</p>
						)}
					</motion.div>
				)}
			</motion.div>
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
}: QuestionCardProps) {
	const hasError = Object.keys(validationErrors).some(key => key.startsWith(`q${questionIndex}_`))

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			className={`bg-white rounded-2xl border-2 transition-all ${
				hasError ? 'border-red-400' : 'border-slate-200'
			} ${isExpanded ? 'shadow-lg' : 'hover:border-slate-300'}`}
		>
			{/* Заголовок вопроса */}
			<div
				className="p-6 cursor-pointer select-none"
				onClick={onToggleExpand}
			>
				<div className="flex items-start gap-4">
					<div className="flex items-center gap-3">
						<GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
						<div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
							{questionIndex + 1}
						</div>
					</div>

					<div className="flex-1 min-w-0">
						<p className="font-medium text-slate-900 truncate">
							{question.question || <span className="text-slate-400">Новый вопрос...</span>}
						</p>
						<div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
							<span className="px-2 py-1 bg-slate-100 rounded-full">
								{question.type === 'single' ? 'Один ответ' : question.type === 'multiple' ? 'Несколько ответов' : 'Открытый'}
							</span>
							<span>{question.points || 1} балл</span>
							{question.hideOptionsInPDF && (
								<span className="text-orange-600">Без вариантов в PDF</span>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						{hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
						<motion.div
							animate={{ rotate: isExpanded ? 180 : 0 }}
							transition={{ duration: 0.2 }}
						>
							<Eye className="w-5 h-5 text-slate-400" />
						</motion.div>
					</div>
				</div>
			</div>

			{/* Развёрнутое содержимое */}
			<AnimatePresence>
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
									<select
										value={question.type}
										onChange={(e) => onUpdate({ type: e.target.value as TestQuestion['type'] })}
										className="w-full h-12 rounded-xl border border-slate-200 px-4 bg-white"
									>
										<option value="single">Один ответ</option>
										<option value="multiple">Несколько ответов</option>
										<option value="open">Открытый вопрос</option>
									</select>
								</div>

								<div>
									<label className="block text-sm font-semibold text-slate-700 mb-2">
										Баллы
									</label>
									<Input
										type="number"
										min="1"
										max="100"
										value={question.points || 1}
										onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
										className="h-12"
									/>
								</div>
							</div>

							{/* Дополнительные опции */}
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

								{question.type === 'open' && (
									<div className="flex items-center justify-between pt-3 border-t border-slate-200">
										<div>
											<p className="font-semibold text-sm text-slate-800">
												Точное совпадение
											</p>
											<p className="text-xs text-slate-600 mt-1">
												Требовать точное совпадение ответа при проверке
											</p>
										</div>
										<Switch
											checked={question.strictMatch || false}
											onCheckedChange={(checked) => onUpdate({ strictMatch: checked })}
										/>
									</div>
								)}
							</div>

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

												{question.options.length > 2 && (
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
		</motion.div>
	)
}
