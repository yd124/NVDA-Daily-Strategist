'use client'

import { MarketSnapshot } from '@/lib/types'

interface TickerTapeProps {
  marketSnapshot: MarketSnapshot
}

interface TickerItem {
  label: string
  price: number | null
  pct: number | null
  watch?: boolean
  alert?: boolean
}

function formatPrice(price: number | null): string {
  if (price === null) return 'N/A'
  return price >= 100 ? price.toFixed(2) : price.toFixed(3)
}

function formatPct(pct: number | null): string {
  if (pct === null) return 'N/A'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

function pctColor(pct: number | null): string {
  if (pct === null) return 'rgba(255,255,255,0.5)'
  if (pct > 0) return '#4ade80'
  if (pct < 0) return '#f87171'
  return 'rgba(255,255,255,0.6)'
}

function TickerItemEl({ item }: { item: TickerItem }) {
  const isWatch = item.watch || (item.pct !== null && Math.abs(item.pct) > 1.5)
  const isAlert = item.alert

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '0 20px',
        whiteSpace: 'nowrap',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {item.label}
      </span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {formatPrice(item.price)}
      </span>
      <span
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: pctColor(item.pct),
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {formatPct(item.pct)}
      </span>
      {isWatch && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '1px 5px',
            background: 'var(--orange)',
            color: '#fff',
            borderRadius: '2px',
          }}
        >
          WATCH
        </span>
      )}
      {isAlert && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '1px 5px',
            background: 'var(--red)',
            color: '#fff',
            borderRadius: '2px',
          }}
        >
          ALERT
        </span>
      )}
    </span>
  )
}

export default function TickerTape({ marketSnapshot: ms }: TickerTapeProps) {
  const peers = ms.peers || {}

  const items: TickerItem[] = [
    {
      label: 'NVDA',
      price: ms.nvda_premarket_price,
      pct: ms.nvda_premarket_pct,
      watch: ms.nvda_premarket_pct !== null && Math.abs(ms.nvda_premarket_pct) > 1.5,
    },
    {
      label: 'QQQ',
      price: peers['QQQ']?.price ?? null,
      pct: peers['QQQ']?.pct ?? null,
    },
    {
      label: 'SOXX',
      price: peers['SOXX']?.price ?? null,
      pct: peers['SOXX']?.pct ?? null,
    },
    {
      label: 'AMD',
      price: peers['AMD']?.price ?? null,
      pct: peers['AMD']?.pct ?? null,
    },
    {
      label: 'AVGO',
      price: peers['AVGO']?.price ?? null,
      pct: peers['AVGO']?.pct ?? null,
    },
    {
      label: 'TSM',
      price: peers['TSM']?.price ?? null,
      pct: peers['TSM']?.pct ?? null,
    },
    {
      label: 'SPY',
      price: peers['SPY']?.price ?? null,
      pct: peers['SPY']?.pct ?? null,
    },
    {
      label: 'VIX',
      price: ms.context_metrics?.vix_price ?? null,
      pct: null,
      alert: (ms.context_metrics as Record<string, number | null>)?.vix_price != null &&
             ((ms.context_metrics as Record<string, number | null>).vix_price as number) > 25,
    } as TickerItem,
    {
      label: '10Y',
      price: (ms.context_metrics as Record<string, number | null>)?.tnx_price ?? null,
      pct: null,
    } as TickerItem,
    {
      label: 'NVDA/SOXX',
      price: ms.nvda_vs_soxx,
      pct: null,
    },
  ]

  // Duplicate for seamless scroll
  const doubledItems = [...items, ...items]

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-invert)',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Left fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to right, var(--bg-invert), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Right fade */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to left, var(--bg-invert), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Scrolling track */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          animation: 'tickerScroll 30s linear infinite',
          willChange: 'transform',
        }}
      >
        {doubledItems.map((item, i) => (
          <TickerItemEl key={`${item.label}-${i}`} item={item} />
        ))}
      </div>
    </div>
  )
}
