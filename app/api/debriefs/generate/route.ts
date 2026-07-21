import { NextResponse } from "next/server";

import { generateCoachDebrief } from "@/lib/coach";
import { calculatePortfolioSummary, type HoldingInput, type LatestPrice } from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DebriefRequest = { roomId?: string };
type Room = { name: string; starting_capital: number | string; status: "active" | "complete" | "lobby" };
type Trade = { action: "buy" | "sell"; asset_symbol: string; executed_at: string; price_at_execution: number | string; quantity: number | string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate a coach debrief." }, { status: 401 });

  let body: DebriefRequest;
  try {
    body = await request.json() as DebriefRequest;
  } catch {
    return NextResponse.json({ error: "Invalid debrief request." }, { status: 400 });
  }
  if (!body.roomId) return NextResponse.json({ error: "A room is required." }, { status: 400 });

  const { data: membership } = await supabase
    .from("players")
    .select("id, cash_balance")
    .eq("room_id", body.roomId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "You are not a player in this room." }, { status: 403 });

  const { data: roomData } = await supabase
    .from("rooms")
    .select("name, starting_capital, status")
    .eq("id", body.roomId)
    .maybeSingle();
  const room = roomData as Room | null;
  if (!room || (room.status !== "active" && room.status !== "complete")) {
    return NextResponse.json({ error: "A debrief is available after this room has started." }, { status: 400 });
  }

  const [{ data: holdingData }, { data: priceData }, { data: tradeData }] = await Promise.all([
    supabase.from("holdings").select("asset_symbol, quantity, average_cost_basis").eq("player_id", membership.id).gt("quantity", 0),
    supabase.from("price_snapshots").select("asset_symbol, price_usd, captured_at").order("captured_at", { ascending: false }).limit(500),
    supabase.from("trades").select("asset_symbol, action, quantity, price_at_execution, executed_at").eq("player_id", membership.id).order("executed_at", { ascending: false }).limit(1000),
  ]);

  const portfolio = calculatePortfolioSummary({
    cashBalance: membership.cash_balance,
    holdings: (holdingData ?? []) as HoldingInput[],
    latestPrices: (priceData ?? []) as LatestPrice[],
    startingCapital: room.starting_capital,
  });
  const trades = ((tradeData ?? []) as Trade[]).map((trade) => ({
    action: trade.action,
    assetSymbol: trade.asset_symbol,
    executedAt: trade.executed_at,
    price: Number(trade.price_at_execution),
    quantity: Number(trade.quantity),
  }));
  const debrief = await generateCoachDebrief({
    challengeStatus: room.status,
    portfolio,
    roomName: room.name,
    trades,
  });

  const { error } = await supabase.rpc("save_debrief", {
    p_lesson_text: debrief.lesson,
    p_metrics_json: {
      generatedBy: debrief.source,
      headline: debrief.headline,
      metrics: debrief.metrics,
      model: debrief.model ?? null,
      summary: debrief.summary,
      version: 1,
    },
    p_pattern_flags_json: debrief.patterns,
    p_room_id: body.roomId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ debrief });
}
