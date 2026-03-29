# LEARNINGS.md
## NVDA Daily Strategist — Build Retrospective

**Date:** 2026-03-29
**Context:** Post-build notes from designing and implementing the NVDA Daily Strategist MVP

---

## 1. Design Preferences

### What worked well

**Typography pairing: Barlow Condensed + DM Mono**
- Barlow Condensed at 900 weight for scores creates strong visual hierarchy with minimal space
- DM Mono for all numeric/data values creates a clear semantic split: "editorial content" vs "machine output"
- The combination reads as both authoritative and technical — exactly right for a financial signal tool

**Orange accent bar as structural identity**
- A 72px fixed vertical orange bar is more memorable than a logo
- It creates a literal "spine" that anchors every page to a single recognizable identity
- Don't replace it with a wordmark — the bar is the brand

**Off-white warm background (#f4f0e8)**
- More sophisticated than pure white; reduces eye fatigue on a tool you open every morning
- Creates warmth that contrasts well with the dark ticker tape strip
- The deliberate mix of warm background + cold monochrome data text creates productive tension

**Score-to-color mapping that means something**
- Score ≥ 7 → orange. Score ≥ 9 → red. Thesis at_risk → red. Intact → green.
- Using orange (not yellow) for "elevated" avoids the "traffic light" cliché while still feeling urgent
- Green only appears for "intact" — it's earned, not defaulted

**Dark ticker tape strip**
- Harsh contrast against the warm background is intentional: it reads as a "status bar" (always on, real-time, critical)
- If it felt too aggressive at first glance — that's correct. It should feel like a Bloomberg terminal quote strip.

**Ghost oversized score number**
- The large faded number behind the score hero (e.g., "8" rendered at ~240px, 5% opacity) creates editorial depth
- It's the kind of detail that makes a dashboard feel designed vs. generated

---

## 2. Bad Designs & What Was Wrong

### Option 1 (first exploration) — Too terminal/Bloomberg-raw
- Pure dark background with neon accents: readable but cold
- Financial dashboards that look like IDEs signal "tool for traders" not "signal filter for long-term holders"
- The audience doesn't want to feel like they're staring at a trading terminal at 8am
- **Fix:** Use warm backgrounds, reserve dark for contrast elements only (ticker tape, code blocks)

### Option 2 (second exploration) — Too editorial/magazine
- Clean white, generous whitespace, serif fonts: beautiful but too passive
- A long-term investor opening this at 8:20am doesn't want to feel like they're reading a magazine
- Low information density is frustrating when you know the data exists and want it fast
- **Fix:** Density matters. Pack meaningful data — don't "design away" the content

### Option 3 (third exploration) — Best foundation, missing context metrics
- Light warm palette, strong typographic hierarchy: closest to the right answer
- But lacked the historical bars, peer comparison, and macro context grid in the main body
- You can't assess "NVDA down 2%" without knowing if SOXX and QQQ are also down 2%
- **Fix:** Add relative/comparative data. Absolute prices alone are noise. Context is signal.

### "Mean" design (Option 4 first iteration) — High contrast eye strain
- Kept dark cards + dark background: mid-grey text on near-black backgrounds
- At 8am with normal room lighting, the contrast ratio is uncomfortable — not accessible
- The problem was "dark on dark" not "dark vs. light"
- **Fix:** Revert to Option 3's light palette (#f4f0e8). Keep dark restricted to intentional contrast strips.

### General anti-patterns to avoid
- Purple gradient backgrounds: generic, no personality, reads as "AI-generated template"
- Rounded corners on everything: friendly but not authoritative — wrong tone for financial signals
- Shadows: softens edges, reduces precision feel
- System fonts (Inter, Arial, Roboto): invisible personality, forgettable
- Equal color distribution: a palette where every color gets equal real estate has no hierarchy

---

## 3. How to Avoid Bad Assumptions

### Product assumptions

**Ask about output channel first, not UI**
- First assumption was "email + dashboard" — turns out email was complexity with no additional value
- For a personal local tool used at a fixed time daily, a browser tab is strictly better than email
- If the tool has a scheduler, the output should be pull (open tab) not push (receive email)
- **Rule:** Before designing delivery, ask: "Does the user need to be notified, or will they check?"

**Don't default to "all data available"**
- First pass assumed NewsAPI would always return results, macro calendar RSS would always parse
- In practice: macOS SSL certificate errors blocked RSS, NewsAPI has rate limits and 0-result days
- **Rule:** Design for partial data from day one. Every data source should be optional; scores should degrade gracefully, not fail silently.

**Half-trading days need explicit handling**
- Easy to miss: NYSE half-days exist and affect how scores should be weighted
- Macro events scheduled for a half-session deserve lower weight (market closes early)
- **Rule:** When building NYSE-calendar-dependent tools, enumerate all day types upfront: full, half, holiday, pre/post-market.

### Technical assumptions

**Python module imports break when run from subdirectory**
- Running `python agent/main.py` vs `python main.py` from inside `agent/` produces different `sys.path` states
- Fix is simple: `sys.path.insert(0, str(Path(__file__).parent.parent))` before local imports
- **Rule:** Always test your entry point by running it from the project root, not from inside the module directory.

**Next.js config file format matters**
- Assumed `.ts` config would work — Next.js 14.2.5 only supports `.mjs` or `.js` for config
- Easy to miss because the error message doesn't clearly say "wrong extension"
- **Rule:** Check supported config file formats in the target framework version before writing config.

**TypeScript interfaces must match the actual JSON schema**
- `context_metrics` in Python wrote `vix_price` and `tnx_price`, but TypeScript type didn't include them
- Silent build error that only surfaces at runtime when the dashboard tries to render those fields
- **Rule:** Define the JSON schema first (or generate types from the Python output), then write both sides to match it.

**Claude API credits are not assumed**
- If you write an LLM-dependent pipeline without testing the API key, you'll discover the credit issue at runtime
- Always validate API key + credits in the pipeline's health check phase
- The graceful degradation path (rule-based fallback scores) exists for exactly this reason
- **Rule:** Build fallback logic before testing the happy path. The happy path almost never runs first.

### UX assumptions

**"Under 20 seconds to decide" is a real constraint**
- The attention score and thesis verdict need to be above the fold, large, and immediately readable
- Don't bury the score in a card with a label — make it the page
- **Rule:** For decision-support tools, the primary output should be readable in under 3 seconds without scrolling.

**Comparative data is mandatory, not optional**
- "NVDA down 2.5%" means nothing without "SOXX down 3.1%, QQQ down 1.8%"
- The tool's core value is separating company-specific signal from market-wide noise
- That separation is impossible to make if you only show absolute NVDA data
- **Rule:** Any metric that only has meaning in context should always be shown with its context.

**Personal tools don't need auth but do need transparency**
- No login, no user sessions — correct for a personal local tool
- But the dashboard still needs to be transparent about when data is partial, which sources failed, and pipeline metadata
- Transparency builds trust even when you're the only user — especially on the days that matter most
- **Rule:** Even for single-user tools, log what happened. You will want to debug a high-score day that turned out to be wrong.

---

## 4. Architecture Lessons

**Agentic pipeline as phases, not monolith**
- Breaking the pipeline into 6 discrete phases (Calendar → Gather → Classify → Score → Validate → Log) made debugging and graceful degradation much easier
- Each phase can fail or be skipped independently
- **Rule:** Pipelines that touch multiple external systems should be phase-based, not a flat sequence of calls.

**Atomic writes prevent corruption**
- Writing to `.tmp` then `os.rename()` ensures the log is never in a partially-written state
- A crash during write leaves the previous valid log intact
- **Rule:** Any log or state file that will be read by another process (the dashboard) should use atomic writes.

**Token budget forces good prompt design**
- The 8,000-token cap required batching news classification into a single call instead of one call per headline
- This forced a cleaner, more structured prompt that returned structured JSON
- Constraints often produce better design than open-ended budgets
- **Rule:** Set token budgets before writing prompts. It changes how you structure the problem.

**Conditional tool calling (not LLM-native) is more reliable**
- The validation loop is implemented as Python branching logic, not as an LLM deciding to "call a tool"
- The LLM's job is classification and text generation — not pipeline orchestration
- Python can reason about numbers reliably (score ≥ 6) where LLMs introduce unnecessary variance
- **Rule:** Use LLMs for classification, generation, and summarization. Use code for conditional logic, math, and routing.

---

*LEARNINGS.md — NVDA Daily Strategist — 2026-03-29*
