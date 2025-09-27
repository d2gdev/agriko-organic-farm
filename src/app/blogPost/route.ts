import { NextResponse } from 'next/server'

export async function GET() {
  // Return empty JSON for schema routes that the Studio tries to access
  return NextResponse.json({})
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}