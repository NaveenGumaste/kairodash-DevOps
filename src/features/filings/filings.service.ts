import "server-only";

import { ID, Query } from "appwrite";
import { collections, appwriteStatus } from "@/lib/env";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { sha256 } from "@/lib/hash";
import { fetchBseAnnouncements } from "@/features/filings/bse.client";
import {
  fetchNseAnnouncements,
  fetchNseResults,
} from "@/features/filings/nse.client";
import { listTrackedStocks, getTrackedStockBySymbol } from "@/features/watchlist/watchlist.repository";
import type { TrackedStock } from "@/features/watchlist/watchlist.schemas";
import { rSIsMember, rSAdd } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

export type FilingItem = {
  stockSymbol: string;
  source: "NSE" | "BSE";
  itemType: "filing" | "result";
  title: string;
  identifier: string;
  publishedAt?: string;
  url?: string;
};

/**
 * Check if a filing was already posted.
 * Priority: Redis SET (O(1), sub-ms) → Appwrite (fallback on Redis miss).
 * Using a daily Redis key avoids unbounded SET growth — TTL = 9 days.
 */
async function hasPosted(dedupeKey: string): Promise<boolean> {
  // 1. Redis fast path
  const redisKey = CK.filingsPosted();
  const inRedis = await rSIsMember(redisKey, dedupeKey);
  if (inRedis) return true;

  if (!appwriteStatus().configured) return false;

  // 2. Appwrite fallback (cold Redis or Redis miss)
  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collections.postedItems,
    [Query.equal("dedupeKey", dedupeKey), Query.limit(1)],
  );

  const exists = response.documents.length > 0;
  if (exists) {
    // Back-fill Redis so future checks for this dedupeKey are free
    rSAdd(redisKey, TTL.filingsPosted, dedupeKey).catch(() => {});
  }

  return exists;
}

async function recordPosted(item: FilingItem) {
  if (!appwriteStatus().configured) return;

  const dedupeKey = `${item.stockSymbol}:${item.itemType}:${sha256(item.identifier)}`;
  if (await hasPosted(dedupeKey)) return;

  await getDatabases().createDocument(getDatabaseId(), collections.postedItems, ID.unique(), {
    stockSymbol: item.stockSymbol,
    source: item.source,
    itemType: item.itemType,
    identifier: item.identifier,
    dedupeKey,
    title: item.title,
    publishedAt: item.publishedAt,
    createdAt: new Date().toISOString(),
  });

  // Cache the new dedupeKey so subsequent runs skip the Appwrite check
  rSAdd(CK.filingsPosted(), TTL.filingsPosted, dedupeKey).catch(() => {});
}

export async function fetchStockFilings(stock: TrackedStock) {
  const items: FilingItem[] = [];

  // Fetch NSE announcements + results in parallel (was serial within each stock)
  const [announcements, results] = await Promise.all([
    stock.exchanges.includes("NSE")
      ? fetchNseAnnouncements(stock.symbol)
      : Promise.resolve([]),
    stock.exchanges.includes("NSE")
      ? fetchNseResults(stock.symbol)
      : Promise.resolve([]),
  ]);

  for (const announcement of announcements.slice(0, 3)) {
    const identifier =
      announcement.attchmntFile ??
      `${stock.symbol}-${announcement.exchDt}-${announcement.subject}`;
    items.push({
      stockSymbol: stock.symbol,
      source: "NSE",
      itemType: "filing",
      title: announcement.subject ?? announcement.desc ?? "NSE announcement",
      identifier,
      publishedAt: announcement.exchDt ?? announcement.bcastDt,
      url: announcement.attchmntFile,
    });
  }

  for (const result of results.slice(0, 2)) {
    const identifier =
      result.pdfLink ?? `${stock.symbol}-result-${result.fromDt}-${result.toDt}`;
    items.push({
      stockSymbol: stock.symbol,
      source: "NSE",
      itemType: "result",
      title: result.resultType ?? "Financial result",
      identifier,
      publishedAt: result.toDt,
      url: result.pdfLink ?? result.xbrlAttachment,
    });
  }

  if (stock.exchanges.includes("BSE") && stock.bseCode) {
    const bseAnnouncements = await fetchBseAnnouncements(stock.bseCode);
    for (const announcement of bseAnnouncements.slice(0, 3)) {
      const identifier =
        announcement.pdfUrl ??
        `${stock.symbol}-bse-${announcement.NEWS_DT}-${announcement.HEADLINE}`;
      items.push({
        stockSymbol: stock.symbol,
        source: "BSE",
        itemType: "filing",
        title: announcement.HEADLINE,
        identifier,
        publishedAt: announcement.NEWS_DT,
        url: announcement.pdfUrl,
      });
    }
  }

  return items;
}

const STOCK_CONCURRENCY = 5; // Gentle on NSE — 5 stocks at a time

export async function runFilingsJob() {
  const stocks = await listTrackedStocks({ activeOnly: true, limit: 200 });

  const posted: FilingItem[] = [];
  const failures: { symbol: string; error: string }[] = [];

  // Process stocks in parallel batches of 5 (was 100% serial)
  for (let i = 0; i < stocks.length; i += STOCK_CONCURRENCY) {
    const batch = stocks.slice(i, i + STOCK_CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (stock) => {
        const filings = await fetchStockFilings(stock);
        // Record each filing in parallel within the stock
        await Promise.allSettled(filings.map((f) => recordPosted(f)));
        return { stock, filings };
      }),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        posted.push(...result.value.filings);
      } else {
        // Match failure to the correct stock by index
        const stockIndex = batchResults.indexOf(result);
        const stock = batch[stockIndex];
        failures.push({
          symbol: stock?.symbol ?? "unknown",
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        });
      }
    }
  }

  return { posted, failures };
}

export async function fetchFilingsForSymbol(symbol: string) {
  const stock = await getTrackedStockBySymbol(symbol);

  if (!stock) {
    throw new Error("Tracked stock not found.");
  }

  return fetchStockFilings(stock);
}
