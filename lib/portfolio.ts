import { MARKET_ASSETS } from "@/lib/market-assets";

export type HoldingInput = {
  asset_symbol: string;
  average_cost_basis: number | string;
  quantity: number | string;
};

export type LatestPrice = {
  asset_symbol: string;
  captured_at: string;
  price_usd: number | string;
};

export type PortfolioHolding = {
  averageCost: number;
  color: string;
  currentPrice: number | null;
  marketValue: number;
  percentOfPortfolio: number;
  quantity: number;
  symbol: string;
  unrealizedPnl: number | null;
};

export type PortfolioSummary = {
  allocations: Array<{ color: string; name: string; value: number }>;
  cashBalance: number;
  holdings: PortfolioHolding[];
  latestPriceAt: string | null;
  startingCapital: number;
  totalPnl: number;
  totalValue: number;
};

function asNumber(value: number | string | null | undefined) {
  const number = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function calculatePortfolioSummary({ cashBalance, holdings, latestPrices, startingCapital }: { cashBalance: number | string; holdings: HoldingInput[]; latestPrices: LatestPrice[]; startingCapital: number | string }) : PortfolioSummary {
  const pricesBySymbol = new Map<string, LatestPrice>();
  for (const price of latestPrices) {
    if (!pricesBySymbol.has(price.asset_symbol)) pricesBySymbol.set(price.asset_symbol, price);
  }

  const valuedHoldings = holdings
    .filter((holding) => asNumber(holding.quantity) > 0)
    .map((holding) => {
      const asset = MARKET_ASSETS.find((candidate) => candidate.symbol === holding.asset_symbol);
      const quantity = asNumber(holding.quantity);
      const averageCost = asNumber(holding.average_cost_basis);
      const snapshot = pricesBySymbol.get(holding.asset_symbol);
      const currentPrice = snapshot ? asNumber(snapshot.price_usd) : null;
      const marketValue = currentPrice === null ? 0 : quantity * currentPrice;

      return {
        averageCost,
        color: asset?.color ?? "#9da68e",
        currentPrice,
        marketValue,
        percentOfPortfolio: 0,
        quantity,
        symbol: holding.asset_symbol,
        unrealizedPnl: currentPrice === null ? null : marketValue - quantity * averageCost,
      };
    })
    .sort((left, right) => right.marketValue - left.marketValue);

  const cash = asNumber(cashBalance);
  const starting = asNumber(startingCapital);
  const totalValue = cash + valuedHoldings.reduce((total, holding) => total + holding.marketValue, 0);
  const allocations = [
    ...valuedHoldings.filter((holding) => holding.marketValue > 0).map((holding) => ({ color: holding.color, name: holding.symbol, value: (holding.marketValue / Math.max(totalValue, 1)) * 100 })),
    { color: "#334336", name: "Cash", value: (cash / Math.max(totalValue, 1)) * 100 },
  ].filter((allocation) => allocation.value > 0.01);

  const latestPriceAt = latestPrices.reduce<string | null>((latest, price) => !latest || price.captured_at > latest ? price.captured_at : latest, null);

  return {
    allocations,
    cashBalance: cash,
    holdings: valuedHoldings.map((holding) => ({ ...holding, percentOfPortfolio: (holding.marketValue / Math.max(totalValue, 1)) * 100 })),
    latestPriceAt,
    startingCapital: starting,
    totalPnl: totalValue - starting,
    totalValue,
  };
}
