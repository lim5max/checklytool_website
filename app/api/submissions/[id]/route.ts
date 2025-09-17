/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

interface RouteParams {
	params: Promise<{ id: string }>
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