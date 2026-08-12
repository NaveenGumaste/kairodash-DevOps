import "server-only";

import type { AxiosInstance } from "axios";
import { createHttpClient } from "@/lib/http";
import { rGet, rSet, rDel } from "@/lib/redis";
import { CK, TTL } from "@/lib/cache-keys";

export type NSEAnnouncement = {
  symbol: string;
  desc?: string;
  attchmntFile?: string;
  bcastDt?: string;
  exchDt?: string;
  subject?: string;
};

export type NSEFinancialResult = {
  symbol: string;
  fromDt?: string;
  toDt?: string;
  xbrlAttachment?: string;
  pdfLink?: string;
  resultType?: string;
};

export type NSEAnnualReport = {
  symbol: string;
  fromYr?: string;
  toYr?: string;
  fileName?: string;
};

const warmupPaths = ["/market-data/live-equity-market", "/get-quotes/equity", "/"];

// In-memory fallback for same-worker warm requests (0 Redis commands)
let _memoryCookie = "";
let _memoryExpiry = 0;
let _memoryBackoff = 0;

function headers(cookie?: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    Accept: "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.nseindia.com/",
    Cookie: cookie ?? "",
  };
}

async function warmup(client: AxiosInstance) {
  // 1. Fast path: in-memory (same serverless worker, 0 Redis commands)
  if (_memoryCookie && _memoryExpiry > Date.now()) {
    return _memoryCookie;
  }

  // 2. In-memory backoff (same worker already hit 403)
  if (_memoryBackoff > Date.now()) {
    throw new Error("NSE is in 403 backoff.");
  }

  // 3. Redis-persisted cookie (different worker or cold start)
  const redisCookie = await rGet<string>(CK.nseCookie);
  if (redisCookie) {
    _memoryCookie = redisCookie;
    _memoryExpiry = Date.now() + TTL.nseCookie * 1000;
    return redisCookie;
  }

  // 4. Redis-persisted backoff (another worker hit 403 recently)
  const redisBackoff = await rGet<string>(CK.nseBackoff);
  if (redisBackoff && Number(redisBackoff) > Date.now()) {
    throw new Error("NSE is in 403 backoff.");
  }

  // 5. Run warmup sequence
  for (const path of warmupPaths) {
    try {
      const response = await client.get(`https://www.nseindia.com${path}`, {
        headers: headers(),
      });
      const cookies = response.headers["set-cookie"];

      if (cookies?.length) {
        const cookie = cookies.map((c: string) => c.split(";")[0]).join("; ");
        // Save to in-memory and Redis (non-blocking)
        _memoryCookie = cookie;
        _memoryExpiry = Date.now() + TTL.nseCookie * 1000;
        rSet(CK.nseCookie, cookie, TTL.nseCookie).catch(() => {});
        return cookie;
      }
    } catch {
      // Try the next warmup path.
    }
  }

  throw new Error("Could not warm NSE session cookies.");
}

async function getNse<T>(path: string, params: Record<string, string>) {
  const client = createHttpClient(15_000);
  const cookie = await warmup(client);

  try {
    const response = await client.get<T>(`https://www.nseindia.com/api/${path}`, {
      params,
      headers: headers(cookie),
    });

    return response.data;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 403
    ) {
      // Bust in-memory and Redis cookie; set backoff everywhere
      _memoryCookie = "";
      _memoryExpiry = 0;
      _memoryBackoff = Date.now() + 15 * 60_000;
      rDel(CK.nseCookie).catch(() => {});
      rSet(CK.nseBackoff, String(Date.now() + 15 * 60_000), 15 * 60).catch(() => {});
    }

    throw error;
  }
}

export async function fetchNseAnnouncements(symbol: string) {
  const response = await getNse<{ data?: NSEAnnouncement[] }>(
    "corporate-announcements",
    { symbol },
  );

  return response.data ?? [];
}

export async function fetchNseResults(symbol: string) {
  const response = await getNse<{ data?: NSEFinancialResult[] }>(
    "corporates-financial-results",
    { index: "equities", symbol },
  );

  return response.data ?? [];
}

export async function fetchNseAnnualReports(symbol: string) {
  const response = await getNse<{ data?: NSEAnnualReport[] }>("annual-reports", {
    symbol,
  });

  return response.data ?? [];
}
