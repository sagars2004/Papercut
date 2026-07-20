"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Lightbulb,
  Menu,
  Medal,
  Search,
  Scissors,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/auth";
import { MARKET_ASSETS, type MarketAsset } from "@/lib/market-assets";
import type { PortfolioSummary } from "@/lib/portfolio";
import { formatRoomDuration } from "@/lib/rooms";

const tabs = ["Dashboard", "Trade", "Leaderboard", "History", "Feedback"];

const holdingStats = [
  { symbol: "BTC", name: "Bitcoin", percent: 84, color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", percent: 72, color: "#9ba4ff" },
  { symbol: "SOL", name: "Solana", percent: 61, color: "#a8ffcf" },
  { symbol: "LINK", name: "Chainlink", percent: 38, color: "#5e8cff" },
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

type LiveMarketAsset = MarketAsset & {
  price: number | null;
  change24h: number | null;
};

function formatUsd(value: number | null) {
  if (value === null) return "Loading…";
  return value < 1
    ? "$" + value.toFixed(4)
    : "$" + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatChange(value: number | null) {
  if (value === null) return "—";
  return (value >= 0 ? "+" : "") + value.toFixed(2) + "%";
}

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

type ChartMode = "line" | "area" | "candles";

type CandlePoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

function SampledCandleChart({ candles }: { candles: CandlePoint[] }) {
  if (candles.length === 0) {
    return <div className="flex h-full items-center justify-center text-xs text-white/35">Loading price history…</div>;
  }

  const width = 1000;
  const height = 320;
  const padding = { top: 38, right: 18, bottom: 34, left: 82 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = candles.flatMap((candle) => [candle.high, candle.low]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const rawRange = rawMax - rawMin;
  const chartPadding = rawRange === 0 ? Math.max(Math.abs(rawMax) * 0.01, 0.01) : rawRange * 0.08;
  const min = rawMin - chartPadding;
  const max = rawMax + chartPadding;
  const range = max - min || 1;
  const step = plotWidth / Math.max(candles.length - 1, 1);
  const y = (value: number) => padding.top + plotHeight - ((value - min) / range) * plotHeight;
  const x = (index: number) => padding.left + index * step;
  const yTicks = Array.from({ length: 5 }, (_, index) => max - (range * index) / 4);
  const xTickIndexes = Array.from(new Set([0, Math.floor((candles.length - 1) / 2), candles.length - 1]));
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <svg viewBox={"0 0 " + width + " " + height} className="h-full w-full" preserveAspectRatio="none" role="img" aria-label="Candlestick price chart with price and time axes">
      <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} fill="rgba(3, 12, 8, 0.56)" />
      {yTicks.map((tick, index) => (
        <g key={"y-" + index}>
          <line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 7" />
          <text x={padding.left - 12} y={y(tick) + 4} textAnchor="end" fill="rgba(255,255,255,0.48)" fontSize="12">{formatUsd(tick)}</text>
        </g>
      ))}
      {xTickIndexes.map((index) => (
        <g key={"x-" + index}>
          <line x1={x(index)} x2={x(index)} y1={padding.top} y2={padding.top + plotHeight} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 7" />
          <text x={x(index)} y={height - 10} textAnchor={index === 0 ? "start" : index === candles.length - 1 ? "end" : "middle"} fill="rgba(255,255,255,0.42)" fontSize="12">{formatTime(candles[index].time)}</text>
        </g>
      ))}
      <line x1={padding.left} x2={padding.left} y1={padding.top} y2={padding.top + plotHeight} stroke="rgba(255,255,255,0.24)" />
      <line x1={padding.left} x2={width - padding.right} y1={padding.top + plotHeight} y2={padding.top + plotHeight} stroke="rgba(255,255,255,0.24)" />
      {candles.map((candle, index) => {
        const { open, close, high, low } = candle;
        const candleX = x(index);
        const candleWidth = Math.max(6, Math.min(18, step * 0.62));
        const bullish = close >= open;

        return (
          <g key={candle.time}>
            <title>{formatTime(candle.time)} · O {formatUsd(open)} · H {formatUsd(high)} · L {formatUsd(low)} · C {formatUsd(close)}</title>
            <line x1={candleX} x2={candleX} y1={y(high)} y2={y(low)} stroke={bullish ? "#c4ff0d" : "#ff7f7f"} strokeWidth="2" />
            <rect x={candleX - candleWidth / 2} y={Math.min(y(open), y(close))} width={candleWidth} height={Math.max(3, Math.abs(y(open) - y(close)))} rx="1.5" fill={bullish ? "#c4ff0d" : "#ff7f7f"} fillOpacity="0.9" />
          </g>
        );
      })}
    </svg>
  );
}

function TradePanel({ portfolio, roomId }: { portfolio: PortfolioSummary; roomId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [orderInputMode, setOrderInputMode] = useState<"units" | "usd">("units");
  const [orderAmount, setOrderAmount] = useState("1");
  const [orderMessage, setOrderMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [range, setRange] = useState<"1h" | "6h" | "24h">("24h");
  const [chartMode, setChartMode] = useState<ChartMode>("area");
  const [marketAssets, setMarketAssets] = useState<LiveMarketAsset[]>(() =>
    MARKET_ASSETS.map((asset) => ({ ...asset, price: null, change24h: null })),
  );
  const [priceHistory, setPriceHistory] = useState<Array<{ time: number; value: number }>>([]);
  const [candleHistory, setCandleHistory] = useState<CandlePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const selectedAsset = marketAssets.find((asset) => asset.symbol === selectedSymbol) ?? marketAssets[0];
  const filteredAssets = marketAssets.filter((asset) =>
    (asset.symbol + asset.name).toLowerCase().includes(query.toLowerCase()),
  );
  const selectedHolding = portfolio.holdings.find((holding) => holding.symbol === selectedSymbol);
  const selectedPrice = selectedAsset.price;
  const requestedQuantity = orderInputMode === "usd" && selectedPrice !== null && selectedPrice > 0
    ? Number(orderAmount) / selectedPrice
    : Number(orderAmount);
  const orderValue = selectedPrice === null || !Number.isFinite(requestedQuantity) ? null : requestedQuantity * selectedPrice;

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/market")
      .then(async (response) => {
        if (!response.ok) throw new Error("Market data unavailable");
        return response.json() as Promise<{ assets: LiveMarketAsset[] }>;
      })
      .then((data) => {
        if (isCurrent) setMarketAssets(data.assets);
      })
      .catch(() => {
        if (isCurrent) setMarketError("Market data is temporarily unavailable.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/market/" + selectedAsset.symbol + "/history?range=" + range)
      .then(async (response) => {
        if (!response.ok) throw new Error("Price history unavailable");
        return response.json() as Promise<{ prices: Array<[number, number]>; candles?: Array<[number, number, number, number, number]> }>;
      })
      .then((data) => {
        if (data.prices.length === 0) throw new Error("Price history unavailable");
        if (isCurrent) {
          setPriceHistory(data.prices.map(([time, value]) => ({ time, value })));
          setCandleHistory((data.candles ?? []).map(([time, open, high, low, close]) => ({ time, open, high, low, close })));
        }
      })
      .catch(() => {
        if (isCurrent) setMarketError("Price history is temporarily unavailable.");
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedAsset.symbol, range]);

  async function submitOrder() {
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setOrderError(`Enter a ${orderInputMode === "usd" ? "USD amount" : "quantity"} greater than zero.`);
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError("");
    setOrderMessage("");
    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: orderType, quantity: requestedQuantity, roomId, symbol: selectedAsset.symbol }),
      });
      const body = await response.json() as { error?: string; trade?: { action: string; assetSymbol: string; quantity: number } };
      if (!response.ok) throw new Error(body.error ?? "We could not place that order.");

      setOrderMessage(`${body.trade?.action ?? orderType} executed: ${body.trade?.quantity ?? requestedQuantity} ${body.trade?.assetSymbol ?? selectedAsset.symbol}.`);
      router.refresh();
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "We could not place that order.");
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/75">Live Prices</p>
            <p className="mt-1 text-[10px] text-white/30">Select an asset to trade</p>
          </div>
          <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#c4ff0d]"><span className={isLoading ? "size-1.5 animate-pulse rounded-full bg-[#c4ff0d]" : "size-1.5 rounded-full bg-[#c4ff0d]"} /> {isLoading ? "Updating" : "Live"}</span>
        </div>
        <div className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 focus-within:border-[#c4ff0d]/40">
          <Search className="size-3.5 text-white/30" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter assets" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25" aria-label="Filter assets" />
          <SlidersHorizontal className="size-3.5 text-white/25" />
        </div>
        <div className="mt-4 space-y-1">
          {filteredAssets.map((asset) => (
            <button key={asset.symbol} type="button" onClick={() => { setSelectedSymbol(asset.symbol); setOrderMessage(""); setOrderError(""); }} className={selectedSymbol === asset.symbol ? "flex w-full items-center gap-2.5 rounded-xl border border-[#c4ff0d]/20 bg-[#c4ff0d]/[0.08] px-2.5 py-3 text-left" : "flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-3 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"}>
              <AssetMark symbol={asset.symbol} color={asset.color} />
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-white/80">{asset.symbol}</span><span className="block truncate text-[10px] text-white/30">{asset.name}</span></span>
              <span className="text-right"><span className="block text-[11px] text-white/70">{formatUsd(asset.price)}</span><span className={asset.change24h === null || asset.change24h >= 0 ? "block text-[10px] text-[#c4ff0d]" : "block text-[10px] text-[#ff7f7f]"}>{formatChange(asset.change24h)}</span></span>
            </button>
          ))}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-3"><AssetMark symbol={selectedAsset.symbol} color={selectedAsset.color} /><div><p className="text-lg font-semibold tracking-[-0.04em]">{selectedAsset.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/30">{selectedAsset.symbol} / USD</p></div></div>
          <div className="text-left sm:text-right"><p className="text-xl font-semibold tracking-[-0.05em]">{formatUsd(selectedAsset.price)}</p><p className={selectedAsset.change24h === null || selectedAsset.change24h >= 0 ? "mt-1 text-xs text-[#c4ff0d]" : "mt-1 text-xs text-[#ff7f7f]"}>{formatChange(selectedAsset.change24h)} today</p></div>
        </div>
        <div className="relative mt-7 h-[300px] min-w-0 rounded-xl border border-white/[0.07] bg-black/10 p-3">
          <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#07110c]/80 p-1 backdrop-blur-sm">
              {(["1h", "6h", "24h"] as const).map((option) => (
                <button key={option} type="button" onClick={() => setRange(option)} className={range === option ? "rounded-md bg-white/[0.1] px-2.5 py-1.5 text-[10px] font-semibold text-[#c4ff0d]" : "rounded-md px-2.5 py-1.5 text-[10px] text-white/35 hover:text-white"}>{option}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-[#07110c]/80 p-1 backdrop-blur-sm">
              {(["line", "area", "candles"] as const).map((option) => (
                <button key={option} type="button" onClick={() => setChartMode(option)} className={chartMode === option ? "rounded-md bg-white/[0.1] px-2.5 py-1.5 text-[10px] font-semibold text-[#c4ff0d]" : "rounded-md px-2.5 py-1.5 text-[10px] capitalize text-white/35 hover:text-white"}>{option}</button>
              ))}
            </div>
          </div>
          {chartMode === "candles" ? <SampledCandleChart candles={candleHistory} /> : <ResponsiveContainer width="100%" height="100%">
            {chartMode === "line" ? <LineChart data={priceHistory} margin={{ top: 8, right: 6, left: 4, bottom: 20 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 7" />
              <YAxis domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }} tickFormatter={(value) => formatUsd(Number(value))} width={56} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }} tickFormatter={(value) => new Date(Number(value)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} minTickGap={24} />
              <Tooltip contentStyle={{ background: "#0b1d13", border: "1px solid rgba(196,255,13,0.22)", borderRadius: 12, color: "#fff", fontSize: 11 }} formatter={(value) => [Number(value).toLocaleString(), selectedAsset.symbol]} />
              <Line type="monotone" dataKey="value" stroke={selectedAsset.color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: selectedAsset.color, stroke: "#07110c", strokeWidth: 2 }} />
            </LineChart> : <AreaChart data={priceHistory} margin={{ top: 8, right: 6, left: 4, bottom: 20 }}>
              <defs><linearGradient id="tradeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selectedAsset.color} stopOpacity={0.28} /><stop offset="100%" stopColor={selectedAsset.color} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 7" />
              <YAxis domain={["dataMin", "dataMax"]} tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }} tickFormatter={(value) => formatUsd(Number(value))} width={56} />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: "rgba(255,255,255,0.32)", fontSize: 10 }} tickFormatter={(value) => new Date(Number(value)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} minTickGap={24} />
              <Tooltip contentStyle={{ background: "#0b1d13", border: "1px solid rgba(196,255,13,0.22)", borderRadius: 12, color: "#fff", fontSize: 11 }} formatter={(value) => [Number(value).toLocaleString(), selectedAsset.symbol]} />
              <Area type="monotone" dataKey="value" stroke={selectedAsset.color} strokeWidth={2.5} fill="url(#tradeGradient)" dot={false} activeDot={{ r: 4, fill: selectedAsset.color, stroke: "#07110c", strokeWidth: 2 }} />
            </AreaChart>}
          </ResponsiveContainer>}
          {marketError ? <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/35">{marketError}</p> : null}
          {!marketError && priceHistory.length === 0 ? <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white/35">Loading price history…</p> : null}
        </div>
        <p className="mt-2 text-[10px] text-white/25">Candles use provider OHLC data when available; the fallback feed derives ranges from quote samples.</p>
        <div className="mt-6 grid gap-4 rounded-xl border border-white/[0.08] bg-black/10 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">USD available</p><p className="mt-2 text-sm font-medium text-white/80">{formatUsd(portfolio.cashBalance)}</p></div>
            <div><p className="text-[9px] uppercase tracking-[0.14em] text-white/25">Current holding</p><p className="mt-2 text-sm font-medium text-white/80">{selectedHolding?.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 }) ?? "0.00"} {selectedSymbol}</p></div>
            <div className="col-span-2 sm:col-span-1"><div className="flex items-center justify-between"><span className="text-[9px] uppercase tracking-[0.14em] text-white/25">{orderInputMode === "usd" ? "Order value" : "Quantity"}</span><div className="flex rounded-md border border-white/10 bg-black/10 p-0.5 text-[9px]"><button type="button" onClick={() => setOrderInputMode("units")} className={orderInputMode === "units" ? "rounded bg-[#c4ff0d] px-1.5 py-1 font-semibold text-[#0a170d]" : "rounded px-1.5 py-1 text-white/40 hover:text-white"}>Units</button><button type="button" onClick={() => setOrderInputMode("usd")} className={orderInputMode === "usd" ? "rounded bg-[#c4ff0d] px-1.5 py-1 font-semibold text-[#0a170d]" : "rounded px-1.5 py-1 text-white/40 hover:text-white"}>USD</button></div></div><input type="number" min="0" step="any" value={orderAmount} onChange={(event) => setOrderAmount(event.target.value)} className="mt-1.5 h-8 w-full rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-white outline-none focus:border-[#c4ff0d]/45" /><p className="mt-1 text-[9px] text-white/30">{orderInputMode === "usd" ? (selectedPrice === null ? "Waiting for a price…" : "≈ " + requestedQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 }) + " " + selectedSymbol) : (orderValue === null ? "Waiting for a price…" : "≈ " + formatUsd(orderValue))}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[210px]"><Button type="button" onClick={() => setOrderType("BUY")} className={orderType === "BUY" ? "h-9 rounded-lg bg-[#c4ff0d] text-xs font-semibold text-[#0a170d] hover:bg-[#d8ff62]" : "h-9 rounded-lg border border-[#c4ff0d]/20 bg-transparent text-xs text-[#c4ff0d] hover:bg-[#c4ff0d]/10"}>BUY {selectedSymbol}</Button><Button type="button" onClick={() => setOrderType("SELL")} variant="outline" className={orderType === "SELL" ? "h-9 rounded-lg border-[#ff7f7f]/50 bg-[#ff7f7f]/10 text-xs text-[#ff9b9b]" : "h-9 rounded-lg border-white/10 bg-transparent text-xs text-white/50 hover:bg-white/[0.08]"}>SELL {selectedSymbol}</Button></div>
        </div>
        <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-[10px] text-white/30">Orders use the latest stored market price and update cash, holdings, and history together.</p><Button type="button" onClick={submitOrder} disabled={isSubmittingOrder || selectedAsset.price === null} className="h-9 rounded-lg bg-white/[0.08] px-4 text-xs text-white/75 hover:bg-[#c4ff0d]/15 hover:text-[#c4ff0d] disabled:opacity-50">{isSubmittingOrder ? "Executing…" : "Execute " + orderType + " order"} <ChevronRight className="size-3.5" /></Button></div>
        {orderMessage ? <p className="mt-3 rounded-lg border border-[#c4ff0d]/20 bg-[#c4ff0d]/[0.06] px-3 py-2 text-xs text-[#c4ff0d]">{orderMessage}</p> : null}
        {orderError ? <p role="alert" className="mt-3 rounded-lg border border-[#ff7f7f]/30 bg-[#ff7f7f]/10 px-3 py-2 text-xs text-[#ffb4b4]">{orderError}</p> : null}
      </section>
    </div>
  );
}

type DashboardShellProps = {
  durationMinutes: number;
  endsAt: string | null;
  isHost: boolean;
  portfolio: PortfolioSummary;
  roomId: string;
  roomName: string;
  user: {
    name: string;
    email: string;
  };
};

export function DashboardShell({ durationMinutes, endsAt, isHost, portfolio, roomId, roomName, user }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isPublic, setIsPublic] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() => endsAt ? Math.max(0, Math.floor((Date.parse(endsAt) - Date.now()) / 1000)) : durationMinutes * 60);
  const [endChallengeError, setEndChallengeError] = useState("");
  const [isEndingChallenge, setIsEndingChallenge] = useState(false);
  const portfolioHistory = [
    { time: "Start", value: portfolio.startingCapital },
    { time: "Now", value: portfolio.totalValue },
  ];
  const pnlClass = portfolio.totalPnl >= 0 ? "text-[#c4ff0d]" : "text-[#ff7f7f]";

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 60));
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  async function endChallenge() {
    setIsEndingChallenge(true);
    setEndChallengeError("");
    try {
      const response = await fetch("/api/rooms/end", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ roomId }) });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "We could not end this challenge.");
      window.location.assign("/rooms");
    } catch (error) {
      setEndChallengeError(error instanceof Error ? error.message : "We could not end this challenge.");
      setIsEndingChallenge(false);
    }
  }

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
            <span className="truncate text-xs font-medium text-white/75">{roomName}</span>
            <span className="text-[10px] text-white/30">{formatRoomDuration(durationMinutes).toUpperCase()} CHALLENGE</span>
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
            <Link href="/account" className="flex items-center gap-2.5 border-l border-white/10 pl-3 transition-opacity hover:opacity-80" aria-label="Open account settings">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#c4ff0d] text-xs font-bold text-[#0a170d]">{getInitials(user.name)}</div>
              <div className="hidden xl:block">
                <p className="max-w-[140px] truncate text-xs font-medium text-white/80">{user.name}</p>
                <p className="max-w-[140px] truncate text-[9px] text-white/30">{user.email}</p>
              </div>
            </Link>
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
        {activeTab === "Trade" ? <TradePanel portfolio={portfolio} roomId={roomId} /> : <>
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              <span className="size-1.5 rounded-full bg-[#c4ff0d]" />
              {activeTab} / current room
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">Good evening, {user.name.split(" ")[0]}.</h1>
            <p className="mt-2 text-sm text-white/40">Your portfolio is valued from your cash balance and the latest recorded market prices.</p>
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
                  <span className="text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">{formatUsd(portfolio.totalValue)}</span>
                  <span className={"mb-1 flex items-center gap-1 text-xs font-semibold " + pnlClass}>{portfolio.totalPnl >= 0 ? "+" : ""}{formatUsd(portfolio.totalPnl)}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/30">{portfolio.latestPriceAt ? "Latest market valuation recorded " + new Date(portfolio.latestPriceAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Starting capital held in USD"}</p>
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
                <AreaChart data={portfolioHistory} margin={{ top: 8, right: 4, left: -25, bottom: 0 }}>
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
                    <Pie data={portfolio.allocations} dataKey="value" nameKey="name" innerRadius={51} outerRadius={72} paddingAngle={3} stroke="none">
                      {portfolio.allocations.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold tracking-[-0.06em]">{formatUsd(portfolio.totalValue)}</span>
                  <span className="text-[9px] uppercase tracking-[0.12em] text-white/30">total</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {portfolio.allocations.map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-white/55"><span className="size-2 rounded-full" style={{ backgroundColor: asset.color }} /> {asset.name}</span>
                    <span className="font-medium text-white/75">{asset.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 border-t border-white/[0.08] pt-4">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30"><span>Asset</span><span className="text-right">Amount</span><span className="text-right">Current value</span></div>
              {portfolio.holdings.length === 0 ? <p className="px-2 py-4 text-xs text-white/35">No crypto positions yet. Your allocation is entirely USD cash.</p> : <div className="mt-2 space-y-1">{portfolio.holdings.map((holding) => <div key={holding.symbol} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-black/10 px-2 py-2.5"><span className="flex items-center gap-2 text-xs font-semibold text-white/75"><span className="size-2 rounded-full" style={{ backgroundColor: holding.color }} />{holding.symbol}</span><span className="text-right text-[11px] text-white/55">{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span><span className="text-right"><span className="block text-[11px] font-medium text-white/80">{formatUsd(holding.marketValue)}</span><span className="block text-[9px] text-white/30">{holding.currentPrice === null ? "Price pending" : formatUsd(holding.currentPrice)}</span></span></div>)}</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5 sm:p-6 lg:col-span-1 lg:row-span-2">
            <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2 text-xs text-white/45"><CircleDollarSign className="size-4 text-[#c4ff0d]/75" /> My Portfolio</div>
                <p className="mt-3 text-2xl font-semibold tracking-[-0.06em]">{formatUsd(portfolio.totalValue)}</p>
                <p className={"mt-1 text-xs " + pnlClass}>{portfolio.totalPnl >= 0 ? "+" : ""}{formatUsd(portfolio.totalPnl)} <span className="text-white/30">all time</span></p>
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
              {portfolio.holdings.length === 0 ? <div className="rounded-xl border border-dashed border-white/[0.1] px-3 py-5 text-center"><p className="text-xs text-white/55">No positions yet</p><p className="mt-1 text-[10px] text-white/25">Your {formatUsd(portfolio.cashBalance)} remains in USD cash.</p></div> : portfolio.holdings.map((holding) => (
                <div key={holding.symbol} className="rounded-xl border border-white/[0.07] bg-black/10 p-3 transition-colors hover:border-[#c4ff0d]/20 hover:bg-[#c4ff0d]/[0.025]">
                  <div className="flex items-center gap-2.5">
                    <AssetMark symbol={holding.symbol} color={holding.color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-white/80">{holding.symbol}</p>
                        <span className={holding.unrealizedPnl === null || holding.unrealizedPnl >= 0 ? "text-[10px] text-[#c4ff0d]" : "text-[10px] text-[#ff7f7f]"}>{holding.unrealizedPnl === null ? "Price pending" : (holding.unrealizedPnl >= 0 ? "+" : "") + formatUsd(holding.unrealizedPnl)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-white/30">{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {holding.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-white/80">{formatUsd(holding.marketValue)}</p>
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
            {isHost ? <div className="mt-5 border-t border-white/[0.08] pt-4"><Button type="button" onClick={endChallenge} disabled={isEndingChallenge} variant="outline" className="h-9 w-full rounded-lg border-[#ff8c8c]/30 bg-transparent text-xs font-semibold text-[#ffaaaa] hover:bg-[#ff8c8c]/10 hover:text-[#ffc1c1] disabled:opacity-60">{isEndingChallenge ? "Ending challenge…" : "End challenge"}</Button><p className="mt-2 text-center text-[10px] text-white/30">Ends trading for everyone immediately.</p>{endChallengeError ? <p role="alert" className="mt-2 text-center text-[10px] text-[#ffb4b4]">{endChallengeError}</p> : null}</div> : null}
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
        </>}
      </section>
    </main>
  );
}
