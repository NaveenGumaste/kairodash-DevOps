import "server-only";

import { ID, Query } from "appwrite";
import { collections, appwriteStatus } from "@/lib/env";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { defaultWatchlist } from "@/features/watchlist/default-watchlist";
import {
  trackedStockCreateSchema,
  trackedStockUpdateSchema,
  type TrackedStock,
  type TrackedStockInput,
} from "@/features/watchlist/watchlist.schemas";
import { rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

const collectionId = collections.trackedStocks;

function withTimestamps<T extends Record<string, unknown>>(data: T) {
  const now = new Date().toISOString();
  return { ...data, createdAt: now, updatedAt: now };
}

function mapStock(document: TrackedStock): TrackedStock {
  return {
    ...document,
    aliases: document.aliases ?? [],
    exchanges: document.exchanges ?? ["NSE"],
    isActive: document.isActive ?? true,
  };
}

export async function listTrackedStocks(options?: {
  activeOnly?: boolean;
  limit?: number;
}) {
  // Return seed data immediately if Appwrite isn't wired up
  if (!appwriteStatus().configured) {
    return defaultWatchlist.filter((stock) =>
      options?.activeOnly === false ? true : stock.isActive,
    );
  }

  // Only cache the default "active stocks" call (used by dashboard + stocks page)
  const isDefaultCall =
    options?.activeOnly !== false && (options?.limit === undefined || options.limit === 100);

  if (isDefaultCall) {
    const cached = await rGet<TrackedStock[]>(CK.trackedStocks);
    if (cached) return cached;
  }

  const queries = [
    Query.orderAsc("symbol"),
    Query.limit(options?.limit ?? 100),
  ];

  if (options?.activeOnly !== false) {
    queries.push(Query.equal("isActive", true));
  }

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collectionId,
    queries,
  );

  const stocks = response.documents.map((document) =>
    mapStock(document as unknown as TrackedStock),
  );

  if (isDefaultCall) {
    rSet(CK.trackedStocks, stocks, TTL.trackedStocks).catch(() => {});
  }

  return stocks;
}

export async function getTrackedStockBySymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  const stocks = await listTrackedStocks({ activeOnly: false, limit: 200 });

  return stocks.find((stock) => stock.symbol === normalized) ?? null;
}

export async function createTrackedStock(input: TrackedStockInput) {
  const data = trackedStockCreateSchema.parse(input);

  const response = await getDatabases().createDocument(
    getDatabaseId(),
    collectionId,
    ID.unique(),
    withTimestamps(data),
  );

  return mapStock(response as unknown as TrackedStock);
}

export async function updateTrackedStock(id: string, input: unknown) {
  const data = trackedStockUpdateSchema.parse(input);

  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    collectionId,
    id,
    { ...data, updatedAt: new Date().toISOString() },
  );

  return mapStock(response as unknown as TrackedStock);
}

export async function deactivateTrackedStock(id: string) {
  const response = await getDatabases().updateDocument(
    getDatabaseId(),
    collectionId,
    id,
    { isActive: false, updatedAt: new Date().toISOString() },
  );

  return mapStock(response as unknown as TrackedStock);
}
