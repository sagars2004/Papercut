"use client";

import { LogOut, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

type AccountFormProps = {
  email: string;
  initialName: string;
  nextPath?: string;
  onboarding?: boolean;
};

export function AccountForm({ email, initialName, nextPath = "/dashboard", onboarding = false }: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Choose a display name with at least two characters.");
      return;
    }

    setStatus("saving");
    setError("");
    const { error: updateError } = await createClient().auth.updateUser({ data: { full_name: trimmedName } });
    if (updateError) {
      setError(updateError.message);
      setStatus("idle");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={saveProfile} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-xs font-medium text-white/65">Display name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={48} className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c4ff0d]/55" placeholder="How friends will know you" />
      </label>
      <div>
        <p className="text-xs font-medium text-white/65">Email</p>
        <p className="mt-2 text-sm text-white/38">{email}</p>
      </div>
      {error ? <p role="alert" className="rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}
      <Button type="submit" disabled={status === "saving"} className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62] disabled:opacity-60">
        {status === "saving" ? "Saving…" : onboarding ? "Continue to Papercut" : "Save account"}
        <Save className="size-4" />
      </Button>
      {!onboarding ? <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-white/40 transition-colors hover:text-[#ff9b9b]"><LogOut className="size-3.5" /> Sign out</button> : null}
    </form>
  );
}
