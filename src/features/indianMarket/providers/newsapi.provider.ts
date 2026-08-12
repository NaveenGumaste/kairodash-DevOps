import "server-only";

import { createHttpClient } from "@/lib/http";
import { env } from "@/lib/env";
import type { NewsWindow } from "@/lib/news-window";
import type { RawMarketEvent } from "@/features/indianMarket/indianMarket.schemas";
import { rGet, rSet } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

type NewsApiResponse = {
  articles?: {
    title?: string;
    url?: string;
    source?: { name?: string };
    publishedAt?: string;
  }[];
};

export async function fetchNewsApiMarketEvents(
  window?: NewsWindow,
): Promise<RawMarketEvent[]> {
  if (!env.NEWSAPI_KEY) {
    return [];
  }

  // Cache ignores the window param for simplicity — NewsAPI is the rate-limit concern
  const cached = await rGet<RawMarketEvent[]>(CK.newsapi);
  if (cached) return cached;

  const client = createHttpClient(15_000);
  const response = await client.get<NewsApiResponse>(
    "https://newsapi.org/v2/everything",
    {
      params: {
        q: "(NIFTY OR Sensex OR NSE OR BSE OR SEBI OR RBI OR earnings OR \"block deal\" OR \"bulk deal\")",
        domains:
          "economictimes.indiatimes.com,moneycontrol.com,livemint.com,cnbctv18.com",
        pageSize: 50,
        sortBy: "publishedAt",
        from: window?.startsAt.toISOString(),
        to: window?.endsAt.toISOString(),
        apiKey: env.NEWSAPI_KEY,
      },
    },
  );

  const events = (response.data.articles ?? []).flatMap((article) => {
    if (!article.title || !article.url) {
      return [];
    }

    return [
      {
        provider: "newsapi" as const,
        source: article.source?.name ?? "NewsAPI",
        sourcePriority: 5,
        title: article.title,
        url: article.url,
        publishedAt: article.publishedAt ?? new Date().toISOString(),
        raw: article,
      },
    ];
  });

  rSet(CK.newsapi, events, TTL.newsapi).catch(() => {});
  return events;
}
