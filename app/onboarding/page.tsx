import { redirect } from "next/navigation";

import { AccountForm } from "@/components/account/account-form";
import { getDisplayName } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/onboarding");

  const initialName = getDisplayName(user.user_metadata, user.email);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06110d] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_52%_10%,rgba(89,150,66,0.22),transparent_32%),linear-gradient(145deg,#0b2618_0%,#06110d_48%,#020604_100%)]" />
      <section className="relative z-10 w-full max-w-[460px] rounded-[28px] border border-white/10 bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">One small setup step</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">What should your room call you?</h1>
        <p className="mt-3 text-sm leading-6 text-white/45">This name appears on room invites, leaderboards, and your private debrief history.</p>
        <div className="mt-8"><AccountForm email={user.email ?? ""} initialName={initialName} onboarding /></div>
      </section>
    </main>
  );
}
