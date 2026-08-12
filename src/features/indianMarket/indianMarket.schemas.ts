import { z } from "zod";

export const indianMarketProviderSchema = z.enum(["smartapi", "newsapi", "rss"]);

export const indianMarketEventTypeSchema = z.enum([
  "earnings",
  "regulatory",
  "bulk_block_deal",
  "promoter_activity",
  "sector_market_movement",
  "corporate_action",
  "merger_acquisition",
  "institutional_flow",
  "macro",
  "ipo",
  "index_update",
  "stock_movement",
  "gainers_losers",
  "other",
]);

export const priorityLevelSchema = z.enum(["high", "medium", "low"]);

export type IndianMarketProvider = z.infer<typeof indianMarketProviderSchema>;
export type IndianMarketEventType = z.infer<typeof indianMarketEventTypeSchema>;
export type PriorityLevel = z.infer<typeof priorityLevelSchema>;

export type RawMarketEvent = {
  provider: IndianMarketProvider;
  source: string;
  sourcePriority: number;
  title: string;
  url: string;
  publishedAt: string;
  raw?: unknown;
};

export type ProcessedMarketEvent = {
  $id?: string;
  rawEventId?: string;
  provider: IndianMarketProvider;
  source: string;
  sourcePriority: number;
  title: string;
  normalizedTitle: string;
  url: string;
  urlHash: string;
  eventType: IndianMarketEventType;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  symbols: string[];
  impactSummary: string;
  postedToDiscord: boolean;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
};
