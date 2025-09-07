/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

// Create a test submission for evaluation testing
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId, user } = await getAuthenticatedSupabase()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // First, check if user has any checks
    const { data: checks, error: checksError } = await supabase
      .from('checks')
      .select('*')
      .eq('user_id', userId)
      .limit(1)

    if (checksError) {
      console.error('Error fetching checks:', checksError)
      return NextResponse.json(
        { error: 'Failed to fetch checks' },
        { status: 500 }
      )
    }

    if (!checks || checks.length === 0) {
      return NextResponse.json(
        { error: 'No checks found. Please create a check first.' },
        { status: 400 }
      )
    }

    const checkId = (checks[0] as { id: string }).id

    // Create a test submission
    const { data: submission, error: submissionError } = await (supabase as any)
      .from('student_submissions')
      .insert({
        check_id: checkId,
        student_name: 'Test Student',
        student_class: '10A',
        submission_images: [
          'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=800&h=1000&fit=crop',
          'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=800&h=1000&fit=crop'
        ],
        status: 'pending'
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create test submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      submission,
      message: 'Test submission created successfully'
    })
    
  } catch (error) {
    console.error('Error creating test submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}