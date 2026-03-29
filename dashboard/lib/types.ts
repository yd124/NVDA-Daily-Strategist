export interface PeerData {
  price: number | null
  pct: number | null
}

export interface MarketSnapshot {
  nvda_premarket_price: number | null
  nvda_premarket_pct: number | null
  nvda_premarket_prev_close: number | null
  sma_20d: number | null
  sma_50d: number | null
  sma_200d: number | null
  sma_20d_pct: number | null
  sma_50d_pct: number | null
  sma_200d_pct: number | null
  peers: Record<string, PeerData>
  nvda_vs_soxx: number | null
  context_metrics: {
    volume_vs_30d_avg_pct: number | null
    implied_volatility: number | null
    relative_strength_3m_pct: number | null
    week_52_high: number | null
    week_52_low: number | null
    week_52_position_pct: number | null
    vix_price: number | null
    tnx_price: number | null
  }
}

export interface NewsItem {
  headline: string
  source: string
  source_url: string
  published_at: string
  event_type: string
  is_novel: boolean
  is_thesis_relevant: boolean
  thesis_relevance_score: number
  source_tier: number
  weight: string
}

export interface MacroEvent {
  event: string
  description: string
  scheduled_at: string
  impact: 'high' | 'medium' | 'low'
}

export interface Scores {
  attention: number | null
  thesis_risk: number | null
  validation_loops: number
  confidence: 'high' | 'low'
  watch_level: 'high' | 'moderate' | 'low'
  thesis_verdict: 'intact' | 'monitor' | 'at_risk'
  dimension_scores: Record<string, number>
}

export interface Driver {
  rank: number
  type: string
  text: string
  flags: string[]
}

export interface Report {
  top_drivers: Driver[]
  interpretation: string
  suggested_action: string
}

export interface Meta {
  pipeline_duration_seconds: number
  tokens_used: number
  email_sent: boolean
  data_sources_available: string[]
  data_sources_failed: string[]
  partial_data: boolean
  error?: string
}

export interface DailyEntry {
  date: string
  run_timestamp: string
  trading_day_type: 'full' | 'half'
  market_snapshot: MarketSnapshot
  news_items: NewsItem[]
  macro_events: MacroEvent[]
  scores: Scores
  report: Report
  meta: Meta
}
