import Link from "next/link";

import { RoomEntryForm } from "@/components/rooms/room-entry-form";

type JoinPageProps = { searchParams: Promise<{ email?: string | string[]; inviteCode?: string | string[]; name?: string | string[] }> };

function value(query: Record<string, string | string[] | undefined>, key: string) {
  return typeof query[key] === "string" ? query[key] : "";
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const query = await searchParams;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(80,150,74,0.18),transparent_36%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />
      <section className="relative z-10 w-full max-w-[560px] rounded-[28px] border border-white/[0.1] bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="text-xs text-white/45 transition-colors hover:text-[#c4ff0d]">← Back to Papercut</Link>
        <p className="mt-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Accept an invite</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.065em]">Join your friends&apos; room.</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">Enter the code your host sent you. You&apos;ll wait with the group until they start the challenge.</p>
        <div className="mt-8"><RoomEntryForm mode="join" initialName={value(query, "name")} initialEmail={value(query, "email")} initialInviteCode={value(query, "inviteCode")} /></div>
      </section>
    </main>
  );
}
