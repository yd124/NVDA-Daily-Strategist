'use client'

interface ScoreHeroProps {
  score: number | null
  watchLevel: string
  validationLoops: number
  confidence: string
  pipelineDuration: number
  tokensUsed: number
}

function watchLevelColor(level: string): string {
  switch (level) {
    case 'high':
      return 'var(--orange)'
    case 'moderate':
      return 'var(--amber)'
    default:
      return 'var(--text-dim)'
  }
}

function watchLevelBg(level: string): string {
  switch (level) {
    case 'high':
      return 'var(--orange-pale)'
    case 'moderate':
      return '#fff4dc'
    default:
      return 'var(--bg-deep)'
  }
}

export default function ScoreHero({
  score,
  watchLevel,
  validationLoops,
  confidence,
  pipelineDuration,
  tokensUsed,
}: ScoreHeroProps) {
  const displayScore = score !== null ? score.toFixed(1) : '—'
  const scoreColor = watchLevelColor(watchLevel)

  return (
    <div
      style={{
        position: 'relative',
        padding: '32px 32px 24px',
        background: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        animation: 'fadeSlide 0.5s ease both',
      }}
    >
      {/* Ghost background number */}
      <div
        style={{
          position: 'absolute',
          right: '-10px',
          top: '-20px',
          fontSize: '240px',
          fontWeight: 900,
          fontFamily: "'Barlow Condensed', sans-serif",
          color: 'var(--orange)',
          opacity: 0.06,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          letterSpacing: '-0.05em',
        }}
        aria-hidden="true"
      >
        {score !== null ? Math.round(score) : '?'}
      </div>

      {/* Eyebrow label */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-dim)',
          marginBottom: '8px',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        Attention Score
      </div>

      {/* Score + denominator */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '116px',
            fontWeight: 900,
            fontFamily: "'Barlow Condensed', sans-serif",
            lineHeight: 0.9,
            color: scoreColor,
            letterSpacing: '-0.04em',
          }}
        >
          {displayScore}
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 400,
            color: 'var(--text-muted)',
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          /10
        </span>
      </div>

      {/* Watch level badge */}
      <div style={{ marginBottom: '20px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: watchLevelBg(watchLevel),
            color: scoreColor,
            borderRadius: '3px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: "'Barlow Condensed', sans-serif",
            border: `1px solid ${scoreColor}`,
          }}
        >
          {watchLevel.toUpperCase()} WATCH
        </span>
      </div>

      {/* Meta row */}
      <div
        className="mono"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
        }}
      >
        <span>
          <span style={{ color: 'var(--text-dim)' }}>VALIDATION </span>
          {validationLoops} loop{validationLoops !== 1 ? 's' : ''}
        </span>
        <span>
          <span style={{ color: 'var(--text-dim)' }}>CONFIDENCE </span>
          <span
            style={{
              color: confidence === 'high' ? 'var(--green)' : 'var(--amber)',
              fontWeight: 600,
            }}
          >
            {confidence.toUpperCase()}
          </span>
        </span>
        <span>
          <span style={{ color: 'var(--text-dim)' }}>PIPELINE </span>
          {pipelineDuration}s
        </span>
        <span>
          <span style={{ color: 'var(--text-dim)' }}>TOKENS </span>
          ~{tokensUsed.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
