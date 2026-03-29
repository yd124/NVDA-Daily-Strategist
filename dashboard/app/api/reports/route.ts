import { NextResponse } from 'next/server'
import { getAllReports } from '@/lib/reports'

export async function GET() {
  const reports = getAllReports()
  return NextResponse.json(reports)
}
