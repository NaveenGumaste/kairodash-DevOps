/**
 * Central registry of every Redis key used in the app.
 * Rename a key here → old cached data auto-expires, no manual flush needed.
 *
 * TTLs are tuned for a single-user app with ~8 visits/day.
 * Budget: ~350 commands/day out of 10,000 free limit (3.5%).
 * Generous TTLs keep cache-hit rates near 100% between visits.
 */

// ── Cache keys ────────────────────────────────────────────────────────────────

export const CK = {
  // Repository reads (dashboard + inner pages)
  trackedStocks:      "cache:tracked-stocks:active",
  portfolioHoldings:  "cache:portfolio:holdings",
  portfolioPositions: "cache:portfolio:positions",
  marketAlerts:       (limit: number) => `cache:market-alerts:${limit}`,
  queueJobs:          (limit: number) => `cache:queue-jobs:${limit}`,
  geoAlerts:          (limit: number) => `cache:geo-alerts:${limit}`,
  marketBriefs:       (limit: number) => `cache:market-briefs:${limit}`,
  brokerConfigs:      "cache:broker-configs",

  // Auth
  zerodhaToken: "auth:zerodha:token",
  zerodhaEnctoken: "auth:zerodha:enctoken",

  // NSE scraping session (survives Vercel cold starts via Redis)
  nseCookie:  "nse:session-cookie",
  nseBackoff: "nse:backoff-until",

  // External API response caches
  rss:       (source: string) =>
    `rss:${source.toLowerCase().replace(/\s+/g, "-")}`,
  newsapi:   "newsapi:indian-market",
  marketaux: "marketaux:briefs",

  // Filings deduplication — date-scoped SET, covers weekends
  filingsPosted: () =>
    `filings:posted:${new Date().toISOString().slice(0, 10)}`,

  // All invalidatable keys (everything except auth + filings dedup)
  ALL_INVALIDATABLE: [
    "cache:tracked-stocks:active",
    "cache:portfolio:holdings",
    "cache:portfolio:positions",
    "cache:market-alerts:8",
    "cache:market-alerts:50",
    "cache:queue-jobs:15",
    "cache:queue-jobs:25",
    "cache:geo-alerts:50",
    "cache:market-briefs:10",
    "cache:broker-configs",
    // External API caches
    "rss:reuters-india-business",
    "rss:cnbc-tv18-markets",
    "rss:economic-times-markets",
    "rss:moneycontrol-markets",
    "rss:livemint-markets",
    "rss:reuters-world",
    "rss:bbc-world",
    "newsapi:indian-market",
    "marketaux:briefs",
  ] as const,
} as const;

// ── TTLs in seconds ───────────────────────────────────────────────────────────
// Single-user with 8 visits/day → use generous TTLs for near-100% cache-hit rates.

export const TTL = {
  trackedStocks:  20 * 60,        // 20 min  — watchlist almost never changes
  portfolioData:  10 * 60,        // 10 min  — holdings sync is always manual
  marketAlerts:   3 * 60,         // 3 min   — alerts are important, keep fresh
  queueJobs:      60,             // 60 sec  — job status changes frequently
  geoAlerts:      20 * 60,        // 20 min  — geopolitical alerts are slow-moving
  marketBriefs:   60 * 60,        // 60 min  — daily brief, very stable
  brokerConfigs:  60 * 60,        // 60 min  — DP charges rarely change
  zerodhaToken:   24 * 60 * 60,   // 24 hr   — Zerodha tokens expire daily
  nseCookie:      8 * 60,         // 8 min   — matches NSE session duration
  rssFeed:        15 * 60,        // 15 min  — RSS feeds don't update per-second
  newsapi:        30 * 60,        // 30 min  — protect daily API quota
  marketaux:      60 * 60,        // 60 min  — brief summary, stable
  filingsPosted:  9 * 24 * 60 * 60, // 9 days — covers weekends between job runs
} as const;
