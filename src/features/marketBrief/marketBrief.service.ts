import "server-only";

import { ID, Query } from "appwrite";
import { createHttpClient } from "@/lib/http";
import { appwriteStatus, collections, env } from "@/lib/env";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { isPublishedInWindow, type NewsWindow } from "@/lib/news-window";
import { rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

export type MarketBriefSegment = {
  title: string;
  source: string;
  url: string;
  sentiment?: number;
  publishedAt?: string;
};

export type MarketBrief = {
  $id?: string;
  briefDate: string;
  segmentsJson: string;
  postedToDiscord: boolean;
  createdAt: string;
};

export async function listMarketBriefs(limit = 10) {
  if (!appwriteStatus().configured) {
    return [] as MarketBrief[];
  }

  const cacheKey = CK.marketBriefs(limit);
  const cached = await rGet<MarketBrief[]>(cacheKey);
  if (cached) return cached;

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collections.marketBriefs,
    [Query.orderDesc("briefDate"), Query.limit(limit)],
  );

  const briefs = response.documents as unknown as MarketBrief[];
  rSet(cacheKey, briefs, TTL.marketBriefs).catch(() => {});
  return briefs;
}

export async function runMarketBriefJob(window?: NewsWindow) {
  if (!env.MARKETAUX_API_KEY) {
    return { created: null, skipped: "MARKETAUX_API_KEY is not configured." };
  }

  // Cache the raw Marketaux API response — 1 hr TTL, very stable data
  const cachedSegments = await rGet<MarketBriefSegment[]>(CK.marketaux);

  let segments: MarketBriefSegment[];

  if (cachedSegments) {
    segments = cachedSegments;
  } else {
    const client = createHttpClient(15_000);
    const response = await client.get<{
      data?: {
        title?: string;
        source?: string;
        url?: string;
        sentiment_score?: number;
        published_at?: string;
      }[];
    }>("https://api.marketaux.com/v1/news/all", {
      params: {
        api_token: env.MARKETAUX_API_KEY,
        countries: "in,us",
        filter_entities: true,
        language: "en",
        limit: 20,
      },
    });

    segments = (response.data.data ?? []).map((item) => ({
      title: item.title ?? "Untitled market brief item",
      source: item.source ?? "Marketaux",
      url: item.url ?? "https://www.marketaux.com/",
      sentiment: item.sentiment_score,
      publishedAt: item.published_at,
    }));

    rSet(CK.marketaux, segments, TTL.marketaux).catch(() => {});
  }

  const filteredSegments = window
    ? segments.filter((s) => isPublishedInWindow(s.publishedAt, window))
    : segments;

  const briefDate = new Date().toISOString().slice(0, 10);
  const brief: MarketBrief = {
    briefDate,
    segmentsJson: JSON.stringify(filteredSegments),
    postedToDiscord: false,
    createdAt: new Date().toISOString(),
  };

  if (!appwriteStatus().configured) {
    return { created: brief, window: serializeWindow(window) };
  }

  try {
    const created = await getDatabases().createDocument(
      getDatabaseId(),
      collections.marketBriefs,
      ID.unique(),
      brief,
    );
    return { created: created as unknown as MarketBrief, window: serializeWindow(window) };
  } catch (err: unknown) {
    // Duplicate brief for today is acceptable — silently skip
    const message = err instanceof Error ? err.message : "";
    if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("unique")) {
      console.info(`[marketBrief] Brief for ${briefDate} already exists — skipping.`);
      return { created: null, skipped: `Brief for ${briefDate} already exists.` };
    }
    throw err;
  }
}

function serializeWindow(window: NewsWindow | undefined) {
  return window
    ? {
        startsAt: window.startsAt.toISOString(),
        endsAt: window.endsAt.toISOString(),
        timezone: window.timezone,
      }
    : null;
}
