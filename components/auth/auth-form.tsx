"use client";

import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  initialEmail?: string;
  initialError?: string;
  nextPath: string;
};

export function AuthForm({ initialEmail = "", initialError = "", nextPath }: AuthFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState(initialError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);

    const { error: signInError } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06110d] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(89,150,66,0.22),transparent_32%),linear-gradient(145deg,#0b2618_0%,#06110d_48%,#020604_100%)]" />
      <div className="relative z-10 w-full max-w-[460px] rounded-[28px] border border-white/10 bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.03em] text-white transition-colors hover:text-[#c4ff0d]">
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#c4ff0d]/40 bg-[#c4ff0d]/10 text-[#c4ff0d]">✂</span>
          papercut
        </Link>

        {status === "sent" ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[#c4ff0d]/30 bg-[#c4ff0d]/10 text-[#c4ff0d]"><CheckCircle2 className="size-7" /></div>
            <h1 className="mt-6 text-2xl font-semibold tracking-[-0.05em]">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-white/45">We sent a secure sign-in link to <span className="text-white/80">{email}</span>. Open it here to continue.</p>
            <button type="button" onClick={() => setStatus("idle")} className="mt-7 text-xs font-semibold text-[#c4ff0d] hover:text-white">Use a different email</button>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Your trading identity</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">Start your next experiment.</h1>
              <p className="mt-3 text-sm leading-6 text-white/45">No password needed. We&apos;ll send a magic link so you can create rooms and keep your trade history yours.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-white/70">Email address</span>
                <span className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 focus-within:border-[#c4ff0d]/55">
                  <Mail className="size-4 text-white/30" />
                  <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@inbox.com" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
                </span>
              </label>
              {error ? <p role="alert" className="rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}
              <Button type="submit" disabled={status === "sending"} className="h-12 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62] disabled:opacity-60">
                {status === "sending" ? "Sending secure link…" : "Email me a sign-in link"}
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <p className="mt-5 text-center text-[11px] leading-5 text-white/30">By continuing, you&apos;re creating a Papercut account for virtual trading only—not investment advice.</p>
          </>
        )}
      </div>
    </main>
  );
}
