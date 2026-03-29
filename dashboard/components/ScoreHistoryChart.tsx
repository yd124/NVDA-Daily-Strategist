'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ScorePoint {
  date: string
  attention: number | null
  thesis_risk: number | null
}

interface Props {
  scores: ScorePoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-invert)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '10px 14px',
      fontFamily: "'DM Mono', monospace",
      fontSize: '11px',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: '0.1em' }}>
        {label}
      </div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name === 'attention' ? 'Attention' : 'Thesis Risk'}: {p.value?.toFixed(1) ?? 'N/A'}
        </div>
      ))}
    </div>
  )
}

export default function ScoreHistoryChart({ scores }: Props) {
  // Recharts needs data in ascending date order
  const data = [...scores].reverse().map((s) => ({
    date: s.date.slice(5), // MM-DD
    attention: s.attention,
    thesis_risk: s.thesis_risk,
  }))

  if (data.length === 0) {
    return (
      <div style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontFamily: "'DM Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.1em',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
      }}>
        No history data yet
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-hi)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={7}
            stroke="var(--orange)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{ value: 'HIGH', position: 'right', fontSize: 8, fill: 'var(--orange)', fontFamily: "'DM Mono', monospace" }}
          />
          <ReferenceLine
            y={5}
            stroke="var(--amber)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{ value: 'MOD', position: 'right', fontSize: 8, fill: 'var(--amber)', fontFamily: "'DM Mono', monospace" }}
          />
          <Line
            type="monotone"
            dataKey="attention"
            name="attention"
            stroke="var(--orange)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--orange)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="thesis_risk"
            name="thesis_risk"
            stroke="var(--green)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--green)', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      <div style={{
        display: 'flex',
        gap: 20,
        justifyContent: 'center',
        marginTop: 6,
        fontFamily: "'DM Mono', monospace",
        fontSize: '9px',
        color: 'var(--text-dim)',
        letterSpacing: '0.1em',
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--orange)', verticalAlign: 'middle', marginRight: 5 }} />
          Attention
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--green)', verticalAlign: 'middle', marginRight: 5 }} />
          Thesis Risk
        </span>
      </div>
    </div>
  )
}
