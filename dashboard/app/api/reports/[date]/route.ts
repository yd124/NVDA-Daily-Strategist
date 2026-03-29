import { NextResponse } from 'next/server'
import { getReportByDate } from '@/lib/reports'

export async function GET(
  _req: Request,
  { params }: { params: { date: string } }
) {
  const report = getReportByDate(params.date)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}
