# NVDA Daily Strategist

A local agentic AI tool for long-term NVIDIA (NVDA) holders. Every trading day at 8:30am ET, an AI pipeline gathers pre-market data, classifies news, scores the day's importance, validates its own reasoning, and writes a structured report to a local Next.js dashboard.

**Two scores. One clear answer: does today deserve your attention?**

- **Attention Score (0–10):** Is this a day worth watching?
- **Thesis Risk Score (0–10):** Does today threaten the long-term NVDA thesis?

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- A NewsAPI key ([newsapi.org](https://newsapi.org) — free tier)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/yd124/NVDA-Daily-Strategist.git
cd NVDA-Daily-Strategist
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure API keys

```bash
cp agent/.env.example agent/.env
```

Edit `agent/.env` and fill in your keys:

```
ANTHROPIC_API_KEY=your_key_here
NEWSAPI_KEY=your_key_here
```

### 4. Install dashboard dependencies

```bash
cd dashboard
npm install
```

---

## Running

### Run the pipeline manually (for testing)

```bash
cd agent
python main.py --force
```

`--force` skips the NYSE trading-day check so you can test on any day.

Optional: `--date 2026-03-29` to simulate a specific date.

### Start the dashboard

```bash
cd dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- `/` — today's report
- `/history` — score history chart + all reports
- `/report/YYYY-MM-DD` — specific archived report

### Set up the daily cron (8:20am ET, weekdays)

```bash
crontab -e
```

Add this line (replace paths with your actual paths):

```
20 8 * * 1-5 /usr/bin/python3 /Users/yourname/Documents/NVDA/agent/main.py >> /Users/yourname/Documents/NVDA/logs/pipeline.log 2>&1
```

Create the logs directory first:

```bash
mkdir -p /Users/yokeroil/Documents/NVDA/logs
```

---

## Project Structure

```
NVDA-Daily-Strategist/
├── requirements.txt
├── README.md
├── agent/
│   ├── main.py              # Pipeline orchestrator (run this)
│   ├── config.py            # Scoring weights & constants
│   ├── scheduler.py         # NYSE trading calendar check
│   ├── .env                 # Your API keys (not committed)
│   ├── .env.example         # Template
│   ├── tools/
│   │   ├── market_data.py   # yfinance: prices, SMA, peers
│   │   ├── news_fetcher.py  # NewsAPI + Nvidia IR RSS
│   │   ├── macro_calendar.py# Economic events RSS
│   │   └── source_verifier.py # Trusted source tiers
│   ├── scoring/
│   │   ├── classifier.py    # Claude: classify news
│   │   ├── scorer.py        # Rule-based + Claude scoring
│   │   └── validator.py     # Validation loop
│   └── reporting/
│       └── logger.py        # Atomic JSON log writer
├── dashboard/               # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx         # Today's report
│   │   ├── history/         # Score history
│   │   └── report/[date]/   # Archived reports
│   ├── components/          # All UI components
│   └── lib/                 # Data access layer
└── data/
    └── nvda_daily_log.json  # Persistent report store (auto-created)
```

---

## How it works

```
8:20am ET (cron)
    │
    ▼
Phase 0 — NYSE calendar check (exits if non-trading day)
Phase 1 — Parallel data fetch: yfinance + NewsAPI + macro RSS
Phase 2 — Claude classifies each news item (event type, novelty, thesis relevance)
Phase 3 — Rule-based scoring: Attention Score + Thesis Risk Score
Phase 4 — Validation loop: Claude re-evaluates if score ≥ 6 or unusual market move
Phase 5 — Claude generates top drivers, interpretation, suggested action
Phase 6 — Writes to data/nvda_daily_log.json
    │
    ▼
Dashboard reads JSON → http://localhost:3000
```

---

## Scoring Framework

### Attention Score weights
| Dimension | Weight |
|---|---|
| Company catalyst strength | 35% |
| Market reaction strength | 25% |
| Macro risk intensity | 20% |
| Long-term thesis relevance | 20% |

### Thesis Risk Score weights
| Dimension | Weight |
|---|---|
| Official disclosure / guidance change | 40% |
| Regulatory / policy risk | 30% |
| Demand signal change | 20% |
| Competitive threat | 10% |

---

## Notes

- Email delivery is **disabled** in this version. Reports are dashboard-only.
- The `data/nvda_daily_log.json` file is excluded from git (contains fetched financial data).
- API keys in `agent/.env` are excluded from git. Never commit them.
- This is a personal monitoring tool, not financial advice.
