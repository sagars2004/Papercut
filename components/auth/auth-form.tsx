"use client";

import { ArrowRight, KeyRound, LogOut, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  activeEmail?: string;
  backPath?: string;
  initialEmail?: string;
  initialError?: string;
  nextPath: string;
};

type AuthMode = "login" | "signup";

export function AuthForm({ activeEmail = "", backPath = "/", initialEmail = "", initialError = "", nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>(initialEmail ? "signup" : "login");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState(initialError);
  const [hasActiveSession, setHasActiveSession] = useState(Boolean(activeEmail));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setStatus("submitting");
    setError("");
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email: normalizedEmail, password })
      : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (result.error) {
      setError(result.error.message);
      setStatus("idle");
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setError("Email confirmation is still enabled in Supabase. Disable Confirm email for this POC, then try again.");
      setStatus("idle");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function useDifferentAccount() {
    await createClient().auth.signOut();
    setHasActiveSession(false);
    setError("");
  }

  const isSubmitting = status === "submitting";
  const title = mode === "signup" ? "Create your trading account." : "Welcome back.";
  const description = mode === "signup"
    ? "Use an email and password to keep your rooms and trades tied to you."
    : "Sign in with the email and password registered to your Papercut account.";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06110d] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(89,150,66,0.22),transparent_32%),linear-gradient(145deg,#0b2618_0%,#06110d_48%,#020604_100%)]" />
      <div className="relative z-10 w-full max-w-[460px] rounded-[28px] border border-white/10 bg-[#0c1d14]/80 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[-0.03em] text-white transition-colors hover:text-[#c4ff0d]">
          <span className="flex size-8 items-center justify-center rounded-lg border border-[#c4ff0d]/40 bg-[#c4ff0d]/10 text-[#c4ff0d]">✂</span>
          papercut
        </Link>

        {hasActiveSession ? <div className="mt-7 rounded-xl border border-[#c4ff0d]/20 bg-[#c4ff0d]/[0.06] p-3 text-xs leading-5 text-white/55">You&apos;re currently signed in as <span className="font-medium text-white/85">{activeEmail}</span>. To use <span className="font-medium text-white/85">{email || "a different email"}</span>, sign out first.<button type="button" onClick={useDifferentAccount} className="mt-2 flex items-center gap-1.5 font-semibold text-[#c4ff0d] hover:text-white"><LogOut className="size-3.5" /> Sign out and use a different account</button></div> : null}

        <div className="mt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">Your trading identity</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/45">{description}</p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-xl border border-white/10 bg-black/15 p-1 text-xs font-semibold">
          <button type="button" onClick={() => { setMode("login"); setError(""); }} className={mode === "login" ? "rounded-lg bg-white/10 px-3 py-2 text-white" : "rounded-lg px-3 py-2 text-white/40 transition-colors hover:text-white"}>Log in</button>
          <button type="button" onClick={() => { setMode("signup"); setError(""); }} className={mode === "signup" ? "rounded-lg bg-[#c4ff0d] px-3 py-2 text-[#0a170d]" : "rounded-lg px-3 py-2 text-white/40 transition-colors hover:text-white"}>Sign up</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/70">Email address</span>
            <span className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 focus-within:border-[#c4ff0d]/55">
              <Mail className="size-4 text-white/30" />
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/70">Password</span>
            <span className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 focus-within:border-[#c4ff0d]/55">
              <KeyRound className="size-4 text-white/30" />
              <input type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
            </span>
          </label>
          {error ? <p role="alert" className="rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting || hasActiveSession} className="h-12 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62] disabled:opacity-60">
            {isSubmitting ? "Signing you in…" : mode === "signup" ? "Create account" : "Log in"}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-5 text-white/30">Papercut is virtual trading only—not investment advice.</p>
        <Link href={backPath} className="mt-5 block text-center text-xs font-medium text-white/40 transition-colors hover:text-[#c4ff0d]">← Back to room setup</Link>
      </div>
    </main>
  );
}
