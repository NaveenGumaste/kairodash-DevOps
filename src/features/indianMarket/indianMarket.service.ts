import "server-only";

import { normalizeTitle, sha256 } from "@/lib/hash";
import {
  classifyIndianMarketEvent,
  extractSymbols,
  inferImpactSummary,
  isRelevantIndianMarketEvent,
} from "@/features/indianMarket/indianMarket.filter";
import {
  createProcessedIndianMarketEvent,
  createRawIndianMarketEvent,
} from "@/features/indianMarket/indianMarket.repository";
import { fetchIndianMarketProviderEvents } from "@/features/indianMarket/providers/registry";
import type { NewsWindow } from "@/lib/news-window";
import type { ProcessedMarketEvent } from "@/features/indianMarket/indianMarket.schemas";

const CONCURRENCY = 10;

export async function runIndianMarketIngestion(window?: NewsWindow) {
  const events = await fetchIndianMarketProviderEvents(window);
  const relevantEvents = events.filter(isRelevantIndianMarketEvent);

  // Process all relevant events in parallel batches (was fully serial)
  const results = await Promise.allSettled(
    chunk(relevantEvents, CONCURRENCY).flatMap((batch) =>
      batch.map(async (event) => {
        const raw = await createRawIndianMarketEvent(event);
        return createProcessedIndianMarketEvent(raw.$id, {
          provider: event.provider,
          source: event.source,
          sourcePriority: event.sourcePriority,
          title: event.title,
          normalizedTitle: normalizeTitle(event.title),
          url: event.url,
          urlHash: sha256(event.url),
          eventType: classifyIndianMarketEvent(event.title).eventType,
          priorityScore: classifyIndianMarketEvent(event.title).priorityScore,
          priorityLevel: classifyIndianMarketEvent(event.title).priorityLevel,
          symbols: extractSymbols(event.title),
          impactSummary: inferImpactSummary(event.title),
          postedToDiscord: false,
          publishedAt: event.publishedAt,
        }) as Promise<ProcessedMarketEvent>;
      }),
    ),
  );

  const processed = results
    .filter((r): r is PromiseFulfilledResult<ProcessedMarketEvent> => r.status === "fulfilled")
    .map((r) => r.value as ProcessedMarketEvent);

  return {
    processed,
    skippedCount: events.length - relevantEvents.length,
    window: window
      ? {
          startsAt: window.startsAt.toISOString(),
          endsAt: window.endsAt.toISOString(),
          timezone: window.timezone,
        }
      : null,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
