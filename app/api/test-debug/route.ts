import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[TEST-DEBUG] GET request received')
  return NextResponse.json({ 
    message: 'Test debug endpoint working',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  console.log('[TEST-DEBUG] POST request received')
  return NextResponse.json({ 
    message: 'Test debug POST working',
    timestamp: new Date().toISOString()
  })
}