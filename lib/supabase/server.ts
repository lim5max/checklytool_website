/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
	const cookieStore = await cookies()

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	// Use service role key to bypass RLS issues with NextAuth
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Missing Supabase environment variables')
	}

	return createServerClient<Database>(
		supabaseUrl,
		supabaseKey,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options)
						})
					} catch (error) {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		}
	)
}

// Helper function to set user context for RLS
export async function setUserContext(supabase: SupabaseClient<Database>, userId: string) {
	const { error } = await (supabase as any).rpc('set_config', {
		parameter: 'app.current_user_id',
		value: userId
	})
	
	if (error) {
		console.error('Error setting user context:', error)
	}
}