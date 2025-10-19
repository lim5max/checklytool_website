/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

interface RouteParams {
	params: Promise<{ id: string }>
}

// Disable caching for this endpoint to always get fresh signed URLs
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/submissions/[id] - Get submission details
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: submissionId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()

		// Get submission details with check ownership verification
		const { data: submission, error: submissionError } = await supabase
			.from('student_submissions')
			.select(`
				id,
				status,
				student_name,
				student_class,
				submission_images,
				created_at,
				updated_at,
				processing_started_at,
				processing_completed_at,
				error_message,
				checks!inner (
					id,
					user_id,
					title,
					subject,
					class_level,
					total_questions,
					check_type
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

		// Get evaluation results separately
		const { data: evaluationResults, error: evalError } = await supabase
			.from('evaluation_results')
			.select(`
				id,
				final_grade,
				percentage_score,
				total_questions,
				correct_answers,
				incorrect_answers,
				detailed_answers,
				confidence_score,
				created_at
			`)
			.eq('submission_id', submissionId)
			.single()

		if (evalError && evalError.code !== 'PGRST116') {
			console.error('Error fetching evaluation results:', evalError)
		}

		// Refresh signed URLs for submission images if they exist
		let refreshedImages = submission.submission_images
		if (submission.submission_images && submission.submission_images.length > 0) {
			console.log('[REFRESH URLs] Starting to refresh', submission.submission_images.length, 'images')
			refreshedImages = await Promise.all(
				submission.submission_images.map(async (imageUrl: string, index: number) => {
					try {
						console.log(`[REFRESH URLs] Image ${index}:`, imageUrl.substring(0, 100))

						// Extract the file path from the existing URL
						// Match pattern: /storage/v1/object/sign/checks/PATH?token=...
						const urlMatch = imageUrl.match(/\/storage\/v1\/object\/sign\/checks\/(.+?)\?/)

						if (urlMatch && urlMatch[1]) {
							const filePath = urlMatch[1]
							console.log(`[REFRESH URLs] Extracted path ${index}:`, filePath)

							// Generate a new signed URL with 1 hour expiry
							const { data: signedUrlData, error: signError } = await supabase
								.storage
								.from('checks')
								.createSignedUrl(filePath, 3600) // 1 hour

							if (signError) {
								console.error(`[REFRESH URLs] Error signing URL ${index}:`, signError)
								return imageUrl
							}

							if (signedUrlData?.signedUrl) {
								console.log(`[REFRESH URLs] New URL ${index}:`, signedUrlData.signedUrl.substring(0, 100))
								return signedUrlData.signedUrl
							}
						} else {
							console.warn(`[REFRESH URLs] Could not extract path from URL ${index}`)
						}
						return imageUrl
					} catch (error) {
						console.error(`[REFRESH URLs] Error refreshing image URL ${index}:`, error)
						return imageUrl
					}
				})
			)
			console.log('[REFRESH URLs] Finished refreshing URLs')
		}

		// Merge evaluation results into submission
		const submissionWithEvaluation = {
			...submission,
			submission_images: refreshedImages,
			evaluation_results: evaluationResults || null
		}

		// Return with no-cache headers to ensure fresh URLs
		return NextResponse.json(submissionWithEvaluation, {
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
			}
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

// DELETE /api/submissions/[id] - Delete submission
export async function DELETE(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: submissionId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()

		// Check if submission exists and belongs to user
		const { data: submission, error: submissionError } = await supabase
			.from('student_submissions')
			.select(`
				id,
				checks!inner (user_id)
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

		// Delete related evaluation results first
		await (supabase as any)
			.from('evaluation_results')
			.delete()
			.eq('submission_id', submissionId)

		// Delete the submission
		const { error: deleteError } = await (supabase as any)
			.from('student_submissions')
			.delete()
			.eq('id', submissionId)

		if (deleteError) {
			console.error('Error deleting submission:', deleteError)
			return NextResponse.json(
				{ error: 'Failed to delete submission' },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			message: 'Submission deleted successfully',
			submissionId
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