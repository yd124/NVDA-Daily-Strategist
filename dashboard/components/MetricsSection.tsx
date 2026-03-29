'use client'

import { DailyEntry } from '@/lib/types'

interface MetricsSectionProps {
  entry: DailyEntry
  recentScores: Array<{ date: string; attention: number | null; thesis_risk: number | null }>
}

function fmt(val: number | null, decimals = 1, suffix = ''): string {
  if (val === null || val === undefined) return 'N/A'
  return `${val.toFixed(decimals)}${suffix}`
}

function pctColor(val: number | null, inverse = false): string {
  if (val === null) return 'var(--text-dim)'
  const positive = inverse ? val < 0 : val > 0
  if (positive) return 'var(--green)'
  if ((!inverse && val < 0) || (inverse && val > 0)) return 'var(--red)'
  return 'var(--text-dim)'
}

// ─── 7-day Score History Bars ────────────────────────────────────────────────
function ScoreHistoryBars({
  recentScores,
  todayDate,
}: {
  recentScores: Array<{ date: string; attention: number | null; thesis_risk: number | null }>
  todayDate: string
}) {
  const last7 = recentScores.slice(0, 7).reverse()

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '12px',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        7-Day Score History
      </div>
      <div
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-end',
          height: '64px',
        }}
      >
        {last7.map((s, i) => {
          const isToday = s.date === todayDate
          const attn = s.attention ?? 0
          const risk = s.thesis_risk ?? 0
          const attnH = Math.max(4, (attn / 10) * 60)
          const riskH = Math.max(2, (risk / 10) * 60)

          return (
            <div
              key={s.date}
              title={`${s.date}\nAttention: ${s.attention ?? 'N/A'}\nThesis Risk: ${s.thesis_risk ?? 'N/A'}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'default',
              }}
            >
              {/* Bar stack */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                {/* Attention bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${attnH}px`,
                    background: isToday ? 'var(--orange)' : 'var(--orange-mid)',
                    borderRadius: '2px 2px 0 0',
                    transformOrigin: 'bottom',
                    animation: `growBar 0.6s ease ${i * 0.05}s both`,
                    border: isToday ? '1px solid var(--orange)' : '1px solid var(--border)',
                  }}
                />
                {/* Thesis risk overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '25%',
                    width: '50%',
                    height: `${riskH}px`,
                    background: 'rgba(26, 122, 66, 0.5)',
                    borderRadius: '1px 1px 0 0',
                    transformOrigin: 'bottom',
                    animation: `growBar 0.6s ease ${i * 0.05 + 0.1}s both`,
                  }}
                />
              </div>
              {/* Date label */}
              <div
                style={{
                  fontSize: '9px',
                  color: isToday ? 'var(--orange)' : 'var(--text-muted)',
                  fontFamily: "'DM Mono', monospace",
                  fontWeight: isToday ? 700 : 400,
                }}
              >
                {s.date.slice(5).replace('-', '/')}
              </div>
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '8px',
          fontSize: '10px',
          color: 'var(--text-muted)',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              background: 'var(--orange-mid)',
              border: '1px solid var(--border)',
              borderRadius: '1px',
            }}
          />
          Attention
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              background: 'rgba(26,122,66,0.5)',
              borderRadius: '1px',
            }}
          />
          Thesis Risk
        </span>
      </div>
    </div>
  )
}

// ─── Peer Pre-Market Comparison ───────────────────────────────────────────────
function PeerComparison({ entry }: { entry: DailyEntry }) {
  const ms = entry.market_snapshot
  const peers = ms?.peers || {}

  const rows = [
    { label: 'NVDA', pct: ms?.nvda_premarket_pct ?? null, highlight: true },
    { label: 'AMD', pct: peers['AMD']?.pct ?? null, highlight: false },
    { label: 'SOXX', pct: peers['SOXX']?.pct ?? null, highlight: false },
    { label: 'AVGO', pct: peers['AVGO']?.pct ?? null, highlight: false },
    { label: 'TSM', pct: peers['TSM']?.pct ?? null, highlight: false },
    { label: 'QQQ', pct: peers['QQQ']?.pct ?? null, highlight: false },
  ]

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.pct ?? 0)), 2)

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '12px',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Pre-Market Peers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row) => {
          const pct = row.pct ?? 0
          const fillPct = (Math.abs(pct) / maxAbs) * 100
          const isPos = pct >= 0

          return (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 8px',
                background: row.highlight ? 'var(--orange-pale)' : 'transparent',
                borderRadius: '3px',
                border: row.highlight ? '1px solid rgba(232,64,0,0.2)' : '1px solid transparent',
              }}
            >
              <div
                style={{
                  width: '36px',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'DM Mono', monospace",
                  color: row.highlight ? 'var(--orange)' : 'var(--text-mid)',
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: '6px',
                  background: 'var(--bg-deep)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${fillPct}%`,
                    background: row.highlight
                      ? 'var(--orange)'
                      : isPos
                      ? 'var(--green)'
                      : 'var(--red)',
                    borderRadius: '3px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
              <div
                style={{
                  width: '54px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'DM Mono', monospace",
                  color: row.highlight
                    ? 'var(--orange)'
                    : pctColor(row.pct),
                }}
              >
                {row.pct !== null
                  ? `${row.pct >= 0 ? '+' : ''}${row.pct.toFixed(2)}%`
                  : 'N/A'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Context Metrics Grid ─────────────────────────────────────────────────────
function ContextMetricsGrid({ entry }: { entry: DailyEntry }) {
  const ctx = entry.market_snapshot?.context_metrics

  function metricColor(val: number | null, good: 'positive' | 'negative' | 'neutral' = 'neutral'): string {
    if (val === null) return 'var(--text-muted)'
    if (good === 'positive') return val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-mid)'
    if (good === 'negative') return val < 0 ? 'var(--green)' : val > 0 ? 'var(--red)' : 'var(--text-mid)'
    return 'var(--text-mid)'
  }

  const cells = [
    {
      label: 'Volume vs 30d Avg',
      value: ctx?.volume_vs_30d_avg_pct !== null && ctx?.volume_vs_30d_avg_pct !== undefined
        ? `${ctx.volume_vs_30d_avg_pct >= 0 ? '+' : ''}${ctx.volume_vs_30d_avg_pct.toFixed(1)}%`
        : 'N/A',
      color: metricColor(ctx?.volume_vs_30d_avg_pct ?? null, 'positive'),
      sublabel: 'relative volume',
    },
    {
      label: 'Impl. Volatility',
      value: ctx?.implied_volatility !== null && ctx?.implied_volatility !== undefined
        ? `${ctx.implied_volatility.toFixed(1)}%`
        : 'N/A',
      color: 'var(--text-mid)',
      sublabel: '30-day IV',
    },
    {
      label: 'Rel. Strength 3M',
      value: ctx?.relative_strength_3m_pct !== null && ctx?.relative_strength_3m_pct !== undefined
        ? `${ctx.relative_strength_3m_pct >= 0 ? '+' : ''}${ctx.relative_strength_3m_pct.toFixed(1)}%`
        : 'N/A',
      color: metricColor(ctx?.relative_strength_3m_pct ?? null, 'positive'),
      sublabel: 'price return',
    },
    {
      label: '52W Position',
      value: ctx?.week_52_position_pct !== null && ctx?.week_52_position_pct !== undefined
        ? `${ctx.week_52_position_pct.toFixed(1)}%`
        : 'N/A',
      color:
        (ctx?.week_52_position_pct ?? 0) > 70
          ? 'var(--green)'
          : (ctx?.week_52_position_pct ?? 0) < 30
          ? 'var(--red)'
          : 'var(--amber)',
      sublabel: `H: ${fmt(ctx?.week_52_high ?? null, 2)} / L: ${fmt(ctx?.week_52_low ?? null, 2)}`,
    },
  ]

  return (
    <div>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '12px',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Context Metrics
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.label}
            style={{
              padding: '10px 12px',
              background: 'var(--bg-deep)',
              borderRadius: '4px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginBottom: '4px',
                fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.05em',
              }}
            >
              {cell.label}
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                fontFamily: "'Barlow Condensed', sans-serif",
                color: cell.color,
                lineHeight: 1.1,
              }}
            >
              {cell.value}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginTop: '2px',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {cell.sublabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MetricsSection({ entry, recentScores }: MetricsSectionProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        animation: 'fadeSlide 0.5s ease 0.1s both',
      }}
    >
      <ScoreHistoryBars recentScores={recentScores} todayDate={entry.date} />
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <PeerComparison entry={entry} />
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <ContextMetricsGrid entry={entry} />
      </div>
    </div>
  )
}
