import { NextResponse } from "next/server";

import { MARKET_ASSETS } from "@/lib/market-assets";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CoinMarketCapHistory = {
  data?: Record<string, Array<{
    quotes?: Array<{
      timestamp: string;
      quote?: { USD?: { price?: number } };
    }>;
  }>>;
};

type CoinGeckoOhlc = [number, number, number, number, number];

export const dynamic = "force-dynamic";
const marketRevalidate = 300;

export async function GET(request: Request, context: RouteContext) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view market data." }, { status: 401 });

  const { id } = await context.params;
  const asset = MARKET_ASSETS.find((candidate) => candidate.symbol === id.toUpperCase());
  const range = new URL(request.url).searchParams.get("range") ?? "24h";
  const rangeMs = range === "1h"
    ? 60 * 60 * 1000
    : range === "6h"
      ? 6 * 60 * 60 * 1000
      : range === "1w"
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

  if (!asset) {
    return NextResponse.json({ error: "Asset is not supported." }, { status: 404 });
  }

  const coinGeckoKey = process.env.COINGECKO_API_KEY;
  if (coinGeckoKey) {
    const url = new URL("https://api.coingecko.com/api/v3/coins/" + asset.id + "/ohlc");
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("days", range === "1w" ? "7" : "1");

    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "x-cg-demo-api-key": coinGeckoKey },
        next: { revalidate: marketRevalidate },
      });

      if (response.ok) {
        const candles = (await response.json()) as CoinGeckoOhlc[];
        const cutoff = Date.now() - rangeMs;
        const filteredCandles = candles.filter(([timestamp]) => timestamp >= cutoff);
        const prices = filteredCandles.map(([timestamp, , , , close]) => [timestamp, close] as [number, number]);
        if (prices.length > 0) {
          return NextResponse.json({ prices, candles: filteredCandles, symbol: asset.symbol, range, provider: "coingecko" });
        }
      }
    } catch {
      // Fall through to CoinMarketCap if CoinGecko is unavailable or plan-limited.
    }
  }

  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Price history provider is not configured." }, { status: 500 });
  }

  const url = new URL("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical");
  const window = range === "1h"
    ? { count: "12", interval: "5m" }
    : range === "6h"
      ? { count: "36", interval: "10m" }
      : range === "1w"
        ? { count: "7", interval: "1d" }
        : { count: "24", interval: "1h" };
  url.searchParams.set("symbol", asset.symbol);
  url.searchParams.set("convert", "USD");
  url.searchParams.set("count", window.count);
  url.searchParams.set("interval", window.interval);

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", "X-CMC_PRO_API_KEY": apiKey },
      next: { revalidate: marketRevalidate },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Price history unavailable." }, { status: 502 });
    }

    const body = (await response.json()) as CoinMarketCapHistory;
    const quotes = body.data?.[asset.symbol]?.[0]?.quotes ?? [];
    const candles = quotes.flatMap((quote, index) => {
      const price = quote.quote?.USD?.price;
      if (price === undefined) return [];
      const previous = quotes[index - 1]?.quote?.USD?.price ?? price;
      return [[Date.parse(quote.timestamp), previous, Math.max(previous, price), Math.min(previous, price), price] as CoinGeckoOhlc];
    });
    const prices = candles.map(([timestamp, , , , close]) => [timestamp, close] as [number, number]);
    return NextResponse.json({ prices, candles, symbol: asset.symbol, range, provider: "coinmarketcap" });
  } catch {
    return NextResponse.json({ error: "Unable to reach market data provider." }, { status: 502 });
  }
}
