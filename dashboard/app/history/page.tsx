import Link from 'next/link'
import { getAllReports, getRecentScores } from '@/lib/reports'
import ScoreHistoryChart from '@/components/ScoreHistoryChart'
import type { DailyEntry } from '@/lib/types'

function watchBadgeStyle(level: string) {
  if (level === 'high') return { color: 'var(--orange)', borderColor: 'rgba(232,64,0,0.4)', background: 'var(--orange-pale)' }
  if (level === 'moderate') return { color: 'var(--amber)', borderColor: 'rgba(196,122,0,0.4)', background: 'rgba(196,122,0,0.06)' }
  return { color: 'var(--text-dim)', borderColor: 'var(--border)', background: 'var(--bg-deep)' }
}

function thesisBadgeStyle(verdict: string) {
  if (verdict === 'at_risk') return { color: 'var(--red)', borderColor: 'rgba(192,57,43,0.4)', background: 'var(--red-pale)' }
  if (verdict === 'monitor') return { color: 'var(--amber)', borderColor: 'rgba(196,122,0,0.4)', background: 'rgba(196,122,0,0.06)' }
  return { color: 'var(--green)', borderColor: 'rgba(26,122,66,0.4)', background: 'var(--green-pale)' }
}

function rowBg(entry: DailyEntry): string {
  if (entry.scores?.watch_level === 'high') return 'rgba(232,64,0,0.04)'
  if (entry.scores?.thesis_verdict === 'at_risk') return 'rgba(192,57,43,0.04)'
  return 'transparent'
}

export default function HistoryPage() {
  const reports = getAllReports()
  const recentScores = getRecentScores(30)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>

      {/* Header */}
      <header style={{
        borderBottom: '2px solid var(--text)',
        padding: '20px 36px 16px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 2 }}>
            Score History
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 0.9 }}>
            NV<span style={{ color: 'var(--orange)' }}>DA</span> Daily Strategist
          </div>
        </div>
        <Link href="/" style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 10,
          color: 'var(--orange)',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          border: '1px solid var(--orange)',
          padding: '4px 12px',
        }}>
          ← TODAY
        </Link>
      </header>

      <div style={{ padding: '28px 36px 48px', maxWidth: 1100 }}>

        {/* Chart section */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--text-dim)', paddingBottom: 10, borderBottom: '1px solid var(--border)',
            marginBottom: 16,
          }}>
            <span style={{ color: 'var(--orange)' }}>▸</span> Score Trend — Last {recentScores.length} Sessions
          </div>
          <div style={{ background: 'var(--bg-panel)', padding: '20px 16px', border: '1px solid var(--border)' }}>
            <ScoreHistoryChart scores={recentScores} />
          </div>
        </div>

        {/* Reports table */}
        <div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'var(--text-dim)', paddingBottom: 10, borderBottom: '1px solid var(--border)',
            marginBottom: 0,
          }}>
            <span style={{ color: 'var(--orange)' }}>▸</span> All Reports ({reports.length})
          </div>

          {reports.length === 0 && (
            <div style={{
              padding: '40px', textAlign: 'center',
              fontFamily: "'DM Mono', monospace", fontSize: 11,
              color: 'var(--text-muted)', letterSpacing: '0.1em',
            }}>
              No reports yet. Run the pipeline to generate your first report.
            </div>
          )}

          {/* Table header */}
          {reports.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '110px 80px 80px 90px 100px 1fr 80px',
              gap: '0 12px',
              padding: '8px 12px',
              background: 'var(--bg-raised)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 9,
              fontWeight: 400,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              borderBottom: '1px solid var(--border-hi)',
            }}>
              <span>Date</span>
              <span>Attn</span>
              <span>Risk</span>
              <span>Watch</span>
              <span>Thesis</span>
              <span>Top Driver</span>
              <span>Duration</span>
            </div>
          )}

          {reports.map((entry) => {
            const s = entry.scores
            const d = entry.report?.top_drivers?.[0]
            const wStyle = watchBadgeStyle(s?.watch_level ?? 'low')
            const tStyle = thesisBadgeStyle(s?.thesis_verdict ?? 'intact')

            return (
              <Link
                key={entry.date}
                href={`/report/${entry.date}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 80px 80px 90px 100px 1fr 80px',
                  gap: '0 12px',
                  padding: '11px 12px',
                  borderBottom: '1px solid var(--border)',
                  background: rowBg(entry),
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-mid)' }}>
                    {entry.date}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700,
                    color: s?.attention != null && s.attention >= 7 ? 'var(--orange)' : s?.attention != null && s.attention >= 5 ? 'var(--amber)' : 'var(--text-dim)',
                  }}>
                    {s?.attention?.toFixed(1) ?? '—'}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700,
                    color: s?.thesis_risk != null && s.thesis_risk >= 6 ? 'var(--red)' : s?.thesis_risk != null && s.thesis_risk >= 4 ? 'var(--amber)' : 'var(--green)',
                  }}>
                    {s?.thesis_risk?.toFixed(1) ?? '—'}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.15em', padding: '2px 6px',
                    border: '1px solid', ...wStyle,
                  }}>
                    {(s?.watch_level ?? 'low').toUpperCase()}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.12em', padding: '2px 6px',
                    border: '1px solid', ...tStyle,
                  }}>
                    {(s?.thesis_verdict ?? 'intact').replace('_', ' ').toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d?.text ?? '—'}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>
                    {entry.meta?.pipeline_duration_seconds}s
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
