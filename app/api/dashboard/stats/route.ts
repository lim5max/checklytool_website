import { NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

export async function GET(_request: Request) {
  try {
    console.log('[DASHBOARD_STATS] Starting stats request...')
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    
    console.log('[DASHBOARD_STATS] Authentication check:')
    console.log('  - User exists:', !!user)
    console.log('  - User ID:', userId)
    console.log('  - User email:', user?.email)
    console.log('  - User name:', user?.name)
    console.log('  - User provider:', (user as { provider?: string })?.provider)
    
    if (!user) {
      console.log('[DASHBOARD_STATS] Authentication failed - no user')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[DASHBOARD_STATS] Executing optimized parallel queries...')
    
    // Execute all queries in parallel for better performance
    const [checksQuery, submissionsQuery] = await Promise.all([
      // Get total checks count
      supabase
        .from('checks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Get total submissions count  
      supabase
        .from('student_submissions')
        .select('*, checks!inner(*)', { count: 'exact', head: true })
        .eq('checks.user_id', userId)
    ])
    
    console.log('[DASHBOARD_STATS] Parallel query results:', {
      checks: { count: checksQuery.count, error: checksQuery.error },
      submissions: { count: submissionsQuery.count, error: submissionsQuery.error }
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
      
      // Проверим, может есть submissions под другими user_id
      const allSubmissions = await supabase
        .from('student_submissions')
        .select('id, check_id, student_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      
      console.log('[DASHBOARD_STATS] Latest 10 submissions (any user):', {
        data: allSubmissions.data,
        error: allSubmissions.error
      })
    }

    const { count: total_checks } = checksQuery
    const { count: total_submissions } = submissionsQuery

    console.log('[DASHBOARD_STATS] Querying additional stats in parallel...')
    
    // Execute remaining queries in parallel
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const [completedQuery, recentSubmissionsQuery, recentChecksQuery] = await Promise.all([
      // Get completed submissions count
      supabase
        .from('student_submissions')
        .select('*, checks!inner(*)', { count: 'exact', head: true })
        .eq('checks.user_id', userId)
        .not('evaluation_result', 'is', null),
      
      // Get recent submissions count
      supabase
        .from('student_submissions')
        .select('*, checks!inner(*)', { count: 'exact', head: true })
        .eq('checks.user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString()),
      
      // Get recent checks count
      supabase
        .from('checks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
    ])

    const { count: completed_submissions } = completedQuery
    const { count: recent_submissions } = recentSubmissionsQuery  
    const { count: recent_checks } = recentChecksQuery

    // Calculate average completion rate
    const avg_completion_rate = (total_submissions || 0) > 0 
      ? Math.round(((completed_submissions || 0) / (total_submissions || 1)) * 100)
      : 0

    console.log('[DASHBOARD_STATS] Final calculation results:', {
      total_checks,
      total_submissions,
      completed_submissions,
      avg_completion_rate,
      recent_submissions,
      recent_checks
    })

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