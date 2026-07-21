create table if not exists public.final_coach_recaps (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  recap_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint final_coach_recaps_player_room_key unique (player_id, room_id)
);

create index if not exists final_coach_recaps_player_room_idx
  on public.final_coach_recaps(player_id, room_id);

alter table public.final_coach_recaps enable row level security;

create policy "Users can view their own final coach recaps"
  on public.final_coach_recaps for select
  using (
    exists (
      select 1
      from public.players
      where players.id = final_coach_recaps.player_id and players.user_id = auth.uid()
    )
  );

create or replace function public.save_final_coach_recap(
  p_room_id uuid,
  p_recap_json jsonb
)
returns public.final_coach_recaps
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_room public.rooms;
  saved_recap public.final_coach_recaps;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to save a final coach recap';
  end if;

  if jsonb_typeof(p_recap_json) <> 'object' then
    raise exception 'Invalid final coach recap payload';
  end if;

  select * into target_room
  from public.rooms
  where id = p_room_id;

  if not found or target_room.status <> 'complete' then
    raise exception 'A final coach recap is available once the challenge is complete';
  end if;

  select * into current_player
  from public.players
  where room_id = p_room_id and user_id = auth.uid();

  if not found then
    raise exception 'You are not a player in this room';
  end if;

  insert into public.final_coach_recaps (player_id, room_id, recap_json)
  values (current_player.id, target_room.id, p_recap_json)
  on conflict (player_id, room_id) do update
  set recap_json = excluded.recap_json,
      updated_at = now()
  returning * into saved_recap;

  return saved_recap;
end;
$$;

grant execute on function public.save_final_coach_recap(uuid, jsonb) to authenticated;
