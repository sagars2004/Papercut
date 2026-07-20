import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDisplayName } from "@/lib/auth";
import { calculatePortfolioSummary, type HoldingInput, type LatestPrice } from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams: Promise<{ room?: string | string[] }>;
};

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

  const { data: holdingData } = await supabase.from("holdings").select("asset_symbol, quantity, average_cost_basis").eq("player_id", membership.id).gt("quantity", 0);
  const holdings = (holdingData ?? []) as HoldingInput[];
  const symbols = holdings.map((holding) => holding.asset_symbol);
  const { data: priceData } = symbols.length > 0
    ? await supabase.from("price_snapshots").select("asset_symbol, price_usd, captured_at").in("asset_symbol", symbols).order("captured_at", { ascending: false })
    : { data: [] as LatestPrice[] };
  const portfolio = calculatePortfolioSummary({
    cashBalance: membership.cash_balance,
    holdings,
    latestPrices: (priceData ?? []) as LatestPrice[],
    startingCapital: room.starting_capital,
  });

  return <DashboardShell durationMinutes={room.duration_minutes} endsAt={room.ends_at} isHost={room.created_by === user.id && membership.role === "host"} portfolio={portfolio} roomId={roomId} roomName={room.name} user={{ name: getDisplayName(user.user_metadata, user.email), email: user.email ?? "" }} />;
}
