# Product Requirements Document
## NVIDIA Daily Report — Agentic Attention & Thesis Monitor

**Version:** 1.1 — MVP
**Date:** 2026-03-29
**Owner:** Personal tool
**Status:** Draft

---

## 1. Problem Statement

Long-term NVDA holders face a daily signal-to-noise problem. The volume of financial news, analyst commentary, macro events, and price moves is high every day — but most of it does not meaningfully affect the long-term investment thesis. The cost of ignoring everything is missed awareness on genuinely important days. The cost of reading everything is wasted attention on noise.

There is no tool today that answers the specific question a long-term holder actually needs answered each morning:

> *"Do I need to pay special attention to the market today?"*

Existing tools are either too broad (general financial dashboards), too noisy (news aggregators), or too signal-focused (trading tools optimized for entry/exit decisions). None of them are calibrated to the long-term holder's actual goal: protect the thesis, ignore the noise, and allocate attention wisely.

This product fills that gap with a single structured daily email and a web dashboard, powered by an agentic AI that gathers data, reasons over it, validates its own conclusions, and produces two actionable scores with clear explanations.

---

## 2. Goals and Non-Goals

### Goals (MVP)
- Deliver one structured email per NYSE trading day (including half-days) at 8:30am ET
- Serve the same report on a Next.js web dashboard
- Produce an **Attention Score** (0–10) and a **Thesis Risk Score** (0–10) with explanations
- Distinguish company-specific catalysts from macro noise
- Filter recycled or low-novelty headlines
- Include pre-market price context with 20d, 50d, 200d SMA trend data
- Run reliably with graceful degradation when data sources fail
- Log each day's output to a local JSON file consumed by the dashboard

### Non-Goals (MVP)
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

1. Email arrives at 8:30am ET
2. Subject line reads: `NVDA Daily Report — Attention: 2.5/10 | Thesis Risk: 1/10`
3. User glances at subject line, sees low scores
4. Skips detailed reading, proceeds with their morning
5. **Outcome:** Zero wasted attention. Day correctly filtered.

---

#### Journey 2: High-attention day (uncommon)

1. Email arrives at 8:30am ET
2. Subject line reads: `NVDA Daily Report — Attention: 8.0/10 | Thesis Risk: 6.5/10`
3. User opens the email immediately
4. Reads: NVDA is down 3.8% pre-market, significantly underperforming SOXX, driven by a new AI chip export restriction headline
5. Reads the interpretation: "This appears to be a thesis-relevant event, not routine macro volatility"
6. Reads suggested behavior: "Monitor the open. Assess whether sell-side responds with guidance revisions"
7. User optionally opens the web dashboard to view score history and trend
8. **Outcome:** Attention correctly allocated to a day that warranted it

---

#### Journey 3: Macro noise day (moderate)

1. Email arrives at 8:30am ET
2. Subject line reads: `NVDA Daily Report — Attention: 6.0/10 | Thesis Risk: 1.5/10`
3. User opens email or dashboard
4. Reads: Market-wide risk-off on CPI data. NVDA down in line with QQQ and SOXX. No NVDA-specific news
5. Reads interpretation: "This is macro-driven. Long-term Nvidia thesis appears unchanged"
6. User notes it, decides not to act
7. **Outcome:** User has context and confidence to stay the course

---

#### Journey 4: Half-trading day (e.g. day after Thanksgiving)

1. NYSE half-day detected via trading calendar
2. Agent runs at 8:30am ET as normal
3. Email and dashboard note: "Half-trading day — market closes at 1:00pm ET"
4. Report is generated with reduced macro weight (less likely to be a high-signal day)
5. **Outcome:** User is aware of shortened session without needing to check NYSE schedule

---

#### Journey 5: Data degradation day

1. Email arrives at 8:30am ET with subject: `NVDA Daily Report — Attention: [Partial] | Thesis Risk: 5.0/10`
2. Email and dashboard note: "News API unavailable. Score based on market data only. Retry attempted once."
3. **Outcome:** Transparency maintained, trust preserved

---

## 4. Business Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Attention accuracy** | High-score days (≥7) feel justified in retrospect ≥80% of the time | Subjective weekly review against JSON log |
| **False positive rate** | Fewer than 2 unjustified high-score days per month | Manual tagging in log |
| **False negative rate** | No more than 1 genuinely important day missed per quarter | Post-hoc review of days scored <4 |
| **Time to decision** | User can determine watch/ignore in under 20 seconds | Subjective assessment |
| **Daily completion rate** | Report delivered on ≥95% of scheduled NYSE trading days | Delivery log |
| **Noise reduction** | User reads full report on <40% of days (score-filtered) | Open behavior vs subject-line dismissal |

---

## 5. Technical Success Metrics

| Metric | Target |
|---|---|
| **Delivery reliability** | Email delivered by 8:30am ET on ≥95% of NYSE trading days |
| **End-to-end runtime** | Full pipeline completes in under 4 minutes |
| **Data freshness** | Pre-market data reflects ≤15-minute delay at time of run |
| **Validation loop convergence** | Re-scoring loop completes within 2 iterations on ≥99% of runs |
| **Score stability** | Same input on repeated runs produces score within ±0.5 points |
| **Graceful degradation** | Email and dashboard still served with partial data flag on 100% of partial-failure runs |
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
│   ├── scheduler.py              # NYSE calendar check + cron coordination
│   ├── tools/
│   │   ├── market_data.py        # yfinance: price, SMA, pre-market
│   │   ├── news_fetcher.py       # NewsAPI + Nvidia IR RSS
│   │   ├── macro_calendar.py     # Economic event RSS feed
│   │   └── source_verifier.py   # Trusted source allowlist checker
│   ├── scoring/
│   │   ├── classifier.py         # Claude API: event type + novelty + relevance
│   │   ├── scorer.py             # Rule-based + Claude: attention + thesis scores
│   │   └── validator.py          # Validation loop logic
│   ├── reporting/
│   │   ├── email_builder.py      # HTML email construction
│   │   ├── email_sender.py       # Gmail SMTP delivery
│   │   └── logger.py             # JSON log append
│   └── .env                      # API keys (never committed)
├── dashboard/                    # Next.js web dashboard
│   ├── app/
│   │   ├── page.tsx              # Today's report
│   │   ├── history/page.tsx      # Score history view
│   │   └── api/reports/route.ts  # API route reading local JSON log
│   ├── components/
│   │   ├── ScoreCard.tsx
│   │   ├── PreMarketSnapshot.tsx
│   │   ├── DriversList.tsx
│   │   ├── InterpretationBlock.tsx
│   │   └── ScoreHistoryChart.tsx
│   └── package.json
├── data/
│   └── nvda_daily_log.json       # Persistent report history
├── PRD.md                        # This document
└── README.md
```

---

### 6.2 Agent Pipeline — Step by Step

The agent runs as a single Python process triggered by a cron job at 8:20am ET (10-minute buffer).

**Step 0 — Trading Day Check**

Using `pandas_market_calendars`, verify today is a valid NYSE trading day (full or half-session). If not a trading day, exit silently. If a half-day, flag it in the report context.

**Step 1 — Data Gathering (parallel tool calls)**

| Tool | Source | Data Collected |
|---|---|---|
| `get_premarket_price` | yfinance | NVDA pre-market price, % change vs prior close |
| `get_benchmark_prices` | yfinance | QQQ, SOXX pre-market % change |
| `get_moving_averages` | yfinance | NVDA 20d, 50d, 200d SMA; % distance from current price |
| `get_nvda_news` | NewsAPI free tier + Nvidia IR RSS | Headlines, sources, timestamps from last 18 hours |
| `get_macro_calendar` | Investing.com RSS or FXStreet economic calendar RSS | Scheduled macro events for today |

**Step 2 — Classification (Claude API, first pass)**

For each news item, Claude classifies:
- **Event type:** earnings/guidance, product launch, export control/regulation, hyperscaler capex, supply chain, analyst action, macro event, media noise
- **Novelty:** new information vs recycled headline
- **Relevance:** thesis-relevant vs generic market chatter

**Step 3 — Scoring (rule-based + Claude)**

**Attention Score (0–10)**

| Dimension | Weight | Description |
|---|---|---|
| Company catalyst strength | 35% | Significance of NVDA-specific news |
| Market reaction strength | 25% | Pre-market move relative to QQQ and SOXX |
| Macro risk intensity | 20% | Severity of scheduled or surprise macro events |
| Long-term thesis relevance | 20% | Whether today's information is new and thesis-relevant |

**Thesis Risk Score (0–10)**

| Dimension | Weight | Description |
|---|---|---|
| Official disclosure or guidance change | 40% | Earnings, margins, forward guidance |
| Regulatory / policy risk | 30% | Export controls, government action affecting AI chips |
| Demand signal change | 20% | Hyperscaler capex shifts, customer cancellations |
| Competitive threat | 10% | Credible new competitive development |

**Step 4 — Validation Loop (conditional)**

Trigger conditions:
- Score ≥ 6 on either dimension, OR
- Score < 3 but pre-market move > ±2%

Claude receives raw data alongside its initial scores and re-evaluates: "Are these scores consistent with the evidence? If not, produce revised scores."

- Maximum 2 iterations
- If not converged after 2 passes: scores accepted, "Confidence: LOW" flag added

**Conditional tool calls within the loop:**
- Pre-market move > ±2%: extend news lookback to 24 hours
- Official Nvidia IR detected: force Thesis Risk re-evaluation
- Macro event scheduled: increase macro risk weight by 5%
- Source not in trusted allowlist: call `verify_source_credibility` before accepting signal

**Step 5 — Report Generation (Claude API)**

Claude generates structured report content: scores, top 3 drivers, interpretation, suggested behavior, sources list.

**Step 6 — Delivery and Logging**

- HTML email sent via Gmail SMTP
- Report JSON appended to `data/nvda_daily_log.json`
- Dashboard auto-reflects new entry on next page load

---

### 6.3 Email Format

**Subject line:**
```
NVDA Daily Report — Attention: 7.5/10 | Thesis Risk: 3.0/10 [HIGH WATCH]
```

**Body (HTML):**
```
Pre-Market Snapshot
────────────────────────────────
NVDA:   -2.3% pre-market
QQQ:    -0.4%   |   SOXX: -1.1%   |   Relative: NVDA -1.2% vs SOXX

Moving Average Context
  vs 20d SMA:  -4.1%  ▼
  vs 50d SMA:  +8.3%  ▲
  vs 200d SMA: +41.2% ▲

────────────────────────────────
Attention Score:    7.5 / 10   [WATCH LEVEL: HIGH]
Thesis Risk Score:  3.0 / 10   [THESIS: INTACT]
────────────────────────────────

Top Drivers
  1. NVDA significantly underperforming SOXX pre-market (-1.2% relative)
  2. New export control headline — AI chip restrictions to additional markets
  3. CPI release scheduled 8:30am ET today

Interpretation
  This looks like a meaningful day worth monitoring. The export control
  headline is new (not recycled) and directly relevant to NVDA's
  international revenue exposure. However, the thesis remains intact —
  no guidance change or structural demand shift detected.

Suggested Behavior
  Monitor the open and early price confirmation. Distinguish macro-led
  weakness from NVDA-specific thesis change.

Sources
  [1] Reuters — "US expands AI chip export restrictions" — 6:14am ET
  [2] Pre-market data: yfinance (8:20am ET snapshot)
  [3] BLS CPI release scheduled 8:30am ET
```

---

### 6.4 Dashboard (Next.js)

**Pages:**

| Route | Content |
|---|---|
| `/` | Today's report: scores, pre-market snapshot, drivers, interpretation |
| `/history` | Score history chart (Attention + Thesis Risk over time), table of past reports |
| `/report/[date]` | Full report for a specific past date |

**Key components:**

| Component | Description |
|---|---|
| `ScoreCard` | Displays score (0–10) with color-coded watch level label |
| `PreMarketSnapshot` | NVDA/QQQ/SOXX prices + SMA distance indicators |
| `DriversList` | Numbered list of top 3 drivers |
| `InterpretationBlock` | Interpretation + suggested behavior text |
| `ScoreHistoryChart` | Line chart of Attention and Thesis Risk scores over time |

**Data source:** Dashboard reads directly from `data/nvda_daily_log.json` via a Next.js API route (`/api/reports`). No separate database for MVP.

**Design style:**
- Calm, financial-grade aesthetic — dark background, clean typography
- Score ≥ 7: amber highlight
- Score ≥ 9: red highlight
- Score < 4: muted/grey treatment
- Thesis Risk ≥ 6: "THESIS: MONITOR" warning label
- Mobile-responsive
- No login required (local tool)

---

## 7. Technical Considerations

### 7.1 Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| LLM | Claude API (claude-sonnet-4-6) |
| Market data | yfinance |
| News | NewsAPI free tier + Nvidia IR RSS |
| Macro calendar | Investing.com RSS or FXStreet economic calendar RSS |
| Trading calendar | pandas_market_calendars |
| Email delivery | Gmail SMTP (smtplib + email) |
| Scheduler | macOS cron job |
| Persistence | Local JSON (`data/nvda_daily_log.json`) |
| Dashboard | Next.js 14+ (App Router) |

### 7.2 Claude API Usage Strategy

To stay within ~8,000 tokens/run:
- Batch all news classification in a single prompt
- Use structured JSON output for scores to minimize verbosity
- Validation loop triggered conditionally (most days: 0 iterations)
- Report generation uses a templated prompt with strict length constraint

### 7.3 Trusted Source Allowlist

**Tier 1 — Always trusted (official):**
- investor.nvidia.com, SEC EDGAR, federalregister.gov

**Tier 2 — Trusted financial news:**
- reuters.com, bloomberg.com, wsj.com, ft.com, barrons.com, seekingalpha.com (articles only)

**Tier 3 — Conditional (flagged, low weight):**
- Social media, substack, unrecognized domains

### 7.4 API Key Management

Stored in `agent/.env` (never committed to version control):
```
ANTHROPIC_API_KEY=
NEWSAPI_KEY=
GMAIL_APP_PASSWORD=
GMAIL_SENDER_ADDRESS=
GMAIL_RECIPIENT_ADDRESS=
```

`.gitignore` must include `agent/.env` and `data/nvda_daily_log.json`.

### 7.5 NYSE Half-Day Handling

`pandas_market_calendars` returns session close times. If close time is before 4:00pm ET, the report includes a half-day notice. Macro risk weight is reduced by 5% on half-days (lower probability of high-impact events on shortened sessions).

---

## 8. Corner Cases

| Scenario | Expected Behavior |
|---|---|
| **NYSE holiday** | `pandas_market_calendars` check exits pipeline silently — no email sent |
| **NYSE half-trading day** | Report generated normally; half-day flag added; macro weight reduced by 5% |
| **yfinance returns null pre-market data** | Retry once after 3 minutes. If still null, email sent with market section marked "Unavailable" |
| **NewsAPI returns 0 results** | Retry once. If still empty, score based on market data only, clearly flagged |
| **Claude API timeout or error** | Catch exception, send plain-text fallback: "Pipeline error — manual check recommended today" |
| **Pre-market move is extreme (>8%)** | Force both scores ≥ 8, override validation loop limit, flag "Extreme Move — High Confidence Override" |
| **All news classified as recycled/noise** | Both scores floor at ≤4, regardless of market move, unless official IR news present |
| **Validation loop fails to converge after 2 iterations** | Accept iteration-2 scores, append "Confidence: LOW" to email and dashboard |
| **Gmail SMTP auth failure** | Log error, retry once after 2 minutes |
| **Duplicate news items across sources** | Deduplication in classification step — same story from multiple sources counts as one signal |
| **JSON log file missing or corrupted** | Agent recreates empty log file before appending; dashboard shows empty state gracefully |
| **Dashboard loaded before today's report is ready** | Show yesterday's report with "Today's report not yet available" banner |
| **Nvidia after-hours news posted, captured at 8:20am** | 18-hour lookback window captures it; classified as high-priority official disclosure |

---

## 9. UI Style Preferences

### Email
- HTML formatted, calm financial-grade aesthetic
- Monospace sections for data (prices, scores)
- Dividers between sections
- Color coding: amber for score ≥7, red for score ≥9, muted for score <4
- No images or attachments in MVP

### Dashboard (Next.js)
- Dark background, clean sans-serif typography
- Score displayed as large number with colored badge
- Pre-market snapshot in a compact data grid
- Score history as a dual-line chart (Attention + Thesis Risk)
- Mobile-responsive layout
- No login required

---

## 10. Post-MVP Roadmap

| Feature | Priority |
|---|---|
| Configurable alert threshold (email only if score ≥ N) | High |
| Peer monitoring: AMD, AVGO, TSM, SOXX | High |
| Historical calibration and accuracy scoring | Medium |
| Sunday week-ahead summary | Medium |
| Dashboard annotations (user can tag days manually) | Medium |
| Multi-user support with auth | Low |

---

*PRD v1.1 — NVIDIA Daily Report — Personal MVP*
*Last updated: 2026-03-29*
