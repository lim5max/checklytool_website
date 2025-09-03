import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

// Get recent submissions for testing
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get recent submissions with check info
    const { data: submissions, error } = await supabase
      .from('student_submissions')
      .select(`
        *,
        checks!inner (title)
      `)
      .eq('checks.user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      submissions: submissions || []
    })
    
  } catch (error) {
    console.error('Error fetching recent submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}