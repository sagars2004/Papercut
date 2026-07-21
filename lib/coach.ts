import "server-only";

import type { CoachDebrief, CoachMetrics, CoachPattern, CoachPatternTone } from "@/lib/coach-types";
import type { PortfolioSummary } from "@/lib/portfolio";
import type { PortfolioHistoryTrade } from "@/lib/portfolio-history";

type CoachInput = {
  challengeStatus: "active" | "complete";
  portfolio: PortfolioSummary;
  roomName: string;
  trades: PortfolioHistoryTrade[];
};

type JsonRecord = Record<string, unknown>;

const COACH_INSTRUCTIONS = `You are Papercut's supportive coach for a paper crypto-trading game. Analyze only the supplied simulated portfolio and order data. Do not provide personalized financial advice, price predictions, or buy/sell recommendations. Be specific about observed behavior, educational, concise, and non-judgmental. Return only valid JSON with this exact shape: {"headline": string, "summary": string, "lesson": string, "patterns": [{"title": string, "detail": string, "tone": "positive" | "watch" | "neutral"}]}. Include at most three patterns. Do not include markdown or a reasoning trace.`;

const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const DEFAULT_NVIDIA_FALLBACK_MODEL = "meta/llama-3.1-8b-instruct";

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function cleanText(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : fallback;
}

function formatUsd(value: number) {
  return "$" + value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function makePattern(title: string, detail: string, tone: CoachPatternTone): CoachPattern {
  return { title, detail, tone };
}

export function buildCoachMetrics({ portfolio, trades }: Pick<CoachInput, "portfolio" | "trades">): CoachMetrics {
  const assetsTraded = new Set(trades.map((trade) => trade.assetSymbol)).size;
  const buyCount = trades.filter((trade) => trade.action === "buy").length;
  const sellCount = trades.length - buyCount;
  const largestHolding = portfolio.holdings[0];

  return {
    assetsTraded,
    buyCount,
    cashBalance: portfolio.cashBalance,
    holdingsCount: portfolio.holdings.length,
    largestHoldingPercent: largestHolding ? largestHolding.percentOfPortfolio : null,
    largestHoldingSymbol: largestHolding?.symbol ?? null,
    sellCount,
    totalPnl: portfolio.totalPnl,
    totalValue: portfolio.totalValue,
    tradeCount: trades.length,
    turnoverUsd: trades.reduce((total, trade) => total + Math.abs(trade.price * trade.quantity), 0),
  };
}

export function buildFallbackCoachDebrief(input: CoachInput): CoachDebrief {
  const metrics = buildCoachMetrics(input);
  const tradesByAsset = new Map<string, number>();
  for (const trade of input.trades) {
    tradesByAsset.set(trade.assetSymbol, (tradesByAsset.get(trade.assetSymbol) ?? 0) + 1);
  }
  const mostTraded = [...tradesByAsset.entries()].sort((left, right) => right[1] - left[1])[0];
  const patterns: CoachPattern[] = [];

  if (metrics.tradeCount === 0) {
    return {
      headline: "Cash is still a position.",
      summary: `You have kept the full ${formatUsd(input.portfolio.startingCapital)} in USD so far. That gives you a clean baseline for a deliberate first trade.`,
      lesson: "Before entering, write down what would make you buy, what would prove the idea wrong, and how much of the portfolio the position may use. A planned non-trade is more useful than an impulsive one.",
      metrics,
      patterns: [makePattern("No orders yet", "Your portfolio has not taken market exposure, so the next useful step is defining an entry rule rather than chasing a move.", "neutral")],
      source: "fallback",
    };
  }

  const pnlDirection = metrics.totalPnl >= 0 ? "above" : "below";
  const headline = metrics.totalPnl >= 0
    ? "A green mark is information, not a verdict."
    : "A drawdown is a prompt to revisit the thesis.";
  const summary = `You placed ${metrics.tradeCount} ${metrics.tradeCount === 1 ? "order" : "orders"} across ${metrics.assetsTraded} ${metrics.assetsTraded === 1 ? "asset" : "assets"}. Your marked portfolio is ${formatUsd(Math.abs(metrics.totalPnl))} ${pnlDirection} the ${formatUsd(input.portfolio.startingCapital)} starting line.`;

  if (metrics.largestHoldingSymbol && (metrics.largestHoldingPercent ?? 0) >= 55) {
    patterns.push(makePattern(
      "Concentration is carrying the result",
      `${metrics.largestHoldingSymbol} represents ${metrics.largestHoldingPercent?.toFixed(0)}% of your current portfolio value. Size can be a conviction choice, but it also makes one price move dominate the lesson.`,
      "watch",
    ));
  }

  if (metrics.buyCount > 0 && metrics.sellCount === 0) {
    patterns.push(makePattern(
      "No exit has been recorded",
      "You have opened positions without closing one yet. Decide in advance what price, thesis change, or time limit would make you reduce risk.",
      "watch",
    ));
  } else if (metrics.sellCount > 0) {
    patterns.push(makePattern(
      "You have tested an exit",
      `${metrics.sellCount} ${metrics.sellCount === 1 ? "sale is" : "sales are"} now part of the record. Compare each exit with the rule you meant to follow, not just the outcome.`,
      "positive",
    ));
  }

  if (mostTraded && mostTraded[1] >= 3) {
    patterns.push(makePattern(
      "Repeated decisions in one asset",
      `${mostTraded[0]} appears in ${mostTraded[1]} orders. Re-entering or adding can be intentional, but every additional order should have a distinct reason and size limit.`,
      "neutral",
    ));
  } else if (metrics.assetsTraded > 1) {
    patterns.push(makePattern(
      "You are comparing multiple ideas",
      `Your activity spans ${metrics.assetsTraded} assets. Keep the comparison useful by tracking why each position exists instead of treating every move as the same trade.`,
      "positive",
    ));
  }

  if (patterns.length === 0) {
    patterns.push(makePattern(
      "One decision at a time",
      "Your record is still compact. Use it to capture the reason for the next trade before price movement rewrites the story in hindsight.",
      "neutral",
    ));
  }

  return {
    headline,
    summary,
    lesson: metrics.sellCount === 0
      ? "An entry is only half of a trade. Pair every position with an invalidation point and a maximum size so that conviction does not silently become hope."
      : "Review the rule behind every exit. A repeatable process is one you can explain before the next price move, whether the last trade made or lost money.",
    metrics,
    patterns: patterns.slice(0, 3),
    source: "fallback",
  };
}

function parseJsonObject(text: string): JsonRecord | null {
  const candidates = [text.trim()];
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) candidates.push(text.slice(firstBrace, lastBrace + 1));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const record = asRecord(parsed);
      if (record) return record;
    } catch {
      // A malformed model response falls back to the deterministic coach.
    }
  }
  return null;
}

function normalizeModelPatterns(value: unknown, fallback: CoachPattern[]) {
  if (!Array.isArray(value)) return fallback;
  const patterns = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const tone = record.tone === "positive" || record.tone === "watch" || record.tone === "neutral" ? record.tone : "neutral";
      const title = cleanText(record.title, "Trading pattern", 72);
      const detail = cleanText(record.detail, "Keep documenting the reason behind each decision so you can review the process, not just the result.", 260);
      return { title, detail, tone } satisfies CoachPattern;
    })
    .filter((pattern): pattern is CoachPattern => pattern !== null)
    .slice(0, 3);
  return patterns.length > 0 ? patterns : fallback;
}

function normalizeModelDebrief(value: JsonRecord, fallback: CoachDebrief, model: string): CoachDebrief {
  return {
    headline: cleanText(value.headline, fallback.headline, 130),
    lesson: cleanText(value.lesson, fallback.lesson, 440),
    model,
    metrics: fallback.metrics,
    patterns: normalizeModelPatterns(value.patterns, fallback.patterns),
    source: "nvidia",
    summary: cleanText(value.summary, fallback.summary, 420),
  };
}

function extractChatCompletionText(payload: unknown): string | null {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record.choices)) return null;

  for (const choice of record.choices) {
    const choiceRecord = asRecord(choice);
    const message = choiceRecord ? asRecord(choiceRecord.message) : null;
    const content = message?.content;
    if (typeof content === "string" && content.trim()) return content;
    if (Array.isArray(content)) {
      const text = content
        .map((part) => {
          const partRecord = asRecord(part);
          return typeof partRecord?.text === "string" ? partRecord.text : "";
        })
        .filter(Boolean)
        .join("\n");
      if (text.trim()) return text;
    }
  }

  return null;
}

function buildCoachPrompt(input: CoachInput) {
  return {
    challengeStatus: input.challengeStatus,
    roomName: input.roomName,
    portfolio: {
      cashBalance: input.portfolio.cashBalance,
      holdings: input.portfolio.holdings.map((holding) => ({
        averageCost: holding.averageCost,
        marketValue: holding.marketValue,
        percentOfPortfolio: holding.percentOfPortfolio,
        quantity: holding.quantity,
        symbol: holding.symbol,
        unrealizedPnl: holding.unrealizedPnl,
      })),
      startingCapital: input.portfolio.startingCapital,
      totalPnl: input.portfolio.totalPnl,
      totalValue: input.portfolio.totalValue,
    },
    trades: input.trades
      .slice(0, 200)
      .map((trade) => ({ action: trade.action, asset: trade.assetSymbol, executedAt: trade.executedAt, price: trade.price, quantity: trade.quantity })),
  };
}

function nvidiaChatCompletionsUrl() {
  const configuredBaseUrl = process.env.NVIDIA_BASE_URL?.trim() || process.env.BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1";
  const baseUrl = configuredBaseUrl.replace(/\/+$/, "");
  return baseUrl.endsWith("/chat/completions") ? baseUrl : baseUrl + "/chat/completions";
}

function normalizeNvidiaModel(model: string) {
  const normalized = model.trim();
  // Accept the common "nao" typo so a copied local env value does not silently
  // skip the intended Nemotron primary model.
  if (normalized === "nvidia/nemotron-3-nao-30b-a3b" || normalized === "nemotron-3-nao-30b-a3b") return DEFAULT_NVIDIA_MODEL;
  return normalized;
}

function configuredNvidiaModels() {
  const primary = normalizeNvidiaModel(process.env.NVIDIA_MODEL?.trim() || DEFAULT_NVIDIA_MODEL);
  const fallback = normalizeNvidiaModel(process.env.NVIDIA_FALLBACK_MODEL?.trim() || DEFAULT_NVIDIA_FALLBACK_MODEL);
  return [...new Set([primary, fallback].filter(Boolean))];
}

async function requestNvidiaDebrief({ apiKey, fallback, model, prompt }: { apiKey: string; fallback: CoachDebrief; model: string; prompt: ReturnType<typeof buildCoachPrompt> }) {
  try {
    const response = await fetch(nvidiaChatCompletionsUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        max_tokens: 700,
        messages: [
          { content: COACH_INSTRUCTIONS, role: "system" },
          { content: JSON.stringify(prompt), role: "user" },
        ],
        model,
        stream: false,
        temperature: 0.2,
        top_p: 0.7,
      }),
    });
    if (!response.ok) return null;

    const modelResponse = await response.json() as unknown;
    const text = extractChatCompletionText(modelResponse);
    const parsed = text ? parseJsonObject(text) : null;
    return parsed ? normalizeModelDebrief(parsed, fallback, model) : null;
  } catch {
    return null;
  }
}

export async function generateCoachDebrief(input: CoachInput): Promise<CoachDebrief> {
  const fallback = buildFallbackCoachDebrief(input);
  const prompt = buildCoachPrompt(input);
  const nvidiaApiKey = process.env.NVIDIA_API_KEY?.trim();
  if (nvidiaApiKey) {
    for (const model of configuredNvidiaModels()) {
      const nvidiaDebrief = await requestNvidiaDebrief({ apiKey: nvidiaApiKey, fallback, model, prompt });
      if (nvidiaDebrief) return nvidiaDebrief;
    }
  }

  return fallback;
}
