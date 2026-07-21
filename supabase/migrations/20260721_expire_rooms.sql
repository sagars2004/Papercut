create or replace function public.complete_expired_room(p_room_id uuid)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update a challenge';
  end if;

  select * into target_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Room not found';
  end if;

  if not exists (
    select 1
    from public.players
    where room_id = target_room.id and user_id = auth.uid()
  ) then
    raise exception 'You are not a member of this room';
  end if;

  if target_room.status = 'active' and target_room.ends_at is not null and target_room.ends_at <= now() then
    update public.rooms
    set status = 'complete'
    where id = target_room.id
    returning * into target_room;
  end if;

  return target_room;
end;
$$;

grant execute on function public.complete_expired_room(uuid) to authenticated;
