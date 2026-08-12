import "server-only";

import Parser from "rss-parser";
import { getTrackedStockBySymbol } from "@/features/watchlist/watchlist.repository";
import { stockSymbolSchema } from "@/features/watchlist/watchlist.schemas";

export type StockNewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
};

const parser = new Parser({ timeout: 15_000 });

export async function fetchStockNews(symbolInput: string) {
  const symbol = stockSymbolSchema.parse(symbolInput);
  const stock = await getTrackedStockBySymbol(symbol);

  if (!stock) {
    throw new Error("Tracked stock not found.");
  }

  const query = encodeURIComponent(`${stock.companyName} ${stock.symbol} stock`);
  const feed = await parser.parseURL(
    `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`,
  );

  return feed.items.slice(0, 20).map((item) => ({
    title: item.title ?? "Untitled stock news item",
    url: item.link ?? "",
    source: item.creator ?? item.source?.title ?? "Google News",
    publishedAt: item.isoDate ?? item.pubDate,
  }));
}
