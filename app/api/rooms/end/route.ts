import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to end a challenge." }, { status: 401 });

  let roomId = "";
  try {
    const body = await request.json() as { roomId?: string };
    roomId = typeof body.roomId === "string" ? body.roomId : "";
  } catch {
    return NextResponse.json({ error: "Invalid room request." }, { status: 400 });
  }
  if (!roomId) return NextResponse.json({ error: "A room is required." }, { status: 400 });

  const { error } = await supabase.rpc("end_room", { p_room_id: roomId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
