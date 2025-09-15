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
	try {
		console.log('[SUBMISSIONS] Starting submission creation...')
		const { id: checkId } = await params
		console.log('[SUBMISSIONS] Check ID:', checkId)
		
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
				console.error('Error uploading file:', uploadError)
				// Clean up previously uploaded files
				for (const uploadedUrl of uploadedUrls) {
					await supabase.storage.from('checks').remove([uploadedUrl])
				}
				return NextResponse.json(
					{ error: 'Failed to upload images' },
					{ status: 500 }
				)
			}
			
			// Get signed URL (valid for 24 hours) for external API access
			const { data: urlData, error: signError } = await supabase.storage
				.from('checks')
				.createSignedUrl(uploadData.path, 86400) // 24 hours
			
			if (signError) {
				console.error('Error creating signed URL:', signError)
				throw new Error('Failed to create image access URL')
			}
			
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

// GET /api/checks/[id]/submissions - Get submissions for a check
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Verify the check belongs to the user
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
		
		// Get submissions with results
		const { data: submissions, error } = await supabase
			.from('student_submissions')
			.select(`
				*,
				evaluation_results (*)
			`)
			.eq('check_id', checkId)
			.order('created_at', { ascending: false })
		
		if (error) {
			console.error('Error fetching submissions:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch submissions' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			submissions: submissions || []
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