create extension if not exists "pgcrypto";

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_days integer not null default 7 check (duration_days > 0),
  duration_minutes integer not null default 10080 check (duration_minutes > 0),
  starting_capital numeric(14, 2) not null default 1000000,
  asset_universe text not null default 'crypto',
  status text not null default 'lobby' check (status in ('lobby', 'active', 'complete')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  ends_at timestamptz
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cash_balance numeric(14, 2) not null default 1000000,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  asset_symbol text not null,
  action text not null check (action in ('buy', 'sell')),
  quantity numeric(24, 8) not null check (quantity > 0),
  price_at_execution numeric(24, 8) not null check (price_at_execution > 0),
  executed_at timestamptz not null default now()
);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  asset_symbol text not null,
  quantity numeric(24, 8) not null default 0,
  average_cost_basis numeric(24, 8) not null default 0,
  updated_at timestamptz not null default now(),
  unique (player_id, asset_symbol)
);

create table if not exists public.price_snapshots (
  id bigint generated always as identity primary key,
  asset_symbol text not null,
  price_usd numeric(24, 8) not null,
  change_24h numeric(10, 4),
  captured_at timestamptz not null default now()
);

create table if not exists public.debriefs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  debrief_date date not null,
  metrics_json jsonb not null default '{}'::jsonb,
  pattern_flags_json jsonb not null default '[]'::jsonb,
  lesson_text text not null,
  created_at timestamptz not null default now(),
  constraint debriefs_player_room_debrief_date_key unique (player_id, room_id, debrief_date)
);

create index if not exists trades_player_executed_idx on public.trades(player_id, executed_at desc);
create index if not exists price_snapshots_asset_captured_idx on public.price_snapshots(asset_symbol, captured_at desc);
create index if not exists debriefs_player_room_date_idx on public.debriefs(player_id, room_id, debrief_date desc);

alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.trades enable row level security;
alter table public.holdings enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.debriefs enable row level security;

create policy "Users can view rooms they joined"
  on public.rooms for select
  using (auth.role() = 'authenticated');

create policy "Users can create rooms"
  on public.rooms for insert
  with check (created_by = auth.uid());

create policy "Users can view room players"
  on public.players for select
  using (auth.role() = 'authenticated');

create policy "Users can join rooms as themselves"
  on public.players for insert
  with check (user_id = auth.uid());

create policy "Users can view their own trades"
  on public.trades for select
  using (
    exists (
      select 1 from public.players
      where players.id = trades.player_id and players.user_id = auth.uid()
    )
  );

create policy "Users can create their own trades"
  on public.trades for insert
  with check (
    exists (
      select 1 from public.players
      where players.id = trades.player_id and players.user_id = auth.uid()
    )
  );

create policy "Users can view their own holdings"
  on public.holdings for select
  using (
    exists (
      select 1 from public.players
      where players.id = holdings.player_id and players.user_id = auth.uid()
    )
  );

create policy "Users can view price snapshots"
  on public.price_snapshots for select
  using (auth.role() = 'authenticated');

create policy "Users can view their own debriefs"
  on public.debriefs for select
  using (
    exists (
      select 1 from public.players
      where players.id = debriefs.player_id and players.user_id = auth.uid()
    )
  );
