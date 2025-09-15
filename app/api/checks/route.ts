/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { createCheckSchema, checksQuerySchema } from '@/lib/validations/check'

// GET /api/checks - List user's checks
export async function GET(request: NextRequest) {
	try {
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Parse query parameters
		const url = new URL(request.url)
		const queryParams = Object.fromEntries(url.searchParams)
		const { page, per_page, search, subject, sort_by, sort_order } = checksQuerySchema.parse(queryParams)
		
		// Build optimized query - load only essential data for listing
		let query = supabase
			.from('checks')
			.select(`
				id,
				title,
				description,
				subject,
				class_level,
				variant_count,
				total_questions,
				created_at,
				updated_at,
				check_statistics (
					total_submissions,
					completed_submissions,
					average_score
				)
			`, { count: 'exact' })
			.eq('user_id', userId)
		
		// Add search filter
		if (search) {
			query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
		}
		
		// Add subject filter
		if (subject) {
			query = query.eq('subject', subject)
		}
		
		// Add sorting
		query = query.order(sort_by, { ascending: sort_order === 'asc' })
		
		// Execute query with count in one request
		const from = (page - 1) * per_page
		const to = from + per_page - 1
		
		const { data: checks, error, count: totalCount } = await query
			.range(from, to)
		
		if (error) {
			console.error('Error fetching checks:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch checks' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			checks: checks || [],
			pagination: {
				page,
				per_page,
				total: totalCount || 0,
				total_pages: Math.ceil((totalCount || 0) / per_page)
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

// POST /api/checks - Create new check
export async function POST(request: NextRequest) {
	try {
		console.log('[API] Starting check creation...')
		const { supabase, userId } = await getAuthenticatedSupabase()
		console.log('[API] Authentication successful, userId:', userId)
		
		const body = await request.json()
		console.log('[API] Request body:', body)
		const validatedData = createCheckSchema.parse(body)
		console.log('[API] Data validation successful')
		
		// Start transaction
		console.log('[API] Creating check in database...')
		const { data: check, error: checkError } = await (supabase as any)
			.from('checks')
			.insert({
				user_id: userId,
				title: validatedData.title,
				description: validatedData.description,
				variant_count: validatedData.variant_count,
				subject: validatedData.subject,
				class_level: validatedData.class_level,
				total_questions: validatedData.total_questions
			})
			.select()
			.single()
		
		if (checkError) {
			console.error('[API] Error creating check:', checkError)
			return NextResponse.json(
				{ error: 'Failed to create check' },
				{ status: 500 }
			)
		}

		const checkResult = check as { id: string; [key: string]: unknown }
		console.log('[API] Check created successfully:', checkResult.id)
		
		// Create grading criteria
		console.log('[API] Creating grading criteria...')
		const criteriaData = validatedData.grading_criteria.map(criteria => ({
			check_id: checkResult.id,
			grade: criteria.grade,
			min_percentage: criteria.min_percentage
		}))
		
		const { error: criteriaError } = await (supabase as any)
			.from('grading_criteria')
			.insert(criteriaData)
		
		if (criteriaError) {
			console.error('[API] Error creating grading criteria:', criteriaError)
			// Clean up check if criteria creation fails
			await supabase.from('checks').delete().eq('id', checkResult.id)
			return NextResponse.json(
				{ error: 'Failed to create grading criteria' },
				{ status: 500 }
			)
		}
		
		console.log('[API] Grading criteria created successfully')
		
		// Create default variants if needed
		console.log('[API] Creating variants...')
		const variantsData = Array.from({ length: validatedData.variant_count }, (_, i) => ({
			check_id: checkResult.id,
			variant_number: i + 1,
			name: `Вариант ${i + 1}`, // Fix: Set correct name for each variant
			reference_answers: {},
			reference_image_urls: []
		}))
		
		const { error: variantsError } = await (supabase as any)
			.from('check_variants')
			.insert(variantsData)
		
		if (variantsError) {
			console.error('[API] Error creating variants:', variantsError)
			// Don't fail the entire operation, variants can be created later
		}
		
		console.log('[API] Check creation completed successfully')

		// If variant data was provided, update the variants with actual answers
		if (body.variantData && Array.isArray(body.variantData)) {
			console.log('[API] Processing variant answers...')
			
			for (const variantInfo of body.variantData) {
				if (variantInfo.answers && variantInfo.answers.length > 0) {
					// Find the corresponding database variant
					const { data: variant } = await (supabase as any)
						.from('check_variants')
						.select('id')
						.eq('check_id', checkResult.id)
						.eq('variant_number', variantInfo.variantNumber || 1)
						.single()
					
					if (variant) {
						// Store answers in variant_answers table
						for (let i = 0; i < variantInfo.answers.length; i++) {
							const answer = variantInfo.answers[i]
							if (answer.value && answer.value.trim()) {
								await (supabase as any)
									.from('variant_answers')
									.insert({
										variant_id: variant.id,
										question_number: i + 1,
										correct_answer: answer.value.trim()
									})
							}
						}
					}
				}
			}
		}
		
		return NextResponse.json({
			check: checkResult,
			message: 'Check created successfully'
		}, { status: 201 })
		
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			console.log('[API] Authentication error')
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		console.error('[API] Unexpected error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}