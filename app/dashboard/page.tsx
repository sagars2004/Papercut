import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDisplayName } from "@/lib/auth";
import { buildCoachMetrics } from "@/lib/coach";
import type { CoachDebrief, CoachPattern } from "@/lib/coach-types";
import { MARKET_ASSETS } from "@/lib/market-assets";
import { calculatePortfolioSummary, type HoldingInput, type LatestPrice } from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ room?: string | string[] }>;
};

type RoomPlayer = { cash_balance: number | string; id: string; role: "host" | "member"; user_id: string };
type RoomHolding = HoldingInput & { player_id: string };
type RoomProfile = { display_name: string; id: string };
type RoomTrade = { action: "buy" | "sell"; asset_symbol: string; executed_at: string; player_id: string; price_at_execution: number | string; quantity: number | string };
type StoredDebrief = { created_at: string; lesson_text: string; metrics_json: unknown; pattern_flags_json: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseStoredDebrief(stored: StoredDebrief | null, fallback: CoachDebrief["metrics"]): CoachDebrief | null {
  if (!stored) return null;

  const storedMetrics = isRecord(stored.metrics_json) ? stored.metrics_json : {};
  const patterns = Array.isArray(stored.pattern_flags_json)
    ? stored.pattern_flags_json
      .map((pattern) => {
        if (!isRecord(pattern)) return null;
        const tone = pattern.tone === "positive" || pattern.tone === "watch" || pattern.tone === "neutral" ? pattern.tone : "neutral";
        return {
          detail: stringFrom(pattern.detail, "Use the next trade to practice a clear, repeatable process."),
          title: stringFrom(pattern.title, "Trading pattern"),
          tone,
        } satisfies CoachPattern;
      })
      .filter((pattern): pattern is CoachPattern => pattern !== null)
      .slice(0, 3)
    : [];

  return {
    createdAt: stored.created_at,
    headline: stringFrom(storedMetrics.headline, "Your latest trading debrief"),
    lesson: stringFrom(stored.lesson_text, "Keep recording the reason for each trade so you can review the process, not just the result."),
    model: typeof storedMetrics.model === "string" && storedMetrics.model.trim() ? storedMetrics.model.trim() : undefined,
    metrics: fallback,
    patterns,
    source: storedMetrics.generatedBy === "nvidia" ? "nvidia" : "fallback",
    summary: stringFrom(storedMetrics.summary, "This reflection is based on your simulated orders, holdings, and current portfolio value."),
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const query = await searchParams;
  const roomId = typeof query.room === "string" ? query.room : "";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/rooms");
  if (!roomId) redirect("/rooms");

  const { data: membership } = await supabase.from("players").select("id, cash_balance, role").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
  if (!membership) redirect("/rooms");

  const { data: room } = await supabase.from("rooms").select("name, status, invite_code, duration_minutes, ends_at, starting_capital, created_by").eq("id", roomId).maybeSingle();
  if (!room) redirect("/rooms");
  if (room.status === "lobby") redirect("/rooms/" + room.invite_code);
  if (room.status !== "active" && room.status !== "complete") redirect("/rooms/" + room.invite_code);

  const { data: roomPlayerData } = await supabase.from("players").select("id, user_id, cash_balance, role").eq("room_id", roomId);
  const roomPlayers = (roomPlayerData ?? []) as RoomPlayer[];
  const playerIds = roomPlayers.map((player) => player.id);
  const userIds = roomPlayers.map((player) => player.user_id);
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: holdingData }, { data: priceData }, { data: profileData }, { data: tradeData }, { data: debriefData }] = await Promise.all([
    supabase.from("holdings").select("player_id, asset_symbol, quantity, average_cost_basis").in("player_id", playerIds).gt("quantity", 0),
    supabase.from("price_snapshots").select("asset_symbol, price_usd, captured_at").order("captured_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.from("trades").select("player_id, asset_symbol, action, quantity, price_at_execution, executed_at").eq("player_id", membership.id).order("executed_at", { ascending: false }).limit(1000),
    supabase.from("debriefs").select("created_at, lesson_text, metrics_json, pattern_flags_json").eq("player_id", membership.id).eq("room_id", roomId).eq("debrief_date", today).maybeSingle(),
  ]);
  const holdings = (holdingData ?? []) as RoomHolding[];
  const prices = (priceData ?? []) as LatestPrice[];
  const portfolio = calculatePortfolioSummary({
    cashBalance: membership.cash_balance,
    holdings: holdings.filter((holding) => holding.player_id === membership.id),
    latestPrices: prices,
    startingCapital: room.starting_capital,
  });
  const profilesById = new Map(((profileData ?? []) as RoomProfile[]).map((profile) => [profile.id, profile.display_name]));
  const portfolioByPlayer = roomPlayers.map((player) => ({
    player,
    portfolio: calculatePortfolioSummary({
      cashBalance: player.cash_balance,
      holdings: holdings.filter((holding) => holding.player_id === player.id),
      latestPrices: prices,
      startingCapital: room.starting_capital,
    }),
  })).sort((left, right) => right.portfolio.totalValue - left.portfolio.totalValue);
  const leaderboard = portfolioByPlayer.map(({ player, portfolio: playerPortfolio }, index) => ({
    isCurrentUser: player.user_id === user.id,
    name: profilesById.get(player.user_id) ?? (player.user_id === user.id ? getDisplayName(user.user_metadata, user.email) : "Trader"),
    rank: index + 1,
    totalPnl: playerPortfolio.totalPnl,
    totalValue: playerPortfolio.totalValue,
    userId: player.user_id,
  }));
  const roomHoldingStats = MARKET_ASSETS.map((asset) => ({
    color: asset.color,
    name: asset.name,
    percent: roomPlayers.length === 0 ? 0 : (portfolioByPlayer.filter(({ portfolio: playerPortfolio }) => playerPortfolio.holdings.some((holding) => holding.symbol === asset.symbol)).length / roomPlayers.length) * 100,
    symbol: asset.symbol,
  })).filter((asset) => asset.percent > 0);
  const portfolioTrades = ((tradeData ?? []) as RoomTrade[]).map((trade) => ({
    action: trade.action,
    assetSymbol: trade.asset_symbol,
    executedAt: trade.executed_at,
    price: Number(trade.price_at_execution),
    quantity: Number(trade.quantity),
  }));
  const tradeHistory = portfolioTrades.slice(0, 50);
  const debrief = parseStoredDebrief((debriefData as StoredDebrief | null) ?? null, buildCoachMetrics({ portfolio, trades: portfolioTrades }));

  return <DashboardShell debrief={debrief} durationMinutes={room.duration_minutes} endsAt={room.ends_at} isComplete={room.status === "complete"} isHost={room.created_by === user.id && membership.role === "host"} leaderboard={leaderboard} portfolio={portfolio} portfolioTrades={portfolioTrades} roomHoldingStats={roomHoldingStats} roomId={roomId} roomName={room.name} tradeHistory={tradeHistory} user={{ name: getDisplayName(user.user_metadata, user.email), email: user.email ?? "" }} />;
}
