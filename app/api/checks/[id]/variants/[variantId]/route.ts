/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

interface RouteParams {
	params: Promise<{ id: string; variantId: string }>
}

// Validation schema for variant updates
const updateVariantSchema = z.object({
	reference_answers: z.record(z.string(), z.string()).optional(),
	reference_image_urls: z.array(z.string()).optional()
})

// GET /api/checks/[id]/variants/[variantId] - Get specific variant
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId, variantId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Verify check ownership and get variant
		const { data: variant, error } = await supabase
			.from('check_variants')
			.select(`
				*,
				checks!inner (id, user_id)
			`)
			.eq('id', variantId)
			.eq('checks.id', checkId)
			.eq('checks.user_id', userId)
			.single()
		
		if (error) {
			if (error.code === 'PGRST116') {
				return NextResponse.json(
					{ error: 'Variant not found' },
					{ status: 404 }
				)
			}
			console.error('Error fetching variant:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch variant' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({ variant })
		
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

// PUT /api/checks/[id]/variants/[variantId] - Update variant answers
export async function PUT(
	request: NextRequest,
	{ params }: RouteParams
) {
	console.log('[API] ===== PUT VARIANT ENDPOINT CALLED =====')
	try {
		console.log('[API] PUT variant update started')
		const { id: checkId, variantId } = await params
		console.log('[API] Params:', { checkId, variantId })
		
		const { supabase, userId } = await getAuthenticatedSupabase()
		console.log('[API] Authentication successful, userId:', userId)
		
		const body = await request.json()
		console.log('[API] Request body:', body)
		const validatedData = updateVariantSchema.parse(body)
		console.log('[API] Data validation successful:', validatedData)
		
		// Verify check ownership first
		console.log('[API] Verifying check ownership...')
		const { data: check, error: checkError } = await supabase
			.from('checks')
			.select('id')
			.eq('id', checkId)
			.eq('user_id', userId)
			.single()
		
		if (checkError || !check) {
			console.error('[API] Check verification failed:', checkError)
			return NextResponse.json(
				{ error: 'Check not found' },
				{ status: 404 }
			)
		}
		console.log('[API] Check ownership verified')
		
		// Update variant
		console.log('[API] Preparing update data...')
		const updateData: Record<string, any> = {}
		
		if (validatedData.reference_answers) {
			updateData.reference_answers = validatedData.reference_answers
		}
		
		if (validatedData.reference_image_urls) {
			updateData.reference_image_urls = validatedData.reference_image_urls
		}
		
		console.log('[API] Update data prepared:', updateData)
		console.log('[API] Executing update query...')
		
		// Create admin client with service role key to bypass RLS for this operation
		const adminClient = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
			{ auth: { persistSession: false } }
		)
		
		console.log('[API] Using admin client for update...')
		
		const { data: updatedVariant, error: updateError } = await adminClient
			.from('check_variants')
			.update(updateData)
			.eq('id', variantId)
			.eq('check_id', checkId)
			.select()
			.single()
		
		if (updateError) {
			console.error('[API] Error updating variant:', updateError)
			return NextResponse.json(
				{ error: 'Failed to update variant', details: updateError.message },
				{ status: 500 }
			)
		}
		
		console.log('[API] Variant updated successfully:', updatedVariant)
		
		return NextResponse.json({
			variant: updatedVariant,
			message: 'Variant updated successfully'
		})
		
	} catch (error) {
		console.error('[API] Unexpected error in PUT variant:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		if (error instanceof z.ZodError) {
			console.error('[API] Validation error:', error.issues)
			return NextResponse.json(
				{ error: 'Invalid data format', details: error.issues },
				{ status: 400 }
			)
		}
		
		return NextResponse.json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		)
	}
}

// DELETE /api/checks/[id]/variants/[variantId] - Delete variant
export async function DELETE(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId, variantId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Verify check ownership first
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
		
		// Don't allow deleting if it's the only variant
		if ((check as any).variant_count <= 1) {
			return NextResponse.json(
				{ error: 'Cannot delete the only variant' },
				{ status: 400 }
			)
		}
		
		// Delete variant
		const { error: deleteError } = await supabase
			.from('check_variants')
			.delete()
			.eq('id', variantId)
			.eq('check_id', checkId)
		
		if (deleteError) {
			console.error('Error deleting variant:', deleteError)
			return NextResponse.json(
				{ error: 'Failed to delete variant' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			message: 'Variant deleted successfully'
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