import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/lib/database'

// Debug endpoint to check variants in database
export async function GET(_request: NextRequest) {
  try {
    const { supabase, userId } = await getAuthenticatedSupabase()
    
    console.log('[DEBUG] User ID:', userId)
    
    // Get all checks for the user
    const { data: checks, error: checksError } = await supabase
      .from('checks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (checksError) {
      console.error('[DEBUG] Error fetching checks:', checksError)
      return NextResponse.json({ error: 'Failed to fetch checks', details: checksError }, { status: 500 })
    }
    
    console.log('[DEBUG] Found checks:', checks?.length || 0)
    
    // Get all variants for all checks
    const { data: variants, error: variantsError } = await supabase
      .from('check_variants')
      .select(`
        *,
        checks!inner (
          id,
          title,
          user_id
        )
      `)
      .eq('checks.user_id', userId)
      .order('created_at', { ascending: false })
    
    if (variantsError) {
      console.error('[DEBUG] Error fetching variants:', variantsError)
      return NextResponse.json({ error: 'Failed to fetch variants', details: variantsError }, { status: 500 })
    }
    
    console.log('[DEBUG] Found variants:', variants?.length || 0)
    
    // Get variant answers if the table exists
    const { data: variantAnswers, error: answersError } = await supabase
      .from('variant_answers')
      .select(`
        *,
        check_variants!inner (
          id,
          name,
          check_id,
          checks!inner (
            user_id
          )
        )
      `)
      .eq('check_variants.checks.user_id', userId)
      .order('question_number', { ascending: true })
    
    // Don't fail if variant_answers table doesn't exist
    if (answersError && !answersError.message?.includes('does not exist')) {
      console.error('[DEBUG] Error fetching variant answers:', answersError)
    }
    
    return NextResponse.json({
      debug: {
        userId,
        totalChecks: checks?.length || 0,
        totalVariants: variants?.length || 0,
        totalVariantAnswers: variantAnswers?.length || 0
      },
      checks: checks || [],
      variants: variants || [],
      variantAnswers: variantAnswers || []
    })
    
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error }, 
      { status: 500 }
    )
  }
}