drop policy if exists "Room members can view room trades" on public.trades;
drop policy if exists "Users can view their own trades" on public.trades;

create policy "Users can view their own trades"
  on public.trades for select
  using (
    exists (
      select 1
      from public.players
      where players.id = trades.player_id
        and players.user_id = auth.uid()
    )
  );
