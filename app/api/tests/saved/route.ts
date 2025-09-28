import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('API: Starting to fetch saved tests')

    const supabase = await createClient()
    console.log('API: Supabase client created')

    try {
      const { data: tests, error: testsError } = await supabase
        .from('generated_tests')
        .select('id, title, description, created_at, questions')
        .eq('user_id', session.user.email)
        .order('created_at', { ascending: false })

      if (testsError) {
        console.log('API: Error querying generated_tests:', testsError)
        return NextResponse.json(
          { error: 'Failed to fetch tests' },
          { status: 500 }
        )
      }

      const formattedTests = (tests || []).map((test) => ({
        id: test.id,
        title: test.title,
        description: test.description || '',
        created_at: test.created_at,
        question_count: Array.isArray(test.questions) ? test.questions.length : 0
      }))

      console.log('API: Returning tests from generated_tests:', formattedTests)
      return NextResponse.json(formattedTests)

    } catch (queryError) {
      console.log('API: Query failed:', queryError)
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}