import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@/lib/auth'

export async function GET() {
	try {
		const session = await auth()

		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		}

		const supabase = await createClient()

		// Получаем данные пользователя с подпиской
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: userProfile, error: userError } = await (supabase as any)
			.from('user_profiles')
			.select(`
				email,
				name,
				subscription_plan_id,
				check_balance,
				subscription_started_at,
				subscription_expires_at,
				created_at
			`)
			.eq('email', session.user.email)
			.single()

		if (userError) {
			return NextResponse.json({ error: userError.message }, { status: 500 })
		}

		// Получаем информацию о плане подписки
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: plan } = await (supabase as any)
			.from('subscription_plans')
			.select('name, display_name, check_credits, price')
			.eq('id', userProfile.subscription_plan_id)
			.single()

		return NextResponse.json({
			user: userProfile,
			plan: plan || null,
		})

	} catch (error) {
		console.error('[DEBUG] Error:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
