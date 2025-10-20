import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { analyzeWithRetry, calculateGrade, calculateEssayGrade } from '@/lib/openrouter'
import { deductCheckCredits } from '@/lib/subscription'
import { withErrorHandler, ValidationError, DatabaseError, type ApiHandler } from '@/lib/api/error-handler'
import { submissionIdSchema } from '@/lib/validations/api'

// Увеличиваем таймаут до 60 секунд для обработки больших изображений
export const maxDuration = 60

interface RouteParams {
	params: Promise<{ id: string }>
}

/**
 * Нормализует ответ: убирает лишние пробелы, обрамляющие кавычки и экранирование
 * @param answer - исходный ответ
 * @returns нормализованный ответ
 */
function normalizeAnswer(answer: string): string {
	let normalized = answer.trim()

	// Убираем обрамляющие кавычки (одинарные или двойные)
	// Проверяем оба конца строки на наличие кавычек
	while ((normalized.startsWith("'") && normalized.endsWith("'")) ||
	       (normalized.startsWith('"') && normalized.endsWith('"'))) {
		normalized = normalized.slice(1, -1).trim()
	}

	// Убираем экранированные кавычки внутри строки
	normalized = normalized.replace(/\\["']/g, '')

	return normalized
}

/**
 * Умная функция сравнения ответов - поддерживает разные форматы выбора вариантов
 * @param studentAnswer - ответ студента
 * @param correctAnswer - правильный ответ
 * @param strictMatch - требовать точное совпадение (учитывать регистр и пунктуацию)
 */
function compareAnswers(studentAnswer: string, correctAnswer: string, strictMatch: boolean = false): boolean {
	// Нормализуем ответы (убираем кавычки и лишние пробелы)
	const normalizedStudent = normalizeAnswer(studentAnswer)
	const normalizedCorrect = normalizeAnswer(correctAnswer)
	// Для строгого режима - точное совпадение с учетом регистра и пунктуации
	if (strictMatch) {
		return normalizedStudent === normalizedCorrect
	}

	// Нестрогий режим (по умолчанию)
	const student = normalizedStudent.toLowerCase().trim()
	const correct = normalizedCorrect.toLowerCase().trim()

	// 1. Прямое сравнение
	if (student === correct) {
		return true
	}

	// 2. Извлечение номера варианта из ответа типа "1) Принтер"
	const studentNumberMatch = student.match(/^(\d+)[).]?\s*(.*)$/)
	const correctNumberMatch = correct.match(/^(\d+)[).]?\s*(.*)$/)

	// Если правильный ответ это просто цифра, а студент указал "цифра) текст"
	if (/^\d+$/.test(correct) && studentNumberMatch) {
		return studentNumberMatch[1] === correct
	}

	// Если оба ответа содержат номера вариантов
	if (studentNumberMatch && correctNumberMatch) {
		return studentNumberMatch[1] === correctNumberMatch[1]
	}

	// 3. Сравнение только текстовой части (убираем номера)
	const studentText = student.replace(/^\d+[).]?\s*/, '').trim()
	const correctText = correct.replace(/^\d+[).]?\s*/, '').trim()

	if (studentText && correctText && studentText === correctText) {
		return true
	}

	// 4. Сравнение с учетом вариаций пунктуации и пробелов
	const normalizeText = (text: string) => {
		return text
			.replace(/[()\[\].,;:!?]/g, '') // убираем пунктуацию
			.replace(/\s+/g, ' ') // нормализуем пробелы
			.trim()
	}

	return normalizeText(student) === normalizeText(correct)
}

/**
 * Умная проверка открытых вопросов с двухэтапным подходом
 * Определяет тип ответа и применяет соответствующую логику сравнения
 */
function smartCompareOpenAnswer(studentAnswer: string, correctAnswer: string): boolean {
	// Нормализуем ответы перед сравнением
	const student = normalizeAnswer(studentAnswer)
	const correct = normalizeAnswer(correctAnswer)

	// ЭТАП 1: Определение типа ответа
	const isNumeric = (text: string) => /^-?[\d.,\s]+$/.test(text.replace(/[<>=≤≥]/g, ''))
	const hasComparisonSign = (text: string) => /[<>=≤≥]/.test(text)
	const isFormula = (text: string) => /[a-zA-Zа-яА-Я]+[\d]*|[+\-*/^()=]/.test(text) && text.length < 50

	// Определяем тип эталонного ответа
	let answerType: 'numeric' | 'comparison' | 'formula' | 'text'
	if (hasComparisonSign(correct)) {
		answerType = 'comparison'
	} else if (isNumeric(correct)) {
		answerType = 'numeric'
	} else if (isFormula(correct)) {
		answerType = 'formula'
	} else {
		answerType = 'text'
	}

	// ЭТАП 2: Контекстная проверка
	if (answerType === 'numeric') {
		// Для чисел: нормализуем и сравниваем
		const normalizeNumber = (text: string) => text.replace(/\s/g, '').replace(/,/g, '.')
		return normalizeNumber(student) === normalizeNumber(correct)
	}

	if (answerType === 'comparison') {
		// Для сравнений: проверяем, что знаки и числа совпадают
		const normalizeComparison = (text: string) => {
			return text
				.replace(/\s/g, '') // убираем пробелы
				.replace(/,/g, '.') // запятые -> точки
				.toLowerCase()
		}

		const studentNorm = normalizeComparison(student)
		const correctNorm = normalizeComparison(correct)

		// ВАЖНО: для сравнений знаки минусов критичны!
		// Проверяем, что у эталона есть минусы, а у ученика нет - это ошибка
		const correctHasMinus = /-\d/.test(correctNorm)
		const studentHasMinus = /-\d/.test(studentNorm)

		if (correctHasMinus && !studentHasMinus) {
			// Эталон с минусами, а ответ без - неверно
			return false
		}

		return studentNorm === correctNorm
	}

	if (answerType === 'formula') {
		// Для формул: простое сравнение с нормализацией пробелов
		const normalizeFormula = (text: string) => text.replace(/\s/g, '').toLowerCase()
		return normalizeFormula(student) === normalizeFormula(correct)
	}

	// answerType === 'text'
	// Для текстов: проверяем наличие ключевых понятий из эталона
	const correctLower = correct.toLowerCase()
	const studentLower = student.toLowerCase()

	// Извлекаем ключевые слова (слова длиннее 3 символов)
	const extractKeywords = (text: string) => {
		return text
			.split(/[\s,.:;!?()]+/)
			.filter(word => word.length > 3)
			.map(word => word.toLowerCase())
	}

	const correctKeywords = extractKeywords(correctLower)
	const studentKeywords = extractKeywords(studentLower)

	// Проверяем, что хотя бы 50% ключевых слов из эталона присутствуют в ответе
	const matchedKeywords = correctKeywords.filter(keyword =>
		studentKeywords.some(sw => sw.includes(keyword) || keyword.includes(sw))
	)

	const matchPercentage = correctKeywords.length > 0
		? matchedKeywords.length / correctKeywords.length
		: 0

	// Если ответ слишком короткий (< 30% длины эталона) - скорее всего поверхностный
	const lengthRatio = studentLower.length / correctLower.length
	if (lengthRatio < 0.3) {
		return false
	}

	// Если совпало >= 50% ключевых слов - считаем правильным
	return matchPercentage >= 0.5
}

// POST /api/submissions/[id]/evaluate - Evaluate submission using AI
const postHandler = async (
	request: NextRequest,
	context: { params: Promise<Record<string, string>> }
) => {
	console.log('[EVALUATE] Starting evaluation request...')
	const resolvedParams = await context.params

	// Validate submission ID
	const validation = submissionIdSchema.safeParse(resolvedParams)
	if (!validation.success) {
		throw new ValidationError('Invalid submission ID')
	}

	const submissionId = validation.data.id
	console.log('[EVALUATE] Submission ID:', submissionId)

		const { supabase, userId } = await getAuthenticatedSupabase()
		console.log('[EVALUATE] Authentication successful, userId:', userId)

		// Get submission with check details
		const { data: submission, error: submissionError } = await supabase
			.from('student_submissions')
			.select(`
				*,
				checks!inner (
					*,
					check_variants (id, variant_number, reference_answers, reference_image_urls),
					grading_criteria (*),
					essay_grading_criteria (*)
				)
			`)
			.eq('id', submissionId)
			.eq('checks.user_id', userId)
			.single()

		if (submissionError || !submission) {
			return NextResponse.json(
				{ error: 'Submission not found' },
				{ status: 404 }
			)
		}

		const submissionData = submission as {
			id: string
			status: string
			submission_images: string[]
			student_name?: string
			checks: {
				id: string
				variant_count: number
				check_type?: string
				test_id?: string
				check_variants: Array<{
					id: string
					variant_number: number
					reference_answers?: Record<string, string>
					reference_image_urls?: string[]
				}>
				grading_criteria: Array<{
					grade: number
					min_percentage: number
				}>
				essay_grading_criteria?: Array<{
					grade: number
					title: string
					description: string
				}>
			}
		}
		const checkData = submissionData.checks

		// Check if already being processed or completed
		if (submissionData.status === 'processing') {
			return NextResponse.json(
				{ error: 'Submission is already being processed' },
				{ status: 409 }
			)
		}

		if (submissionData.status === 'completed') {
			return NextResponse.json(
				{ error: 'Submission already evaluated' },
				{ status: 409 }
			)
		}

		// Deduct credits before processing
		const pagesCount = submissionData.submission_images.length
		const deductResult = await deductCheckCredits({
			userId,
			checkId: checkData.id,
			submissionId,
			checkType: (checkData.check_type || 'test') as 'test' | 'essay',
			pagesCount,
		})

		if (!deductResult.success) {
			console.log('[EVALUATE] Insufficient credits:', deductResult)
			return NextResponse.json(
				{
					error: 'insufficient_credits',
					message: 'Недостаточно проверок на балансе',
					required: deductResult.required,
					available: deductResult.available,
				},
				{ status: 402 }
			)
		}

		console.log('[EVALUATE] Credits deducted:', deductResult.creditsDeducted, 'New balance:', deductResult.newBalance)

		// Update status to processing
		const updateResult = await supabase
			.from('student_submissions')
			.update({
				status: 'processing',
				processing_started_at: new Date().toISOString()
			})
			.eq('id', submissionId)

		if (updateResult.error) {
			throw new DatabaseError('Failed to update submission status', updateResult.error)
		}

		try {
			// Refresh signed URLs for submission images before AI analysis
			const refreshedImageUrls: string[] = []

			for (const imageUrl of submissionData.submission_images) {
				// Extract file path from existing URL
				let filePath: string

				if (imageUrl.includes('/storage/v1/object/sign/')) {
					// Already a signed URL, extract path
					const urlParts = imageUrl.split('/storage/v1/object/sign/checks/')
					filePath = urlParts[1]?.split('?')[0] || ''
				} else if (imageUrl.includes('/storage/v1/object/public/')) {
					// Public URL, extract path
					const urlParts = imageUrl.split('/storage/v1/object/public/checks/')
					filePath = urlParts[1] || ''
				} else {
					console.warn('Unknown URL format, keeping original:', imageUrl)
					refreshedImageUrls.push(imageUrl)
					continue
				}

				if (filePath) {
					// Create fresh signed URL
					const { data: urlData, error: signError } = await supabase.storage
						.from('checks')
						.createSignedUrl(filePath, 86400) // 24 hours

					if (signError) {
						console.error('Error creating signed URL:', signError)
						refreshedImageUrls.push(imageUrl) // Keep original
					} else {
						refreshedImageUrls.push(urlData.signedUrl)
					}
				} else {
					refreshedImageUrls.push(imageUrl)
				}
			}

			// Update submission with fresh URLs
			await supabase
				.from('student_submissions')
				.update({ submission_images: refreshedImageUrls })
				.eq('id', submissionId)

			// Prepare reference data with fresh signed URLs for reference images too
			const variants = checkData.check_variants || []
			const referenceAnswers = variants.length > 0 ? variants[0].reference_answers : null
			let referenceImages = variants.length > 0 ? variants[0].reference_image_urls : null

			// Refresh reference image URLs if they exist
			if (referenceImages && referenceImages.length > 0) {
				const refreshedRefImages: string[] = []
				for (const refImageUrl of referenceImages) {
					let filePath: string

					if (refImageUrl.includes('/storage/v1/object/sign/')) {
						const urlParts = refImageUrl.split('/storage/v1/object/sign/checks/')
						filePath = urlParts[1]?.split('?')[0] || ''
					} else if (refImageUrl.includes('/storage/v1/object/public/')) {
						const urlParts = refImageUrl.split('/storage/v1/object/public/checks/')
						filePath = urlParts[1] || ''
					} else {
						refreshedRefImages.push(refImageUrl)
						continue
					}

					if (filePath) {
						const { data: urlData, error: signError } = await supabase.storage
							.from('checks')
							.createSignedUrl(filePath, 86400)

						if (!signError) {
							refreshedRefImages.push(urlData.signedUrl)
						} else {
							refreshedRefImages.push(refImageUrl)
						}
					} else {
						refreshedRefImages.push(refImageUrl)
					}
				}
				referenceImages = refreshedRefImages
			}

			console.log('Starting AI analysis for submission:', submissionId)
			console.log('Reference answers available:', !!referenceAnswers)
			console.log('Reference images available:', !!referenceImages)
			console.log('Fresh signed URLs created for', refreshedImageUrls.length, 'submission images')
			console.log('Image URLs being sent to AI:', refreshedImageUrls.map((url, i) => `Image ${i+1}: ${url.substring(0, 100)}...`).join('\n'))

			// Call OpenRouter API with retry mechanism using refreshed URLs
			const aiResult = await analyzeWithRetry(
				refreshedImageUrls,
				referenceAnswers || null,
				referenceImages || null,
				checkData.variant_count,
				3, // maxRetries
				(checkData.check_type || 'test') as 'test' | 'essay',
				checkData.essay_grading_criteria || undefined
			)

			console.log('AI analysis completed:', aiResult)

			// Проверяем, не обнаружил ли AI неподходящий контент
			if (aiResult.error === 'inappropriate_content') {
				console.log('[EVALUATE] Inappropriate content detected by AI')

				// Обновляем статус submission как failed
				const updateData = {
					status: 'failed',
					processing_completed_at: new Date().toISOString(),
					error_message: aiResult.error_message || 'Загружены неподходящие изображения',
					error_details: JSON.parse(JSON.stringify({
						error_type: 'inappropriate_content',
						content_type_detected: aiResult.content_type_detected,
						ai_response: aiResult
					}))
				}

				console.log('[EVALUATE] Updating submission with failed status')

				await supabase
					.from('student_submissions')
					.update(updateData)
					.eq('id', submissionId)

				return NextResponse.json(
					{
						error: 'inappropriate_content',
						message: aiResult.error_message || 'Загружены неподходящие изображения',
						details: {
							content_type: aiResult.content_type_detected,
							help: 'Пожалуйста, сфотографируйте именно работу ученика - тетрадь, листы с решениями, письменные ответы.'
						},
						submission_id: submissionId
					},
					{ status: 400 } // 400 Bad Request для неподходящего контента
				)
			}

			// Проверяем наличие обязательных полей для успешного анализа
			if (!aiResult.answers || !aiResult.total_questions) {
				throw new Error('AI analysis incomplete - missing answers or total_questions')
			}

			// Determine which variant to use for correct answers
			const detectedVariant = aiResult.variant_detected || 1
			console.log('Detected variant:', detectedVariant, 'Available variants:', checkData.check_variants.length)

			// Get correct answers - different logic based on check.test_id
			let correctAnswersMap: Record<string, string> = {}

			// ПРИОРИТЕТ 1: Если check связан с generated_test - загружаем оттуда
			if (checkData.test_id) {
				console.log('[EVALUATE] Check has test_id, loading answers from generated_tests:', checkData.test_id)

				// Load test from generated_tests table by exact ID
				const { data: generatedTest, error: testError } = await supabase
					.from('generated_tests')
					.select('questions')
					.eq('id', checkData.test_id)
					.single()

				if (testError) {
					console.error('Error loading generated test:', testError)
					throw new Error(`Не удалось найти тест с ID ${checkData.test_id}`)
				}

				if (generatedTest && generatedTest.questions) {
					// Extract correct answers and points from questions JSON
					const questions = generatedTest.questions as Array<{
						type: 'single' | 'multiple' | 'open'
						options: Array<{ text: string; isCorrect: boolean }>
						points?: number
					}>

					questions.forEach((question, index) => {
						const questionKey = (index + 1).toString()

						// For closed questions (single/multiple choice)
						if (question.type !== 'open') {
							// For closed questions (single/multiple choice)
							const correctOptions = question.options
								.map((option, optIndex) => ({ option, index: optIndex + 1 }))
								.filter(({ option }) => option.isCorrect)

							if (correctOptions.length > 0) {
								// For single choice questions, use the first correct option number
								correctAnswersMap[questionKey] = correctOptions[0].index.toString()
							}
						}
					})

					console.log('Loaded correct answers from generated test:', correctAnswersMap)
				} else {
					throw new Error('Тест не найден или не содержит вопросов')
				}
			} else {
				// ПРИОРИТЕТ 2: Если нет test_id - загружаем из reference_answers (старая логика)
				console.log('[EVALUATE] No test_id, loading answers from reference_answers field')

				if (detectedVariant <= checkData.variant_count) {
				// Find the variant in database
				const targetVariant = checkData.check_variants.find(v => v.variant_number === detectedVariant)
				if (targetVariant && targetVariant.reference_answers) {
					// Use reference_answers directly from the variant
					correctAnswersMap = targetVariant.reference_answers
					console.log('Loaded correct answers for variant', detectedVariant, ':', correctAnswersMap)
				} else {
					console.warn('No answers found in reference_answers for variant', detectedVariant)

					// Fallback: try variant_answers table (old system)
					if (targetVariant) {
						const { data: variantAnswers } = await supabase
							.from('variant_answers')
							.select('question_number, correct_answer')
							.eq('variant_id', targetVariant.id)

						if (variantAnswers && variantAnswers.length > 0) {
							const answers = variantAnswers as Array<{ question_number: number; correct_answer: string }>
							const answerMap: Record<string, string> = {}
							answers.forEach(answer => {
								answerMap[answer.question_number.toString()] = answer.correct_answer
							})
							correctAnswersMap = answerMap
							console.log('Loaded from variant_answers table for variant', detectedVariant, ':', correctAnswersMap)
						}
					}
				}
			} else {
				console.warn('Detected variant', detectedVariant, 'exceeds available variants', checkData.variant_count)
				// If detected variant is higher than available, fallback to variant 1
				const targetVariant = checkData.check_variants.find(v => v.variant_number === 1)
				if (targetVariant && targetVariant.reference_answers) {
					correctAnswersMap = targetVariant.reference_answers
					console.log('Fallback to variant 1 reference_answers:', correctAnswersMap)
				} else if (targetVariant) {
					// Fallback to variant_answers table
					const { data: variantAnswers } = await supabase
						.from('variant_answers')
						.select('question_number, correct_answer')
						.eq('variant_id', targetVariant.id)

					if (variantAnswers && variantAnswers.length > 0) {
						const answers = variantAnswers as Array<{ question_number: number; correct_answer: string }>
						const answerMap: Record<string, string> = {}
						answers.forEach(answer => {
							answerMap[answer.question_number.toString()] = answer.correct_answer
						})
						correctAnswersMap = answerMap
						console.log('Fallback to variant 1 variant_answers:', correctAnswersMap)
					}
				}
			}
			}

			// Count correct answers and calculate score with points
			let correctAnswers = 0
			let totalPoints = 0
			let earnedPoints = 0
			const detailedAnswers: Record<string, {
				given: string
				correct: string | null
				
				confidence?: number
				points?: number
			}> = {}

			// Load question metadata from generated_tests if check has test_id
			const questionPointsMap: Record<string, number> = {}
			const questionMetadataMap: Record<string, { strictMatch?: boolean; type?: string }> = {}
			if (checkData.test_id) {
				const { data: generatedTest } = await supabase
					.from('generated_tests')
					.select('questions')
					.eq('id', checkData.test_id)
					.single()

				if (generatedTest && generatedTest.questions) {
					const questions = generatedTest.questions as Array<{
						type?: 'single' | 'multiple' | 'open'
						points?: number
						strictMatch?: boolean
					}>
					questions.forEach((question, index) => {
						const questionKey = (index + 1).toString()
						const points = question.points || 1
						questionPointsMap[questionKey] = points
						questionMetadataMap[questionKey] = {
							strictMatch: question.strictMatch || false,
							type: question.type || 'single',
						}
						totalPoints += points
					})
					console.log('Loaded question points:', questionPointsMap, 'Total:', totalPoints)
					console.log('Loaded question metadata:', questionMetadataMap)
				}
			}

			// If not using points system or no points loaded, use simple counting
			const usePointsSystem = totalPoints > 0

			Object.entries(aiResult.answers).forEach(([questionNum, answerData]) => {
				const questionKey = questionNum.toString()
				const studentAnswer = answerData.detected_answer
				const correctAnswer = correctAnswersMap[questionKey]
				const points = questionPointsMap[questionKey] || 1
				const metadata = questionMetadataMap[questionKey] || { strictMatch: false, type: 'single' }

				// Add to total points if not using ChecklyTool test
				if (!usePointsSystem) {
					totalPoints += 1
				}

				let isCorrect = false

				// Определяем правильность ответа
				if (metadata.type === 'open' && correctAnswer && studentAnswer) {
					// Для открытых вопросов используем умную проверку
					isCorrect = smartCompareOpenAnswer(studentAnswer, correctAnswer)
					console.log(`Question ${questionKey} is open question - using smart compare: ${isCorrect ? 'correct' : 'incorrect'}`)
				} else if (correctAnswer && studentAnswer) {
					// Для закрытых вопросов - точное сравнение
					isCorrect = compareAnswers(studentAnswer, correctAnswer, metadata.strictMatch || false)
					console.log(`Question ${questionKey} comparison result: ${isCorrect ? 'correct' : 'incorrect'}`)
				} else {
					console.log(`Question ${questionKey} - no reference answer or empty student answer`)
				}

				if (isCorrect) {
					correctAnswers++
					earnedPoints += points
				}

				detailedAnswers[questionKey] = {
					given: studentAnswer,
					correct: correctAnswer || null,
					confidence: answerData.confidence,
					points: usePointsSystem ? points : undefined
				}
			})

			console.log('Score calculation:', {
				correctAnswers,
				totalQuestions: aiResult.total_questions,
				earnedPoints,
				totalPoints,
				usePointsSystem
			})

			// Calculate grade based on check type
			let grade: number
			let percentage: number

			if (checkData.check_type === 'essay' && checkData.essay_grading_criteria) {
				// For essays, use AI's grade directly from essay_analysis
				const aiGrade = aiResult.essay_analysis?.final_grade || 2
				const gradeResult = calculateEssayGrade(aiGrade, checkData.essay_grading_criteria)
				grade = gradeResult.grade
				percentage = gradeResult.percentage
			} else {
				// For tests, use points-based or traditional percentage-based calculation
				if (usePointsSystem && totalPoints > 0) {
					// Calculate percentage based on earned points
					percentage = Math.round((earnedPoints / totalPoints) * 100)
					console.log(`Points-based calculation: ${earnedPoints}/${totalPoints} = ${percentage}%`)

					// Calculate grade from percentage using grading criteria
					const sortedCriteria = [...checkData.grading_criteria].sort((a, b) => b.grade - a.grade)
					grade = 2 // Default grade
					for (const criterion of sortedCriteria) {
						if (percentage >= criterion.min_percentage) {
							grade = criterion.grade
							break
						}
					}
					console.log(`Points-based grading: ${percentage}% = grade ${grade}`)
				} else {
					// Traditional calculation based on correct answers count
					percentage = Math.round((correctAnswers / aiResult.total_questions) * 100)
					console.log(`Traditional calculation: ${correctAnswers}/${aiResult.total_questions} = ${percentage}%`)

					// Use calculateGrade for traditional calculation
					const gradeResult = calculateGrade(
						correctAnswers,
						aiResult.total_questions,
						checkData.grading_criteria
					)
					grade = gradeResult.grade
				}
			}

			// Save evaluation results
			const evaluationData = {
				submission_id: submissionId,
				total_questions: aiResult.total_questions,
				// For essays, correct_answers should represent grade quality, not comparison
				correct_answers: checkData.check_type === 'essay' ? grade : correctAnswers,
				incorrect_answers: checkData.check_type === 'essay' ? (5 - grade) : (aiResult.total_questions - correctAnswers),
				percentage_score: percentage,
				final_grade: grade,
				variant_used: aiResult.variant_detected || 1,
				detailed_answers: JSON.parse(JSON.stringify(detailedAnswers)),
				ai_response: JSON.parse(JSON.stringify(aiResult)),
				confidence_score: aiResult.confidence_score,
				...(checkData.check_type === 'essay' && aiResult.essay_analysis ? {
					essay_analysis: JSON.parse(JSON.stringify({
						structure: aiResult.essay_analysis.structure,
						logic: aiResult.essay_analysis.logic,
						errors: aiResult.essay_analysis.errors,
						content_quality: aiResult.essay_analysis.content_quality,
						final_grade: aiResult.essay_analysis.final_grade
					})),
					additional_notes: aiResult.additional_notes || null
				} : {})
			}

			const { data: evaluationResult, error: evaluationError } = await supabase
				.from('evaluation_results')
				.insert(evaluationData)
				.select()
				.single()

			if (evaluationError) {
				console.error('Error saving evaluation results:', evaluationError)
				throw new Error('Failed to save evaluation results')
			}

			// Update submission status
			await supabase
				.from('student_submissions')
				.update({
					status: 'completed',
					variant_detected: aiResult.variant_detected || 1,
					processing_completed_at: new Date().toISOString(),
					student_name: aiResult.student_name || submissionData.student_name
				})
				.eq('id', submissionId)

			console.log('Evaluation completed successfully for submission:', submissionId)

			return NextResponse.json({
				result: evaluationResult as { id: string; [key: string]: unknown },
				submission_id: submissionId,
				message: 'Evaluation completed successfully'
			})

		} catch (evaluationError) {
			console.error('Evaluation failed for submission:', submissionId)
			console.error('Error details:', evaluationError)
			console.error('Error message:', evaluationError instanceof Error ? evaluationError.message : 'No error message')
			console.error('Error stack:', evaluationError instanceof Error ? evaluationError.stack : 'No stack')

			// Update submission status to failed
			const updateData = {
				status: 'failed',
				processing_completed_at: new Date().toISOString(),
				error_message: evaluationError instanceof Error ? evaluationError.message : 'Произошла ошибка при обработке работы',
				error_details: JSON.parse(JSON.stringify({
					error_type: 'processing_error',
					error_message: evaluationError instanceof Error ? evaluationError.message : String(evaluationError),
					error_stack: evaluationError instanceof Error ? evaluationError.stack : undefined,
					timestamp: new Date().toISOString()
				}))
			}

			console.log('[EVALUATE] Updating submission with failed status (error case)')

			await supabase
				.from('student_submissions')
				.update(updateData)
				.eq('id', submissionId)

			return NextResponse.json(
				{
					error: 'Evaluation failed',
					details: evaluationError instanceof Error ? evaluationError.message : String(evaluationError),
					submission_id: submissionId
				},
				{ status: 500 }
			)
		}
}

// GET /api/submissions/[id]/evaluate - Check evaluation status
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: submissionId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()

		// Get submission status
		const { data: submission, error } = await supabase
			.from('student_submissions')
			.select(`
				id,
				status,
				processing_started_at,
				processing_completed_at,
				checks!inner (user_id)
			`)
			.eq('id', submissionId)
			.eq('checks.user_id', userId)
			.single()

		if (error || !submission) {
			return NextResponse.json(
				{ error: 'Submission not found' },
				{ status: 404 }
			)
		}

		const submissionData = submission as {
			id: string
			status: string
			processing_started_at?: string
			processing_completed_at?: string
			checks: { user_id: string }
		}

		return NextResponse.json({
			submission_id: submissionId,
			status: submissionData.status,
			processing_started_at: submissionData.processing_started_at,
			processing_completed_at: submissionData.processing_completed_at
		})

	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}

		const resolvedParams = await params
		console.error('Unexpected error in evaluate route:', error)
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			submissionId: resolvedParams.id
		})

		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}

// Export wrapped handlers
export const POST = withErrorHandler<unknown>(postHandler as ApiHandler<unknown>)
