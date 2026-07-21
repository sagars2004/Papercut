do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'debriefs_player_id_debrief_date_key'
      and conrelid = 'public.debriefs'::regclass
  ) then
    alter table public.debriefs drop constraint debriefs_player_id_debrief_date_key;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'debriefs_player_room_debrief_date_key'
      and conrelid = 'public.debriefs'::regclass
  ) then
    alter table public.debriefs
      add constraint debriefs_player_room_debrief_date_key
      unique (player_id, room_id, debrief_date);
  end if;
end;
$$;

create index if not exists debriefs_player_room_date_idx
  on public.debriefs(player_id, room_id, debrief_date desc);

create or replace function public.save_debrief(
  p_room_id uuid,
  p_metrics_json jsonb,
  p_pattern_flags_json jsonb,
  p_lesson_text text
)
returns public.debriefs
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_room public.rooms;
  saved_debrief public.debriefs;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to save a debrief';
  end if;

  if jsonb_typeof(p_metrics_json) <> 'object' or jsonb_typeof(p_pattern_flags_json) <> 'array' then
    raise exception 'Invalid debrief payload';
  end if;

  if char_length(trim(coalesce(p_lesson_text, ''))) < 1 then
    raise exception 'A debrief lesson is required';
  end if;

  select * into target_room
  from public.rooms
  where id = p_room_id;

  if not found or target_room.status not in ('active', 'complete') then
    raise exception 'This room is not ready for a debrief';
  end if;

  select * into current_player
  from public.players
  where room_id = p_room_id and user_id = auth.uid();

  if not found then
    raise exception 'You are not a player in this room';
  end if;

  insert into public.debriefs (
    player_id,
    room_id,
    debrief_date,
    metrics_json,
    pattern_flags_json,
    lesson_text
  )
  values (
    current_player.id,
    target_room.id,
    current_date,
    p_metrics_json,
    p_pattern_flags_json,
    trim(p_lesson_text)
  )
  on conflict (player_id, room_id, debrief_date) do update
  set metrics_json = excluded.metrics_json,
      pattern_flags_json = excluded.pattern_flags_json,
      lesson_text = excluded.lesson_text,
      created_at = now()
  returning * into saved_debrief;

  return saved_debrief;
end;
$$;

grant execute on function public.save_debrief(uuid, jsonb, jsonb, text) to authenticated;
