import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[TEST-SIMPLE] Simple GET endpoint working')
  return NextResponse.json({ 
    success: true,
    message: 'Simple GET endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  console.log('[TEST-SIMPLE] Simple POST endpoint working')
  return NextResponse.json({ 
    success: true,
    message: 'Simple POST endpoint working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}