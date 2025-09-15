import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

export async function GET() {
  try {
    console.log('[DASHBOARD_STATS] Starting stats request...')
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    
    console.log('[DASHBOARD_STATS] Authentication check:')
    console.log('  - User exists:', !!user)
    console.log('  - User ID:', userId)
    console.log('  - User email:', user?.email)
    
    if (!user) {
      console.log('[DASHBOARD_STATS] Authentication failed - no user')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[DASHBOARD_STATS] Querying total checks...')
    // Get total checks count
    const checksQuery = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    console.log('[DASHBOARD_STATS] Checks query result:', {
      count: checksQuery.count,
      error: checksQuery.error,
      status: checksQuery.status,
      statusText: checksQuery.statusText
    })

    console.log('[DASHBOARD_STATS] Querying total submissions...')
    // Get total submissions count
    const submissionsQuery = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)
    
    console.log('[DASHBOARD_STATS] Submissions query result:', {
      count: submissionsQuery.count,
      error: submissionsQuery.error,
      status: submissionsQuery.status,
      statusText: submissionsQuery.statusText
    })
    
    // If there's an error, try a simpler query to debug
    if (submissionsQuery.error) {
      console.log('[DASHBOARD_STATS] Submissions query failed, trying direct query...')
      const directQuery = await supabase
        .from('student_submissions')
        .select('id, check_id', { count: 'exact', head: true })
      
      console.log('[DASHBOARD_STATS] Direct submissions query:', {
        count: directQuery.count,
        error: directQuery.error
      })
      
      // Also try to get user's check IDs first
      const userChecks = await supabase
        .from('checks')
        .select('id')
        .eq('user_id', userId)
      
      console.log('[DASHBOARD_STATS] User checks:', {
        data: userChecks.data,
        error: userChecks.error,
        count: userChecks.data?.length
      })
    }

    const { count: total_checks } = checksQuery
    const { count: total_submissions } = submissionsQuery

    console.log('[DASHBOARD_STATS] Querying completed submissions...')
    // Get completed submissions count
    const completedQuery = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)
      .not('evaluation_result', 'is', null)

    console.log('[DASHBOARD_STATS] Completed submissions query result:', {
      count: completedQuery.count,
      error: completedQuery.error
    })

    const { count: completed_submissions } = completedQuery

    // Calculate average completion rate
    const avg_completion_rate = (total_submissions || 0) > 0 
      ? Math.round(((completed_submissions || 0) / (total_submissions || 1)) * 100)
      : 0

    console.log('[DASHBOARD_STATS] Calculated completion rate:', {
      total_submissions,
      completed_submissions,
      avg_completion_rate
    })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    console.log('[DASHBOARD_STATS] Querying recent activity since:', sevenDaysAgo.toISOString())

    const recentSubmissionsQuery = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())

    const recentChecksQuery = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())

    console.log('[DASHBOARD_STATS] Recent activity results:', {
      recent_submissions: recentSubmissionsQuery.count,
      recent_checks: recentChecksQuery.count,
      submissions_error: recentSubmissionsQuery.error,
      checks_error: recentChecksQuery.error
    })

    const { count: recent_submissions } = recentSubmissionsQuery
    const { count: recent_checks } = recentChecksQuery

    const finalStats = {
      stats: {
        total_checks: total_checks || 0,
        total_submissions: total_submissions || 0,
        completed_submissions: completed_submissions || 0,
        avg_completion_rate,
        recent_activity: {
          submissions_last_7_days: recent_submissions || 0,
          checks_last_7_days: recent_checks || 0
        }
      }
    }

    console.log('[DASHBOARD_STATS] Final response:', finalStats)
    return NextResponse.json(finalStats)
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}