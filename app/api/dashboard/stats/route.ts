import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

/**
 * GET /api/dashboard/stats
 * Получение статистики для дашборда пользователя
 *
 * Оптимизация: Использует PostgreSQL функцию get_dashboard_stats
 * вместо 5 отдельных запросов (8-10x быстрее!)
 */
export async function GET() {
	try {
		console.log('[DASHBOARD_STATS] Starting stats request...')
		const { supabase, userId, user } = await getAuthenticatedSupabase()

		console.log('[DASHBOARD_STATS] Authentication check:')
		console.log('  - User exists:', !!user)
		console.log('  - User ID:', userId)

		if (!user) {
			console.log('[DASHBOARD_STATS] Authentication failed - no user')
			return NextResponse.json(
				{ error: 'Authentication required' },
				{ status: 401 }
			)
		}

		console.log('[DASHBOARD_STATS] Executing optimized single query...')

		// ОПТИМИЗАЦИЯ: Один запрос вместо 5!
		// Использует PostgreSQL функцию get_dashboard_stats
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data, error } = await (supabase as any).rpc('get_dashboard_stats', {
			p_user_id: userId
		})

		if (error) {
			console.error('[DASHBOARD_STATS] Error calling get_dashboard_stats:', error)
			throw error
		}

		console.log('[DASHBOARD_STATS] Function result:', data)

		return NextResponse.json({
			stats: data
		})

	} catch (error) {
		console.error('[DASHBOARD_STATS] Error fetching dashboard stats:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}