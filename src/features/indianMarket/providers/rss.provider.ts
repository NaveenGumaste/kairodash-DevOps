import "server-only";

import Parser from "rss-parser";
import type { RawMarketEvent } from "@/features/indianMarket/indianMarket.schemas";
import { rMGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

const feeds = [
  {
    source: "Reuters India Business",
    url: "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
    priority: 1,
  },
  {
    source: "CNBC TV18 Markets",
    url: "https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml",
    priority: 2,
  },
  {
    source: "Economic Times Markets",
    url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    priority: 3,
  },
  {
    source: "Moneycontrol Markets",
    url: "https://www.moneycontrol.com/rss/MCtopnews.xml",
    priority: 4,
  },
  {
    source: "LiveMint Markets",
    url: "https://www.livemint.com/rss/markets",
    priority: 5,
  },
];

const parser = new Parser({
  timeout: 15_000,
});

export async function fetchRssMarketEvents(): Promise<RawMarketEvent[]> {
  const feedKeys = feeds.map((f) => CK.rss(f.source));

  // Single MGET for all 5 feeds — counts as 1 Redis command
  const cached = await rMGet<RawMarketEvent[]>(feedKeys);

  const results = await Promise.allSettled(
    feeds.map(async (feed, i) => {
      // Cache hit — skip HTTP entirely
      const hit = cached[i];
      if (hit !== null) return hit;

      const parsed = await parser.parseURL(feed.url);
      const events: RawMarketEvent[] = parsed.items.map((item) => ({
        provider: "rss" as const,
        source: feed.source,
        sourcePriority: feed.priority,
        title: item.title ?? "Untitled market update",
        url: item.link ?? feed.url,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        raw: item,
      }));

      // Cache this feed's result non-blocking
      rSet(feedKeys[i], events, TTL.rssFeed).catch(() => {});
      return events;
    }),
  );

  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort(
      (a, b) =>
        a.sourcePriority - b.sourcePriority ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
