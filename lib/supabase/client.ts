import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
	if (supabaseClient) {
		return supabaseClient
	}

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!supabaseUrl || !supabaseKey) {
		throw new Error('Missing Supabase environment variables')
	}

	supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseKey)
	
	return supabaseClient
}

export const supabase = createClient()