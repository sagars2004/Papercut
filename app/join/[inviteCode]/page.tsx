import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Users } from "lucide-react";

import { InviteJoinForm } from "@/components/rooms/room-forms";
import { formatRoomDuration } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/server";

type InviteRoom = { id: string; name: string; duration_minutes: number; status: "lobby" | "active" | "complete"; created_by: string };

type JoinInvitePageProps = { params: Promise<{ inviteCode: string }> };

export default async function JoinInvitePage({ params }: JoinInvitePageProps) {
  const { inviteCode } = await params;
  const normalizedCode = inviteCode.toUpperCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/join/" + normalizedCode);

  const { data: roomData } = await supabase.from("rooms").select("id, name, duration_minutes, status, created_by").eq("invite_code", normalizedCode).maybeSingle();
  const room = roomData as InviteRoom | null;
  if (!room) redirect("/rooms?error=invalid_invite");

  const { data: membership } = await supabase.from("players").select("id").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  if (membership) redirect("/rooms/" + normalizedCode);

  const { data: hostProfile } = await supabase.from("profiles").select("display_name").eq("id", room.created_by).maybeSingle();
  const hostName = hostProfile?.display_name ?? "Your friend";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"><Link href="/rooms" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← My rooms</Link><p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">You&apos;re invited</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">Join {hostName}&apos;s room.</h1><p className="mt-3 text-sm leading-6 text-white/45">{hostName} invited you to <span className="font-medium text-white/80">{room.name}</span>. You&apos;ll begin with $1,000,000 USD and wait together for the host to start.</p><div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Clock3 className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">{formatRoomDuration(room.duration_minutes)}</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Challenge</p></div><div className="rounded-xl border border-white/[0.08] bg-black/10 p-4"><Users className="size-4 text-[#c4ff0d]/75" /><p className="mt-4 text-lg font-semibold">$1M</p><p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/30">Starting cash</p></div></div>{room.status === "lobby" ? <InviteJoinForm inviteCode={normalizedCode} /> : <p className="mt-8 rounded-xl border border-[#ff7f7f]/25 bg-[#ff7f7f]/10 px-4 py-3 text-sm text-[#ffb4b4]">This room has already started and can&apos;t accept new players.</p>}</section>
    </main>
  );
}
