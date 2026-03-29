'use client'

interface InterpretationBlockProps {
  interpretation: string
  suggestedAction: string
}

export default function InterpretationBlock({
  interpretation,
  suggestedAction,
}: InterpretationBlockProps) {
  const actionLines = suggestedAction
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith('.') ? s : s + '.'))

  return (
    <div
      style={{
        background: 'var(--bg-invert)',
        borderRadius: '8px',
        overflow: 'hidden',
        borderLeft: '3px solid var(--orange)',
        animation: 'fadeSlide 0.5s ease 0.3s both',
      }}
    >
      {/* Interpretation section */}
      <div style={{ padding: '24px 28px 20px' }}>
        {/* Label */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--orange)',
            marginBottom: '12px',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          // Interpretation
        </div>

        {/* Interpretation text */}
        <p
          style={{
            fontSize: '16px',
            fontWeight: 400,
            color: 'rgba(244,240,232,0.8)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {interpretation || 'No interpretation available.'}
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'rgba(255,255,255,0.08)',
          margin: '0 28px',
        }}
      />

      {/* Suggested action section */}
      <div style={{ padding: '20px 28px 24px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--orange)',
            marginBottom: '12px',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          // Suggested Action
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {actionLines.length > 0 ? (
            actionLines.map((line, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    color: 'var(--orange)',
                    fontWeight: 700,
                    fontSize: '16px',
                    lineHeight: 1.6,
                    flexShrink: 0,
                  }}
                >
                  →
                </span>
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 400,
                    color: 'rgba(244,240,232,0.75)',
                    lineHeight: 1.6,
                  }}
                >
                  {line}
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: '16px' }}>
                →
              </span>
              <span
                style={{
                  fontSize: '15px',
                  color: 'rgba(244,240,232,0.75)',
                  lineHeight: 1.6,
                }}
              >
                {suggestedAction || 'No suggested action available.'}
              </span>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div
          style={{
            marginTop: '16px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: "'DM Mono', monospace",
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '12px',
          }}
        >
          Not financial advice. For monitoring purposes only.
        </div>
      </div>
    </div>
  )
}
