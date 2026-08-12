import "server-only";

import { runGeopoliticsJob } from "@/features/geopolitics/geopolitics.service";
import { runIndianMarketIngestion } from "@/features/indianMarket/indianMarket.service";
import { runMarketBriefJob } from "@/features/marketBrief/marketBrief.service";
import { getMorningNewsWindow } from "@/lib/news-window";

async function capture<T>(operation: () => Promise<T>) {
  try {
    return { ok: true as const, result: await operation() };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unexpected error",
    };
  }
}

export async function runMorningNewsJob(now = new Date()) {
  const window = getMorningNewsWindow(now);

  const [indianMarket, geopolitics, marketBrief] = await Promise.all([
    capture(() => runIndianMarketIngestion(window)),
    capture(() => runGeopoliticsJob(window)),
    capture(() => runMarketBriefJob(window)),
  ]);

  return {
    window: {
      startsAt: window.startsAt.toISOString(),
      endsAt: window.endsAt.toISOString(),
      timezone: window.timezone,
    },
    indianMarket,
    geopolitics,
    marketBrief,
  };
}
