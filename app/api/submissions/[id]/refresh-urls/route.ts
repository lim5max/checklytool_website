/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/submissions/[id]/refresh-urls - Refresh signed URLs for submission images
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: submissionId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Get submission with check relationship to verify ownership
		const { data: submission, error: submissionError } = await supabase
			.from('student_submissions')
			.select(`
				*,
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

		const submissionData = submission as {
			id: string
			submission_images: string[]
			checks: { user_id: string }
		}
		
		// Generate new signed URLs for all images
		const refreshedUrls: string[] = []
		
		for (const imageUrl of submissionData.submission_images) {
			// Extract file path from the existing URL
			let filePath: string
			
			if (imageUrl.includes('/storage/v1/object/sign/')) {
				// It's already a signed URL, extract path
				const urlParts = imageUrl.split('/storage/v1/object/sign/checks/')
				filePath = urlParts[1]?.split('?')[0] || ''
			} else if (imageUrl.includes('/storage/v1/object/public/')) {
				// It's a public URL, extract path
				const urlParts = imageUrl.split('/storage/v1/object/public/checks/')
				filePath = urlParts[1] || ''
			} else {
				console.warn('Unknown URL format:', imageUrl)
				refreshedUrls.push(imageUrl) // Keep original if we can't parse
				continue
			}
			
			if (filePath) {
				// Create new signed URL
				const { data: urlData, error: signError } = await supabase.storage
					.from('checks')
					.createSignedUrl(filePath, 86400) // 24 hours
				
				if (signError) {
					console.error('Error creating signed URL for path:', filePath, signError)
					refreshedUrls.push(imageUrl) // Keep original if signing fails
				} else {
					refreshedUrls.push(urlData.signedUrl)
				}
			} else {
				refreshedUrls.push(imageUrl) // Keep original if path extraction fails
			}
		}
		
		// Update submission with refreshed URLs
		const { error: updateError } = await supabase
			.from('student_submissions')
			.update({
				submission_images: refreshedUrls,
				updated_at: new Date().toISOString()
			})
			.eq('id', submissionId)
		
		if (updateError) {
			console.error('Error updating submission URLs:', updateError)
			return NextResponse.json(
				{ error: 'Failed to refresh URLs' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			message: 'URLs refreshed successfully',
			image_urls: refreshedUrls
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