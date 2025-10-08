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

		const { data: history, error } = await supabase
			.from('check_usage_history')
			.select('*')
			.eq('user_id', session.user.email)
			.order('created_at', { ascending: false })
			.limit(50)

		if (error) {
			console.error('Error fetching usage history:', error)
			return NextResponse.json(
				{ error: 'Failed to fetch usage history' },
				{ status: 500 }
			)
		}

		return NextResponse.json({ history })
	} catch (error) {
		console.error('Error in usage history API:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
