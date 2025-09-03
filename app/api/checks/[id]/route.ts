/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/checks/[id] - Get specific check details
export async function GET(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Get check with all related data
		const { data: check, error } = await supabase
			.from('checks')
			.select(`
				*,
				grading_criteria (*),
				check_variants (*),
				check_statistics (
					total_submissions,
					completed_submissions,
					average_score,
					grade_distribution,
					last_updated
				)
			`)
			.eq('id', id)
			.eq('user_id', userId) // Ensure user owns this check
			.single()
		
		if (error) {
			if (error.code === 'PGRST116') {
				return NextResponse.json(
					{ error: 'Check not found' },
					{ status: 404 }
				)
			}
			console.error('Error fetching check:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch check' },
				{ status: 500 }
			)
		}
		
		// Get recent submissions for this check
		const { data: recentSubmissions } = await supabase
			.from('student_submissions')
			.select(`
				*,
				evaluation_results (*)
			`)
			.eq('check_id', id)
			.order('created_at', { ascending: false })
			.limit(10)
		
		return NextResponse.json({
			check,
			recent_submissions: recentSubmissions || [],
			submission_count: (check as { check_statistics?: Array<{ total_submissions: number }> }).check_statistics?.[0]?.total_submissions || 0
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

// PUT /api/checks/[id] - Update check
export async function PUT(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		const body = await request.json()
		
		// Validate the check belongs to the user
		const { data: existingCheck, error: checkError } = await supabase
			.from('checks')
			.select('id')
			.eq('id', id)
			.eq('user_id', userId)
			.single()
		
		if (checkError || !existingCheck) {
			return NextResponse.json(
				{ error: 'Check not found' },
				{ status: 404 }
			)
		}
		
		// Update check - simplified for type safety
		const updateData = {
			title: String(body.title || ''),
			description: String(body.description || ''),
			subject: String(body.subject || ''),
			class_level: String(body.class_level || ''),
			total_questions: Number(body.total_questions || 0),
			updated_at: new Date().toISOString()
		}
		
		const { data: updatedCheck, error: updateError } = await (supabase as any)
			.from('checks')
			.update(updateData)
			.eq('id', id)
			.select()
			.single()
		
		if (updateError) {
			console.error('Error updating check:', updateError)
			return NextResponse.json(
				{ error: 'Failed to update check' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			check: updatedCheck,
			message: 'Check updated successfully'
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

// DELETE /api/checks/[id] - Delete check
export async function DELETE(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Verify ownership and delete
		const { error } = await supabase
			.from('checks')
			.delete()
			.eq('id', id)
			.eq('user_id', userId)
		
		if (error) {
			console.error('Error deleting check:', error)
			return NextResponse.json(
				{ error: 'Failed to delete check' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			message: 'Check deleted successfully'
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