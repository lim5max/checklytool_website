/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  console.log('[SIMPLE-SUBMISSION] === POST REQUEST STARTED ===')
  console.log('[SIMPLE-SUBMISSION] Request method:', request.method)
  console.log('[SIMPLE-SUBMISSION] Request URL:', request.url)
  
  try {
    console.log('[SIMPLE-SUBMISSION] Getting form data...')
    const formData = await request.formData()
    const checkId = formData.get('checkId') as string
    const studentName = formData.get('student_name') as string
    
    console.log('[SIMPLE-SUBMISSION] Form data:', { checkId, studentName })
    
    console.log('[SIMPLE-SUBMISSION] Getting authenticated supabase...')
    const { supabase, userId } = await getAuthenticatedSupabase()
    console.log('[SIMPLE-SUBMISSION] Auth successful, userId:', userId)
    
    // Create a simple submission without file upload
    console.log('[SIMPLE-SUBMISSION] Creating submission record...')
    const { data: submission, error } = await (supabase as any)
      .from('student_submissions')
      .insert({
        check_id: checkId,
        student_name: studentName,
        submission_images: ['https://example.com/test.jpg'], // Fake URL for testing
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('[SIMPLE-SUBMISSION] Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('[SIMPLE-SUBMISSION] Success:', submission)
    return NextResponse.json({ submission, message: 'Success' })
    
  } catch (error) {
    console.error('[SIMPLE-SUBMISSION] Catch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}