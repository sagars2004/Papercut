create table if not exists public.assets (
  symbol text primary key,
  provider_id text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.assets (symbol, provider_id, name)
values
  ('BTC', 'bitcoin', 'Bitcoin'),
  ('ETH', 'ethereum', 'Ethereum'),
  ('SOL', 'solana', 'Solana'),
  ('LINK', 'chainlink', 'Chainlink'),
  ('AVAX', 'avalanche-2', 'Avalanche'),
  ('AAVE', 'aave', 'Aave'),
  ('DOGE', 'dogecoin', 'Dogecoin')
on conflict (symbol) do update set provider_id = excluded.provider_id, name = excluded.name;

alter table public.assets enable row level security;

create policy "Authenticated users can view supported assets"
  on public.assets for select
  using (auth.role() = 'authenticated');

create index if not exists price_snapshots_symbol_captured_desc_idx
  on public.price_snapshots(asset_symbol, captured_at desc);
