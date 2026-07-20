"use client";

import { ArrowRight, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { normalizeInviteCode, type DurationUnit } from "@/lib/rooms";

type RoomEntryFormProps = {
  mode: "create" | "join";
  initialDurationUnit?: DurationUnit;
  initialDurationValue?: string;
  initialEmail?: string;
  initialInviteCode?: string;
  initialName?: string;
  initialRoomName?: string;
};

export function RoomEntryForm({ mode, initialDurationUnit = "hours", initialDurationValue = "1", initialEmail = "", initialInviteCode = "", initialName = "", initialRoomName = "" }: RoomEntryFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [roomName, setRoomName] = useState(initialRoomName);
  const [durationValue, setDurationValue] = useState(Number(initialDurationValue) > 0 ? initialDurationValue : "1");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(["minutes", "hours", "days"].includes(initialDurationUnit) ? initialDurationUnit : "hours");
  const [inviteCode, setInviteCode] = useState(normalizeInviteCode(initialInviteCode));
  const [error, setError] = useState("");
  const isCreate = mode === "create";

  function handleInvitePaste(value: string) {
    const normalized = normalizeInviteCode(value);
    if (/^[A-Z0-9]{8}$/.test(normalized)) setInviteCode(normalized);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    const normalizedInvite = normalizeInviteCode(inviteCode);

    if (name.length < 2) {
      setError("Enter the name your friends will see in the room.");
      return;
    }
    if (isCreate && roomName.trim().length < 3) {
      setError("Give your room a name with at least three characters.");
      return;
    }
    if (!isCreate && !/^[A-Z0-9]{8}$/.test(normalizedInvite)) {
      setError("Enter the 8-character invite code from your host.");
      return;
    }

    const destination = isCreate
      ? `/rooms/new?${new URLSearchParams({ roomName: roomName.trim(), durationValue, durationUnit }).toString()}`
      : `/join/${normalizedInvite}`;
    const setupPath = isCreate
      ? `/create?${new URLSearchParams({ name, email: email.trim(), roomName: roomName.trim(), durationValue, durationUnit }).toString()}`
      : `/join?${new URLSearchParams({ name, email: email.trim(), inviteCode: normalizedInvite }).toString()}`;
    const onboardingPath = `/onboarding?${new URLSearchParams({ name, next: destination, back: setupPath }).toString()}`;
    router.push(`/auth?${new URLSearchParams({ email: email.trim(), next: onboardingPath, back: setupPath }).toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-white/70">Your name</span>
          <input required autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none focus:border-[#c4ff0d]/55" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-white/70">Email address</span>
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none focus:border-[#c4ff0d]/55" />
        </label>
      </div>

      {isCreate ? (
        <>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-white/70">Room name</span>
            <input required maxLength={48} value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="e.g. The green room" className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c4ff0d]/55" />
          </label>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-white/70">Challenge length</legend>
            <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2"><input required type="number" min="1" max="43200" step="1" value={durationValue} onChange={(event) => setDurationValue(event.target.value)} className="h-12 min-w-0 rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none focus:border-[#c4ff0d]/55" aria-label="Challenge duration" /><select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value as DurationUnit)} className="h-12 rounded-xl border border-white/10 bg-[#10241a] px-3 text-sm text-white outline-none focus:border-[#c4ff0d]/55"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
            <span className="mt-2 block text-xs leading-5 text-white/40">Try 15 minutes for a quick demo. Rooms can run for up to 30 days.</span>
          </fieldset>
        </>
      ) : (
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-white/70">Invite code</span>
          <input required value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} onPaste={(event) => { const normalized = normalizeInviteCode(event.clipboardData.getData("text")); if (/^[A-Z0-9]{8}$/.test(normalized)) { event.preventDefault(); handleInvitePaste(normalized); } }} minLength={8} maxLength={8} placeholder="AB12CD34" className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 font-mono text-sm uppercase tracking-[0.2em] text-white outline-none placeholder:tracking-normal placeholder:text-white/25 focus:border-[#c4ff0d]/55" />
          <span className="mt-2 block text-xs leading-5 text-white/40">Paste the full invite link or enter the eight-character code from your host.</span>
        </label>
      )}

      {error ? <p role="alert" className="rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null}
      <div className="rounded-xl border border-white/[0.08] bg-black/10 p-3 text-xs leading-5 text-white/40">Sign in or create an account to continue. Every player begins with <span className="font-medium text-white/70">$1,000,000 USD</span>.</div>
      <Button type="submit" className="h-12 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62]">
        {isCreate ? <Users className="size-4" /> : <UserPlus className="size-4" />}
        {isCreate ? "Continue to create room" : "Continue to join room"}
        <ArrowRight className="size-4" />
      </Button>
    </form>
  );
}
