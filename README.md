This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase setup

1. Copy `.env.example` to `.env` and add your Supabase and market-data credentials. `SUPABASE_SERVICE_ROLE_KEY` is used only by the server to write trusted market-price snapshots; never expose it through a `NEXT_PUBLIC_` variable.
2. In the Supabase SQL Editor, run [schema.sql](supabase/schema.sql), then run [20260719_room_lifecycle.sql](supabase/migrations/20260719_room_lifecycle.sql), [20260719_profiles_waiting_room.sql](supabase/migrations/20260719_profiles_waiting_room.sql), [20260719_host_role_backfill.sql](supabase/migrations/20260719_host_role_backfill.sql), [20260720_close_room.sql](supabase/migrations/20260720_close_room.sql), [20260720_market_snapshots.sql](supabase/migrations/20260720_market_snapshots.sql), [20260720_trading_and_durations.sql](supabase/migrations/20260720_trading_and_durations.sql), [20260720_host_end_challenge.sql](supabase/migrations/20260720_host_end_challenge.sql), [20260720_room_portfolio_visibility.sql](supabase/migrations/20260720_room_portfolio_visibility.sql), [20260720_private_trade_history.sql](supabase/migrations/20260720_private_trade_history.sql), [20260720_ai_debriefs.sql](supabase/migrations/20260720_ai_debriefs.sql), [20260721_expire_rooms.sql](supabase/migrations/20260721_expire_rooms.sql), and [20260721_final_coach_recaps.sql](supabase/migrations/20260721_final_coach_recaps.sql), in that order.
3. In Supabase Auth, enable Email + Password and disable **Confirm email** for this hackathon POC. Add a production email-verification policy before any public launch.

The room migrations add invite codes, host/member roles, public room display names, and the server-side create, join, and start functions used by the app.

## AI coach

The coach remains silent during active trading, then unlocks a private final debrief and end-of-challenge personality recap once the room closes. Both are grounded in the signed-in player's own simulated orders, holdings, portfolio value, and saved debrief history. NVIDIA NIM is the narrative provider: add `NVIDIA_API_KEY`, `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1`, and optionally `NVIDIA_MODEL` (default: `nvidia/nemotron-3-nano-30b-a3b`) to `.env`. If the primary model cannot return a valid response, Papercut automatically tries `NVIDIA_FALLBACK_MODEL` (default: `meta/llama-3.1-8b-instruct`) before showing the deterministic coach preview. If you copied the prototype's generic `BASE_URL` variable, the app recognizes that too. Keep the key server-only; do not prefix it with `NEXT_PUBLIC_`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
