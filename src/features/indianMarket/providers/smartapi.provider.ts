import "server-only";

import { env } from "@/lib/env";
import type { RawMarketEvent } from "@/features/indianMarket/indianMarket.schemas";

export async function fetchSmartApiMarketEvents(): Promise<RawMarketEvent[]> {
  const configured =
    env.SMARTAPI_API_KEY &&
    env.SMARTAPI_CLIENT_ID &&
    env.SMARTAPI_PASSWORD &&
    env.SMARTAPI_TOTP_SECRET;

  if (!configured) {
    return [];
  }

  // SmartAPI authentication and market context are intentionally server-only.
  // This placeholder keeps the provider contract ready without exposing secrets.
  return [
    {
      provider: "smartapi",
      source: "Angel One SmartAPI",
      sourcePriority: 0,
      title: "SmartAPI credentials configured; live market context provider is ready",
      url: "https://www.nseindia.com/market-data/live-equity-market",
      publishedAt: new Date().toISOString(),
      raw: { configured: true },
    },
  ];
}
