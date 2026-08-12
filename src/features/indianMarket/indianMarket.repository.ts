import "server-only";

import { ID, Query } from "appwrite";
import { appwriteStatus, collections } from "@/lib/env";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { normalizeTitle, sha256 } from "@/lib/hash";
import { rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";
import type {
  ProcessedMarketEvent,
  RawMarketEvent,
} from "@/features/indianMarket/indianMarket.schemas";

async function createOrReuseDocument<T extends Record<string, unknown>>(
  collectionId: string,
  query: string,
  data: T,
) {
  const databases = getDatabases();
  const existing = await databases.listDocuments(
    getDatabaseId(),
    collectionId,
    [query, Query.limit(1)],
  );

  if (existing.documents.length) {
    return existing.documents[0] as unknown as T & { $id: string };
  }

  try {
    return (await databases.createDocument(
      getDatabaseId(),
      collectionId,
      ID.unique(),
      data,
    )) as unknown as T & { $id: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.toLowerCase().includes("already exists")) {
      const retry = await databases.listDocuments(
        getDatabaseId(),
        collectionId,
        [query, Query.limit(1)],
      );

      if (retry.documents.length) {
        return retry.documents[0] as unknown as T & { $id: string };
      }
    }

    throw error;
  }
}

export async function listIndianMarketEvents(limit = 50) {
  if (!appwriteStatus().configured) {
    return [] as ProcessedMarketEvent[];
  }

  const cacheKey = CK.marketAlerts(limit);
  const cached = await rGet<ProcessedMarketEvent[]>(cacheKey);
  if (cached) return cached;

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collections.indianMarketProcessedEvents,
    [Query.orderDesc("publishedAt"), Query.limit(limit)],
  );

  const events = response.documents.map((doc) => ({
    ...doc,
  })) as unknown as ProcessedMarketEvent[];

  rSet(cacheKey, events, TTL.marketAlerts).catch(() => {});
  return events;
}

export async function createRawIndianMarketEvent(event: RawMarketEvent) {
  const urlHash = sha256(event.url);
  const now = new Date().toISOString();

  if (!appwriteStatus().configured) {
    return { $id: urlHash, urlHash };
  }

  return createOrReuseDocument(
    collections.indianMarketRawEvents,
    Query.equal("providerUrlHash", `${event.provider}:${urlHash}`),
    {
      provider: event.provider,
      source: event.source,
      sourcePriority: event.sourcePriority,
      title: event.title,
      url: event.url,
      urlHash,
      providerUrlHash: `${event.provider}:${urlHash}`,
      publishedAt: event.publishedAt,
      fetchedAt: now,
      rawJson: event.raw
        ? JSON.stringify(event.raw).slice(0, 19_500)
        : undefined,
      createdAt: now,
    },
  );
}

export async function createProcessedIndianMarketEvent(
  rawEventId: string | undefined,
  event: Omit<ProcessedMarketEvent, "$id" | "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();

  if (!appwriteStatus().configured) {
    return {
      ...event,
      rawEventId,
      $id: event.urlHash,
      createdAt: now,
      updatedAt: now,
    };
  }

  return createOrReuseDocument(
    collections.indianMarketProcessedEvents,
    Query.equal("urlHash", event.urlHash),
    {
      ...event,
      rawEventId,
      normalizedTitle: normalizeTitle(event.title),
      createdAt: now,
    },
  );
}
