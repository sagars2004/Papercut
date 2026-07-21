export type PortfolioHistoryPoint = {
  time: number;
  value: number;
};

export type PortfolioHistoryTrade = {
  action: "buy" | "sell";
  assetSymbol: string;
  executedAt: string;
  price: number;
  quantity: number;
};

export type PortfolioAssetPriceHistory = {
  prices: Array<{ time: number; value: number }>;
  symbol: string;
};

function finiteNumber(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function priceAtOrBefore(prices: Array<{ time: number; value: number }>, time: number, fallback: number) {
  let price = fallback;
  for (const point of prices) {
    if (point.time > time) break;
    price = point.value;
  }
  return price;
}

export function buildTransactionAwarePortfolioHistory({
  currentPrices,
  endTime,
  priceHistories,
  startTime,
  startingCapital,
  trades,
}: {
  currentPrices: Record<string, number>;
  endTime: number;
  priceHistories: PortfolioAssetPriceHistory[];
  startTime: number;
  startingCapital: number;
  trades: PortfolioHistoryTrade[];
}): PortfolioHistoryPoint[] {
  const start = Math.min(startTime, endTime);
  const end = Math.max(startTime, endTime);
  const orderedTrades = trades
    .map((trade) => ({ ...trade, time: Date.parse(trade.executedAt) }))
    .filter((trade) => Number.isFinite(trade.time) && Number.isFinite(trade.price) && trade.price > 0 && Number.isFinite(trade.quantity) && trade.quantity > 0)
    .sort((left, right) => left.time - right.time);
  const pricesBySymbol = new Map<string, Array<{ time: number; value: number }>>();
  const quoteTimes = new Set<number>();

  for (const history of priceHistories) {
    const prices = history.prices
      .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0)
      .sort((left, right) => left.time - right.time);
    pricesBySymbol.set(history.symbol, prices);
    for (const point of prices) {
      if (point.time >= start && point.time <= end) quoteTimes.add(point.time);
    }
  }

  const tradeTimes = new Set(
    orderedTrades
      .filter((trade) => trade.time >= start && trade.time <= end)
      .map((trade) => trade.time),
  );
  const sortedQuoteTimes = Array.from(quoteTimes).sort((left, right) => left - right);
  const quoteStride = Math.max(1, Math.ceil(sortedQuoteTimes.length / 180));
  const sampledQuoteTimes = sortedQuoteTimes.filter((_, index) => index % quoteStride === 0 || index === sortedQuoteTimes.length - 1);
  const timeline = Array.from(new Set([start, end, ...sampledQuoteTimes, ...tradeTimes])).sort((left, right) => left - right);
  const quantities = new Map<string, number>();
  const executionPrices = new Map<string, number>();
  let cash = startingCapital;
  let tradeIndex = 0;

  return timeline.map((time) => {
    const pricesAtThisMoment = new Map<string, number>();
    while (tradeIndex < orderedTrades.length && orderedTrades[tradeIndex].time <= time) {
      const trade = orderedTrades[tradeIndex];
      const tradeValue = trade.quantity * trade.price;
      const currentQuantity = quantities.get(trade.assetSymbol) ?? 0;

      if (trade.action === "buy") {
        cash -= tradeValue;
        quantities.set(trade.assetSymbol, currentQuantity + trade.quantity);
      } else {
        cash += tradeValue;
        quantities.set(trade.assetSymbol, Math.max(0, currentQuantity - trade.quantity));
      }

      executionPrices.set(trade.assetSymbol, trade.price);
      if (trade.time === time) pricesAtThisMoment.set(trade.assetSymbol, trade.price);
      tradeIndex += 1;
    }

    let value = cash;
    for (const [symbol, quantity] of quantities) {
      if (quantity <= 0) continue;
      const executionPrice = executionPrices.get(symbol) ?? 0;
      const price = pricesAtThisMoment.get(symbol)
        ?? (time === end ? finiteNumber(currentPrices[symbol]) : undefined)
        ?? priceAtOrBefore(pricesBySymbol.get(symbol) ?? [], time, executionPrice);
      value += quantity * price;
    }

    return { time, value };
  });
}
