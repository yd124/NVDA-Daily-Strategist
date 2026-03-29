# Product Requirements Document
## NVDA Daily Strategist — Agentic Attention & Thesis Monitor

**Version:** 1.2 — MVP (Dashboard-Only)
**Date:** 2026-03-29
**Owner:** Personal tool
**Status:** Active

> **v1.2 Change:** Email delivery removed. Dashboard is the sole output channel. All journey and technical references updated accordingly.

---

## 1. Problem Statement

Long-term NVDA holders face a daily signal-to-noise problem. The volume of financial news, analyst commentary, macro events, and price moves is high every day — but most of it does not meaningfully affect the long-term investment thesis. The cost of ignoring everything is missed awareness on genuinely important days. The cost of reading everything is wasted attention on noise.

There is no tool today that answers the specific question a long-term holder actually needs answered each morning:

> *"Do I need to pay special attention to the market today?"*

Existing tools are either too broad (general financial dashboards), too noisy (news aggregators), or too signal-focused (trading tools optimized for entry/exit decisions). None of them are calibrated to the long-term holder's actual goal: protect the thesis, ignore the noise, and allocate attention wisely.

This product fills that gap with a local Next.js dashboard, updated daily by an agentic AI pipeline that gathers data, reasons over it, validates its own conclusions, and produces two actionable scores with clear explanations.

---

## 2. Goals and Non-Goals

### Goals (MVP)
- Run the pipeline automatically on each NYSE trading day (including half-days) at 8:20am ET
- Publish a structured report to a local Next.js web dashboard by 8:30am ET
- Produce an **Attention Score** (0–10) and a **Thesis Risk Score** (0–10) with explanations
- Distinguish company-specific catalysts from macro noise
- Filter recycled or low-novelty headlines
- Include pre-market price context with 20d, 50d, 200d SMA trend data
- Run reliably with graceful degradation when data sources fail
- Log each day's output to a local JSON file consumed by the dashboard

### Non-Goals (MVP)
- No email delivery (removed in v1.2)
- No price prediction or buy/sell signals
- No portfolio tracking or position sizing
- No peer stock coverage (AMD, AVGO, TSM, SOXX)
- No user authentication or multi-user support
- No configurable alert thresholds (hardcoded logic for MVP)
- No backtesting or historical performance analysis
- No paid data sources

---

## 3. Personas & User Journeys

### Persona: The Conviction Holder

**Profile:**
- Long-term NVDA investor with existing position and conviction
- Does not want to trade daily or react to every headline
- Has limited morning time — 2–3 minutes maximum to assess the day
- Values signal quality over signal volume
- Distrusts sensationalized financial media
- Wants to know *when* to pay attention, not *what* to think

**Core belief:** "I don't need to watch every day. I need to know which days actually matter."

---

#### Journey 1: Normal low-noise day (most days)

1. User opens dashboard at `localhost:3000` before market open
2. Page header shows: `Attention: 2.5/10 | Thesis: INTACT`
3. User sees low scores at a glance — no scrolling needed
4. Closes tab, proceeds with their morning
5. **Outcome:** Zero wasted attention. Day correctly filtered.

---

#### Journey 2: High-attention day (uncommon)

1. User opens dashboard and sees: `Attention: 8.0/10 | Watch Level: HIGH`
2. Reads pre-market snapshot: NVDA down 3.8%, underperforming SOXX by -1.2%
3. Reads top driver: new AI chip export restriction headline, novel, thesis-adjacent
4. Reads interpretation: "structural not noise"
5. Reads suggested action: "monitor the open, watch for guidance revision"
6. Navigates to `/history` to see how rare a score this high is
7. **Outcome:** Attention correctly allocated to a genuinely important day

---

#### Journey 3: Macro noise day (moderate)

1. User opens dashboard: `Attention: 6.0/10 | Thesis: INTACT`
2. Reads: market-wide CPI risk-off. NVDA moving in line with QQQ/SOXX. No NVDA-specific news.
3. Interpretation confirms: macro-driven, thesis unchanged
4. User notes it, decides not to act
5. **Outcome:** Confidence to stay the course on a volatile-looking day

---

#### Journey 4: Half-trading day

1. NYSE half-day detected via `pandas_market_calendars`
2. Pipeline runs at 8:20am ET as normal
3. Dashboard header shows "NYSE · HALF SESSION" badge
4. Report notes reduced session length; macro weight adjusted down
5. **Outcome:** User aware of shortened session without checking NYSE schedule

---

#### Journey 5: Data degradation day

1. Pipeline runs but NewsAPI is unavailable
2. After one retry, pipeline continues with market data only
3. Dashboard shows amber warning banner: "PARTIAL DATA — Failed sources: news"
4. Scores clearly marked as partial-data estimates
5. **Outcome:** Transparency maintained, scores still useful for market-data signals

---

## 4. Business Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Attention accuracy** | High-score days (≥7) feel justified in retrospect ≥80% of the time | Subjective weekly review of `/history` |
| **False positive rate** | Fewer than 2 unjustified high-score days per month | Manual review via history table |
| **False negative rate** | No more than 1 genuinely important day missed per quarter | Post-hoc review of days scored <4 |
| **Time to decision** | User can determine watch/ignore in under 20 seconds | Subjective assessment |
| **Daily completion rate** | Report available on dashboard by 8:30am on ≥95% of NYSE trading days | Pipeline log |
| **Noise reduction** | User spends >10 seconds on <40% of daily reports (score-filtered) | Self-assessment |

---

## 5. Technical Success Metrics

| Metric | Target |
|---|---|
| **Pipeline reliability** | Completes successfully on ≥95% of NYSE trading days |
| **End-to-end runtime** | Full pipeline completes in under 4 minutes |
| **Data freshness** | Pre-market data reflects ≤15-minute delay at time of run |
| **Validation loop convergence** | Re-scoring loop completes within 2 iterations on ≥99% of runs |
| **Score stability** | Same input on repeated runs produces score within ±0.5 points |
| **Graceful degradation** | Dashboard still shows report with partial data flag on 100% of partial-failure runs |
| **LLM token budget** | Total Claude API tokens per run stays under 8,000 |
| **Log integrity** | 100% of completed runs appended to local history file |
| **Dashboard availability** | Next.js app serves latest report within 30 seconds of pipeline completion |

---

## 6. MVP Scope

### 6.1 Project Structure

```
/Users/yokeroil/Documents/NVDA/
├── agent/                        # Python agentic pipeline
│   ├── main.py                   # Entry point — orchestrates full pipeline
│   ├── config.py                 # Scoring weights, constants, source tiers
│   ├── scheduler.py              # NYSE calendar check
│   ├── tools/
│   │   ├── market_data.py        # yfinance: price, SMA, pre-market, peers
│   │   ├── news_fetcher.py       # NewsAPI + Nvidia IR RSS
│   │   ├── macro_calendar.py     # Economic event RSS feed
│   │   └── source_verifier.py    # Trusted source allowlist checker
│   ├── scoring/
│   │   ├── classifier.py         # Claude API: event type + novelty + relevance
│   │   ├── scorer.py             # Rule-based scoring engine
│   │   └── validator.py          # Validation loop logic
│   ├── reporting/
│   │   └── logger.py             # Atomic JSON log writer
│   └── .env                      # API keys (never committed)
├── dashboard/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Today's report
│   │   ├── history/page.tsx      # Score history + all reports table
│   │   ├── report/[date]/page.tsx# Archived report by date
│   │   └── api/reports/          # Server-side JSON file reads
│   ├── components/               # ScoreHero, TickerTape, MetricsSection, etc.
│   └── lib/
│       ├── reports.ts            # File-system data access layer
│       └── types.ts              # TypeScript interfaces
├── data/
│   └── nvda_daily_log.json       # Persistent report history (gitignored)
├── requirements.txt
├── PRD.md
├── ARCHITECTURE.md
└── README.md
```

---

### 6.2 Agent Pipeline — Step by Step

The agent runs as a single Python process triggered by cron at 8:20am ET.

**Phase 0 — NYSE Calendar Check**
Using `pandas_market_calendars`, verify today is a valid NYSE trading day. Exit cleanly if not. Flag half-days.

**Phase 1 — Parallel Data Gathering** (`asyncio.gather`)

| Tool | Source | Data |
|---|---|---|
| `get_market_data()` | yfinance | NVDA price, % change, 20d/50d/200d SMA, peers, VIX, 10Y |
| `get_nvda_news()` | NewsAPI free + Nvidia IR RSS | Headlines last 18h (extended to 24h if large premarket move) |
| `get_macro_events()` | FXStreet RSS / Dow Jones RSS | Today's scheduled economic events |

**Phase 2 — News Classification** (Claude API, single batch call)
- Event type, novelty, thesis relevance, relevance score per item
- Prompt injection protection: headlines treated as data only

**Phase 3 — Score Computation** (rule-based + Claude)
- Attention Score (4 dimensions, weighted)
- Thesis Risk Score (4 dimensions, weighted)

**Phase 4 — Validation Loop** (conditional Claude call)
- Triggers if: score ≥ 6 OR (score < 3 AND abs(premarket) > 2%)
- Max 2 iterations; returns confidence level

**Phase 5 — Report Generation** (Claude API)
- Top 3 drivers, interpretation, suggested action

**Phase 6 — Log**
- Atomic write to `data/nvda_daily_log.json`
- Dashboard reflects new entry on next page load

---

### 6.3 Scoring Framework

**Attention Score (0–10)**

| Dimension | Weight |
|---|---|
| Company catalyst strength | 35% |
| Market reaction strength | 25% |
| Macro risk intensity | 20% |
| Long-term thesis relevance | 20% |

**Thesis Risk Score (0–10)**

| Dimension | Weight |
|---|---|
| Official disclosure / guidance change | 40% |
| Regulatory / policy risk | 30% |
| Demand signal change | 20% |
| Competitive threat | 10% |

---

### 6.4 Dashboard (Next.js 14)

**Routes:**

| Route | Content |
|---|---|
| `/` | Today's report — scores, ticker tape, metrics, drivers, interpretation |
| `/history` | Score trend chart (Recharts) + full reports table |
| `/report/[date]` | Full archived report for any past date |

**Key Components:**

| Component | Description |
|---|---|
| `ScoreHero` | Giant attention score with watch level badge |
| `TickerTape` | Scrolling dark strip: NVDA, peers, benchmarks, macro events |
| `MetricsSection` | 7-day history bars, peer comparison, context metrics grid |
| `DriversList` | Top 3 signal drivers with type labels and flags |
| `InterpretationBlock` | Dark inverted block with interpretation + suggested action |
| `RightPanel` | Thesis score, pre-market prices, SMA bars, streak dots, sources |
| `ScoreHistoryChart` | Recharts dual-line chart (Attention + Thesis Risk) |

**Data source:** Server-side `fs.readFileSync` in Next.js API routes. No database. No network exposure.

**Design language:**
- Off-white background (`#f4f0e8`), orange accent (`#e84000`), Barlow Condensed + DM Mono
- Orange vertical accent bar (structural identity element)
- Dark ticker tape strip (deliberate contrast — status bar convention)
- Score ≥ 7: orange. Score ≥ 9: red. Thesis at_risk: red. Intact: green.
- No login required

---

## 7. Technical Considerations

### 7.1 Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| LLM | Claude API (`claude-sonnet-4-6`) |
| Market data | yfinance |
| News | NewsAPI free tier + Nvidia IR RSS |
| Macro calendar | FXStreet RSS / Dow Jones RSS (with SSL fallback) |
| Trading calendar | pandas_market_calendars |
| Scheduler | macOS cron job |
| Persistence | Local JSON (`data/nvda_daily_log.json`) |
| Dashboard | Next.js 14 App Router (TypeScript) |
| Charts | Recharts |

### 7.2 Claude API Usage Strategy

Budget: <8,000 tokens/run

| Phase | Call | Est. Tokens |
|---|---|---|
| Phase 2 | News classification (batch) | ~2,000 |
| Phase 3 | Score computation | ~1,500 |
| Phase 4 | Validation (conditional, ×0–2) | ~0–2,000 |
| Phase 5 | Report generation | ~1,500 |

### 7.3 Trusted Source Allowlist

**Tier 1 — Official:** investor.nvidia.com, sec.gov, federalregister.gov
**Tier 2 — Financial news:** reuters.com, bloomberg.com, wsj.com, ft.com, barrons.com, cnbc.com
**Tier 3 — Unverified:** all others (accepted with downweight + flag)

### 7.4 API Key Management

`agent/.env` (gitignored):
```
ANTHROPIC_API_KEY=
NEWSAPI_KEY=
```

### 7.5 NYSE Half-Day Handling

`pandas_market_calendars` returns close time. If close < 16:00 ET → half day. Report flagged; macro risk weight reduced by 5%.

---

## 8. Corner Cases

| Scenario | Expected Behavior |
|---|---|
| **NYSE holiday** | Calendar check exits pipeline silently — dashboard shows previous day's report |
| **NYSE half-trading day** | Report generated normally; "HALF SESSION" badge shown; macro weight reduced 5% |
| **yfinance returns null pre-market data** | Pipeline continues; market section shows "N/A"; scores use available data |
| **NewsAPI returns 0 results** | Score based on market data only; dashboard shows partial data banner |
| **Claude API error / no credits** | Fallback report text used; scores from rule-based engine still written to log |
| **Pre-market move >8%** | Both scores forced ≥ 8; validation loop bypassed; "Extreme Move" flag shown |
| **All news classified as recycled** | Scores floored at ≤ 4 unless official IR news present |
| **Validation loop fails to converge** | Scores from iteration 2 accepted; "Confidence: LOW" banner shown on dashboard |
| **Duplicate news across sources** | Deduplication by first-60-char title match; highest tier source kept |
| **JSON log missing or corrupted** | Agent recreates empty `[]` log before appending; dashboard shows empty state |
| **Dashboard loaded before pipeline completes** | Previous day's report shown; no "loading" spinner needed |
| **After-hours Nvidia news captured at 8:20am** | 18h lookback window captures it; classified as official disclosure |
| **macOS SSL certificate errors on RSS feeds** | SSL verification bypassed with warning for local-tool context |

---

## 9. UI Style Preferences

**Dashboard (Next.js):**
- Off-white warm background (`#f4f0e8`), orange accent (`#e84000`)
- Fonts: Barlow Condensed (display, 900 weight for scores) + DM Mono (all data values)
- 3-column grid layout: 72px orange accent bar / main body / 360px right panel
- Score ≥ 7: orange. Thesis at_risk: red. Thesis intact: green.
- Dark ticker tape strip for deliberate contrast (status bar)
- No rounded corners, no shadows
- Ghost oversized score number behind the hero (subtle branding)
- Mobile-responsive not prioritized for MVP (personal desktop tool)

---

## 10. Post-MVP Roadmap

| Feature | Priority |
|---|---|
| Peer monitoring: AMD, AVGO, TSM, SOXX | High |
| Configurable score threshold (notify via system alert if score ≥ N) | High |
| Historical calibration — tag days and track accuracy over time | Medium |
| Sunday week-ahead summary | Medium |
| Dashboard annotations (manual tagging of report days) | Medium |
| Export report as PDF | Low |
| Multi-user support with auth | Low |

---

*PRD v1.2 — NVDA Daily Strategist — Dashboard-Only MVP*
*Last updated: 2026-03-29*
