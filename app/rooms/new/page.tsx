import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateRoomForm } from "@/components/rooms/room-forms";
import type { DurationUnit } from "@/lib/rooms";
import { createClient } from "@/lib/supabase/server";

type NewRoomPageProps = {
  searchParams: Promise<{ durationUnit?: string | string[]; durationValue?: string | string[]; roomName?: string | string[] }>;
};

export default async function NewRoomPage({ searchParams }: NewRoomPageProps) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms/new");

  const initialRoomName = typeof query.roomName === "string" ? query.roomName.slice(0, 48) : "";
  const initialDurationValue = typeof query.durationValue === "string" ? Number(query.durationValue) : 1;
  const initialDurationUnit = typeof query.durationUnit === "string" && ["minutes", "hours", "days"].includes(query.durationUnit) ? query.durationUnit as DurationUnit : "hours";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[520px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8"><Link href="/rooms" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← My rooms</Link><p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Host a challenge</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">Set the shared starting line.</h1><p className="mt-3 text-sm leading-6 text-white/45">You&apos;ll receive a private invite link after creating the room. Everyone starts with the same $1M in USD.</p><div className="mt-8"><CreateRoomForm initialRoomName={initialRoomName} initialDurationValue={initialDurationValue} initialDurationUnit={initialDurationUnit} /></div></section>
    </main>
  );
}
