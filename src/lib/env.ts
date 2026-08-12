import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optionalString = () =>
	z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = () =>
	z.preprocess(emptyToUndefined, z.string().url().optional());
const stringWithDefault = (fallback: string) =>
	z.preprocess(emptyToUndefined, z.string().min(1).default(fallback));

const envSchema = z.object({
	// ── Appwrite ─────────────────────────────────────────────────────────────
	NEXT_PUBLIC_APPWRITE_ENDPOINT: optionalUrl(),
	NEXT_PUBLIC_APPWRITE_PROJECT_ID: optionalString(),
	APPWRITE_API_KEY: optionalString(),
	APPWRITE_DATABASE_ID: optionalString(),
	APPWRITE_STORAGE_BUCKET_ID: optionalString(),
	APPWRITE_COLLECTION_TRACKED_STOCKS: stringWithDefault("tracked_stocks"),
	APPWRITE_COLLECTION_POSTED_ITEMS: stringWithDefault("posted_items"),
	APPWRITE_COLLECTION_NEWS_ARTICLES: stringWithDefault("news_articles"),
	APPWRITE_COLLECTION_INDIAN_MARKET_RAW_EVENTS: stringWithDefault(
		"indian_market_raw_events",
	),
	APPWRITE_COLLECTION_INDIAN_MARKET_PROCESSED_EVENTS: stringWithDefault(
		"indian_market_processed_events",
	),
	APPWRITE_COLLECTION_INDIAN_MARKET_POSTED_ALERTS: stringWithDefault(
		"indian_market_posted_alerts",
	),
	APPWRITE_COLLECTION_QUEUE_JOBS: stringWithDefault("queue_jobs"),
	APPWRITE_COLLECTION_MARKET_BRIEFS: stringWithDefault("market_briefs"),
	APPWRITE_COLLECTION_BROKERAGE_CONFIGS: stringWithDefault("brokerage_configs"),
	APPWRITE_COLLECTION_BROKERAGE_AUDIT_LOGS: stringWithDefault("brokerage_audit_logs"),
	// ── Auth / cron ───────────────────────────────────────────────────────────
	CRON_SECRET: optionalString(),
	ADMIN_ACTION_TOKEN: optionalString(),
	/**
	 * Public: base URL of this app (e.g. https://kairo.vercel.app).
	 * Used to build the Kite Connect redirect_uri server-side.
	 */
	NEXT_PUBLIC_APP_URL: optionalString(),
	// ── News / data providers ─────────────────────────────────────────────────
	NEWSAPI_KEY: optionalString(),
	MARKETAUX_API_KEY: optionalString(),
	SMARTAPI_API_KEY: optionalString(),
	SMARTAPI_CLIENT_ID: optionalString(),
	SMARTAPI_PASSWORD: optionalString(),
	SMARTAPI_TOTP_SECRET: optionalString(),
	// ── Discord ───────────────────────────────────────────────────────────────
	DISCORD_TOKEN: optionalString(),
	DISCORD_STOCK_FILINGS_CHANNEL_ID: optionalString(),
	DISCORD_WAR_NEWS_CHANNEL_ID: optionalString(),
	DISCORD_MARKET_UPDATES_CHANNEL_ID: optionalString(),
	DISCORD_INDIAN_MARKET_NEWS_CHANNEL_ID: optionalString(),
	// ── Redis (Upstash) — optional, app degrades gracefully without it ────────
	UPSTASH_REDIS_REST_URL: optionalUrl(),
	UPSTASH_REDIS_REST_TOKEN: optionalString(),
	// ── Monitoring ────────────────────────────────────────────────────────────
	SENTRY_DSN: optionalUrl(),
	TIMEZONE: stringWithDefault("Asia/Kolkata"),
});

export const env = envSchema.parse(process.env);

export const collections = {
	trackedStocks: env.APPWRITE_COLLECTION_TRACKED_STOCKS,
	postedItems: env.APPWRITE_COLLECTION_POSTED_ITEMS,
	newsArticles: env.APPWRITE_COLLECTION_NEWS_ARTICLES,
	indianMarketRawEvents: env.APPWRITE_COLLECTION_INDIAN_MARKET_RAW_EVENTS,
	indianMarketProcessedEvents:
		env.APPWRITE_COLLECTION_INDIAN_MARKET_PROCESSED_EVENTS,
	indianMarketPostedAlerts: env.APPWRITE_COLLECTION_INDIAN_MARKET_POSTED_ALERTS,
	queueJobs: env.APPWRITE_COLLECTION_QUEUE_JOBS,
	marketBriefs: env.APPWRITE_COLLECTION_MARKET_BRIEFS,
	brokerageConfigs: env.APPWRITE_COLLECTION_BROKERAGE_CONFIGS,
	brokerageAuditLogs: env.APPWRITE_COLLECTION_BROKERAGE_AUDIT_LOGS,
} as const;

// Compute once at module load — env vars never change at runtime.
const _appwriteStatus = (() => {
	const missing = [
		["NEXT_PUBLIC_APPWRITE_ENDPOINT", env.NEXT_PUBLIC_APPWRITE_ENDPOINT],
		["NEXT_PUBLIC_APPWRITE_PROJECT_ID", env.NEXT_PUBLIC_APPWRITE_PROJECT_ID],
		["APPWRITE_API_KEY", env.APPWRITE_API_KEY],
		["APPWRITE_DATABASE_ID", env.APPWRITE_DATABASE_ID],
	]
		.filter(([, value]) => !value)
		.map(([key]) => key as string);
	return { configured: missing.length === 0, missing };
})();

export function appwriteStatus() {
	return _appwriteStatus;
}
