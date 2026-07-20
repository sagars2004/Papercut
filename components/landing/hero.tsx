"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  CircleHelp,
  LockKeyhole,
  Scissors,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";

const coins = [
  {
    ticker: "BTC",
    symbol: "₿",
    className: "left-[0%] top-[3%] sm:left-[2%] sm:top-[5%]",
    color: "#f7931a",
    duration: 6.5,
    delay: 0,
    rotate: 10,
  },
  {
    ticker: "ETH",
    symbol: "◆",
    className: "right-[0%] top-[4%] sm:right-[2%] sm:top-[6%]",
    color: "#9ba4ff",
    duration: 7.5,
    delay: 1.2,
    rotate: -14,
  },
  {
    ticker: "SOL",
    symbol: "≋",
    className: "bottom-[-8%] left-[8%] sm:bottom-[-7%] sm:left-[12%]",
    color: "#a8ffcf",
    duration: 8.5,
    delay: 0.7,
    rotate: 8,
  },
];

const entering = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) router.push("/auth?email=" + encodeURIComponent(email.trim()) + "&next=/onboarding");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06110d] text-white selection:bg-[#c4ff0d] selection:text-[#06110d]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(57,113,62,0.28),transparent_28%),radial-gradient(circle_at_18%_84%,rgba(16,72,42,0.2),transparent_27%),linear-gradient(130deg,#0b2618_0%,#06110d_47%,#020604_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c4ff0d]/50 to-transparent" />
      <div className="pointer-events-none absolute -right-24 top-24 h-[34rem] w-[34rem] rounded-full bg-[#c4ff0d]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute left-[-18rem] top-[44%] h-[30rem] w-[30rem] rounded-full border border-[#c4ff0d]/[0.08]" />

      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 mx-auto flex w-full max-w-[1380px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-6"
      >
        <a href="#top" className="group flex items-center gap-3" aria-label="Papercut home">
          <span className="relative flex size-10 items-center justify-center rounded-xl border border-[#c4ff0d]/50 bg-[#c4ff0d]/10 text-[#c4ff0d] shadow-[0_0_28px_rgba(196,255,13,0.12)] transition-transform group-hover:rotate-[-8deg]">
            <Scissors className="size-[19px]" strokeWidth={2.2} />
          </span>
          <span className="text-[18px] font-semibold tracking-[-0.04em] text-white">papercut</span>
        </a>

        <div className="hidden items-center gap-9 text-sm font-medium text-white/55 md:flex">
          <a className="transition-colors hover:text-[#c4ff0d]" href="#how-it-works">How it works</a>
          <a className="transition-colors hover:text-[#c4ff0d]" href="#leaderboard">Leaderboard</a>
          <a className="transition-colors hover:text-[#c4ff0d]" href="#rooms">Rooms</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button type="button" onClick={() => router.push("/auth?next=/dashboard")} variant="ghost" className="h-10 rounded-full px-3.5 text-sm text-white/70 hover:bg-white/5 hover:text-white sm:px-5">Log in</Button>
          <Button type="button" onClick={() => router.push("/auth?next=/onboarding")} className="h-10 rounded-full bg-[#c4ff0d] px-5 text-sm font-semibold text-[#0b1b0f] shadow-[0_0_24px_rgba(196,255,13,0.18)] hover:bg-[#d6ff59]">Sign up</Button>
        </div>
      </motion.nav>

      <section id="top" className="relative z-10 mx-auto grid w-full max-w-[1380px] items-center gap-14 px-5 pb-12 pt-5 sm:px-8 md:pt-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-5 lg:px-12 lg:pb-14 lg:pt-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={entering}
          transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
          className="relative z-10 max-w-[620px]"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#c4ff0d]/20 bg-[#c4ff0d]/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c4ff0d]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#c4ff0d]" />
            Social trading, with a coach
          </div>

          <h1 className="max-w-[700px] text-[clamp(3.35rem,7vw,6.7rem)] font-semibold leading-[0.92] tracking-[-0.075em] text-white">
            Make your first million a{" "}
            <span className="relative inline-block text-[#c4ff0d]">
              shared
              <svg className="absolute -bottom-3 left-0 h-3 w-full overflow-visible text-[#c4ff0d]/70" viewBox="0 0 260 12" fill="none" aria-hidden="true">
                <path d="M2 8.5C54 1 160 1.5 258 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>{" "}
            experiment.
          </h1>

          <p className="mt-8 max-w-[500px] text-base leading-7 text-white/55 sm:text-[17px]">
            Trade $1M in virtual capital against your friends. Then find out what your decisions are really teaching you.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 flex max-w-[510px] flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex h-14 flex-1 items-center rounded-2xl border border-white/10 bg-white/[0.055] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition-colors focus-within:border-[#c4ff0d]/60 focus-within:bg-white/[0.08]">
              <span className="mr-3 text-white/30" aria-hidden="true">@</span>
              <input
                aria-label="Email address"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                type="email"
                placeholder="you@inbox.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                required
              />
            </div>
            <Button type="submit" className="h-14 rounded-2xl bg-[#c4ff0d] px-6 text-sm font-semibold text-[#0a170d] shadow-[0_0_30px_rgba(196,255,13,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#d8ff62] hover:shadow-[0_0_36px_rgba(196,255,13,0.3)]">
              Create a room
              <ArrowUpRight className="size-4" />
            </Button>
          </form>

          <div className="mt-4 flex min-h-5 items-center gap-2 text-xs text-white/35">
            <LockKeyhole className="size-3.5" /> No spam. Just your invite and daily debriefs.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto h-[390px] w-full max-w-[640px] sm:h-[510px] lg:h-[620px]"
          aria-label="Papercut trading room preview"
        >
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#c4ff0d]/10 bg-[#c4ff0d]/[0.025] shadow-[0_0_100px_rgba(86,183,83,0.1)]" />
          <div className="absolute left-1/2 top-1/2 h-[59%] w-[59%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10" />
          <div className="absolute left-1/2 top-1/2 h-[40%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c4ff0d]/10 blur-3xl" />

          <div className="absolute left-1/2 top-1/2 w-[min(86%,470px)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/15 bg-[#10241a]/80 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45),0_0_60px_rgba(151,255,99,0.06)] backdrop-blur-xl sm:p-4">
            <div className="rounded-[20px] border border-white/[0.08] bg-[#0a1710]/95 p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/35">Room / night shift</p>
                  <p className="mt-2 text-sm font-semibold tracking-[-0.02em] text-white sm:text-base">The green room</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-[#c4ff0d]/20 bg-[#c4ff0d]/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#c4ff0d]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#c4ff0d]" /> Live
                </div>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-white/35">Portfolio value</p>
                  <p className="mt-1 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-[42px]">$1,084,260</p>
                </div>
                <div className="pb-1 text-right">
                  <p className="text-sm font-semibold text-[#c4ff0d]">+8.43%</p>
                  <p className="mt-1 text-[9px] text-white/30">today</p>
                </div>
              </div>

              <div className="mt-7 h-[115px] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-2 sm:h-[155px] sm:p-3">
                <svg viewBox="0 0 440 150" className="h-full w-full" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#c4ff0d" stopOpacity="0.28" />
                      <stop offset="1" stopColor="#c4ff0d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 116C22 119 24 102 45 106C69 111 72 91 93 95C117 99 122 78 145 83C162 86 171 66 188 73C205 80 215 59 231 63C249 68 261 42 279 50C293 57 301 41 318 43C336 45 352 26 367 33C387 42 398 18 440 11V150H0V116Z" fill="url(#chartFill)" />
                  <path d="M0 116C22 119 24 102 45 106C69 111 72 91 93 95C117 99 122 78 145 83C162 86 171 66 188 73C205 80 215 59 231 63C249 68 261 42 279 50C293 57 301 41 318 43C336 45 352 26 367 33C387 42 398 18 440 11" stroke="#c4ff0d" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M0 133H440M0 93H440M0 53H440" stroke="white" strokeOpacity="0.07" strokeDasharray="3 6" />
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["Rank", "#02 / 08"],
                  ["Best trade", "+$12,840"],
                  ["Coach", "Tonight 8:00"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5 sm:p-3">
                    <p className="text-[8px] uppercase tracking-[0.14em] text-white/30">{label}</p>
                    <p className="mt-2 truncate text-[11px] font-medium text-white/75 sm:text-xs">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {coins.map((coin) => (
            <motion.div
              key={coin.ticker}
              animate={{ y: [0, -16, 0], rotate: [coin.rotate, coin.rotate - 5, coin.rotate] }}
              transition={{ duration: coin.duration, delay: coin.delay, repeat: Infinity, ease: "easeInOut" }}
              className={["absolute z-10", coin.className].join(" ")}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="relative flex size-[68px] items-center justify-center rounded-full border border-white/20 bg-white/[0.1] shadow-[inset_-8px_-10px_18px_rgba(0,0,0,0.35),0_16px_32px_rgba(0,0,0,0.25)] backdrop-blur-md sm:size-[82px]"
                  style={{ boxShadow: "inset -8px -10px 18px rgba(0,0,0,0.35), 0 16px 32px rgba(0,0,0,0.25), 0 0 35px " + coin.color + "18" }}
                >
                  <span className="absolute inset-2 rounded-full border border-white/10" />
                  <span className="relative text-3xl font-semibold" style={{ color: coin.color }}>{coin.symbol}</span>
                </div>
                <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-semibold tracking-[0.16em] text-white/45 backdrop-blur-sm">{coin.ticker}</span>
              </div>
            </motion.div>
          ))}

          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[6%] right-[1%] hidden rounded-2xl border border-white/10 bg-[#10241a]/80 p-3 shadow-2xl backdrop-blur-md sm:block"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#c4ff0d]/10 text-[#c4ff0d]"><Sparkles className="size-4" /></div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Coach debrief</p>
                <p className="mt-1 text-[11px] text-white/70">Tonight, we review the dip.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto grid w-full max-w-[1380px] gap-3 px-5 pb-8 sm:px-8 md:grid-cols-3 lg:px-12">
        {[
          { icon: Trophy, number: "01", title: "Start a room", body: "Give your friends $1M each and pick a finish line." },
          { icon: CircleHelp, number: "02", title: "Trade your thesis", body: "Make the calls. See the consequences. Keep the receipts." },
          { icon: Sparkles, number: "03", title: "Meet your coach", body: "Get one clear investing lesson after the market closes." },
        ].map(({ icon: Icon, number, title, body }) => (
          <div key={number} className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 transition-colors hover:border-[#c4ff0d]/25 hover:bg-[#c4ff0d]/[0.04] sm:p-5">
            <div className="flex items-center justify-between">
              <Icon className="size-4 text-[#c4ff0d]/75" strokeWidth={1.8} />
              <span className="text-[10px] font-medium tracking-[0.18em] text-white/20">{number}</span>
            </div>
            <h2 className="mt-6 text-sm font-semibold tracking-[-0.02em] text-white/85">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-white/38">{body}</p>
          </div>
        ))}
      </section>

      <div id="leaderboard" className="sr-only">Leaderboard preview coming soon.</div>
      <div id="rooms" className="sr-only">Rooms preview coming soon.</div>
      <div className="relative z-10 mx-auto flex w-full max-w-[1380px] items-center justify-center px-5 pb-7 pt-10 sm:px-8 lg:px-12">
        <a href="#how-it-works" className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25 transition-colors hover:text-[#c4ff0d]">
          Scroll to explore
          <ChevronDown className="size-3.5 animate-bounce" />
        </a>
      </div>
    </main>
  );
}
