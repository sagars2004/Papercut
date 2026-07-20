import Link from "next/link";

import { RoomEntryForm } from "@/components/rooms/room-entry-form";

type CreatePageProps = { searchParams: Promise<{ duration?: string | string[]; email?: string | string[]; name?: string | string[]; roomName?: string | string[] }> };

function value(query: Record<string, string | string[] | undefined>, key: string) {
  return typeof query[key] === "string" ? query[key] : "";
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const query = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[560px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← Back to Papercut</Link>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Host a challenge</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">Create a room for your friends.</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">Choose the finish line, then invite everyone to start their $1M virtual portfolios together.</p>
        <div className="mt-8"><RoomEntryForm mode="create" initialName={value(query, "name")} initialEmail={value(query, "email")} initialRoomName={value(query, "roomName")} initialDurationDays={value(query, "duration")} /></div>
      </section>
    </main>
  );
}
