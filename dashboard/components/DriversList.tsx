'use client'

import { Driver } from '@/lib/types'

interface DriversListProps {
  drivers: Driver[]
}

function FlagBadge({ flag }: { flag: string }) {
  const isNew = flag === 'new'
  const isHighImpact = flag === 'high-impact'
  const isThesisRisk = flag === 'thesis-risk'
  const isBullish = flag === 'bullish'
  const isBearish = flag === 'bearish'

  let bg = 'var(--bg-deep)'
  let color = 'var(--text-dim)'
  let border = 'var(--border)'

  if (isNew || isHighImpact) {
    bg = 'var(--orange-pale)'
    color = 'var(--orange)'
    border = 'rgba(232,64,0,0.3)'
  } else if (isThesisRisk || isBearish) {
    bg = 'var(--red-pale)'
    color = 'var(--red)'
    border = 'rgba(192,57,43,0.3)'
  } else if (isBullish) {
    bg = 'var(--green-pale)'
    color = 'var(--green)'
    border = 'rgba(26,122,66,0.3)'
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        background: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: '2px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {flag}
    </span>
  )
}

export default function DriversList({ drivers }: DriversListProps) {
  if (!drivers || drivers.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '14px',
          fontStyle: 'italic',
        }}
      >
        No signal drivers identified.
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '24px',
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        animation: 'fadeSlide 0.5s ease 0.2s both',
      }}
    >
      {/* Section label */}
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '16px',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Signal Drivers
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {drivers.map((driver) => (
          <div
            key={driver.rank}
            style={{
              position: 'relative',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              padding: '12px 14px',
              borderRadius: '4px',
              border: '1px solid transparent',
              cursor: 'default',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLDivElement
              el.style.background = 'var(--orange-pale)'
              el.style.borderColor = 'rgba(232,64,0,0.15)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLDivElement
              el.style.background = 'transparent'
              el.style.borderColor = 'transparent'
            }}
          >
            {/* Ghost rank number */}
            <div
              style={{
                fontSize: '44px',
                fontWeight: 900,
                fontFamily: "'Barlow Condensed', sans-serif",
                color: 'var(--orange)',
                opacity: 0.18,
                lineHeight: 1,
                minWidth: '32px',
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              {driver.rank}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingTop: '2px' }}>
              {/* Type label */}
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '4px',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {driver.type.replace(/_/g, ' ')}
              </div>

              {/* Driver text */}
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 400,
                  color: 'var(--text-mid)',
                  lineHeight: 1.4,
                  marginBottom: '8px',
                }}
              >
                {driver.text}
              </div>

              {/* Flag badges */}
              {driver.flags && driver.flags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {driver.flags.map((flag) => (
                    <FlagBadge key={flag} flag={flag} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
