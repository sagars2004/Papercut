"use client";

import { ArrowRight, Plus, UserPlus } from "lucide-react";
import { useActionState } from "react";

import { createRoom, joinRoom, type RoomActionState } from "@/app/rooms/actions";
import { Button } from "@/components/ui/button";
import { normalizeInviteCode } from "@/lib/rooms";

const initialState: RoomActionState = {};

function ErrorMessage({ error }: { error?: string }) {
  return error ? <p role="alert" className="rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{error}</p> : null;
}

type CreateRoomFormProps = {
  initialDurationDays?: number;
  initialRoomName?: string;
};

export function CreateRoomForm({ initialDurationDays = 7, initialRoomName = "" }: CreateRoomFormProps) {
  const [state, action, pending] = useActionState(createRoom, initialState);
  const durationDays = [5, 7, 14].includes(initialDurationDays) ? initialDurationDays : 7;

  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="mb-2 block text-xs font-medium text-white/65">Room name</span><input required name="name" maxLength={48} defaultValue={initialRoomName} placeholder="e.g. The green room" className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c4ff0d]/55" /></label>
      <fieldset><legend className="mb-2 text-xs font-medium text-white/65">Challenge length</legend><div className="grid grid-cols-3 gap-2">{[5, 7, 14].map((days) => <label key={days} className="cursor-pointer"><input className="peer sr-only" type="radio" name="durationDays" value={days} defaultChecked={days === durationDays} /><span className="flex h-10 items-center justify-center rounded-lg border border-white/10 text-xs text-white/45 transition-colors peer-checked:border-[#c4ff0d]/45 peer-checked:bg-[#c4ff0d]/10 peer-checked:text-[#c4ff0d]">{days} days</span></label>)}</div></fieldset>
      <div className="rounded-xl border border-white/[0.08] bg-black/10 p-3 text-xs leading-5 text-white/40"><span className="font-medium text-white/65">Every player starts with $1,000,000 USD.</span> The first version uses the same seven crypto assets for every room.</div>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62] disabled:opacity-60">{pending ? "Creating room…" : "Create room"}<Plus className="size-4" /></Button>
    </form>
  );
}

export function JoinRoomForm() {
  const [state, action, pending] = useActionState(joinRoom, initialState);

  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="mb-2 block text-xs font-medium text-white/65">Invite code</span><input required name="inviteCode" minLength={8} maxLength={8} placeholder="AB12CD34" onPaste={(event) => { const normalized = normalizeInviteCode(event.clipboardData.getData("text")); if (/^[A-Z0-9]{8}$/.test(normalized)) { event.preventDefault(); event.currentTarget.value = normalized; } }} className="h-12 w-full rounded-xl border border-white/10 bg-black/15 px-4 font-mono text-sm uppercase tracking-[0.2em] text-white outline-none placeholder:tracking-normal placeholder:text-white/25 focus:border-[#c4ff0d]/55" /></label>
      <p className="text-xs leading-5 text-white/40">Paste the full invite link or enter the eight-character code from your host.</p>
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={pending} variant="outline" className="h-11 w-full rounded-xl border-[#c4ff0d]/25 bg-[#c4ff0d]/[0.06] text-sm font-semibold text-[#c4ff0d] hover:bg-[#c4ff0d]/15 disabled:opacity-60">{pending ? "Joining room…" : "Join room"}<UserPlus className="size-4" /></Button>
    </form>
  );
}

export function InviteJoinForm({ inviteCode }: { inviteCode: string }) {
  const [state, action, pending] = useActionState(joinRoom, initialState);

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="inviteCode" value={inviteCode} />
      <ErrorMessage error={state.error} />
      <Button type="submit" disabled={pending} className="mt-3 h-11 w-full rounded-xl bg-[#c4ff0d] text-sm font-semibold text-[#0a170d] hover:bg-[#d8ff62] disabled:opacity-60">{pending ? "Joining room…" : "Join this waiting room"}<ArrowRight className="size-4" /></Button>
    </form>
  );
}

export function OpenRoomButton() {
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#c4ff0d]">Open room <ArrowRight className="size-3.5" /></span>;
}
