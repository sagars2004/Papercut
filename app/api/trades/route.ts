import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type TradeRequest = {
  action?: string;
  quantity?: number;
  roomId?: string;
  symbol?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to place a trade." }, { status: 401 });

  let body: TradeRequest;
  try {
    body = await request.json() as TradeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid trade request." }, { status: 400 });
  }

  const quantity = Number(body.quantity);
  const action = typeof body.action === "string" ? body.action.toUpperCase() : "";
  const symbol = typeof body.symbol === "string" ? body.symbol.toUpperCase() : "";
  if (!body.roomId || !["BUY", "SELL"].includes(action) || !symbol || !Number.isFinite(quantity) || quantity <= 0) {
    return NextResponse.json({ error: "Enter a valid buy or sell order." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("execute_trade", {
    p_action: action,
    p_asset_symbol: symbol,
    p_quantity: quantity,
    p_room_id: body.roomId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ trade: data });
}
