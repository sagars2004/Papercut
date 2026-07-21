import { NextResponse } from "next/server";

import { generateCoachFinalRecap } from "@/lib/coach";
import type { CoachPattern } from "@/lib/coach-types";
import { calculatePortfolioSummary, type HoldingInput, type LatestPrice } from "@/lib/portfolio";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RecapRequest = { roomId?: string };
type Room = { name: string; starting_capital: number | string; status: "active" | "complete" | "lobby" };
type Trade = { action: "buy" | "sell"; asset_symbol: string; executed_at: string; price_at_execution: number | string; quantity: number | string };
type StoredDebrief = { created_at: string; debrief_date: string; lesson_text: string; metrics_json: unknown; pattern_flags_json: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringFrom(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parsePatterns(value: unknown): CoachPattern[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((pattern) => {
      if (!isRecord(pattern)) return null;
      return {
        detail: stringFrom(pattern.detail, "Keep documenting the reason behind each decision so you can review the process, not just the result."),
        title: stringFrom(pattern.title, "Trading pattern"),
        tone: pattern.tone === "positive" || pattern.tone === "watch" || pattern.tone === "neutral" ? pattern.tone : "neutral",
      } satisfies CoachPattern;
    })
    .filter((pattern): pattern is CoachPattern => pattern !== null)
    .slice(0, 3);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate your final coach recap." }, { status: 401 });

  let body: RecapRequest;
  try {
    body = await request.json() as RecapRequest;
  } catch {
    return NextResponse.json({ error: "Invalid final recap request." }, { status: 400 });
  }
  if (!body.roomId) return NextResponse.json({ error: "A room is required." }, { status: 400 });

  const [{ data: membership }, { data: roomData }] = await Promise.all([
    supabase.from("players").select("id, cash_balance").eq("room_id", body.roomId).eq("user_id", user.id).maybeSingle(),
    supabase.from("rooms").select("name, starting_capital, status").eq("id", body.roomId).maybeSingle(),
  ]);
  if (!membership) return NextResponse.json({ error: "You are not a player in this room." }, { status: 403 });

  const room = roomData as Room | null;
  if (!room || room.status !== "complete") {
    return NextResponse.json({ error: "Your final coach recap is available once the challenge is complete." }, { status: 400 });
  }

  const [{ data: holdingData }, { data: priceData }, { data: tradeData }, { data: debriefData }] = await Promise.all([
    supabase.from("holdings").select("asset_symbol, quantity, average_cost_basis").eq("player_id", membership.id).gt("quantity", 0),
    supabase.from("price_snapshots").select("asset_symbol, price_usd, captured_at").order("captured_at", { ascending: false }).limit(500),
    supabase.from("trades").select("asset_symbol, action, quantity, price_at_execution, executed_at").eq("player_id", membership.id).order("executed_at", { ascending: false }).limit(1000),
    supabase.from("debriefs").select("created_at, debrief_date, lesson_text, metrics_json, pattern_flags_json").eq("player_id", membership.id).eq("room_id", body.roomId).order("debrief_date", { ascending: false }),
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
  const debriefs = ((debriefData ?? []) as StoredDebrief[]).map((debrief) => {
    const storedMetrics = isRecord(debrief.metrics_json) ? debrief.metrics_json : {};
    return {
      date: debrief.debrief_date,
      headline: stringFrom(storedMetrics.headline, "Your daily trading debrief"),
      lesson: stringFrom(debrief.lesson_text, "Keep reviewing the process behind each decision."),
      patterns: parsePatterns(debrief.pattern_flags_json),
      summary: stringFrom(storedMetrics.summary, "This reflection is based on your simulated orders and portfolio."),
    };
  });
  const recap = await generateCoachFinalRecap({ debriefs, portfolio, roomName: room.name, trades });

  const { error } = await supabase.rpc("save_final_coach_recap", {
    p_recap_json: {
      generatedBy: recap.source,
      growthArea: recap.growthArea,
      headline: recap.headline,
      model: recap.model ?? null,
      nextChallenge: recap.nextChallenge,
      strength: recap.strength,
      summary: recap.summary,
      tradingStyle: recap.tradingStyle,
      version: 1,
    },
    p_room_id: body.roomId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ recap });
}
