"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function InviteLink({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copyInvite(kind: "code" | "link") {
    const value = kind === "code" ? inviteCode : window.location.origin + "/join/" + inviteCode;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return <div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/10 bg-black/15 px-3 py-2 font-mono text-xs font-semibold tracking-[0.16em] text-white">{inviteCode}</span><button type="button" onClick={() => copyInvite("code")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/60 transition-colors hover:border-[#c4ff0d]/35 hover:text-[#c4ff0d]">{copied === "code" ? <Check className="size-3.5 text-[#c4ff0d]" /> : <Copy className="size-3.5" />}{copied === "code" ? "Code copied" : "Copy code"}</button><button type="button" onClick={() => copyInvite("link")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs text-white/60 transition-colors hover:border-[#c4ff0d]/35 hover:text-[#c4ff0d]">{copied === "link" ? <Check className="size-3.5 text-[#c4ff0d]" /> : <Copy className="size-3.5" />}{copied === "link" ? "Link copied" : "Copy link"}</button></div>;
}
