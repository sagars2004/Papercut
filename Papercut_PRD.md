# Papercut — Product Requirements Document

**OpenAI Build Week Hackathon Submission**
**Track:** Education
**Built with:** Codex + GPT-5.6

---

## 1. Product Overview

### 1.1 One-liner
A multiplayer trading simulator where friends compete using $1M virtual capital, while a passive AI coach studies every trade and delivers daily debriefs teaching real investing lessons.

### 1.2 Problem
Most people learn to trade by either (a) doing nothing, because real money feels too risky to experiment with, or (b) losing real money before they understand why. Paper trading tools solve the risk problem but not the learning problem — they let you simulate trades but give zero feedback on *why* your decisions were good or bad. Meanwhile, financial literacy content (YouTube explainers, courses) is passive and generic — it doesn't respond to what *you* actually did.

Papercut closes that loop: real behavioral data (your actual trades) + real market movement + a coach that reflects your specific decisions back at you every day.

### 1.3 Why competition + friends
Solo trading simulators have poor retention — there's no reason to log in day 2. Turning it into a competition with friends (leaderboard, shared stakes, bragging rights) creates a reason to keep trading daily, which means the AI coach has fresh behavior to analyze every day instead of a one-time backtest. The competition is the retention engine; the education is the actual value.

### 1.4 Target audience
- New-grad / early-career professionals curious about investing but hesitant to risk real capital
- Friend groups / roommates who already do informal "what stock would you buy" chat debates
- Finance-adjacent students who want practical experience beyond textbook theory

### 1.5 Core insight
The AI coach is **passive during the day, active at night**. It never gives real-time buy/sell advice (that would turn this into a signals bot and defeat the learning purpose). It only observes, then teaches — after the fact, when the lesson can't be gamed.

---

## 2. Features

### 2.1 Room & Competition Setup
- Create a "room" (competition instance) with configurable parameters:
  - Duration (e.g., 5 / 7 / 14 days)
  - Starting capital (default $1,000,000 virtual)
  - Asset universe (stocks, crypto, or mixed — configurable per room)
  - Trade frequency limits (optional, e.g., max 10 trades/day, to discourage pure spam-trading)
- Shareable invite link / room code
- Room creator can start the clock once enough players have joined

### 2.2 Trading Interface
- Browse available assets with live/near-live price data
- Buy / sell / hold actions with position sizing (shares or $ amount)
- Portfolio view: holdings, cash balance, unrealized/realized P&L, allocation breakdown
- Trade history log (immutable, timestamped — this is what feeds the AI coach)
- Basic charting per asset (price history over the competition window)

### 2.3 Live Leaderboard
- Real-time ranking by portfolio value (cash + holdings at current market price)
- Secondary stats visible: volatility of returns, largest single gain/loss, number of trades
- Daily snapshot history so players can see rank movement over the competition, not just final state

### 2.4 Passive AI Observer Agent
- Runs continuously in the background per player, per room
- Ingests: trade log, timing of trades, position sizes, portfolio composition, market context at time of trade
- **Never surfaces anything to the player during market hours** — purely observational during the day
- Detects behavioral patterns using GPT-5.6, e.g.:
  - Overtrading / churn
  - Panic-selling after a dip
  - Chasing pumps / FOMO entries
  - Lack of diversification / concentration risk
  - Ignoring stop-loss discipline
  - Doubling down on losers ("revenge trading")

### 2.5 Daily Debrief Engine
- Triggered once per simulated/real trading day (configurable — real-time for crypto rooms which trade 24/7, end-of-day for stock rooms)
- Generates a personalized report per player containing:
  - **Metrics:** daily return %, drawdown, volatility, win/loss ratio, largest position
  - **Pattern flags:** plain-English description of behavior detected that day, with the specific trade(s) that triggered the flag
  - **One lesson:** a single, specific, actionable takeaway tied to that day's decisions — not generic advice. (e.g., "You sold NVDA 40 minutes after buying it, right after a 2% dip — that's the third time this week. Consider setting a rule to hold at least 24 hours before reacting to short-term moves.")
- Debrief delivered via in-app notification + optionally email/SMS digest

### 2.6 Lesson History & Progress Tracking
- Running log of every lesson a player has received across the competition
- Simple tagging (e.g., "risk management," "diversification," "emotional discipline") so patterns across days are visible
- Visual indicator of whether flagged behaviors are improving, worsening, or unchanged over time

### 2.7 End-of-Challenge Summary
- Final leaderboard with full performance breakdown
- AI-generated "trading personality" recap per player — a synthesized narrative across the whole competition (e.g., "The Momentum Chaser," "The Diamond Hands Diversifier") grounded in actual behavior, not a generic quiz result
- Shareable summary card (for socials / bragging rights — also doubles as organic demo material)

---

## 3. Technical Implementation

### 3.1 Architecture Overview
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend    │◄────►│  App Backend      │◄────►│  Market Data API │
│  (Next.js)   │      │  (Node/Express)   │      │  (prices, feed)  │
└─────────────┘      └──────────────────┘      └─────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Trade Log Store  │
                     │  (Postgres)       │
                     └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  AI Coach Service │
                     │  (GPT-5.6 API)    │
                     │  scheduled jobs   │
                     └──────────────────┘
```

### 3.2 Stack
- **Frontend:** Next.js + React, Tailwind for styling, real-time updates via WebSockets or polling for leaderboard/price ticks
- **Backend:** Node.js/Express (or Next.js API routes) for room management, trade execution logic, auth
- **Database:** Postgres (via Supabase for speed of hackathon build — built-in auth, realtime subscriptions, and row-level security for multiplayer rooms)
- **Market Data:** see §4 external integrations
- **AI Layer:** GPT-5.6 via OpenAI API, orchestrated through Codex-built background jobs
- **Auth:** Magic link or OAuth (Google) via Supabase Auth — low friction for inviting friends
- **Hosting:** Vercel (frontend + API routes), Supabase (DB/auth), scheduled jobs via Vercel Cron or a lightweight worker (e.g., Trigger.dev)

### 3.3 Data Model (core tables)
- `rooms` — id, name, duration_days, starting_capital, asset_universe, status, created_by
- `players` — id, room_id, user_id, cash_balance, joined_at
- `trades` — id, player_id, asset_symbol, action (buy/sell), quantity, price_at_execution, timestamp
- `holdings` — derived/materialized view from trades: player_id, asset_symbol, quantity, avg_cost_basis
- `debriefs` — id, player_id, room_id, date, metrics_json, pattern_flags_json, lesson_text, created_at
- `price_snapshots` — asset_symbol, timestamp, price (cached from market data API to avoid rate limits and to reconstruct portfolio value at any point in time)

### 3.4 AI Coach Pipeline (the technical core)
1. **Scheduled trigger** (daily cron, or per-room based on competition timezone/close): for each active player in each active room, pull that day's trade log + resulting portfolio state.
2. **Context assembly:** structure the day's data into a compact, structured prompt (trades, timestamps, price context at each trade, portfolio before/after) — avoid dumping raw logs, since GPT-5.6 performs better on structured, labeled input.
3. **Pattern detection call:** GPT-5.6 call #1 — classify behavioral patterns present in the day's trades against a fixed taxonomy (overtrading, panic-selling, FOMO entry, concentration risk, revenge trading, etc.), with confidence and supporting evidence (which specific trade triggered the flag).
4. **Lesson generation call:** GPT-5.6 call #2 — using the flagged patterns + metrics, generate one specific, personalized lesson in plain English, grounded in the actual trade(s), not generic advice. Prompt explicitly instructs the model to reference specific assets/timestamps/amounts so it reads as personalized, not templated.
5. **Structured output:** enforce JSON schema output (metrics, flags array, lesson text) so the frontend can render consistently — this is a good showcase moment for Codex, since generating and validating the schema/parsing logic is exactly the kind of scaffolding work Codex accelerates.
6. **Storage + delivery:** write to `debriefs` table, push notification to player.
7. **End-of-competition synthesis:** a final GPT-5.6 call aggregates all daily debriefs for a player into the "trading personality" recap.

### 3.5 Market Data Handling
- Poll/stream prices on an interval appropriate to asset class (crypto: near-real-time; stocks: 15-min delayed is acceptable for a simulator and avoids paid real-time licensing issues)
- Cache prices in `price_snapshots` so portfolio value can be reconstructed at any historical timestamp (needed for accurate daily debrief metrics and leaderboard history, not just current state)
- Handle market-closed periods gracefully for stock rooms (freeze valuation outside trading hours, clearly communicate this in UI)

### 3.6 Supported Asset Universe

Papercut v1 supports a fixed list of 94 tradable crypto assets (chosen to span large-cap majors, DeFi, L1/L2s, memecoins, and recent high-attention launches — giving players enough range to demonstrate real strategy differences, from blue-chip holding to memecoin degen behavior):

```
BTC, ETH, BNB, ZEC, XMR, BCH, GNO, AAVE, SOL, OKB, HYPE, QNT, LTC, VVV, LINK, ETC, KCS, AVAX,
GT, INJ, UNI, ICP, NEAR, MORPHO, BGB, TRUMP, ATOM, RNDR, TON, CAKE, M, XRP, AXS, ZRO, DOT, FIL,
NEXO, SUI, JTO, RAY, ASTER, APT, VIRTUAL, MINT, WLD, SPX, TIA, TRX, ONDO, XTZ, JUP, CRV, XLM,
ADA, WIF, FET, STX, THETA, CC, IMX, APE, PI, OP, JST, ALGO, ARB, ENA, DOGE, POL, HBAR, 2Z, MANA,
H, CRO, WLFI, SAND, SEI, PYTH, STRK, KAS, ENJ, S, GRT, FLR, PENGU, VET, BTT, GALA, PUMP, MON,
BONK, SHIB, PEPE, HTX
```

**Implementation notes:**
- Store this list as a seeded `assets` table (symbol, display_name, coingecko_id) rather than hardcoding it — makes it trivial to add/remove assets post-hackathon and gives a clean join target for `price_snapshots`.
- Not every symbol here is a top-100 CoinGecko asset (some are newer/lower-liquidity — e.g., `ASTER`, `VVV`, `MON`, `M`, `2Z`, `WLFI`). Before wiring price ingestion, run a quick pass mapping each symbol to its correct `coingecko_id` (symbol collisions are common — e.g., multiple unrelated tokens can share a ticker — so resolve by contract/chain, not just ticker text). For any asset CoinGecko doesn't cover cleanly, fall back to CoinMarketCap's API or exclude it from v1 and note it as a known limitation in the README rather than shipping a broken price feed for it.
- Since this list mixes majors (BTC, ETH) with highly volatile small-caps and memecoins (PEPE, BONK, WIF, PUMP), the AI coach's pattern taxonomy should treat concentration/volatility flags relative to an asset's typical volatility, not a flat threshold — a 20% single-day move is normal for a memecoin and a red flag for BTC. Worth a line in the demo video since it's a real design decision, not an oversight.

### 3.7 Key Technical Challenges (worth highlighting in submission for "technological implementation" scoring)
- Reconstructing accurate portfolio value/P&L at arbitrary points in time from a trade log + price history
- Designing a pattern-detection taxonomy that's specific enough to generate useful lessons but general enough to apply across very different trading styles
- Keeping the AI coach genuinely passive (no real-time leakage) while still running continuous background analysis
- Real-time multiplayer state (leaderboard, room status) without over-engineering for a hackathon timeline

---

## 4. External Integrations

| Integration | Purpose | Notes |
|---|---|---|
| **OpenAI API (GPT-5.6)** | Pattern detection, lesson generation, personality synthesis | Core requirement of the hackathon |
| **Market data API** (e.g., Alpaca Markets, Polygon.io, or CoinGecko/CoinCap for crypto) | Real asset prices for the simulation | Free tiers sufficient for hackathon demo scope; pick based on asset universe (stocks vs. crypto) |
| **Supabase** | Auth, Postgres DB, realtime subscriptions for live leaderboard | Speeds up multiplayer + auth build significantly |
| **Vercel** | Hosting + cron jobs for scheduled debrief generation | |
| **Resend / SendGrid (optional)** | Email delivery of daily debriefs | Nice-to-have, not core |
| **Devpost Hackathons plugin (ChatGPT)** | Submission prep, requirement tracking | Used during build process, not a runtime integration |

---

## 5. Hackathon Requirements Checklist

- [ ] **Category:** Education
- [ ] **Working project:** deployed, live URL for judges to test directly (create a demo room pre-seeded with a few days of realistic trade history so judges see debriefs without waiting for a full multi-day cycle)
- [ ] **Project description:** problem, solution, how it works (this PRD → condensed for submission form)
- [ ] **Demo video (<3 min, public YouTube):**
  - Show creating a room, inviting a "friend" (can be a second browser/account)
  - Show placing a few trades with intentionally flawed behavior (e.g., panic-sell) to trigger a specific pattern flag
  - Show the daily debrief being generated and rendered
  - Narrate specifically **where Codex accelerated the build** (e.g., scaffolding the trade-log-to-portfolio-value reconstruction logic, the JSON schema validation for structured GPT-5.6 output, the realtime leaderboard wiring) and **how GPT-5.6 was used** (two-call pipeline: pattern detection → lesson generation)
- [ ] **Code repository:** public with license, or private + shared with testing@devpost.com and build-week-event@openai.com
  - [ ] README with setup instructions, sample/seed data for a demo room, clear run instructions
  - [ ] Explicit section in README: "How Codex accelerated this build" + "How GPT-5.6 is used" + key decisions made
- [ ] **/feedback Codex Session ID** — capture during the core build session, include in submission form
- [ ] Since this isn't a dev tool/plugin, no separate sandbox/test-account requirement applies — but still provide a pre-seeded demo room + test login so judges don't have to play multiple days to see the core AI feature

---

## 6. Judging Criteria Alignment

- **Technological Implementation:** The two-stage GPT-5.6 pipeline (pattern detection → grounded lesson generation) with structured output, plus the portfolio-value-over-time reconstruction engine, are both non-trivial and demonstrate real engineering — not a thin API wrapper.
- **Design:** Full product loop — room creation, trading, leaderboard, debrief, end-of-competition recap — not just a proof-of-concept trading screen.
- **Potential Impact:** Specific, credible audience (friend groups wanting a low-stakes way to build real investing literacy) with a mechanism (competition-driven retention + grounded personalized feedback) that directly addresses the stated problem (passive financial education doesn't stick).
- **Quality of the Idea:** Distinct from both generic paper-trading apps (no feedback loop) and generic finance-education content (not personalized, not behavior-driven). The "passive by day, coach by night" framing is the differentiator worth emphasizing in the pitch.

---

## 7. Scope Guardrails for Hackathon Timeline

To keep this buildable in the hackathon window, cut aggressively if needed:
- **Must have:** single-asset-class room (pick crypto — 24/7 markets mean no "market closed" edge cases, and price APIs are simpler/free), core trading loop, trade log, one daily debrief cycle working end-to-end, basic leaderboard
- **Should have:** lesson history view, end-of-competition personality recap
- **Cut if short on time:** email delivery, multi-asset-class support, configurable trade limits, charting beyond a simple line

---

## 8. UI/UX Design & Screens

**One unified theme across the entire product:** dark navy/near-black background with a single lime-green (`#C4FF0D`) accent color, used consistently on the hero page, dashboard, and every tab (Trade, Leaderboard, History, Feedback). No light-theme dashboard, no secondary accent color — every screen shares the same background gradient, card styling, typography, and lime accent for CTAs, active states, positive price movement, and highlights. A dark-mode toggle can exist for accessibility, but lime-on-dark is the default and primary brand identity, not one of two competing looks.

### 8.1 Hero / Login Page
- Deep green-to-black gradient background, lime-green (`#C4FF0D`) accent for CTAs and highlights
- Built from a provided React hero component (`VaultoryHero`, using `framer-motion` for entrance/floating animations) — adapted for Papercut: swap wallet-app copy for the competition pitch ("Trade $1M virtual capital against your friends"), swap floating wallet-brand coins for a few of Papercut's supported assets (BTC, ETH, SOL icons floating with subtle animation)
- Nav bar: logo, links (How it Works, Leaderboard, Rooms), Login / Sign Up buttons
- Primary CTA: email input + "Create a Room" / "Sign Up" button
- Brand strip at the bottom (repurposed for supported-asset logos instead of wallet partners)

### 8.2 Dashboard (post-login, in-room view)
Same dark/lime theme as the hero, applied to a data-dense layout.

**Top bar:** app logo + room name (left) · tab navigation — **Dashboard | Trade | Leaderboard | History | Feedback** — with the active tab highlighted in lime · theme toggle, user name/avatar (right)

**Live ticker strip** (directly under top bar): horizontally scrolling live price ticker across all 94 supported assets, symbol + price + % change (lime for positive, red for negative — the only two semantic colors layered on top of the base dark/lime theme) — see §8.4 for data source.

**Dashboard tab layout:**
- **Portfolio History** (large, main column): area chart of the player's total portfolio value over time, 1H / 24H / 1W range toggle, lime line/fill on dark background
- **Your Rank** (top right card): large rank number + "out of N traders"
- **Who's Holding What** (right column): % of all competing portfolios holding each asset — cheap aggregate query, adds a competitive/community signal
- **Asset Allocation** (bottom left): donut chart of the player's current portfolio composition, lime as the dominant/primary-holding color with muted tones for the rest
- **My Portfolio** (bottom center, largest panel): countdown timer to competition end, total portfolio value, Public/Private toggle (off by default), "+ Add Asset," per-holding rows with Buy/Sell buttons
- **Lesson-of-the-day panel** (bottom right, optional): rotating teaser pulled from the AI coach's most recent debrief — reinforces the education angle right on the dashboard

### 8.3 Trade Tab (matches reference layout)
Two-panel layout, both dark/lime themed:

**Left panel — Live Prices:**
- Search/filter input ("Filter assets") at top
- Scrollable list of all 94 supported assets, each row: asset icon, symbol, % change (lime/red), current price
- "LIVE" indicator badge confirming the feed is active

**Right panel — Chart & Order Ticket:**
- Full TradingView Advanced Chart widget for the selected asset: candlesticks, timeframe selector (1m/30m/1h/etc.), drawing tools, indicators — this is the same widget family as the ticker strip, just the larger interactive version
- Below the chart: order ticket bar showing **USD Available**, a lime **BUY [ASSET]** button, a red **SELL [ASSET]** button, and the player's current holding of that asset (e.g., "BTC Held: 6.25555998")
- Clicking an asset in the left list swaps the chart and order ticket to that asset

**Leaderboard tab:** full ranked list, sortable columns (portfolio value, % return, volatility, trade count), room-wide stats — same dark/lime styling

**History tab:** the player's own trade log and daily debrief history (§2.6), plus room-wide activity if the room is public

### 8.4 Component/Styling Stack
- shadcn/ui component structure (`/components/ui`) + Tailwind CSS + TypeScript — confirm the project is scaffolded this way (via shadcn CLI) before dropping in components; if not set up, run shadcn init first so every component shares the same design tokens
- Define the dark/lime theme once as Tailwind/shadcn design tokens (background, card, border, and the single `--accent: #C4FF0D` value) and reference those tokens everywhere — this is what keeps the hero, dashboard, and Trade tab visually unified instead of drifting into per-page one-off styling
- `framer-motion` for hero-page animation and dashboard micro-interactions (card entrance, number count-ups)
- Recharts for the Portfolio History area chart and Asset Allocation donut, both restyled to the lime-on-dark palette

### 8.5 Live Trading Tickers & Charts
Use the **TradingView Ticker Tape widget** (dashboard header strip) and **TradingView Advanced Chart widget** (Trade tab main panel) — both free, no API key, embedded via a single `<script>` tag, and both themeable to dark mode natively (TradingView widgets accept a `"theme": "dark"` config option, so they drop into the unified palette without custom CSS overrides). This is purely a *display* layer.

**Important distinction:** TradingView widgets are for visual display only — they are not wired into trade execution. The authoritative price used to fill a trade and to compute portfolio value (§3.4–3.6) still comes from the CoinGecko-backed `price_snapshots` pipeline already in this PRD, since that's the price history Papercut needs to reconstruct portfolio value at arbitrary timestamps for the AI coach's metrics. A few of the more obscure supported tokens (e.g., `ASTER`, `VVV`, `2Z`) may not have TradingView symbols available — for those, fall back to a simple in-house price row (symbol, price, % change) styled to match the rest of the UI, sourced from the same CoinGecko data already being polled.

---

## 9. Codex IDE Scaffold Prompt

```
Build "Papercut" — a multiplayer paper-trading competition app with an AI coaching layer.

STACK: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (/components/ui) + framer-motion,
Supabase (Postgres + Auth + Realtime), OpenAI API (GPT-5.6) for the coaching layer,
TradingView embeddable widgets (Ticker Tape + Screener) for live price display,
deployed target Vercel.

CORE ENTITIES:
- rooms (id, name, duration_days, starting_capital, asset_universe, status, created_by, starts_at)
- players (id, room_id, user_id, cash_balance, joined_at)
- assets (symbol, display_name, coingecko_id) -- seeded with the fixed 94-token list below
- trades (id, player_id, asset_symbol, action['buy'|'sell'], quantity, price_at_execution, timestamp)
- price_snapshots (asset_symbol, timestamp, price)
- debriefs (id, player_id, room_id, date, metrics_json, pattern_flags_json, lesson_text, created_at)

SUPPORTED ASSETS (seed the `assets` table with these 94 symbols, resolving each to its correct
coingecko_id -- watch for ticker collisions, resolve by chain/contract not just symbol text):
BTC, ETH, BNB, ZEC, XMR, BCH, GNO, AAVE, SOL, OKB, HYPE, QNT, LTC, VVV, LINK, ETC, KCS, AVAX,
GT, INJ, UNI, ICP, NEAR, MORPHO, BGB, TRUMP, ATOM, RNDR, TON, CAKE, M, XRP, AXS, ZRO, DOT, FIL,
NEXO, SUI, JTO, RAY, ASTER, APT, VIRTUAL, MINT, WLD, SPX, TIA, TRX, ONDO, XTZ, JUP, CRV, XLM,
ADA, WIF, FET, STX, THETA, CC, IMX, APE, PI, OP, JST, ALGO, ARB, ENA, DOGE, POL, HBAR, 2Z, MANA,
H, CRO, WLFI, SAND, SEI, PYTH, STRK, KAS, ENJ, S, GRT, FLR, PENGU, VET, BTT, GALA, PUMP, MON,
BONK, SHIB, PEPE, HTX
-- If any symbol lacks clean CoinGecko coverage, log it and exclude from live price polling for v1
rather than shipping broken prices; note excluded symbols in the README.

BUILD IN THIS ORDER:
0. Confirm shadcn CLI is initialized (creates /components/ui + tailwind config); if not, run
   the shadcn init flow first. Define the dark/lime theme ONCE as shared Tailwind/shadcn design
   tokens (dark navy/black background, --accent: #C4FF0D lime, red for negative price movement)
   and use those tokens on every screen — hero, dashboard, and every tab must look like one
   product, not a light dashboard bolted onto a dark landing page.
   - Hero/login page: dark green-to-black gradient, lime accent, framer-motion entrance
     animations, per PRD §8.1.
   - Dashboard shell (same dark/lime theme): tabs (Dashboard | Trade | Leaderboard | History |
     Feedback), live ticker strip, Portfolio History area chart, Your Rank card, Who's Holding
     What panel, Asset Allocation donut, My Portfolio panel with countdown timer + Public/Private
     toggle, per PRD §8.2.
   - Trade tab (same dark/lime theme): left panel = searchable/filterable scrollable list of all
     94 assets with icon, symbol, % change, price, "LIVE" badge; right panel = TradingView
     Advanced Chart widget (dark theme config) for the selected asset + order ticket bar below
     it showing USD Available, lime BUY button, red SELL button, and current holding of that
     asset. Clicking a list item swaps the chart/order ticket. Per PRD §8.3.
   Use static/mock data for this pass — wire to real data after steps 1-6 below.
1. Supabase schema + auth (magic link) + room creation/join flow with shareable invite code
2. Crypto price ingestion job (poll CoinGecko free API on an interval, write to price_snapshots)
3. Trading engine: buy/sell endpoint that validates cash balance, records trade, updates holdings 
   (derive holdings from trade log rather than storing separately — recompute or materialize)
4. Portfolio valuation function: given a player_id and a timestamp, reconstruct portfolio value 
   from trade log + nearest price_snapshot per asset. This is used for leaderboard AND for debrief metrics.
5. Realtime leaderboard (Supabase realtime subscription) ranking players by current portfolio value
6. AI Coach pipeline (this is the core feature, prioritize getting this right):
   a. Scheduled job (daily, or on-demand for demo purposes) that pulls a player's trades for the day
   b. GPT-5.6 call #1: pattern detection. Input = structured trade list with price context. 
      Output = JSON array of {pattern, confidence, evidence_trade_ids}. Fixed taxonomy: 
      overtrading, panic_selling, fomo_entry, concentration_risk, revenge_trading, disciplined_hold.
   c. GPT-5.6 call #2: lesson generation. Input = flagged patterns + metrics + specific trade details. 
      Output = one paragraph, must reference specific asset/timestamp/amount from that day's trades — 
      explicitly instruct the model to avoid generic advice.
   d. Enforce JSON schema on both calls (use response_format / structured output), validate before storing.
   e. Store to debriefs table, surface in a "Today's Debrief" UI panel.
7. Lesson history view (chronological list of past debriefs, simple tag-based filtering)
8. End-of-competition synthesis call: aggregate all of a player's debriefs into a short 
   "trading personality" recap (GPT-5.6 call #3)
9. Live ticker: embed TradingView Ticker Tape widget (dark theme config) in the dashboard header
   strip and the TradingView Advanced Chart widget (dark theme config) in the Trade tab's right
   panel (display-only — trade execution and portfolio valuation
   still use the CoinGecko-backed price_snapshots pipeline from step 2/4). For supported symbols
   with no TradingView listing, render a fallback ticker row from price_snapshots data.
10. Seed script: generate a demo room with 2-3 fake players and 4-5 days of realistic trade history 
    with at least one obvious behavioral pattern per player, so judges can see a populated debrief 
    without playing for days.

IMPORTANT CONSTRAINTS:
- The AI coach must NEVER be exposed to the player during active trading — no real-time hints, 
  no chat interface during market hours. It only speaks after each day's trades are locked in.
- Prioritize the portfolio valuation reconstruction logic and the AI coach pipeline over UI polish — 
  these are the technically hardest and most judged parts.
- Keep the asset universe to crypto only for v1 (24/7 market, simpler price API, no market-hours logic).
```

---

*Prepared for OpenAI Build Week Hackathon submission — Education track.*
