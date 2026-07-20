-- Ensures rooms created before the role column existed still identify their creator as host.
update public.players as player
set role = 'host'
from public.rooms as room
where player.room_id = room.id
  and player.user_id = room.created_by
  and player.role <> 'host';
