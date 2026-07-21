import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, Plus, Radio, Users } from "lucide-react";

import { CreateRoomForm, JoinRoomForm, OpenRoomButton } from "@/components/rooms/room-forms";
import { getDisplayName } from "@/lib/auth";
import { formatRoomDuration } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/server";

type RoomSummary = { id: string; name: string; invite_code: string; duration_minutes: number; status: "lobby" | "active" | "complete"; ends_at: string | null };
type RoomsPageProps = { searchParams: Promise<{ view?: string | string[] }> };

function RoomCards({ rooms }: { rooms: RoomSummary[] }) {
  return <div className="mt-4 grid gap-3 md:grid-cols-2">{rooms.map((room) => {
    const isComplete = room.status === "complete";
    const isActive = room.status === "active";
    const statusLabel = isComplete ? "Completed" : isActive ? "Live now" : "Waiting in lobby";
    const statusClass = isComplete ? "border-white/10 bg-white/[0.05] text-white/45" : isActive ? "border-[#c4ff0d]/25 bg-[#c4ff0d]/[0.1] text-[#c4ff0d]" : "border-[#ffcf7f]/20 bg-[#ffcf7f]/[0.08] text-[#ffcf7f]";

    return <Link key={room.id} href={isActive || isComplete ? "/dashboard?room=" + room.id : "/rooms/" + room.invite_code} className="group rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 transition-colors hover:border-[#c4ff0d]/30 hover:bg-[#c4ff0d]/[0.04]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-lg font-semibold tracking-[-0.04em]">{room.name}</p><span className={"rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] " + statusClass}>{statusLabel}</span></div><p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/30">{formatRoomDuration(room.duration_minutes)} challenge</p></div><OpenRoomButton /></div></Link>;
  })}</div>;
}

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const query = await searchParams;
  const selectedView = query.view === "completed" ? "completed" : "active";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");

  const { data } = await supabase.from("players").select("rooms(id, name, invite_code, duration_minutes, status, ends_at)").eq("user_id", user.id).order("joined_at", { ascending: false });
  const rooms = (data ?? []).flatMap((membership) => membership.rooms ? [membership.rooms as unknown as RoomSummary] : []);
  const lobbyRooms = rooms.filter((room) => room.status === "lobby");
  const activeRooms = rooms.filter((room) => room.status === "active");
  const completedRooms = rooms.filter((room) => room.status === "complete");
  const selectedRooms = selectedView === "completed" ? completedRooms : activeRooms;
  const selectedTitle = selectedView === "completed" ? "Completed rooms" : "Active rooms";
  const selectedDescription = selectedView === "completed" ? "Review final portfolios, rankings, and private coach reflections." : "Challenges you can return to right now.";
  const selectedEmptyMessage = selectedView === "completed" ? "Completed challenges will appear here." : "No active challenges right now.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07110c] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_0%,rgba(80,150,74,0.16),transparent_30%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <div className="relative z-10 mx-auto max-w-[1180px]">
        <header className="flex items-center justify-between gap-4"><Link href="/" className="text-lg font-semibold tracking-[-0.05em]">papercut</Link><Link href="/account" className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition-colors hover:border-[#c4ff0d]/35 hover:text-[#c4ff0d]">{getDisplayName(user.user_metadata, user.email)}</Link></header>
        <div className="mt-16 max-w-[640px]"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Your competitions</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">A room turns opinions into receipts.</h1><p className="mt-4 text-sm leading-6 text-white/45">Create a challenge, share the invite, and give every friend the same $1M starting line.</p></div>

        <section className="mt-10 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-white/80"><Plus className="size-4 text-[#c4ff0d]" /> Create a room</div><p className="mt-2 text-xs leading-5 text-white/40">You&apos;ll be the host and can start once friends join.</p><div className="mt-6"><CreateRoomForm /></div></div><div className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-white/80"><Users className="size-4 text-[#c4ff0d]" /> Join friends</div><p className="mt-2 text-xs leading-5 text-white/40">Use the invite code from a room that is still in the lobby.</p><div className="mt-6"><JoinRoomForm /></div></div></section>

        <section className="mt-12"><div className="flex items-center gap-2 text-sm font-medium text-white/75"><Clock3 className="size-4 text-[#c4ff0d]/75" /> Your rooms</div>{rooms.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">You have not joined a room yet. Create one or enter an invite code above.</div> : <div className="mt-5 space-y-9">{lobbyRooms.length > 0 ? <div><div className="flex items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-white/75"><Clock3 className="size-4 text-[#ffcf7f]" /> Waiting rooms</p><p className="mt-1 text-xs text-white/35">Invite friends or wait for the host to start.</p></div><span className="text-xs text-white/35">{lobbyRooms.length}</span></div><RoomCards rooms={lobbyRooms} /></div> : null}<div><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-sm font-medium text-white/75">{selectedView === "completed" ? <CheckCircle2 className="size-4 text-white/50" /> : <Radio className="size-4 text-[#c4ff0d]" />}{selectedTitle}</p><p className="mt-1 text-xs text-white/35">{selectedDescription}</p></div><div role="tablist" aria-label="Room status" className="inline-flex w-fit rounded-xl border border-white/[0.09] bg-black/10 p-1"><Link href="/rooms" role="tab" aria-selected={selectedView === "active"} className={selectedView === "active" ? "rounded-lg bg-[#c4ff0d] px-3 py-2 text-xs font-semibold text-[#0a170d]" : "rounded-lg px-3 py-2 text-xs font-medium text-white/45 transition-colors hover:text-white"}>Active <span className="ml-1 opacity-70">{activeRooms.length}</span></Link><Link href="/rooms?view=completed" role="tab" aria-selected={selectedView === "completed"} className={selectedView === "completed" ? "rounded-lg bg-[#c4ff0d] px-3 py-2 text-xs font-semibold text-[#0a170d]" : "rounded-lg px-3 py-2 text-xs font-medium text-white/45 transition-colors hover:text-white"}>Completed <span className="ml-1 opacity-70">{completedRooms.length}</span></Link></div></div><div role="tabpanel" className="mt-4">{selectedRooms.length > 0 ? <RoomCards rooms={selectedRooms} /> : <div className="rounded-2xl border border-dashed border-white/10 px-5 py-6 text-sm text-white/35">{selectedEmptyMessage}</div>}</div></div></div>}</section>
      </div>
    </main>
  );
}
