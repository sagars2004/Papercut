alter table public.rooms add column if not exists duration_minutes integer;

update public.rooms
set duration_minutes = duration_days * 1440
where duration_minutes is null;

alter table public.rooms alter column duration_minutes set default 10080;
alter table public.rooms alter column duration_minutes set not null;

alter table public.rooms drop constraint if exists rooms_duration_minutes_check;
alter table public.rooms add constraint rooms_duration_minutes_check check (duration_minutes between 1 and 43200);

drop function if exists public.create_room(text, integer);

create function public.create_room(p_name text, p_duration_minutes integer)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  created_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create a room';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 3 or char_length(trim(p_name)) > 48 then
    raise exception 'Room names must be between 3 and 48 characters';
  end if;

  if p_duration_minutes < 1 or p_duration_minutes > 43200 then
    raise exception 'Choose a room duration between 1 minute and 30 days';
  end if;

  loop
    begin
      insert into public.rooms (name, duration_days, duration_minutes, starting_capital, asset_universe, status, created_by, invite_code)
      values (
        trim(p_name),
        greatest(1, ceil(p_duration_minutes::numeric / 1440)::integer),
        p_duration_minutes,
        1000000,
        'crypto',
        'lobby',
        auth.uid(),
        upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
      )
      returning * into created_room;
      exit;
    exception when unique_violation then
      -- Generate another code if a rare collision occurs.
    end;
  end loop;

  insert into public.players (room_id, user_id, cash_balance, role)
  values (created_room.id, auth.uid(), created_room.starting_capital, 'host');

  return created_room;
end;
$$;

create or replace function public.start_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  started_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to start a room';
  end if;

  select * into started_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if started_room.created_by <> auth.uid() then
    raise exception 'Only the room host can start this challenge';
  end if;

  if started_room.status <> 'lobby' then
    raise exception 'This room has already started';
  end if;

  update public.rooms
  set status = 'active', starts_at = now(), ends_at = now() + make_interval(mins => started_room.duration_minutes)
  where id = started_room.id
  returning * into started_room;

  return started_room;
end;
$$;

create or replace function public.execute_trade(p_room_id uuid, p_asset_symbol text, p_action text, p_quantity numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_room public.rooms;
  current_player public.players;
  current_holding public.holdings;
  execution_price numeric(24, 8);
  trade_value numeric(24, 8);
  normalized_symbol text := upper(trim(coalesce(p_asset_symbol, '')));
  normalized_action text := upper(trim(coalesce(p_action, '')));
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to place a trade';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Enter a quantity greater than zero';
  end if;

  if normalized_action not in ('BUY', 'SELL') then
    raise exception 'Trade action must be BUY or SELL';
  end if;

  if not exists (select 1 from public.assets where symbol = normalized_symbol) then
    raise exception 'This asset is not supported';
  end if;

  select * into current_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if current_room.status <> 'active' then
    raise exception 'This room is not active';
  end if;

  if current_room.ends_at is not null and current_room.ends_at <= now() then
    update public.rooms set status = 'complete' where id = current_room.id;
    raise exception 'This room has ended';
  end if;

  select * into current_player
  from public.players
  where room_id = current_room.id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'You are not a member of this room';
  end if;

  select price_usd into execution_price
  from public.price_snapshots
  where asset_symbol = normalized_symbol
    and captured_at >= now() - interval '5 minutes'
  order by captured_at desc
  limit 1;

  if execution_price is null then
    raise exception 'A current market price is not available yet. Refresh the trade screen and try again.';
  end if;

  trade_value := execution_price * p_quantity;

  if normalized_action = 'BUY' then
    if current_player.cash_balance < trade_value then
      raise exception 'Insufficient USD cash for this order';
    end if;

    update public.players
    set cash_balance = cash_balance - trade_value
    where id = current_player.id;

    insert into public.holdings (player_id, asset_symbol, quantity, average_cost_basis)
    values (current_player.id, normalized_symbol, p_quantity, execution_price)
    on conflict (player_id, asset_symbol) do update
    set quantity = public.holdings.quantity + excluded.quantity,
        average_cost_basis = (
          (public.holdings.quantity * public.holdings.average_cost_basis)
          + (excluded.quantity * excluded.average_cost_basis)
        ) / (public.holdings.quantity + excluded.quantity),
        updated_at = now();
  else
    select * into current_holding
    from public.holdings
    where player_id = current_player.id and asset_symbol = normalized_symbol
    for update;

    if not found or current_holding.quantity < p_quantity then
      raise exception 'Insufficient % balance for this sell order', normalized_symbol;
    end if;

    update public.players
    set cash_balance = cash_balance + trade_value
    where id = current_player.id;

    update public.holdings
    set quantity = quantity - p_quantity,
        updated_at = now()
    where id = current_holding.id;

    delete from public.holdings
    where id = current_holding.id and quantity <= 0;
  end if;

  insert into public.trades (player_id, asset_symbol, action, quantity, price_at_execution)
  values (current_player.id, normalized_symbol, lower(normalized_action), p_quantity, execution_price);

  return jsonb_build_object(
    'action', normalized_action,
    'assetSymbol', normalized_symbol,
    'executionPrice', execution_price,
    'quantity', p_quantity,
    'tradeValue', trade_value
  );
end;
$$;

grant execute on function public.create_room(text, integer) to authenticated;
grant execute on function public.start_room(uuid) to authenticated;
grant execute on function public.execute_trade(uuid, text, text, numeric) to authenticated;
