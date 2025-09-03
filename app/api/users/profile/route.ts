/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { upsertUserProfile, getUserProfile } from '@/lib/database'
import { updateUserProfileSchema } from '@/lib/validations/check'
import type { User } from 'next-auth'

// GET /api/users/profile - Get current user profile
export async function GET() {
	try {
		const session = await auth()
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		const userId = session.user.id || session.user.email!
		const profile = await getUserProfile(userId)
		
		if (!profile) {
			// Create profile if it doesn't exist
			const createdProfile = await upsertUserProfile(session.user)
			return NextResponse.json({ profile: createdProfile })
		}
		
		return NextResponse.json({ profile })
		
	} catch (error) {
		console.error('Error fetching user profile:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// POST /api/users/profile - Create/update user profile (called on login)
export async function POST(request: NextRequest) {
	try {
		const session = await auth()
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		const body = await request.json()
		const sessionUser = { ...session.user, ...body } as User & { provider?: string }
		
		const profile = await upsertUserProfile(sessionUser)
		
		return NextResponse.json({
			profile,
			message: 'Profile updated successfully'
		})
		
	} catch (error) {
		console.error('Error updating user profile:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
	try {
		const session = await auth()
		
		if (!session?.user) {
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}
		
		const body = await request.json()
		const validatedData = updateUserProfileSchema.parse(body)
		
		const userId = session.user.id || session.user.email!
		
		// Update profile (users can only update their own profile)
		const { createClient } = await import('@/lib/supabase/server')
		const supabase = await createClient()
		
		const { data: updatedProfile, error } = await (supabase as any)
			.from('user_profiles')
			.update({
				...validatedData,
				updated_at: new Date().toISOString()
			})
			.eq('user_id', userId)
			.select()
			.single()
		
		if (error) {
			console.error('Error updating profile:', error)
			return NextResponse.json(
				{ error: 'Failed to update profile' },
				{ status: 500 }
			)
		}
		
		return NextResponse.json({
			profile: updatedProfile,
			message: 'Profile updated successfully'
		})
		
	} catch (error) {
		console.error('Error updating user profile:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}