import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Crown, Users } from "lucide-react";

import { startRoom } from "@/app/rooms/actions";
import { InviteLink } from "@/components/rooms/invite-link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type Room = { id: string; name: string; invite_code: string; duration_days: number; status: "lobby" | "active" | "complete"; created_by: string; starting_capital: number };

type RoomPageProps = { params: Promise<{ inviteCode: string }> };

export default async function RoomLobbyPage({ params }: RoomPageProps) {
  const { inviteCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms/" + inviteCode.toUpperCase());

  const { data: roomData } = await supabase.from("rooms").select("id, name, invite_code, duration_days, status, created_by, starting_capital").eq("invite_code", inviteCode.toUpperCase()).maybeSingle();
  const room = roomData as Room | null;
  if (!room) redirect("/rooms");

  const { data: membership } = await supabase.from("players").select("id").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  if (!membership) redirect("/rooms");

  const { count: playerCount } = await supabase.from("players").select("id", { count: "exact", head: true }).eq("room_id", room.id);
  const isHost = room.created_by === user.id;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[620px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"><div className="flex items-center justify-between gap-4"><Link href="/rooms" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← All rooms</Link><span className={room.status === "lobby" ? "rounded-full border border-[#c4ff0d]/25 bg-[#c4ff0d]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d]" : "rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50"}>{room.status}</span></div>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Competition lobby</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">{room.name}</h1><p className="mt-3 text-sm leading-6 text-white/45">Everyone begins with <span className="font-medium text-white/80">$1,000,000 USD</span> and the same seven-asset crypto universe.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Clock3 className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{room.duration_days} days</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Challenge</p></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Users className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{playerCount ?? 0}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Players joined</p></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Crown className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{isHost ? "You" : "Friend"}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Room host</p></div></div>
        {room.status === "lobby" ? <div className="mt-8 rounded-2xl border border-[#c4ff0d]/18 bg-[#c4ff0d]/[0.055] p-4"><p className="text-xs font-medium text-white/75">Invite friends before you start</p><p className="mt-1 text-[11px] leading-5 text-white/40">Share this private link. Players can join while the room remains in the lobby.</p><div className="mt-4"><InviteLink inviteCode={room.invite_code} /></div></div> : null}
        {room.status === "active" ? <Link href={"/dashboard?room=" + room.id} className="mt-8 block"><Button className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62]">Open trading dashboard</Button></Link> : isHost ? <form action={startRoom.bind(null, room.id)} className="mt-8"><Button type="submit" className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62]">Start {room.duration_days}-day challenge</Button><p className="mt-3 text-center text-[10px] text-white/30">Starting locks the lobby and starts the room clock immediately.</p></form> : <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3 text-center text-xs text-white/45">Waiting for the host to start the challenge.</div>}
      </section>
    </main>
  );
}
