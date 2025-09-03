/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth'
import { createClient, setUserContext } from '@/lib/supabase/server'
import { UserProfile } from '@/types/check'
import type { User } from 'next-auth'

// Get authenticated Supabase client with user context
export async function getAuthenticatedSupabase() {
	const session = await auth()
	
	if (!session?.user) {
		throw new Error('Unauthorized')
	}

	const supabase = await createClient()
	const userId = session.user.id || session.user.email!
	
	console.log('[DATABASE] Setting user context for RLS:', { userId, userEmail: session.user.email })
	console.log('[DATABASE] Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
	
	// Устанавливаем email пользователя для RLS политик
	// Note: RLS is currently disabled, so this is commented out
	// if (session.user.email) {
	//		await supabase.rpc('set_config', [
	//			'request.jwt.claims',
	//			JSON.stringify({ email: session.user.email })
	//		])
	// }
	
	return { supabase, userId, user: session.user }
}

// Create or update user profile on login
export async function upsertUserProfile(sessionUser: User & { provider?: string }) {
	// Use service role client to bypass RLS for profile creation
	const supabase = await createClient()
	const userId = sessionUser.id || sessionUser.email
	
	console.log('Upserting user profile:', { userId, email: sessionUser.email, provider: sessionUser.provider })
	
	if (!userId || !sessionUser.email) {
		console.error('Missing userId or email for profile creation')
		return null
	}

	const profileData = {
		user_id: userId,
		email: sessionUser.email,
		name: sessionUser.name || null,
		avatar_url: sessionUser.image || null,
		provider: (sessionUser.provider as 'google' | 'yandex') || null,
		last_login_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	}

	// Use email as the conflict resolution key instead of user_id
	const { data, error } = await (supabase as any)
		.from('user_profiles')
		.upsert(profileData, { 
			onConflict: 'email', // Changed from 'user_id' to 'email'
			ignoreDuplicates: false 
		})
		.select()
		.single()

	if (error) {
		console.error('Error upserting user profile:', error)
		return null
	}

	console.log('User profile created/updated successfully:', data)
	return data as UserProfile
}

// Check if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('user_profiles')
		.select('role')
		.eq('user_id', userId)
		.single()

	if (error || !data) {
		return false
	}

	return (data as { role: string }).role === 'admin'
}

// Get user profile by user_id
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user profile:', error)
		return null
	}

	return data as UserProfile
}