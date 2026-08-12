import "server-only";

import Parser from "rss-parser";
import { ID, Query } from "appwrite";
import { appwriteStatus, collections } from "@/lib/env";
import { getDatabaseId, getDatabases } from "@/lib/appwrite";
import { normalizeTitle, sha256 } from "@/lib/hash";
import { isPublishedInWindow, type NewsWindow } from "@/lib/news-window";
import { rGet, rSet, rMGet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

export type GeopoliticalAlert = {
  $id?: string;
  title: string;
  normalizedTitle: string;
  url: string;
  urlHash: string;
  source: string;
  category: "geopolitics";
  publishedAt: string;
  marketImpact: string;
  postedToDiscord: boolean;
  createdAt?: string;
};

const parser = new Parser({ timeout: 15_000 });
const feeds = [
  { source: "Reuters World", url: "https://www.reutersagency.com/feed/?best-topics=world&post_type=best", key: CK.rss("Reuters World") },
  { source: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", key: CK.rss("BBC World") },
];
const geopoliticalKeywords = new Set([
  "war",
  "conflict",
  "sanction",
  "oil",
  "attack",
  "missile",
  "trade",
  "red sea",
]);

function inferMarketImpact(title: string) {
  const normalized = normalizeTitle(title);

  if (normalized.includes("war") || normalized.includes("attack")) {
    return "Potential risk-off move across equities, energy, and safe-haven assets.";
  }

  if (normalized.includes("oil") || normalized.includes("red sea")) {
    return "Possible impact on crude prices, logistics, and inflation-sensitive sectors.";
  }

  return "Monitor for spillover into global risk sentiment and Indian market flows.";
}

export async function listGeopoliticalAlerts(limit = 50) {
  if (!appwriteStatus().configured) {
    return [] as GeopoliticalAlert[];
  }

  const cacheKey = CK.geoAlerts(limit);
  const cached = await rGet<GeopoliticalAlert[]>(cacheKey);
  if (cached) return cached;

  const response = await getDatabases().listDocuments(
    getDatabaseId(),
    collections.newsArticles,
    [
      Query.equal("category", "geopolitics"),
      Query.orderDesc("publishedAt"),
      Query.limit(limit),
    ],
  );

  const alerts = response.documents as unknown as GeopoliticalAlert[];
  rSet(cacheKey, alerts, TTL.geoAlerts).catch(() => {});
  return alerts;
}

export async function runGeopoliticsJob(window?: NewsWindow) {
  // Single MGET for both geo feeds — counts as 1 Redis command
  const feedKeys = feeds.map((f) => f.key);
  const cachedFeeds = await rMGet<{ title: string; url: string; source: string; publishedAt: string }[]>(feedKeys);

  const fetched = await Promise.allSettled(
    feeds.map(async (feed, i) => {
      const hit = cachedFeeds[i];
      if (hit !== null) return hit;

      const parsed = await parser.parseURL(feed.url);
      const items = parsed.items.map((item) => ({
        title: item.title ?? "Untitled geopolitical update",
        url: item.link ?? feed.url,
        source: feed.source,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      }));

      rSet(feedKeys[i], items, TTL.rssFeed).catch(() => {});
      return items;
    }),
  );

  const allItems = fetched
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((event) => !window || isPublishedInWindow(event.publishedAt, window));

  const relevantItems = allItems.filter((item) => {
    const normalized = normalizeTitle(item.title);
    return [...geopoliticalKeywords].some((kw) => normalized.includes(kw));
  });

  if (!appwriteStatus().configured) {
    return {
      created: relevantItems.map((item) => ({
        title: item.title,
        normalizedTitle: normalizeTitle(item.title),
        url: item.url,
        urlHash: sha256(item.url),
        source: item.source,
        category: "geopolitics" as const,
        publishedAt: item.publishedAt,
        marketImpact: inferMarketImpact(item.title),
        postedToDiscord: false,
        createdAt: new Date().toISOString(),
      })),
      window: window
        ? { startsAt: window.startsAt.toISOString(), endsAt: window.endsAt.toISOString(), timezone: window.timezone }
        : null,
    };
  }

  // Parallel writes (was fully serial)
  const writeResults = await Promise.allSettled(
    relevantItems.map(async (item) => {
      const alert: GeopoliticalAlert = {
        title: item.title,
        normalizedTitle: normalizeTitle(item.title),
        url: item.url,
        urlHash: sha256(item.url),
        source: item.source,
        category: "geopolitics",
        publishedAt: item.publishedAt,
        marketImpact: inferMarketImpact(item.title),
        postedToDiscord: false,
        createdAt: new Date().toISOString(),
      };

      const document = await getDatabases().createDocument(
        getDatabaseId(),
        collections.newsArticles,
        ID.unique(),
        alert,
      );
      return document as unknown as GeopoliticalAlert;
    }),
  );

  const created = writeResults
    .filter((r): r is PromiseFulfilledResult<GeopoliticalAlert> => r.status === "fulfilled")
    .map((r) => r.value);

  return {
    created,
    window: window
      ? { startsAt: window.startsAt.toISOString(), endsAt: window.endsAt.toISOString(), timezone: window.timezone }
      : null,
  };
}
