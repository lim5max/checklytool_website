import { NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
	try {
		const session = await auth()

		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { data: plans, error } = await supabase
			.from('subscription_plans')
			.select('*')
			.eq('is_active', true)
			.order('check_credits', { ascending: true })

		if (error) {
			console.error('Error fetching plans:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch plans' },
				{ status: 500 }
			)
		}

		return NextResponse.json({ plans })
	} catch (error) {
		console.error('Error in plans API:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
