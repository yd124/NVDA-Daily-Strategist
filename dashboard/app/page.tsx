export const dynamic = 'force-dynamic'

import { getLatestReport, getRecentScores } from '@/lib/reports'
import ScoreHero from '@/components/ScoreHero'
import TickerTape from '@/components/TickerTape'
import MetricsSection from '@/components/MetricsSection'
import DriversList from '@/components/DriversList'
import InterpretationBlock from '@/components/InterpretationBlock'
import RightPanel from '@/components/RightPanel'
import type { DailyEntry } from '@/lib/types'

function fmt(n: number | null | undefined, decimals = 2, suffix = '%'): string {
  if (n == null) return 'N/A'
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)}${suffix}`
}

export default function HomePage() {
  const entry = getLatestReport()
  const recentScores = getRecentScores(7)

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!entry) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px',
      }}>
        <div style={{ maxWidth: 540, textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'var(--orange)',
            marginBottom: 16,
          }}>NVDA Daily Strategist</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 36,
            fontWeight: 900,
            color: 'var(--text)',
            marginBottom: 24,
            lineHeight: 1,
          }}>No Report Available Yet</div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color: 'var(--text-dim)',
            lineHeight: 1.8,
            marginBottom: 28,
          }}>
            Run the agent pipeline to generate today&apos;s report.
          </div>
          <div style={{
            background: 'var(--bg-invert)',
            padding: '16px 20px',
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: 'rgba(255,255,255,0.6)',
            textAlign: 'left',
            lineHeight: 1.9,
          }}>
            <div style={{ color: 'var(--orange)', marginBottom: 4 }}># Run manually</div>
            <div>cd /Users/yokeroil/Documents/NVDA/agent</div>
            <div>python main.py --force</div>
          </div>
        </div>
      </div>
    )
  }

  const { scores, market_snapshot, report, meta, trading_day_type, date } = entry

  // ── Derived display values ─────────────────────────────────────────────────
  const sessionLabel = trading_day_type === 'half' ? 'NYSE · HALF SESSION' : 'NYSE · FULL SESSION'
  const dateDisplay = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  }).toUpperCase()

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '72px 1fr 360px',
      gridTemplateRows: 'auto auto 1fr auto',
      minHeight: '100vh',
      fontFamily: "'Barlow Condensed', sans-serif",
    }}>

      {/* ── ACCENT BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        gridRow: '1 / -1',
        background: 'var(--orange)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 0 24px',
        position: 'relative',
      }}>
        <span style={{
          fontSize: 17, fontWeight: 900, letterSpacing: '0.1em',
          color: 'white', writingMode: 'vertical-rl', transform: 'rotate(180deg)',
        }}>NVDA</span>
        <span style={{
          fontSize: 8, fontWeight: 600, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)', writingMode: 'vertical-rl',
          transform: 'rotate(180deg)', marginTop: 16,
        }}>Signal</span>
        <span style={{
          fontSize: 8, fontWeight: 400, letterSpacing: '0.15em',
          color: 'rgba(255,255,255,0.35)', writingMode: 'vertical-rl',
          transform: 'rotate(180deg)', marginTop: 'auto',
          fontFamily: "'DM Mono', monospace",
        }}>{date}</span>
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        gridColumn: '2 / 4',
        borderBottom: '2px solid var(--text)',
        padding: '22px 36px 18px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        background: 'var(--bg)',
      }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 2,
          }}>Daily Signal Report</div>
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.01em' }}>
            NV<span style={{ color: 'var(--orange)' }}>DA</span>
          </div>
        </div>
        <div style={{
          textAlign: 'right', fontFamily: "'DM Mono', monospace",
          fontSize: 11, fontWeight: 300, color: 'var(--text-dim)', lineHeight: 1.8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', color: 'var(--orange)', fontWeight: 400 }}>
            <span style={{
              width: 6, height: 6, background: 'var(--orange)', borderRadius: '50%',
              display: 'inline-block',
              animation: 'pulseDot 1.6s ease-in-out infinite',
            }} />
            PRE-MARKET ACTIVE
          </div>
          <div>{dateDisplay}</div>
          <div>{sessionLabel}</div>
        </div>
      </header>

      {/* ── TICKER TAPE ────────────────────────────────────────────────────── */}
      <TickerTape marketSnapshot={market_snapshot} />

      {/* ── MAIN BODY ──────────────────────────────────────────────────────── */}
      <main style={{
        gridColumn: '2 / 3',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 36px 48px',
      }}>
        {/* Partial data warning */}
        {meta.partial_data && (
          <div style={{
            background: 'rgba(196,122,0,0.1)',
            border: '1px solid rgba(196,122,0,0.3)',
            borderLeft: '3px solid var(--amber)',
            padding: '10px 16px',
            marginTop: 16,
            fontFamily: "'DM Mono', monospace",
            fontSize: 10,
            color: 'var(--amber)',
            letterSpacing: '0.08em',
          }}>
            ⚠ PARTIAL DATA — Failed sources: {meta.data_sources_failed.join(', ')}. Scores based on available data only.
          </div>
        )}

        <ScoreHero
          score={scores.attention}
          watchLevel={scores.watch_level}
          validationLoops={scores.validation_loops}
          confidence={scores.confidence}
          pipelineDuration={meta.pipeline_duration_seconds}
          tokensUsed={meta.tokens_used}
        />

        <MetricsSection entry={entry} recentScores={recentScores} />
        <DriversList drivers={report.top_drivers} />
        <InterpretationBlock
          interpretation={report.interpretation}
          suggestedAction={report.suggested_action}
        />
      </main>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <RightPanel entry={entry} />

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        gridColumn: '2 / 4',
        background: 'var(--bg-invert)',
        padding: '11px 36px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: "'DM Mono', monospace",
        fontSize: 9,
        fontWeight: 300,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.06em',
      }}>
        <span style={{ color: 'var(--orange)', fontWeight: 400, fontSize: 10 }}>NVDA DAILY STRATEGIST</span>
        <span>NOT INVESTMENT ADVICE · PERSONAL TOOL</span>
        <span>
          {meta.pipeline_duration_seconds}S · ~{meta.tokens_used} TOKENS
          {scores.confidence === 'low' && ' · ⚠ LOW CONFIDENCE'}
        </span>
      </footer>
    </div>
  )
}
