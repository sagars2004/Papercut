import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Plus, Users } from "lucide-react";

import { CreateRoomForm, JoinRoomForm, OpenRoomButton } from "@/components/rooms/room-forms";
import { getDisplayName } from "@/lib/auth";
import { formatRoomDuration } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/server";

type RoomSummary = { id: string; name: string; invite_code: string; duration_minutes: number; status: "lobby" | "active" | "complete"; ends_at: string | null };

export default async function RoomsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");

  const { data } = await supabase.from("players").select("rooms(id, name, invite_code, duration_minutes, status, ends_at)").eq("user_id", user.id).order("joined_at", { ascending: false });
  const rooms = (data ?? []).flatMap((membership) => membership.rooms ? [membership.rooms as unknown as RoomSummary] : []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07110c] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(80,150,74,0.16),transparent_30%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <div className="relative z-10 mx-auto max-w-[1180px]">
        <header className="flex items-center justify-between gap-4"><Link href="/" className="text-lg font-semibold tracking-[-0.05em]">papercut</Link><Link href="/account" className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition-colors hover:border-[#c4ff0d]/35 hover:text-[#c4ff0d]">{getDisplayName(user.user_metadata, user.email)}</Link></header>
        <div className="mt-16 max-w-[640px]"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Your competitions</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">A room turns opinions into receipts.</h1><p className="mt-4 text-sm leading-6 text-white/45">Create a challenge, share the invite, and give every friend the same $1M starting line.</p></div>

        <section className="mt-10 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-white/80"><Plus className="size-4 text-[#c4ff0d]" /> Create a room</div><p className="mt-2 text-xs leading-5 text-white/40">You&apos;ll be the host and can start once friends join.</p><div className="mt-6"><CreateRoomForm /></div></div><div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-white/80"><Users className="size-4 text-[#c4ff0d]" /> Join friends</div><p className="mt-2 text-xs leading-5 text-white/40">Use the invite code from a room that is still in the lobby.</p><div className="mt-6"><JoinRoomForm /></div></div></section>

        <section className="mt-12"><div className="flex items-center gap-2 text-sm font-medium text-white/75"><Clock3 className="size-4 text-[#c4ff0d]/75" /> Your rooms</div>{rooms.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">You have not joined a room yet. Create one or enter an invite code above.</div> : <div className="mt-4 grid gap-3 md:grid-cols-2">{rooms.map((room) => <Link key={room.id} href={room.status === "active" ? "/dashboard?room=" + room.id : "/rooms/" + room.invite_code} className="group rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 transition-colors hover:border-[#c4ff0d]/30 hover:bg-[#c4ff0d]/[0.04]"><div className="flex items-start justify-between gap-4"><div><p className="text-lg font-semibold tracking-[-0.04em]">{room.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">{formatRoomDuration(room.duration_minutes)} challenge · {room.status}</p></div><OpenRoomButton /></div></Link>)}</div>}</section>
      </div>
    </main>
  );
}
