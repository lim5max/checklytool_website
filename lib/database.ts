/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/lib/auth'
import { createClient, setUserContext } from '@/lib/supabase/server'
import { UserProfile } from '@/types/check'
import type { User } from 'next-auth'

// Get authenticated Supabase client with user context
export async function getAuthenticatedSupabase() {
	const session = await auth()
	
	console.log('[DATABASE] Session check:', { 
		hasSession: !!session, 
		hasUser: !!session?.user,
		userEmail: session?.user?.email,
		userId: session?.user?.id 
	})
	
	if (!session?.user) {
		console.log('[DATABASE] No session or user, throwing Unauthorized')
		throw new Error('Unauthorized')
	}

	const supabase = await createClient()
	const userId = session.user.email! // Always use email as consistent identifier
	
	console.log('[DATABASE] Setting user context for RLS:', { userId, userEmail: session.user.email })
	console.log('[DATABASE] Using service role key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
	
	// Устанавливаем контекст пользователя для RLS политик
	console.log('[DATABASE] Setting up RLS context for user:', session.user.email)
	
	try {
		console.log('[DATABASE] Service role mode - RLS will be bypassed')
		console.log('[DATABASE] User context:', { email: session.user.email, id: session.user.id })

		// В режиме service role мы можем обойти RLS, но сохраним логику для будущего использования
		if (session.user.email) {
			console.log('[DATABASE] Setting request.jwt.claims with email:', session.user.email)

			// Создаем JWT-подобный объект с необходимыми claims
			const jwtClaims = {
				email: session.user.email,
				sub: session.user.id || session.user.email,
				role: 'authenticated',
				aud: 'authenticated'
			}

			try {
				// Пытаемся установить через set_config для доступа к auth.jwt()
				const { data, error } = await (supabase as any).rpc('set_config', {
					setting_name: 'request.jwt.claims',
					new_value: JSON.stringify(jwtClaims),
					is_local: true
				})

				if (error) {
					console.log('[DATABASE] RPC set_config failed, trying direct approach:', error.message)

					// Альтернативный метод через SQL - убираем так как функция не существует
					console.log('[DATABASE] Fallback to direct SQL not available')
				} else {
					console.log('[DATABASE] JWT claims set successfully via RPC')
				}
			} catch (setConfigError) {
				console.log('[DATABASE] All set_config methods failed:', setConfigError)
				// Это нормально для service role - продолжаем
			}
		}

		console.log('[DATABASE] Context setup completed - using service role bypass')
	} catch (error) {
		console.error('[DATABASE] Error during context setup:', error)
		// В любом случае продолжаем - service role обойдет все проблемы
		console.log('[DATABASE] Continuing with service role bypass')
	}
	
	return { supabase, userId, user: session.user }
}

// Create or update user profile on login
export async function upsertUserProfile(sessionUser: User & { provider?: string }) {
	// Use service role client to bypass RLS for profile creation
	const supabase = await createClient()
	const userId = sessionUser.email // Always use email as consistent identifier
	
	console.log('Upserting user profile:', { userId, email: sessionUser.email, provider: sessionUser.provider })
	
	if (!userId || !sessionUser.email) {
		console.error('Missing userId or email for profile creation')
		return null
	}

	const profileData = {
		user_id: sessionUser.email, // Use email as user_id for consistency
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