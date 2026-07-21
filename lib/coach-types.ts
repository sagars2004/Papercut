export type CoachPatternTone = "positive" | "watch" | "neutral";

export type CoachPattern = {
  detail: string;
  title: string;
  tone: CoachPatternTone;
};

export type CoachMetrics = {
  assetsTraded: number;
  buyCount: number;
  cashBalance: number;
  holdingsCount: number;
  largestHoldingPercent: number | null;
  largestHoldingSymbol: string | null;
  sellCount: number;
  totalPnl: number;
  totalValue: number;
  tradeCount: number;
  turnoverUsd: number;
};

export type CoachDebrief = {
  createdAt?: string;
  headline: string;
  lesson: string;
  model?: string;
  metrics: CoachMetrics;
  patterns: CoachPattern[];
  source: "fallback" | "nvidia";
  summary: string;
};
