"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Lightbulb,
  Menu,
  Medal,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { Button } from "@/components/ui/button";

const tabs = ["Dashboard", "Trade", "Leaderboard", "History", "Feedback"];

const history = [
  { time: "09:00", value: 1000000 },
  { time: "10:00", value: 1008200 },
  { time: "11:00", value: 1004100 },
  { time: "12:00", value: 1021900 },
  { time: "13:00", value: 1017800 },
  { time: "14:00", value: 1032400 },
  { time: "15:00", value: 1041900 },
  { time: "16:00", value: 1037600 },
  { time: "17:00", value: 1052600 },
  { time: "18:00", value: 1061400 },
  { time: "19:00", value: 1084260 },
];

const allocation = [
  { name: "BTC", value: 46, color: "#c4ff0d" },
  { name: "ETH", value: 24, color: "#9da68e" },
  { name: "SOL", value: 16, color: "#687660" },
  { name: "Cash", value: 14, color: "#334336" },
];

const holdingStats = [
  { symbol: "BTC", name: "Bitcoin", percent: 84, color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", percent: 72, color: "#9ba4ff" },
  { symbol: "SOL", name: "Solana", percent: 61, color: "#a8ffcf" },
  { symbol: "LINK", name: "Chainlink", percent: 38, color: "#5e8cff" },
];

const holdings = [
  { symbol: "BTC", quantity: "6.2555 BTC", value: "$412,840", change: "+12.4%", color: "#f7931a" },
  { symbol: "ETH", quantity: "38.20 ETH", value: "$248,190", change: "+7.8%", color: "#9ba4ff" },
  { symbol: "SOL", quantity: "218.40 SOL", value: "$169,930", change: "+18.2%", color: "#a8ffcf" },
];

const ticker = [
  ["BTC", "$65,942.20", "+2.41%"],
  ["ETH", "$3,218.74", "+1.84%"],
  ["SOL", "$177.92", "+4.62%"],
  ["LINK", "$18.42", "-0.62%"],
  ["AVAX", "$36.09", "+3.18%"],
  ["DOGE", "$0.14", "+0.88%"],
  ["AAVE", "$112.60", "-1.04%"],
];

function formatCountdown(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return [
    String(days).padStart(2, "0") + "d",
    String(hours).padStart(2, "0") + "h",
    String(minutes).padStart(2, "0") + "m",
  ].join(" ");
}

function AssetMark({ symbol, color }: { symbol: string; color: string }) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-[11px] font-semibold"
      style={{ color, backgroundColor: color + "18" }}
    >
      {symbol === "BTC" ? "₿" : symbol === "ETH" ? "◆" : symbol === "SOL" ? "≋" : symbol.slice(0, 1)}
    </span>
  );
}

export function DashboardShell() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isPublic, setIsPublic] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(2 * 86400 + 8 * 3600 + 41 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 60));
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#07110c] text-white selection:bg-[#c4ff0d] selection:text-[#07110c]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_72%_2%,rgba(80,150,74,0.16),transparent_26%),linear-gradient(145deg,#0b1d13_0%,#07110c_46%,#030705_100%)]" />

      <header className="relative z-20 border-b border-white/[0.08] bg-[#07110c]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-5 px-5 py-4 sm:px-7 lg:px-10">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="Back to Papercut home">
            <span className="flex size-9 items-center justify-center rounded-xl border border-[#c4ff0d]/45 bg-[#c4ff0d]/10 text-[#c4ff0d] transition-transform group-hover:rotate-[-8deg]">
              <Scissors className="size-[17px]" strokeWidth={2.2} />
            </span>
            <span className="text-base font-semibold tracking-[-0.04em]">papercut</span>
          </Link>

          <div className="hidden h-8 w-px bg-white/10 lg:block" />
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <span className="size-1.5 rounded-full bg-[#c4ff0d]" />
            <span className="truncate text-xs font-medium text-white/75">The green room</span>
            <span className="text-[10px] text-white/30">7 DAY CHALLENGE</span>
          </div>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 sm:gap-1.5" aria-label="Room navigation">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-current={activeTab === tab ? "page" : undefined}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "whitespace-nowrap rounded-lg bg-[#c4ff0d] px-3 py-2 text-[11px] font-medium text-[#0a170d] shadow-[0_0_18px_rgba(196,255,13,0.16)] sm:px-3.5 sm:text-xs"
                    : "whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white sm:px-3.5 sm:text-xs"
                }
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button type="button" className="relative flex size-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-colors hover:border-[#c4ff0d]/30 hover:text-[#c4ff0d]" aria-label="Notifications">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#c4ff0d]" />
            </button>
            <div className="flex items-center gap-2.5 border-l border-white/10 pl-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#c4ff0d] text-xs font-bold text-[#0a170d]">MS</div>
              <div className="hidden xl:block">
                <p className="text-xs font-medium text-white/80">Maya Singh</p>
                <p className="text-[9px] text-white/30">room owner</p>
              </div>
            </div>
          </div>
          <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/50 md:hidden" aria-label="Open menu">
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 border-b border-white/[0.06] bg-black/10">
        <div className="mx-auto flex max-w-[1500px] items-center gap-5 overflow-hidden px-5 py-2.5 sm:px-7 lg:px-10">
          <div className="flex shrink-0 items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c4ff0d]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#c4ff0d]" />
            Live feed
          </div>
          <div className="flex min-w-max items-center gap-6 text-[11px]">
            {ticker.map(([symbol, price, change]) => (
              <div key={symbol} className="flex items-center gap-2 text-white/50">
                <span className="font-semibold text-white/80">{symbol}</span>
                <span>{price}</span>
                <span className={change.startsWith("+") ? "text-[#c4ff0d]" : "text-[#ff7f7f]"}>{change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="relative z-10 mx-auto max-w-[1500px] px-5 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-9">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              <span className="size-1.5 rounded-full bg-[#c4ff0d]" />
              {activeTab} / mock data
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">Good evening, Maya.</h1>
            <p className="mt-2 text-sm text-white/40">Your room is moving. Here&apos;s what the tape says so far.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Clock3 className="size-4 text-[#c4ff0d]/75" />
            Last synced 12 seconds ago
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-[390px] rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.14)] sm:p-6"
          >
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-xs text-white/38">
                  <WalletCards className="size-4 text-[#c4ff0d]/75" />
                  Portfolio History
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <span className="text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">$1,084,260</span>
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#c4ff0d]"><ArrowUpRight className="size-3.5" /> +8.43%</span>
                </div>
                <p className="mt-1 text-[11px] text-white/30">+$84,260 since the room started</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/10 p-1">
                {["1H", "24H", "1W"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={range === "1W" ? "rounded-md bg-white/[0.1] px-3 py-1.5 text-[10px] font-medium text-[#c4ff0d]" : "rounded-md px-3 py-1.5 text-[10px] font-medium text-white/35 hover:text-white"}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 h-[245px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 8, right: 4, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c4ff0d" stopOpacity={0.26} />
                      <stop offset="100%" stopColor="#c4ff0d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 7" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 10 }} dy={10} />
                  <Tooltip
                    cursor={{ stroke: "rgba(196,255,13,0.25)" }}
                    contentStyle={{ background: "#0b1d13", border: "1px solid rgba(196,255,13,0.22)", borderRadius: 12, color: "#fff", fontSize: 11 }}
                    formatter={(value) => ["$" + Number(value).toLocaleString(), "Value"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#c4ff0d" strokeWidth={2.5} fill="url(#portfolioGradient)" dot={false} activeDot={{ r: 4, fill: "#c4ff0d", stroke: "#07110c", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-2xl border border-[#c4ff0d]/25 bg-[#c4ff0d]/[0.07] p-5 shadow-[0_0_45px_rgba(196,255,13,0.06)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/45"><Medal className="size-4 text-[#c4ff0d]" /> Your Rank</div>
                <span className="rounded-full border border-[#c4ff0d]/20 bg-[#c4ff0d]/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d]">Top 25%</span>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <span className="text-6xl font-semibold tracking-[-0.08em] text-[#c4ff0d]">#02</span>
                <span className="mb-2 text-xs text-white/40">out of 08 traders</span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                <span className="text-white/35">You climbed</span>
                <span className="flex items-center gap-1 font-semibold text-[#c4ff0d]"><TrendingUp className="size-3.5" /> 3 spots today</span>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/45"><Users className="size-4 text-[#c4ff0d]/75" /> Who&apos;s Holding What</div>
                <button type="button" className="text-white/25 transition-colors hover:text-[#c4ff0d]" aria-label="View holding details"><ChevronRight className="size-4" /></button>
              </div>
              <div className="mt-5 space-y-4">
                {holdingStats.map((asset) => (
                  <div key={asset.symbol}>
                    <div className="mb-1.5 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-white/70">{asset.symbol}<span className="ml-1.5 font-normal text-white/30">{asset.name}</span></span>
                      <span className="text-white/45">{asset.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full" style={{ width: asset.percent + "%", backgroundColor: asset.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/45"><BarChart3 className="size-4 text-[#c4ff0d]/75" /> Asset Allocation</div>
              <span className="text-[10px] text-white/25">Current</span>
            </div>
            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-[155px] w-[155px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={51} outerRadius={72} paddingAngle={3} stroke="none">
                      {allocation.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold tracking-[-0.06em]">$1.08M</span>
                  <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">total</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {allocation.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-white/55"><span className="size-2 rounded-full" style={{ backgroundColor: asset.color }} /> {asset.name}</span>
                    <span className="font-medium text-white/75">{asset.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6 lg:col-span-1 lg:row-span-2">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-xs text-white/45"><CircleDollarSign className="size-4 text-[#c4ff0d]/75" /> My Portfolio</div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.06em]">$1,084,260</p>
                <p className="mt-1 text-xs text-[#c4ff0d]">+$84,260 <span className="text-white/30">all time</span></p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2.5 sm:text-right">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] text-white/30 sm:justify-end"><Clock3 className="size-3" /> Ends in</p>
                <p className="mt-1 text-sm font-semibold text-[#c4ff0d]">{formatCountdown(secondsLeft)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-white/[0.08] py-4">
              <div>
                <p className="text-xs font-medium text-white/75">Portfolio visibility</p>
                <p className="mt-1 text-[10px] text-white/30">{isPublic ? "Friends can see your positions" : "Your positions are hidden"}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic((current) => !current)}
                className={isPublic ? "relative h-6 w-11 rounded-full border border-[#c4ff0d] bg-[#c4ff0d] transition-colors" : "relative h-6 w-11 rounded-full border border-white/15 bg-white/[0.08] transition-colors"}
              >
                <span className={isPublic ? "absolute top-1 size-4 translate-x-6 rounded-full bg-[#0a170d] transition-transform" : "absolute top-1 size-4 translate-x-1 rounded-full bg-white/60 transition-transform"} />
                <span className="sr-only">{isPublic ? "Public" : "Private"}</span>
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Holdings</p>
              <Button variant="ghost" className="h-7 rounded-lg px-2 text-[10px] text-[#c4ff0d] hover:bg-[#c4ff0d]/10">+ Add asset</Button>
            </div>

            <div className="space-y-2">
              {holdings.map((holding) => (
                <div key={holding.symbol} className="rounded-xl border border-white/[0.07] bg-black/10 p-3 transition-colors hover:border-[#c4ff0d]/20 hover:bg-[#c4ff0d]/[0.025]">
                  <div className="flex items-center gap-2.5">
                    <AssetMark symbol={holding.symbol} color={holding.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white/80">{holding.symbol}</p>
                        <span className="text-[10px] text-[#c4ff0d]">{holding.change}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-white/30">{holding.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-white/80">{holding.value}</p>
                      <p className="mt-0.5 text-[9px] text-white/25">market value</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-7 rounded-lg border-[#c4ff0d]/25 bg-[#c4ff0d]/[0.06] text-[10px] text-[#c4ff0d] hover:bg-[#c4ff0d]/15">Buy</Button>
                    <Button variant="outline" className="h-7 rounded-lg border-white/10 bg-white/[0.03] text-[10px] text-white/50 hover:bg-white/[0.08] hover:text-white">Sell</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#c4ff0d]/15 bg-[#c4ff0d]/[0.045] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white/45"><Lightbulb className="size-4 text-[#c4ff0d]" /> Lesson of the day</div>
              <Sparkles className="size-4 text-[#c4ff0d]/60" />
            </div>
            <p className="mt-6 max-w-[440px] text-xl font-medium leading-tight tracking-[-0.045em] text-white/90">
              A good entry is only half the trade. Your exit needs a rule, too.
            </p>
            <p className="mt-4 max-w-[460px] text-xs leading-5 text-white/40">
              Your coach noticed you added to SOL after a 7.2% run-up. Tonight&apos;s debrief will unpack the difference between conviction and chasing.
            </p>
            <button type="button" className="mt-5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d] hover:text-white">
              Preview debrief <ChevronRight className="size-3.5" />
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}
