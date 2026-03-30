import fs from 'fs'
import path from 'path'
import { DailyEntry } from './types'

// Path goes up from dashboard/ to data/
const LOG_PATH = path.join(process.cwd(), '..', 'data', 'nvda_daily_log.json')

function readLogFile(): DailyEntry[] {
  try {
    if (!fs.existsSync(LOG_PATH)) {
      return []
    }
    const raw = fs.readFileSync(LOG_PATH, 'utf-8')
    if (!raw.trim()) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed as DailyEntry[]
  } catch {
    return []
  }
}

export function getAllReports(): DailyEntry[] {
  const reports = readLogFile()
  // Deduplicate by date, keeping the entry with the latest run_timestamp
  const byDate = new Map<string, DailyEntry>()
  for (const r of reports) {
    const existing = byDate.get(r.date)
    if (!existing || r.run_timestamp > existing.run_timestamp) {
      byDate.set(r.date, r)
    }
  }
  // Sort by date descending (most recent first)
  return Array.from(byDate.values()).sort((a, b) => {
    if (a.date < b.date) return 1
    if (a.date > b.date) return -1
    return 0
  })
}

export function getLatestReport(): DailyEntry | null {
  const reports = getAllReports()
  return reports.length > 0 ? reports[0] : null
}

export function getReportByDate(date: string): DailyEntry | null {
  const reports = getAllReports()
  return reports.find((r) => r.date === date) ?? null
}

export function getRecentScores(
  n: number = 30
): Array<{ date: string; attention: number | null; thesis_risk: number | null }> {
  const reports = getAllReports()
  return reports.slice(0, n).map((r) => ({
    date: r.date,
    attention: r.scores?.attention ?? null,
    thesis_risk: r.scores?.thesis_risk ?? null,
  }))
}
