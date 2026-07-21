import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDisplayName } from "@/lib/auth";
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
  if (room.status !== "active") redirect("/rooms/" + room.invite_code);

  const { data: roomPlayerData } = await supabase.from("players").select("id, user_id, cash_balance, role").eq("room_id", roomId);
  const roomPlayers = (roomPlayerData ?? []) as RoomPlayer[];
  const playerIds = roomPlayers.map((player) => player.id);
  const userIds = roomPlayers.map((player) => player.user_id);
  const [{ data: holdingData }, { data: priceData }, { data: profileData }, { data: tradeData }] = await Promise.all([
    supabase.from("holdings").select("player_id, asset_symbol, quantity, average_cost_basis").in("player_id", playerIds).gt("quantity", 0),
    supabase.from("price_snapshots").select("asset_symbol, price_usd, captured_at").order("captured_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, display_name").in("id", userIds),
    supabase.from("trades").select("player_id, asset_symbol, action, quantity, price_at_execution, executed_at").in("player_id", playerIds).order("executed_at", { ascending: false }).limit(50),
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
  const tradeHistory = ((tradeData ?? []) as RoomTrade[]).map((trade) => {
    const owner = roomPlayers.find((player) => player.id === trade.player_id);
    return {
      action: trade.action,
      assetSymbol: trade.asset_symbol,
      executedAt: trade.executed_at,
      playerName: owner ? profilesById.get(owner.user_id) ?? (owner.user_id === user.id ? getDisplayName(user.user_metadata, user.email) : "Trader") : "Trader",
      price: Number(trade.price_at_execution),
      quantity: Number(trade.quantity),
    };
  });

  return <DashboardShell durationMinutes={room.duration_minutes} endsAt={room.ends_at} isHost={room.created_by === user.id && membership.role === "host"} leaderboard={leaderboard} portfolio={portfolio} roomHoldingStats={roomHoldingStats} roomId={roomId} roomName={room.name} tradeHistory={tradeHistory} user={{ name: getDisplayName(user.user_metadata, user.email), email: user.email ?? "" }} />;
}
