import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Crown, Users } from "lucide-react";

import { closeRoom, startRoom } from "@/app/rooms/actions";
import { InviteLink } from "@/components/rooms/invite-link";
import { LobbyAutoRefresh } from "@/components/rooms/lobby-auto-refresh";
import { Button } from "@/components/ui/button";
import { formatRoomDuration } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/server";

type Room = { id: string; name: string; invite_code: string; duration_minutes: number; status: "lobby" | "active" | "complete"; created_by: string; starting_capital: number };

type RoomPageProps = { params: Promise<{ inviteCode: string }> };

type Participant = { user_id: string; role: "host" | "member"; joined_at: string };

type Membership = { role: "host" | "member" };

type Profile = { id: string; display_name: string };

export default async function RoomLobbyPage({ params }: RoomPageProps) {
  const { inviteCode } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms/" + inviteCode.toUpperCase());

  const { data: roomData } = await supabase.from("rooms").select("id, name, invite_code, duration_minutes, status, created_by, starting_capital").eq("invite_code", inviteCode.toUpperCase()).maybeSingle();
  const room = roomData as Room | null;
  if (!room) redirect("/rooms");

  const { data: membershipData } = await supabase.from("players").select("role").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  const membership = membershipData as Membership | null;
  if (!membership) redirect("/rooms");

  const { count: playerCount } = await supabase.from("players").select("id", { count: "exact", head: true }).eq("room_id", room.id);
  const { data: participantData } = await supabase.from("players").select("user_id, role, joined_at").eq("room_id", room.id).order("joined_at", { ascending: true });
  const participants = (participantData ?? []) as Participant[];
  const { data: profileData } = participants.length > 0
    ? await supabase.from("profiles").select("id, display_name").in("id", participants.map((participant) => participant.user_id))
    : { data: [] as Profile[] };
  const profilesById = new Map(((profileData ?? []) as Profile[]).map((profile) => [profile.id, profile.display_name]));
  const hostName = profilesById.get(room.created_by) ?? "Your host";
  const isHost = room.created_by === user.id && membership.role === "host";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[620px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"><LobbyAutoRefresh /><div className="flex items-center justify-between gap-4"><Link href="/rooms" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← All rooms</Link><span className={room.status === "lobby" ? "rounded-full border border-[#c4ff0d]/25 bg-[#c4ff0d]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d]" : "rounded-full border border-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/50"}>{room.status}</span></div>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Competition lobby</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">{room.name}</h1><p className="mt-3 text-sm leading-6 text-white/45">{room.status === "complete" ? <>This challenge has ended. Your final dashboard and private coach debrief are ready to review.</> : isHost ? <>You&apos;re hosting this room. Invite friends, then start when everyone&apos;s ready.</> : <>You joined <span className="font-medium text-white/80">{hostName}&apos;s room</span>. You&apos;re in the waiting room until they start the challenge.</>}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Clock3 className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{formatRoomDuration(room.duration_minutes)}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Challenge</p></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Users className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{playerCount ?? 0}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Players joined</p></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Crown className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{isHost ? "You" : "Friend"}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Room host</p></div></div>
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/10 p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-white/75">In this room</p><span className="text-[10px] text-white/35">Refreshes while you wait</span></div><div className="mt-4 space-y-2">{participants.map((participant) => <div key={participant.user_id} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5"><span className="text-sm text-white/75">{participant.user_id === user.id ? "You" : profilesById.get(participant.user_id) ?? "Trader"}</span><span className={participant.role === "host" ? "text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d]" : "text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35"}>{participant.role === "host" ? "Host" : "Joined"}</span></div>)}</div></div>
        {room.status === "lobby" && isHost ? <div className="mt-5 rounded-2xl border border-[#c4ff0d]/18 bg-[#c4ff0d]/[0.055] p-4"><p className="text-xs font-medium text-white/75">Invite friends before you start</p><p className="mt-1 text-[11px] leading-5 text-white/40">Share this private link. Players can join while the room remains in the lobby.</p><div className="mt-4"><InviteLink inviteCode={room.invite_code} /></div></div> : null}
        {room.status === "active" || room.status === "complete" ? <Link href={"/dashboard?room=" + room.id} className="mt-8 block"><Button className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62]">{room.status === "complete" ? "View final dashboard" : "Open trading dashboard"}</Button></Link> : room.status === "lobby" && isHost ? <div className="mt-8 space-y-3"><form action={startRoom.bind(null, room.id)}><Button type="submit" className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62]">Start {formatRoomDuration(room.duration_minutes)} challenge</Button><p className="mt-3 text-center text-[10px] text-white/30">Starting locks the lobby and starts the room clock immediately.</p></form><form action={closeRoom.bind(null, room.id)}><Button type="submit" variant="outline" className="h-10 w-full rounded-xl border-[#ff8c8c]/25 bg-transparent text-xs font-semibold text-[#ffaaaa] hover:bg-[#ff8c8c]/10 hover:text-[#ffc1c1]">Close room</Button></form></div> : <div className="mt-8 rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3 text-center text-xs text-white/45">Waiting for the host to start the challenge.</div>}
      </section>
    </main>
  );
}
