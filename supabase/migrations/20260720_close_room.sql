create or replace function public.close_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  room_to_close public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to close a room';
  end if;

  select * into room_to_close
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if room_to_close.created_by <> auth.uid() then
    raise exception 'Only the room host can close this room';
  end if;

  if room_to_close.status <> 'lobby' then
    raise exception 'Only rooms in the lobby can be closed';
  end if;

  delete from public.rooms where id = room_to_close.id;
end;
$$;

grant execute on function public.close_room(uuid) to authenticated;
