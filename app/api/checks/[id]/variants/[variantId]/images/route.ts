/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
	params: Promise<{ id: string; variantId: string }>
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_FILES_PER_VARIANT = 10

// POST /api/checks/[id]/variants/[variantId]/images - Upload reference images
export async function POST(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId, variantId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		// Parse form data
		const formData = await request.formData()
		const files = formData.getAll('images') as File[]
		
		if (!files || files.length === 0) {
			return NextResponse.json(
				{ error: 'No images provided' },
				{ status: 400 }
			)
		}
		
		// Validate files
		for (const file of files) {
			if (!ALLOWED_FILE_TYPES.includes(file.type)) {
				return NextResponse.json(
					{ error: `File type ${file.type} not allowed. Supported: ${ALLOWED_FILE_TYPES.join(', ')}` },
					{ status: 400 }
				)
			}
			
			if (file.size > MAX_FILE_SIZE) {
				return NextResponse.json(
					{ error: `File ${file.name} is too large. Maximum size: 10MB` },
					{ status: 400 }
				)
			}
		}
		
		if (files.length > MAX_FILES_PER_VARIANT) {
			return NextResponse.json(
				{ error: `Too many files. Maximum ${MAX_FILES_PER_VARIANT} files per variant` },
				{ status: 400 }
			)
		}
		
		// Verify check ownership and get variant
		const { data: variant, error: variantError } = await supabase
			.from('check_variants')
			.select(`
				*,
				checks!inner (id, user_id)
			`)
			.eq('id', variantId)
			.eq('checks.id', checkId)
			.eq('checks.user_id', userId)
			.single()
		
		if (variantError || !variant) {
			return NextResponse.json(
				{ error: 'Variant not found' },
				{ status: 404 }
			)
		}
		
		// Check current image count
		const currentImages = (variant as any).reference_image_urls || []
		if (currentImages.length + files.length > MAX_FILES_PER_VARIANT) {
			return NextResponse.json(
				{ error: `Would exceed maximum ${MAX_FILES_PER_VARIANT} images per variant` },
				{ status: 400 }
			)
		}
		
		// Upload files to Supabase Storage
		const supabaseClient = await createClient()
		const uploadedUrls: string[] = []
		
		try {
			for (const file of files) {
				const timestamp = Date.now()
				const random = Math.random().toString(36).substring(2)
				const fileName = `${checkId}/${variantId}/${timestamp}-${random}-${file.name}`
				
				const { data: uploadData, error: uploadError } = await supabaseClient.storage
					.from('checks')
					.upload(fileName, file, {
						cacheControl: '3600',
						upsert: false
					})
				
				if (uploadError) {
					console.error('Error uploading file:', uploadError)
					// Clean up any successfully uploaded files
					for (const url of uploadedUrls) {
						const urlPath = url.split('/').pop()
						if (urlPath) {
							await supabaseClient.storage.from('checks').remove([fileName])
						}
					}
					throw new Error(`Failed to upload ${file.name}`)
				}
				
				// Get public URL
				const { data: urlData } = supabaseClient.storage
					.from('checks')
					.getPublicUrl(uploadData.path)
				
				uploadedUrls.push(urlData.publicUrl)
			}
			
			// Update variant with new image URLs
			const updatedImageUrls = [...currentImages, ...uploadedUrls]
			
			const { data: updatedVariant, error: updateError } = await (supabase as any)
				.from('check_variants')
				.update({
					reference_image_urls: updatedImageUrls,
					updated_at: new Date().toISOString()
				})
				.eq('id', variantId)
				.select()
				.single()
			
			if (updateError) {
				console.error('Error updating variant with image URLs:', updateError)
				// Clean up uploaded files
				for (const file of files) {
					const timestamp = Date.now()
					const random = Math.random().toString(36).substring(2)
					const fileName = `${checkId}/${variantId}/${timestamp}-${random}-${file.name}`
					await supabaseClient.storage.from('checks').remove([fileName])
				}
				throw new Error('Failed to update variant with image URLs')
			}
			
			return NextResponse.json({
				variant: updatedVariant,
				image_urls: uploadedUrls,
				message: `Successfully uploaded ${files.length} image(s)`
			})
			
		} catch (error) {
			console.error('Error during file upload process:', error)
			return NextResponse.json(
				{ error: error instanceof Error ? error.message : 'Failed to upload images' },
				{ status: 500 }
			)
		}
		
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

// DELETE /api/checks/[id]/variants/[variantId]/images - Remove specific image
export async function DELETE(
	request: NextRequest,
	{ params }: RouteParams
) {
	try {
		const { id: checkId, variantId } = await params
		const { supabase, userId } = await getAuthenticatedSupabase()
		
		const body = await request.json()
		const { image_url } = body
		
		if (!image_url || typeof image_url !== 'string') {
			return NextResponse.json(
				{ error: 'image_url is required' },
				{ status: 400 }
			)
		}
		
		// Verify check ownership and get variant
		const { data: variant, error: variantError } = await supabase
			.from('check_variants')
			.select(`
				*,
				checks!inner (id, user_id)
			`)
			.eq('id', variantId)
			.eq('checks.id', checkId)
			.eq('checks.user_id', userId)
			.single()
		
		if (variantError || !variant) {
			return NextResponse.json(
				{ error: 'Variant not found' },
				{ status: 404 }
			)
		}
		
		const currentImages = (variant as any).reference_image_urls || []
		
		if (!currentImages.includes(image_url)) {
			return NextResponse.json(
				{ error: 'Image not found in variant' },
				{ status: 404 }
			)
		}
		
		// Extract file path from URL for storage deletion
		const url = new URL(image_url)
		const pathParts = url.pathname.split('/')
		const fileName = pathParts.slice(-3).join('/') // Get the last 3 parts: checkId/variantId/filename
		
		// Remove from storage
		const supabaseClient = await createClient()
		const { error: storageError } = await supabaseClient.storage
			.from('checks')
			.remove([fileName])
		
		if (storageError) {
			console.error('Error removing file from storage:', storageError)
			// Continue with database update even if storage deletion fails
		}
		
		// Update variant by removing the image URL
		const updatedImageUrls = currentImages.filter((url: string) => url !== image_url)
		
		const { data: updatedVariant, error: updateError } = await (supabase as any)
			.from('check_variants')
			.update({
				reference_image_urls: updatedImageUrls,
				updated_at: new Date().toISOString()
			})
			.eq('id', variantId)
			.select()
			.single()
		
		if (updateError) {
			console.error('Error updating variant:', updateError)
			return NextResponse.json(
				{ error: 'Failed to update variant' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			variant: updatedVariant,
			message: 'Image removed successfully'
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