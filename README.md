# Papercut
### By Sagar Sahu
### OpenAI Build Week Hacakthon

Papercut is a multiplayer crypto paper-trading competition for friends. Every player starts with **$1,000,000 USD** in virtual capital, trades the same live crypto market, and receives a private post-challenge coaching reflection grounded in their own decisions.

The product is deliberately built around a simple idea: competition creates a reason to keep returning; a passive coach turns the resulting trade history into an investing lesson. It is virtual trading only—not financial advice.

> **Live testing is recommended.** Papercut is already deployed. For the current live URL, approved test accounts, room details, and the complete demo walkthrough, follow the **Testing Instructions** provided with the submission. Those details are intentionally not committed to this repository.

## What is implemented

- Email-and-password accounts with persistent Supabase sessions.
- Host-created rooms, shareable invite codes, guest join flow, waiting rooms, and host-only challenge start/end controls.
- A $1M USD portfolio for every player, live crypto prices, simulated buy/sell orders, holdings, private trade history, and calculated leaderboards.
- Portfolio history that stays flat until a player actually makes a trade, rather than copying an asset chart.
- Active/completed room organization, custom durations in minutes, hours, or days, countdowns with seconds, and automatic order blocking after expiry.
- A passive coach that is locked during active trading, then provides a final debrief, saved lesson history, and a final “trading personality” recap after the challenge ends.

## Stack

| Area | Technology |
| --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript, Node.js |
| UI | Tailwind CSS 4, shadcn/ui, Base UI, Framer Motion, Lucide, Recharts |
| Data and auth | Supabase Auth, PostgreSQL, Row Level Security, `@supabase/ssr` |
| Market data | CoinGecko API first, CoinMarketCap API fallback |
| Coach runtime | GPT-5.6 Terra, NVIDIA NIM, Nemotron primary model, Meta Llama 3.1 8B fallback |
| Delivery | GitHub, GitHub Desktop, Vercel |

## Architecture at a glance

| Layer | Responsibility |
| --- | --- |
| Next.js pages and API routes | UI, authenticated server routes, trade/debrief requests, room lifecycle |
| Supabase Auth | Email/password identity and browser session persistence |
| Supabase Postgres | Rooms, memberships, holdings, trades, price snapshots, debriefs, and final recaps |
| Supabase RPCs + RLS | Server-enforced room membership, start/join/end rules, trade validation, and private data access |
| CoinGecko / CoinMarketCap | Current asset prices and 24-hour change data |
| GPT-5.6 + NVIDIA NIM | Structured, post-challenge coaching narrative with deterministic fallback behavior |

## Local setup for maintainers

The deployed app and the accompanying Testing Instructions are the recommended way to evaluate Papercut. Local setup is intended only for authorized maintainers who need to extend or debug the project.

### Prerequisites

- Node.js **20.9+**
- npm
- Access to the project owner’s private configuration

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare Supabase

For a fresh Supabase project, open the SQL Editor and run these files in this exact order:

1. [`supabase/schema.sql`](supabase/schema.sql)
2. [`20260719_room_lifecycle.sql`](supabase/migrations/20260719_room_lifecycle.sql)
3. [`20260719_profiles_waiting_room.sql`](supabase/migrations/20260719_profiles_waiting_room.sql)
4. [`20260719_host_role_backfill.sql`](supabase/migrations/20260719_host_role_backfill.sql)
5. [`20260720_close_room.sql`](supabase/migrations/20260720_close_room.sql)
6. [`20260720_market_snapshots.sql`](supabase/migrations/20260720_market_snapshots.sql)
7. [`20260720_trading_and_durations.sql`](supabase/migrations/20260720_trading_and_durations.sql)
8. [`20260720_host_end_challenge.sql`](supabase/migrations/20260720_host_end_challenge.sql)
9. [`20260720_room_portfolio_visibility.sql`](supabase/migrations/20260720_room_portfolio_visibility.sql)
10. [`20260720_private_trade_history.sql`](supabase/migrations/20260720_private_trade_history.sql)
11. [`20260720_ai_debriefs.sql`](supabase/migrations/20260720_ai_debriefs.sql)
12. [`20260721_expire_rooms.sql`](supabase/migrations/20260721_expire_rooms.sql)
13. [`20260721_final_coach_recaps.sql`](supabase/migrations/20260721_final_coach_recaps.sql)

For an existing project, run only the missing migrations, from oldest to newest.

Then configure email/password authentication for the POC and disable email confirmation. Obtain all private configuration through the project owner’s secure channel; do not place credentials, environment-variable details, test accounts, or deployment URLs in source control.

### 3. Run and validate

```bash
npm run dev
```

Before shipping a code change, run:

```bash
npm run lint
npm run build
```

## Live testing and sample data

Papercut is already live, and the production deployment is the recommended evaluation path. The Testing Instructions provide the live URL, approved test credentials, sample room state, and the two-browser host/guest walkthrough.

No public app URL, account, password, room code, or seeded-data credential is stored in this README. The app creates each player’s $1,000,000 USD starting balance automatically and captures live demo data during the prescribed test flow.

## Deployment and updates

The production project is connected to GitHub. For an authorized maintainer to publish an update:

1. Commit the validated change.
2. Push it to the configured production branch.
3. Confirm the linked deployment finishes successfully.
4. Re-run the production testing flow from the Testing Instructions.

Deployment configuration, secrets, domains, and access details are private and intentionally omitted from this repository.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /api/market` | Authenticated live price retrieval and snapshot persistence |
| `GET /api/market/[id]/history` | Historical price points for chart modes |
| `POST /api/trades` | Validated simulated buy/sell execution |
| `POST /api/rooms/end` | Host-only early room completion |
| `POST /api/rooms/expire` | Marks an expired active room as complete |
| `POST /api/debriefs/generate` | Final private trade debrief after completion |
| `POST /api/debriefs/recap` | Final private trading-personality recap |

## AI coach design

The coach is intentionally passive during active trading. The UI and API reject coach-generation requests until the room is complete, preventing real-time advice from influencing the next order.

After completion, the coach receives only the signed-in player’s simulated orders, holdings, portfolio value, and earlier saved debriefs. It returns a concise summary, educational patterns, a lesson, and a final synthesis. If the NIM response is unavailable or malformed, Papercut uses a deterministic fallback so the demo remains functional.

### Model transparency

- **Runtime model provider:** NVIDIA NIM, using the configured Nemotron model with Meta Llama 3.1 8B fallback, meant to preserve tokens and minimize cost at runtime.
- **GPT-5.6:** used through Codex during development.

## How Codex and GPT-5.6 accelerated the build

Codex was used as an implementation collaborator throughout the build. GPT-5.6, accessed through Codex, accelerated the development workflow rather than acting as a hidden runtime model provider (at some times).

| Area | How Codex / GPT-5.6 contributed |
| --- | --- |
| Product planning | Turned the PRD into incremental implementation phases and kept each phase reviewable before moving ahead. |
| App foundation | Scaffolded the Next.js, TypeScript, Tailwind, shadcn/ui, and Framer Motion structure. |
| Product UX | Iterated on the hero, auth, create/join flow, waiting room, dashboard, responsive ticker, charts, and portfolio interactions from rapid feedback. |
| Multiplayer data model | Designed Supabase tables, RLS policies, and RPCs for room creation, joining, starting, ending, expiry, and trade execution. |
| Trading engine | Implemented USD/unit order modes, starting-capital rules, holdings, rankings, private trade history, and transaction-aware portfolio reconstruction. |
| AI workflow | Built the passive-coach guardrails, structured debrief/recap payloads, NIM fallback behavior, storage migrations, and Feedback UI. |
| Quality and debugging | Diagnosed Next.js Fast Refresh hook issues, validated migrations/routes, and repeatedly ran lint, TypeScript, and production builds. |

### Key implementation decisions

| Decision | Rationale |
| --- | --- |
| $1M starts as USD cash | Keeps paper trading intuitive and makes portfolio performance comparable across all players. |
| Crypto-only v1 | Markets are available 24/7, making a time-boxed hackathon challenge easier to demo. |
| Private player trade history | Preserves competition while preventing one player from copying another player’s orders. |
| Passive coach | Prevents the AI from becoming a signals bot and keeps feedback educational rather than prescriptive. |
| CoinGecko primary + CoinMarketCap fallback | Improves resilience within free-tier data constraints. |
| NIM runtime fallback | Keeps generated feedback available despite the lack of OpenAI API credits during the build. |

## Current limitations and next production steps

- There is no Vercel Cron job yet. Snapshots are persisted while authenticated users request market data; a scheduled endpoint is the next hardening step for unattended historical data.
- There is no committed database seed script. The two-player demo flow above generates live demo data quickly.
- Email confirmation is intentionally disabled only for the hackathon POC. Enable verification and strengthen abuse controls before a public launch.
- The coach is an educational reflection tool, not financial advice.
