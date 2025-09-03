/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { z } from 'zod'

interface RouteParams {
	params: Promise<{ id: string }>
}

// Validation schema for creating a new variant
const createVariantSchema = z.object({
	variant_number: z.number().int().min(1),
	reference_answers: z.record(z.string(), z.string()).optional(),
	reference_image_urls: z.array(z.string()).optional()
})

// GET /api/checks/[id]/variants - List all variants for a check
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Verify check ownership and get variants
		const { data: variants, error } = await supabase
			.from('check_variants')
			.select(`
				*,
				checks!inner (id, user_id)
			`)
			.eq('checks.id', checkId)
			.eq('checks.user_id', userId)
			.order('variant_number', { ascending: true })
		
		if (error) {
			console.error('Error fetching variants:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch variants' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({ variants: variants || [] })
		
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

// POST /api/checks/[id]/variants - Create a new variant
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		const body = await request.json()
		const validatedData = createVariantSchema.parse(body)
		
		// Verify check ownership
		const { data: check, error: checkError } = await supabase
			.from('checks')
			.select('id, variant_count')
			.eq('id', checkId)
			.eq('user_id', userId)
			.single()
		
		if (checkError || !check) {
			return NextResponse.json(
				{ error: 'Check not found' },
				{ status: 404 }
			)
		}
		
		// Check if variant number already exists
		const { data: existingVariant } = await supabase
			.from('check_variants')
			.select('id')
			.eq('check_id', checkId)
			.eq('variant_number', validatedData.variant_number)
			.single()
		
		if (existingVariant) {
			return NextResponse.json(
				{ error: 'Variant number already exists' },
				{ status: 400 }
			)
		}
		
		// Create new variant
		const { data: newVariant, error: createError } = await (supabase as any)
			.from('check_variants')
			.insert({
				check_id: checkId,
				variant_number: validatedData.variant_number,
				reference_answers: validatedData.reference_answers || {},
				reference_image_urls: validatedData.reference_image_urls || []
			})
			.select()
			.single()
		
		if (createError) {
			console.error('Error creating variant:', createError)
			return NextResponse.json(
				{ error: 'Failed to create variant' },
				{ status: 500 }
			)
		}
		
		// Update check variant count if needed
		const currentVariantCount = (check as any).variant_count
		if (validatedData.variant_number > currentVariantCount) {
			await (supabase as any)
				.from('checks')
				.update({ variant_count: validatedData.variant_number })
				.eq('id', checkId)
		}
		
		return NextResponse.json({
			variant: newVariant,
			message: 'Variant created successfully'
		}, { status: 201 })
		
	} catch (error) {
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid data format', details: error.issues },
				{ status: 400 }
			)
		}
		
		console.error('Unexpected error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}