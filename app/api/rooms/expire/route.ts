import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type ExpireRoomRequest = { roomId?: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update this challenge." }, { status: 401 });

  let body: ExpireRoomRequest;
  try {
    body = await request.json() as ExpireRoomRequest;
  } catch {
    return NextResponse.json({ error: "Invalid room request." }, { status: 400 });
  }
  if (!body.roomId) return NextResponse.json({ error: "A room is required." }, { status: 400 });

  const { data, error } = await supabase.rpc("complete_expired_room", { p_room_id: body.roomId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ room: data });
}
