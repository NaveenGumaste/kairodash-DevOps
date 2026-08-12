import { normalizeTitle } from "@/lib/hash";
import type {
  IndianMarketEventType,
  PriorityLevel,
  RawMarketEvent,
} from "@/features/indianMarket/indianMarket.schemas";

const noisePatterns = [
  "beginner",
  "calculator",
  "credit card",
  "insurance",
  "mutual fund guide",
  "personal loan",
  "sip calculator",
  "tax saving",
  "what is",
];

const relevantPatterns = [
  "nifty",
  "sensex",
  "nse",
  "bse",
  "sebi",
  "rbi",
  "earnings",
  "result",
  "block deal",
  "bulk deal",
  "promoter",
  "dividend",
  "merger",
  "acquisition",
  "ipo",
  "fii",
  "dii",
  "rupee",
  "bank nifty",
  "gainers",
  "losers",
];

const eventRules: { type: IndianMarketEventType; keywords: string[]; score: number }[] = [
  { type: "regulatory", keywords: ["sebi", "rbi", "penalty", "order"], score: 82 },
  { type: "earnings", keywords: ["earnings", "results", "profit", "revenue"], score: 78 },
  { type: "merger_acquisition", keywords: ["merger", "acquisition", "stake sale"], score: 76 },
  { type: "bulk_block_deal", keywords: ["bulk deal", "block deal"], score: 74 },
  { type: "promoter_activity", keywords: ["promoter", "pledge"], score: 70 },
  { type: "corporate_action", keywords: ["dividend", "bonus", "split", "buyback"], score: 68 },
  { type: "institutional_flow", keywords: ["fii", "dii", "institutional"], score: 64 },
  { type: "sector_market_movement", keywords: ["sector", "rally", "selloff"], score: 58 },
  { type: "index_update", keywords: ["nifty", "sensex", "bank nifty"], score: 56 },
  { type: "stock_movement", keywords: ["surges", "jumps", "falls", "slumps"], score: 55 },
  { type: "macro", keywords: ["inflation", "gdp", "rupee", "crude"], score: 52 },
  { type: "ipo", keywords: ["ipo", "listing"], score: 50 },
  { type: "gainers_losers", keywords: ["gainers", "losers"], score: 45 },
];

const knownSymbols = [
  "ANANTRAJ",
  "BEL",
  "BPCL",
  "HDFCBANK",
  "INFY",
  "ITC",
  "NTPC",
  "SUZLON",
  "WIPRO",
  "TCS",
  "RELIANCE",
  "SBIN",
  "ICICIBANK",
  "AXISBANK",
];

export function isRelevantIndianMarketEvent(event: RawMarketEvent) {
  const title = normalizeTitle(event.title);

  if (noisePatterns.some((pattern) => title.includes(pattern))) {
    return false;
  }

  return relevantPatterns.some((pattern) => title.includes(pattern));
}

export function classifyIndianMarketEvent(title: string) {
  const normalized = normalizeTitle(title);
  const match = eventRules.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  const eventType = match?.type ?? "other";
  const priorityScore = match?.score ?? 38;
  const priorityLevel: PriorityLevel =
    priorityScore >= 75 ? "high" : priorityScore >= 55 ? "medium" : "low";

  return { eventType, priorityScore, priorityLevel };
}

export function extractSymbols(title: string) {
  const upper = title.toUpperCase();
  return knownSymbols.filter((symbol) => upper.includes(symbol));
}

export function inferImpactSummary(title: string) {
  const normalized = normalizeTitle(title);

  if (normalized.includes("sebi") || normalized.includes("rbi")) {
    return "Regulatory development that may affect compliance, liquidity, or sector sentiment.";
  }

  if (normalized.includes("earnings") || normalized.includes("profit")) {
    return "Earnings-related update likely to influence stock-specific positioning.";
  }

  if (normalized.includes("nifty") || normalized.includes("sensex")) {
    return "Index-level move that may affect broad market risk appetite.";
  }

  if (normalized.includes("block deal") || normalized.includes("bulk deal")) {
    return "Large transaction flow that may affect short-term price discovery.";
  }

  return "Market-relevant event detected for review and follow-up.";
}
