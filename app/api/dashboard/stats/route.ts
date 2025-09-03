import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

export async function GET() {
  try {
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get total checks count
    const { count: total_checks } = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get total submissions count
    const { count: total_submissions } = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)

    // Get completed submissions count
    const { count: completed_submissions } = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)
      .not('evaluation_result', 'is', null)

    // Calculate average completion rate
    const avg_completion_rate = (total_submissions || 0) > 0 
      ? Math.round(((completed_submissions || 0) / (total_submissions || 1)) * 100)
      : 0

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recent_submissions } = await supabase
      .from('student_submissions')
      .select('*, checks!inner(*)', { count: 'exact', head: true })
      .eq('checks.user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())

    const { count: recent_checks } = await supabase
      .from('checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())

    return NextResponse.json({
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
    })
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}