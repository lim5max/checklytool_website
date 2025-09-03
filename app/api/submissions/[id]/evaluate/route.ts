/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { analyzeWithRetry, calculateGrade } from '@/lib/openrouter'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/submissions/[id]/evaluate - Evaluate submission using AI
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: submissionId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Get submission with check details
		const { data: submission, error: submissionError } = await supabase
			.from('student_submissions')
			.select(`
				*,
				checks!inner (
					*,
					check_variants (*),
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
			// Prepare reference data
			const variants = checkData.check_variants || []
			const referenceAnswers = variants.length > 0 ? variants[0].reference_answers : null
			const referenceImages = variants.length > 0 ? variants[0].reference_image_urls : null
			
			console.log('Starting AI analysis for submission:', submissionId)
			
			// Call OpenRouter API with retry mechanism
			const aiResult = await analyzeWithRetry(
				submissionData.submission_images,
				referenceAnswers || null,
				referenceImages || null,
				checkData.variant_count
			)
			
			console.log('AI analysis completed:', aiResult)
			
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
				const correctAnswer = referenceAnswers?.[questionKey]
				
				let isCorrect = false
				if (correctAnswer && studentAnswer) {
					// Simple comparison - can be enhanced with more sophisticated matching
					isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
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
			console.error('Evaluation failed:', evaluationError)
			
			// Update submission status to failed
			await (supabase as any)
				.from('student_submissions')
				.update({ 
					status: 'failed',
					processing_completed_at: new Date().toISOString()
				})
				.eq('id', submissionId)
			
			return NextResponse.json(
				{ 
					error: 'Evaluation failed', 
					details: evaluationError instanceof Error ? evaluationError.message : 'Unknown error'
				},
				{ status: 500 }
			)
		}
		
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		console.error('Unexpected error during evaluation:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
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