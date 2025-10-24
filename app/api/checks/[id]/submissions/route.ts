/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { createSubmissionSchema } from '@/lib/validations/check'

// Увеличиваем лимиты для загрузки больших изображений
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Максимальный размер запроса
    },
    responseLimit: '50mb', // Максимальный размер ответа
  },
}

interface RouteParams {
	params: Promise<{ id: string }>
}

/**
 * Нормализует имя студента для сравнения
 */
function normalizeStudentName(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, ' ')
}

/**
 * Проверяет, являются ли два имени похожими (простое сравнение после нормализации)
 */
function areNamesSimilar(name1: string, name2: string): boolean {
	const normalized1 = normalizeStudentName(name1)
	const normalized2 = normalizeStudentName(name2)
	return normalized1 === normalized2
}

// POST /api/checks/[id]/submissions - Create new submission
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()

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

		const formData = await request.formData()
		const studentName = formData.get('student_name') as string
		const studentClass = formData.get('student_class') as string
		const files = formData.getAll('images') as File[]

		// Validate submission data
		const validatedData = createSubmissionSchema.parse({
			student_name: studentName || undefined,
			student_class: studentClass || undefined,
			images: files
		})

		// Upload images to Supabase Storage
		const uploadedUrls: string[] = []

		for (const [index, file] of validatedData.images.entries()) {
			const fileName = `${Date.now()}-${index}-${file.name}`
			const filePath = `${checkId}/${fileName}`

			const { data: uploadData, error: uploadError } = await supabase.storage
				.from('checks')
				.upload(filePath, file, {
					contentType: file.type,
					upsert: false
				})

			if (uploadError) {
				console.error('[SUBMISSIONS] Error uploading file:', uploadError)
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
			const { data: urlData, error: signError } = await supabase.storage
				.from('checks')
				.createSignedUrl(uploadData.path, 86400) // 24 hours

			if (signError) {
				console.error('[SUBMISSIONS] Error creating signed URL:', signError)
				throw new Error(`Failed to create image access URL: ${signError.message}`)
			}

			uploadedUrls.push(urlData.signedUrl)
		}

		// Проверка на дубликаты: ищем недавние submissions с похожим именем
		if (validatedData.student_name) {
			// Ищем submissions за последние 5 минут для этой проверки
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
			const { data: recentSubmissions, error: fetchError } = await supabase
				.from('student_submissions')
				.select('id, student_name, created_at, status')
				.eq('check_id', checkId)
				.gte('created_at', fiveMinutesAgo)

			if (!fetchError && recentSubmissions && recentSubmissions.length > 0) {
				// Ищем submission с похожим именем
				const duplicate = recentSubmissions.find((sub: any) =>
					sub.student_name && areNamesSimilar(sub.student_name, validatedData.student_name!)
				)

				if (duplicate) {
					console.warn('[SUBMISSIONS] Duplicate submission detected:', duplicate.id)

					// Удаляем только что загруженные файлы, так как они дубликаты
					for (const url of uploadedUrls) {
						const path = url.split('/').slice(-2).join('/')
						await supabase.storage.from('checks').remove([path])
					}

					// Возвращаем существующий submission вместо создания нового
					return NextResponse.json({
						submission: duplicate,
						message: 'Работа для этого студента уже была загружена недавно',
						isDuplicate: true
					}, { status: 200 })
				}
			}
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
		console.error('[SUBMISSIONS] Error:', error)

		// Handle different types of errors more specifically
		if (error instanceof Error) {
			if (error.message === 'Unauthorized' || error.message.includes('auth')) {
				return NextResponse.json(
					{ error: 'Authentication required' },
					{ status: 401 }
				)
			}

			if (error.message.includes('validation') || error.name === 'ZodError') {
				return NextResponse.json(
					{
						error: 'Invalid submission data',
						details: error.message
					},
					{ status: 400 }
				)
			}
		}

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

		// Get submissions first
		const { data: submissions, error } = await supabase
			.from('student_submissions')
			.select('*')
			.eq('check_id', checkId)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('[SUBMISSIONS GET] Error fetching submissions:', error)
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
			const submissionIds = submissions.map((s: any) => s.id)

			const { data: evaluationResults, error: evalError } = await supabase
				.from('evaluation_results')
				.select('*')
				.in('submission_id', submissionIds)

			if (!evalError && evaluationResults) {
				// Merge evaluation results with submissions
				submissions.forEach((submission: any) => {
					submission.evaluation_results = evaluationResults.filter(
						(result: any) => result.submission_id === submission.id
					)
				})
			}
		}

		return NextResponse.json({
			submissions: submissions || []
		})

	} catch (error) {
		console.error('[SUBMISSIONS GET] Error:', error)

		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}

		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		)
	}
}
