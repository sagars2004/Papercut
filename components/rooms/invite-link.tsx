"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function InviteLink({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <button type="button" onClick={copyInvite} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/60 transition-colors hover:border-[#c4ff0d]/35 hover:text-[#c4ff0d]"><span className="font-mono font-semibold tracking-[0.16em] text-white">{inviteCode}</span>{copied ? <Check className="size-3.5 text-[#c4ff0d]" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy invite"}</button>;
}
