#!/usr/bin/env ts-node

/**
 * Test script for AI evaluation system
 * Run with: npx ts-node scripts/test-ai-system.ts
 */

import { analyzeStudentWork } from '../lib/openrouter'

async function testAI() {
  console.log('Testing AI evaluation system...')
  
  try {
    // Test with sample data
    const testImages = [
      'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=800&h=1000&fit=crop'
    ]
    
    const referenceAnswers = {
      '1': 'A',
      '2': 'Paris',
      '3': 'x = 5'
    }
    
    console.log('Sending test request to OpenRouter...')
    
    const result = await analyzeStudentWork(
      testImages,
      referenceAnswers,
      null, // No reference images
      1 // Single variant
    )
    
    console.log('AI Analysis Result:')
    console.log(JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testAI()