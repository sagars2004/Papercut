drop policy if exists "Users can view their own trades" on public.trades;
create policy "Room members can view room trades"
  on public.trades for select
  using (
    exists (
      select 1
      from public.players as trade_owner
      join public.players as viewer on viewer.room_id = trade_owner.room_id
      where trade_owner.id = trades.player_id
        and viewer.user_id = auth.uid()
    )
  );

drop policy if exists "Users can view their own holdings" on public.holdings;
create policy "Room members can view room holdings"
  on public.holdings for select
  using (
    exists (
      select 1
      from public.players as holding_owner
      join public.players as viewer on viewer.room_id = holding_owner.room_id
      where holding_owner.id = holdings.player_id
        and viewer.user_id = auth.uid()
    )
  );
