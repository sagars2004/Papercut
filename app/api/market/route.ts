import { NextResponse } from "next/server";

import { MARKET_ASSETS } from "@/lib/market-assets";

type CoinMarketCapQuote = {
  quote?: {
    USD?: {
      price?: number;
      percent_change_24h?: number;
    };
  };
};

type CoinGeckoPrice = {
  usd?: number;
  usd_24h_change?: number;
};

export const revalidate = 60;

export async function GET() {
  const coinGeckoKey = process.env.COINGECKO_API_KEY;
  if (coinGeckoKey) {
    const url = new URL("https://api.coingecko.com/api/v3/simple/price");
    url.searchParams.set("ids", MARKET_ASSETS.map((asset) => asset.id).join(","));
    url.searchParams.set("vs_currencies", "usd");
    url.searchParams.set("include_24hr_change", "true");

    try {
      const response = await fetch(url, {
        headers: { accept: "application/json", "x-cg-demo-api-key": coinGeckoKey },
        next: { revalidate },
      });

      if (response.ok) {
        const prices = (await response.json()) as Record<string, CoinGeckoPrice>;
        const assets = MARKET_ASSETS.map((asset) => ({
          ...asset,
          price: prices[asset.id]?.usd ?? null,
          change24h: prices[asset.id]?.usd_24h_change ?? null,
        }));
        return NextResponse.json({ assets, asOf: new Date().toISOString(), provider: "coingecko" });
      }
    } catch {
      // Fall through to CoinMarketCap so a provider hiccup does not blank the trade screen.
    }
  }

  const apiKey = process.env.COINMARKETCAP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "CoinMarketCap API key is not configured." }, { status: 500 });
  }

  const symbols = MARKET_ASSETS.map((asset) => asset.symbol).join(",");
  const url = new URL("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest");
  url.searchParams.set("symbol", symbols);
  url.searchParams.set("convert", "USD");

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json", "X-CMC_PRO_API_KEY": apiKey },
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Market data provider unavailable." }, { status: 502 });
    }

    const body = (await response.json()) as { data?: Record<string, CoinMarketCapQuote[]> };
    const quotes = body.data ?? {};
    const assets = MARKET_ASSETS.map((asset) => {
      const quote = quotes[asset.symbol]?.[0]?.quote?.USD;

      return {
        ...asset,
        price: quote?.price ?? null,
        change24h: quote?.percent_change_24h ?? null,
      };
    });

    return NextResponse.json({ assets, asOf: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Unable to reach market data provider." }, { status: 502 });
  }
}
