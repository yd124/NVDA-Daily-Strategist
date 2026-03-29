'use client'

import { DailyEntry } from '@/lib/types'

interface RightPanelProps {
  entry: DailyEntry
  recentScores?: Array<{ date: string; attention: number | null; thesis_risk: number | null }>
}

function fmt(val: number | null, dec = 2): string {
  if (val === null || val === undefined) return 'N/A'
  return val.toFixed(dec)
}

function pctStr(val: number | null): string {
  if (val === null || val === undefined) return 'N/A'
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`
}

function pctColor(val: number | null): string {
  if (val === null) return 'var(--text-dim)'
  return val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-dim)'
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-dim)',
        marginBottom: '10px',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '18px 0' }} />
}

// ─── Thesis Risk Section ──────────────────────────────────────────────────────
function ThesisRiskSection({ entry }: { entry: DailyEntry }) {
  const scores = entry.scores
  const risk = scores?.thesis_risk ?? null
  const verdict = scores?.thesis_verdict ?? 'intact'

  const verdictConfig = {
    intact: { icon: '✓', label: 'THESIS: INTACT', color: 'var(--green)', bg: 'var(--green-pale)' },
    monitor: { icon: '⚠', label: 'THESIS: MONITOR', color: 'var(--amber)', bg: '#fff4dc' },
    at_risk: { icon: '✗', label: 'THESIS: AT RISK', color: 'var(--red)', bg: 'var(--red-pale)' },
  }
  const vc = verdictConfig[verdict] ?? verdictConfig.intact

  return (
    <div>
      <SectionLabel>Thesis Risk</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
        <span
          style={{
            fontSize: '72px',
            fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
            color: vc.color,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
          }}
        >
          {risk !== null ? risk.toFixed(1) : '—'}
        </span>
        <span
          style={{
            fontSize: '18px',
            color: 'var(--text-muted)',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          /10
        </span>
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: vc.bg,
          color: vc.color,
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          fontFamily: "'Barlow Condensed', sans-serif",
          border: `1px solid ${vc.color}`,
        }}
      >
        <span>{vc.icon}</span>
        <span>{vc.label}</span>
      </div>
    </div>
  )
}

// ─── Pre-Market Section ───────────────────────────────────────────────────────
function PreMarketSection({ entry }: { entry: DailyEntry }) {
  const ms = entry.market_snapshot
  const peers = ms?.peers || {}

  const rows = [
    {
      label: 'NVDA',
      price: ms?.nvda_premarket_price,
      pct: ms?.nvda_premarket_pct,
      highlight: true,
    },
    { label: 'QQQ', price: peers['QQQ']?.price, pct: peers['QQQ']?.pct, highlight: false },
    { label: 'SOXX', price: peers['SOXX']?.price, pct: peers['SOXX']?.pct, highlight: false },
  ]

  return (
    <div>
      <SectionLabel>Pre-Market</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: r.highlight ? 'var(--orange-pale)' : 'var(--bg-deep)',
              borderRadius: '3px',
              border: r.highlight ? '1px solid rgba(232,64,0,0.2)' : '1px solid var(--border)',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color: r.highlight ? 'var(--orange)' : 'var(--text-mid)',
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontSize: '13px',
                fontFamily: "'DM Mono', monospace",
                color: 'var(--text-mid)',
              }}
            >
              ${fmt(r.price ?? null)}
            </span>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'DM Mono', monospace",
                color: pctColor(r.pct ?? null),
              }}
            >
              {pctStr(r.pct ?? null)}
            </span>
          </div>
        ))}

        {/* NVDA vs SOXX strip */}
        {ms?.nvda_vs_soxx !== null && ms?.nvda_vs_soxx !== undefined && (
          <div
            style={{
              padding: '5px 8px',
              background: 'var(--bg-deep)',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              NVDA vs SOXX spread
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color:
                  Math.abs(ms.nvda_vs_soxx) > 1.5
                    ? 'var(--orange)'
                    : pctColor(ms.nvda_vs_soxx),
              }}
            >
              {ms.nvda_vs_soxx >= 0 ? '+' : ''}
              {ms.nvda_vs_soxx.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Moving Averages Section ──────────────────────────────────────────────────
function MovingAveragesSection({ entry }: { entry: DailyEntry }) {
  const ms = entry.market_snapshot

  const smas = [
    { label: '20d SMA', value: ms?.sma_20d, pct: ms?.sma_20d_pct },
    { label: '50d SMA', value: ms?.sma_50d, pct: ms?.sma_50d_pct },
    { label: '200d SMA', value: ms?.sma_200d, pct: ms?.sma_200d_pct },
  ]

  return (
    <div>
      <SectionLabel>Moving Averages</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {smas.map((s) => {
          const pct = s.pct ?? 0
          const isAbove = pct >= 0
          const fillPct = Math.min(Math.abs(pct) * 5, 100)

          return (
            <div key={s.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--text-dim)',
                  }}
                >
                  {s.label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  ${fmt(s.value)}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'DM Mono', monospace",
                    color: pctColor(s.pct ?? null),
                  }}
                >
                  {s.pct !== null ? pctStr(s.pct) : 'N/A'}
                </span>
              </div>
              {/* Fill bar */}
              <div
                style={{
                  height: '4px',
                  background: 'var(--bg-deep)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${fillPct}%`,
                    background: isAbove ? 'var(--green)' : 'var(--red)',
                    borderRadius: '2px',
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Score Streak Section ─────────────────────────────────────────────────────
function ScoreStreakSection({
  entry,
  recentScores,
}: {
  entry: DailyEntry
  recentScores: Array<{ date: string; attention: number | null; thesis_risk: number | null }>
}) {
  const last7 = recentScores.slice(0, 7).reverse()

  function dotColor(attn: number | null, date: string): string {
    if (date === entry.date) return 'var(--orange)'
    if (attn === null) return 'var(--bg-raised)'
    if (attn >= 7) return 'var(--red)'
    if (attn >= 5) return 'var(--amber)'
    return 'var(--green)'
  }

  return (
    <div>
      <SectionLabel>Score Streak (7 sessions)</SectionLabel>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {last7.map((s) => {
          const isToday = s.date === entry.date
          return (
            <div
              key={s.date}
              title={`${s.date}: Attention ${s.attention ?? 'N/A'}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: dotColor(s.attention, s.date),
                border: isToday ? '2px solid var(--orange)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                color: isToday ? '#fff' : 'rgba(255,255,255,0.7)',
                cursor: 'default',
                animation: isToday ? 'pulseDot 2s ease infinite' : 'none',
              }}
            >
              {s.attention !== null ? Math.round(s.attention) : '·'}
            </div>
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginTop: '8px',
          fontSize: '9px',
          color: 'var(--text-muted)',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <span>
          <span style={{ color: 'var(--green)' }}>●</span> Low
        </span>
        <span>
          <span style={{ color: 'var(--amber)' }}>●</span> Mid
        </span>
        <span>
          <span style={{ color: 'var(--red)' }}>●</span> High
        </span>
        <span>
          <span style={{ color: 'var(--orange)' }}>●</span> Today
        </span>
      </div>
    </div>
  )
}

// ─── Sources Section ──────────────────────────────────────────────────────────
function SourcesSection({ entry }: { entry: DailyEntry }) {
  const items = entry.news_items?.slice(0, 8) || []

  function tierBadge(tier: number) {
    const colors: Record<number, { bg: string; color: string; label: string }> = {
      1: { bg: 'var(--orange-pale)', color: 'var(--orange)', label: 'T1' },
      2: { bg: 'var(--bg-deep)', color: 'var(--text-mid)', label: 'T2' },
      3: { bg: 'var(--bg-deep)', color: 'var(--text-muted)', label: 'T3' },
    }
    const c = colors[tier] ?? colors[3]
    return (
      <span
        style={{
          padding: '1px 4px',
          background: c.bg,
          color: c.color,
          borderRadius: '2px',
          fontSize: '9px',
          fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          flexShrink: 0,
        }}
      >
        {c.label}
      </span>
    )
  }

  function formatTime(iso: string): string {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return ''
    }
  }

  if (items.length === 0) {
    return (
      <div>
        <SectionLabel>Sources</SectionLabel>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No news items available.
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>Sources ({items.length})</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '8px 10px',
              background: 'var(--bg-deep)',
              borderRadius: '3px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'flex-start',
                marginBottom: '3px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--orange)',
                  fontFamily: "'DM Mono', monospace",
                  flexShrink: 0,
                  minWidth: '14px',
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-mid)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {item.headline}
              </span>
              {tierBadge(item.source_tier || 3)}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <span>{item.source}</span>
              {item.published_at && (
                <>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>{formatTime(item.published_at)}</span>
                </>
              )}
              {item.is_novel && (
                <span
                  style={{
                    color: 'var(--orange)',
                    fontWeight: 700,
                    fontSize: '9px',
                  }}
                >
                  NEW
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RightPanel({ entry, recentScores = [] }: RightPanelProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        height: '100%',
      }}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          animation: 'fadeSlide 0.5s ease 0.15s both',
        }}
      >
        <ThesisRiskSection entry={entry} />
        <Divider />
        <PreMarketSection entry={entry} />
        <Divider />
        <MovingAveragesSection entry={entry} />
        {recentScores.length > 0 && (
          <>
            <Divider />
            <ScoreStreakSection entry={entry} recentScores={recentScores} />
          </>
        )}
        <Divider />
        <SourcesSection entry={entry} />
      </div>
    </div>
  )
}
