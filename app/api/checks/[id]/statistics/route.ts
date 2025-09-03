import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

interface StatisticsParams {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<StatisticsParams> }
) {
  try {
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    const { id: checkId } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify check ownership
    const { data: check } = await supabase
      .from('checks')
      .select('id, user_id')
      .eq('id', checkId)
      .eq('user_id', userId)
      .single()

    if (!check) {
      return NextResponse.json(
        { error: 'Check not found' },
        { status: 404 }
      )
    }

    // Get all submissions for this check
    const { data: submissions } = await supabase
      .from('student_submissions')
      .select('*')
      .eq('check_id', checkId)

    if (!submissions) {
      return NextResponse.json(
        { error: 'Error fetching submissions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const total_submissions = submissions.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed_submissions = submissions.filter((s: any) => s.evaluation_result !== null).length
    const pending_submissions = total_submissions - completed_submissions

    // Calculate grade distribution
    const grade_distribution: Record<string, number> = { '2': 0, '3': 0, '4': 0, '5': 0 }
    let totalScore = 0
    let scoredSubmissions = 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    submissions.forEach((submission: any) => {
      if (submission.evaluation_result?.grade) {
        const grade = submission.evaluation_result.grade.toString()
        if (grade_distribution[grade] !== undefined) {
          grade_distribution[grade]++
        }
      }
      
      if (submission.evaluation_result?.percentage) {
        totalScore += submission.evaluation_result.percentage
        scoredSubmissions++
      }
    })

    const average_score = scoredSubmissions > 0 ? totalScore / scoredSubmissions : undefined
    const completion_rate = total_submissions > 0 ? (completed_submissions / total_submissions) * 100 : 0

    return NextResponse.json({
      statistics: {
        total_submissions,
        completed_submissions,
        pending_submissions,
        average_score,
        grade_distribution,
        completion_rate
      }
    })
    
  } catch (error) {
    console.error('Error fetching check statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}