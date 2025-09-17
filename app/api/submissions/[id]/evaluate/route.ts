/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { analyzeWithRetry, calculateGrade } from '@/lib/openrouter'

interface RouteParams {
	params: Promise<{ id: string }>
}

/**
 * Умная функция сравнения ответов - поддерживает разные форматы выбора вариантов
 */
function compareAnswers(studentAnswer: string, correctAnswer: string): boolean {
	const student = studentAnswer.toLowerCase().trim()
	const correct = correctAnswer.toLowerCase().trim()

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

// POST /api/submissions/[id]/evaluate - Evaluate submission using AI
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	console.log('[EVALUATE] Starting evaluation request...')
	try {
		const { id: submissionId } = await params
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
					grading_criteria (*)
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
		
		// Update status to processing
		await (supabase as any)
			.from('student_submissions')
			.update({ 
				status: 'processing',
				processing_started_at: new Date().toISOString()
			})
			.eq('id', submissionId)
		
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
			await (supabase as any)
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
			
			// Call OpenRouter API with retry mechanism using refreshed URLs
			const aiResult = await analyzeWithRetry(
				refreshedImageUrls,
				referenceAnswers || null,
				referenceImages || null,
				checkData.variant_count
			)

			console.log('AI analysis completed:', aiResult)

			// Проверяем, не обнаружил ли AI неподходящий контент
			if (aiResult.error === 'inappropriate_content') {
				console.log('[EVALUATE] Inappropriate content detected by AI')

				// Обновляем статус submission как failed
				const updateData: any = {
					status: 'failed',
					processing_completed_at: new Date().toISOString(),
					error_message: aiResult.error_message || 'Загружены неподходящие изображения',
					error_details: {
						error_type: 'inappropriate_content',
						content_type_detected: aiResult.content_type_detected,
						ai_response: aiResult
					}
				}

				console.log('[EVALUATE] Updating submission with failed status')

				await (supabase as any)
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

			// Get correct answers for the detected variant from variant_answers table
			let correctAnswersMap: Record<string, string> = {}

			if (detectedVariant <= checkData.variant_count) {
				// Find the variant in database
				const targetVariant = checkData.check_variants.find(v => v.variant_number === detectedVariant)
				if (targetVariant) {
					// Load answers from variant_answers table
					const { data: variantAnswers } = await supabase
						.from('variant_answers')
						.select('question_number, correct_answer')
						.eq('variant_id', targetVariant.id)

					if (variantAnswers && variantAnswers.length > 0) {
						// Convert to map format
						const answers = variantAnswers as Array<{ question_number: number; correct_answer: string }>
						const answerMap: Record<string, string> = {}
						answers.forEach(answer => {
							answerMap[answer.question_number.toString()] = answer.correct_answer
						})
						correctAnswersMap = answerMap
						console.log('Loaded correct answers for variant', detectedVariant, ':', correctAnswersMap)
					} else {
						console.warn('No answers found for variant', detectedVariant)
					}
				}
			} else {
				console.warn('Detected variant', detectedVariant, 'exceeds available variants', checkData.variant_count)
				// If detected variant is higher than available, fallback to variant 1
				const targetVariant = checkData.check_variants.find(v => v.variant_number === 1)
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
						console.log('Fallback to variant 1 answers:', correctAnswersMap)
					}
				}
			}

			// Count correct answers
			let correctAnswers = 0
			const detailedAnswers: Record<string, {
				given: string
				correct: string | null
				is_correct: boolean
				confidence?: number
			}> = {}

			Object.entries(aiResult.answers).forEach(([questionNum, answerData]) => {
				const questionKey = questionNum.toString()
				const studentAnswer = answerData.detected_answer
				const correctAnswer = correctAnswersMap[questionKey]

				let isCorrect = false
				if (correctAnswer && studentAnswer) {
						// Умное сравнение ответов с поддержкой разных форматов
				isCorrect = compareAnswers(studentAnswer, correctAnswer)
				}

				if (isCorrect) correctAnswers++

				detailedAnswers[questionKey] = {
					given: studentAnswer,
					correct: correctAnswer || null,
					is_correct: isCorrect,
					confidence: answerData.confidence
				}
			})
			
			// Calculate grade
			const { grade, percentage } = calculateGrade(
				correctAnswers,
				aiResult.total_questions,
				checkData.grading_criteria
			)
			
			// Save evaluation results
			const { data: evaluationResult, error: evaluationError } = await (supabase as any)
				.from('evaluation_results')
				.insert({
					submission_id: submissionId,
					total_questions: aiResult.total_questions,
					correct_answers: correctAnswers,
					incorrect_answers: aiResult.total_questions - correctAnswers,
					percentage_score: percentage,
					final_grade: grade,
					variant_used: aiResult.variant_detected || 1,
					detailed_answers: detailedAnswers,
					ai_response: aiResult,
					confidence_score: aiResult.confidence_score
				})
				.select()
				.single()
			
			if (evaluationError) {
				console.error('Error saving evaluation results:', evaluationError)
				throw new Error('Failed to save evaluation results')
			}
			
			// Update submission status
			await (supabase as any)
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
			const updateData: any = {
				status: 'failed',
				processing_completed_at: new Date().toISOString(),
				error_message: evaluationError instanceof Error ? evaluationError.message : 'Произошла ошибка при обработке работы',
				error_details: {
					error_type: 'processing_error',
					error_message: evaluationError instanceof Error ? evaluationError.message : String(evaluationError),
					error_stack: evaluationError instanceof Error ? evaluationError.stack : undefined,
					timestamp: new Date().toISOString()
				}
			}

			console.log('[EVALUATE] Updating submission with failed status (error case)')

			await (supabase as any)
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
		
	} catch (error) {
		console.error('[EVALUATE] Top-level error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			console.log('[EVALUATE] Authentication error')
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		console.error('[EVALUATE] Unexpected error during evaluation:', error)
		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
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
		
		console.error('Unexpected error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}