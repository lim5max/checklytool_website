/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { createSubmissionSchema } from '@/lib/validations/check'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/checks/[id]/submissions - Create new submission
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	console.log('[SUBMISSIONS] === POST REQUEST STARTED ===')
	console.log('[SUBMISSIONS] Request method:', request.method)
	console.log('[SUBMISSIONS] Request URL:', request.url)
	
	try {
		console.log('[SUBMISSIONS] Starting submission creation...')
		const { id: checkId } = await params
		console.log('[SUBMISSIONS] Check ID:', checkId)
		
		console.log('[SUBMISSIONS] Calling getAuthenticatedSupabase...')
		const { supabase, userId } = await getAuthenticatedSupabase()
		console.log('[SUBMISSIONS] Authentication successful, userId:', userId)
		
		// Verify the check exists and belongs to the user
		const { data: checkExists, error: checkError } = await supabase
			.from('checks')
			.select('id')
			.eq('id', checkId)
			.eq('user_id', userId)
			.single()
		
		if (checkError || !checkExists) {
			return NextResponse.json(
				{ error: 'Check not found' },
				{ status: 404 }
			)
		}
		
		console.log('[SUBMISSIONS] Parsing form data...')
		const formData = await request.formData()
		const studentName = formData.get('student_name') as string
		const studentClass = formData.get('student_class') as string
		const files = formData.getAll('images') as File[]
		
		console.log('[SUBMISSIONS] Form data parsed:', {
			studentName,
			studentClass,
			filesCount: files.length,
			fileSizes: files.map(f => f.size)
		})
		
		// Validate submission data
		const validatedData = createSubmissionSchema.parse({
			student_name: studentName || undefined,
			student_class: studentClass || undefined,
			images: files
		})
		
		console.log('[SUBMISSIONS] Starting image uploads...')
		// Upload images to Supabase Storage
		const uploadedUrls: string[] = []
		
		for (const [index, file] of validatedData.images.entries()) {
			const fileName = `${Date.now()}-${index}-${file.name}`
			const filePath = `${checkId}/${fileName}`
			
			console.log(`[SUBMISSIONS] Uploading file ${index + 1}/${validatedData.images.length}:`, {
				fileName,
				filePath,
				size: file.size,
				type: file.type
			})
			
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('checks')
				.upload(filePath, file, {
					contentType: file.type,
					upsert: false
				})
			
			console.log(`[SUBMISSIONS] Upload result for file ${index + 1}:`, {
				success: !uploadError,
				error: uploadError,
				path: uploadData?.path
			})
			
			if (uploadError) {
				console.error('[SUBMISSIONS] Error uploading file:', uploadError)
				console.error('[SUBMISSIONS] Full upload error details:', JSON.stringify(uploadError, null, 2))
				// Clean up previously uploaded files
				for (const uploadedUrl of uploadedUrls) {
					const cleanupPath = uploadedUrl.split('/').slice(-2).join('/')
					await supabase.storage.from('checks').remove([cleanupPath])
				}
				return NextResponse.json(
					{ 
						error: 'Failed to upload images', 
						details: uploadError.message || 'Storage upload failed'
					},
					{ status: 500 }
				)
			}
			
			// Get signed URL (valid for 24 hours) for external API access
			console.log(`[SUBMISSIONS] Creating signed URL for path:`, uploadData.path)
			const { data: urlData, error: signError } = await supabase.storage
				.from('checks')
				.createSignedUrl(uploadData.path, 86400) // 24 hours
			
			if (signError) {
				console.error('[SUBMISSIONS] Error creating signed URL:', signError)
				console.error('[SUBMISSIONS] Signed URL error details:', JSON.stringify(signError, null, 2))
				throw new Error(`Failed to create image access URL: ${signError.message}`)
			}
			
			console.log(`[SUBMISSIONS] Signed URL created successfully:`, urlData.signedUrl)
			
			uploadedUrls.push(urlData.signedUrl)
		}
		
		// Create submission record
		const { data: submission, error: submissionError } = await (supabase as any)
			.from('student_submissions')
			.insert({
				check_id: checkId,
				student_name: validatedData.student_name,
				student_class: validatedData.student_class,
				submission_images: uploadedUrls,
				status: 'pending'
			})
			.select()
			.single()
		
		if (submissionError) {
			console.error('Error creating submission:', submissionError)
			// Clean up uploaded files
			for (const url of uploadedUrls) {
				const path = url.split('/').slice(-2).join('/')
				await supabase.storage.from('checks').remove([path])
			}
			return NextResponse.json(
				{ error: 'Failed to create submission' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			submission: submission as { id: string; [key: string]: unknown },
			message: 'Submission created successfully'
		}, { status: 201 })
		
	} catch (error) {
		console.error('[SUBMISSIONS] === CATCH BLOCK ERROR ===')
		console.error('[SUBMISSIONS] Error type:', typeof error)
		console.error('[SUBMISSIONS] Error message:', error instanceof Error ? error.message : String(error))
		console.error('[SUBMISSIONS] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
		console.error('[SUBMISSIONS] Full error object:', JSON.stringify(error, null, 2))

		// Handle different types of errors more specifically
		if (error instanceof Error) {
			if (error.message === 'Unauthorized' || error.message.includes('auth')) {
				console.log('[SUBMISSIONS] Authentication error detected')
				return NextResponse.json(
					{ error: 'Authentication required' },
					{ status: 401 }
				)
			}

			if (error.message.includes('validation') || error.name === 'ZodError') {
				console.log('[SUBMISSIONS] Validation error detected')
				return NextResponse.json(
					{
						error: 'Invalid submission data',
						details: error.message
					},
					{ status: 400 }
				)
			}
		}

		console.error('[SUBMISSIONS] Returning 500 Internal Server Error')
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error),
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		)
	}
}

// GET /api/checks/[id]/submissions - Get submissions for a check
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	console.log('[SUBMISSIONS GET] === GET REQUEST STARTED ===')
	console.log('[SUBMISSIONS GET] Request method:', request.method)
	console.log('[SUBMISSIONS GET] Request URL:', request.url)

	try {
		console.log('[SUBMISSIONS GET] Extracting checkId from params...')
		const { id: checkId } = await params
		console.log('[SUBMISSIONS GET] Check ID:', checkId)

		console.log('[SUBMISSIONS GET] Getting authenticated Supabase instance...')
		const { supabase, userId } = await getAuthenticatedSupabase()
		console.log('[SUBMISSIONS GET] Authentication successful, userId:', userId)

		console.log('[SUBMISSIONS GET] Verifying check ownership...')
		// Verify the check belongs to the user
		const { data: checkExists, error: checkError } = await supabase
			.from('checks')
			.select('id')
			.eq('id', checkId)
			.eq('user_id', userId)
			.single()

		console.log('[SUBMISSIONS GET] Check verification result:', {
			checkExists: !!checkExists,
			checkError: checkError ? JSON.stringify(checkError) : null
		})

		if (checkError || !checkExists) {
			console.log('[SUBMISSIONS GET] Check not found, returning 404')
			return NextResponse.json(
				{ error: 'Check not found' },
				{ status: 404 }
			)
		}

		console.log('[SUBMISSIONS GET] Fetching submissions from database...')
		// Get submissions first
		const { data: submissions, error } = await supabase
			.from('student_submissions')
			.select('*')
			.eq('check_id', checkId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[SUBMISSIONS GET] Error fetching submissions:', error)
			console.error('[SUBMISSIONS GET] Full error details:', JSON.stringify(error, null, 2))
			return NextResponse.json(
				{
					error: 'Failed to fetch submissions',
					details: error.message || 'Database query failed'
				},
				{ status: 500 }
			)
		}

		// Get evaluation results separately and merge them
		if (submissions && submissions.length > 0) {
			console.log('[SUBMISSIONS GET] Fetching evaluation results...')
			const submissionIds = submissions.map(s => s.id)

			const { data: evaluationResults, error: evalError } = await supabase
				.from('evaluation_results')
				.select('*')
				.in('submission_id', submissionIds)

			if (!evalError && evaluationResults) {
				// Merge evaluation results with submissions
				submissions.forEach(submission => {
					submission.evaluation_results = evaluationResults.filter(
						result => result.submission_id === submission.id
					)
				})
			}
		}

		console.log('[SUBMISSIONS GET] Database query result:', {
			submissionsCount: submissions?.length || 0,
			hasError: !!error,
			error: error ? JSON.stringify(error) : null
		})

		console.log('[SUBMISSIONS GET] Returning successful response with', submissions?.length || 0, 'submissions')
		return NextResponse.json({
			submissions: submissions || []
		})

	} catch (error) {
		console.error('[SUBMISSIONS GET] === CATCH BLOCK ERROR ===')
		console.error('[SUBMISSIONS GET] Error type:', typeof error)
		console.error('[SUBMISSIONS GET] Error message:', error instanceof Error ? error.message : String(error))
		console.error('[SUBMISSIONS GET] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
		console.error('[SUBMISSIONS GET] Full error object:', error)

		if (error instanceof Error && error.message === 'Unauthorized') {
			console.log('[SUBMISSIONS GET] Returning 401 Unauthorized')
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}

		console.error('[SUBMISSIONS GET] Returning 500 Internal Server Error')
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		)
	}
}