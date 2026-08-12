import "server-only";

import { fetchNewsApiMarketEvents } from "@/features/indianMarket/providers/newsapi.provider";
import { fetchRssMarketEvents } from "@/features/indianMarket/providers/rss.provider";
import { fetchSmartApiMarketEvents } from "@/features/indianMarket/providers/smartapi.provider";
import { isPublishedInWindow, type NewsWindow } from "@/lib/news-window";

export async function fetchIndianMarketProviderEvents(window?: NewsWindow) {
  const providers = [
    fetchSmartApiMarketEvents,
    () => fetchNewsApiMarketEvents(window),
    fetchRssMarketEvents,
  ];

  const results = await Promise.allSettled(providers.map((provider) => provider()));

  return results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter((event) => !window || isPublishedInWindow(event.publishedAt, window))
    .sort(
      (a, b) =>
        a.sourcePriority - b.sourcePriority ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}
