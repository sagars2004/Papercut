create or replace function public.end_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  ended_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to end a room';
  end if;

  select * into ended_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if ended_room.created_by <> auth.uid() then
    raise exception 'Only the room host can end this challenge';
  end if;

  if ended_room.status <> 'active' then
    raise exception 'Only an active challenge can be ended';
  end if;

  update public.rooms
  set status = 'complete', ends_at = now()
  where id = ended_room.id
  returning * into ended_room;

  return ended_room;
end;
$$;

grant execute on function public.end_room(uuid) to authenticated;
