alter table public.rooms add column if not exists invite_code text;
alter table public.rooms add column if not exists starts_at timestamptz;
alter table public.players add column if not exists role text not null default 'member';

update public.rooms
set invite_code = upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8))
where invite_code is null;

alter table public.rooms alter column invite_code set not null;
create unique index if not exists rooms_invite_code_key on public.rooms(invite_code);
create index if not exists players_user_room_idx on public.players(user_id, room_id);

create or replace function public.create_room(p_name text, p_duration_days integer)
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

  if p_duration_days not in (5, 7, 14) then
    raise exception 'Choose a 5, 7, or 14 day challenge';
  end if;

  loop
    begin
      insert into public.rooms (name, duration_days, starting_capital, asset_universe, status, created_by, invite_code)
      values (trim(p_name), p_duration_days, 1000000, 'crypto', 'lobby', auth.uid(), upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)))
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

create or replace function public.join_room(p_invite_code text)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  joined_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join a room';
  end if;

  select * into joined_room
  from public.rooms
  where invite_code = upper(trim(coalesce(p_invite_code, '')))
  for update;

  if not found then
    raise exception 'We could not find that invite code';
  end if;

  if joined_room.status <> 'lobby' then
    raise exception 'This room has already started and is not accepting new players';
  end if;

  insert into public.players (room_id, user_id, cash_balance, role)
  values (joined_room.id, auth.uid(), joined_room.starting_capital, 'member')
  on conflict (room_id, user_id) do nothing;

  return joined_room;
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
  set status = 'active', starts_at = now(), ends_at = now() + make_interval(days => started_room.duration_days)
  where id = started_room.id
  returning * into started_room;

  return started_room;
end;
$$;

grant execute on function public.create_room(text, integer) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.start_room(uuid) to authenticated;
