# kairo Operations

Next.js 16 + Appwrite market intelligence dashboard for tracking a watchlist, portfolio, Indian market alerts, geopolitical alerts, filings, queue jobs, and Zerodha sync operations.

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-25.2.0-FD366E?logo=appwrite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-06B6D4?logo=tailwindcss&logoColor=white)
![Sentry](https://img.shields.io/badge/Sentry-362D59?logo=sentry&logoColor=white)

## Highlights

- Live dashboard at `/` with portfolio, watchlist, alerts, and queue summaries
- Portfolio view powered by Appwrite-backed holdings and positions
- Stocks pages for news, filings, and results
- Indian market and geopolitics alert feeds
- Morning market brief
- Admin screens for watchlist, jobs, and system operations
- Protected job and sync endpoints for cron-driven workflows
- Optional Zerodha (Kite Connect) integration, Discord publishing, and Sentry observability

## Stack

- Next.js 16.2.6
- React 19.2.6
- TypeScript 6.0.3
- Appwrite 25.2.0
- Tailwind CSS 4
- Zustand 5 + TanStack Query 5
- Zod 4
- Axios, axios-retry, and rss-parser
- `@sentry/nextjs`

## Quick start

1. `pnpm install`
2. Copy `.env.example` to `.env.local`
3. Fill in the required environment variables
4. `pnpm dev`
5. Open `http://localhost:3000`

## Environment variables

### Required

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_STORAGE_BUCKET_ID`
- `CRON_SECRET`
- `ADMIN_ACTION_TOKEN`

### Optional integrations

- Zerodha: `ZERODHA_API_KEY`, `ZERODHA_API_SECRET`, `ZERODHA_ACCESS_TOKEN`, `ZERODHA_ENCTOKEN`
- News providers: `NEWSAPI_KEY`, `MARKETAUX_API_KEY`, `SMARTAPI_API_KEY`, `SMARTAPI_CLIENT_ID`, `SMARTAPI_PASSWORD`, `SMARTAPI_TOTP_SECRET`
- Discord: `DISCORD_TOKEN`, `DISCORD_STOCK_NEWS_CHANNEL_ID`, `DISCORD_STOCK_FILINGS_CHANNEL_ID`, `DISCORD_WAR_NEWS_CHANNEL_ID`, `DISCORD_MARKET_UPDATES_CHANNEL_ID`, `DISCORD_INDIAN_MARKET_NEWS_CHANNEL_ID`
- Observability: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- Runtime: `TIMEZONE` defaults to `Asia/Kolkata`

## Appwrite collections

The default collection names in `.env.example` are:

- `tracked_stocks`
- `posted_items`
- `news_articles`
- `indian_market_raw_events`
- `indian_market_processed_events`
- `indian_market_posted_alerts`
- `queue_jobs`
- `market_briefs`
- `portfolio_holdings`
- `portfolio_positions`

The `APPWRITE_COLLECTION_*` environment variables already map to these names, so most setups can keep the defaults.

## Project structure

```
├── public/          # Static assets
├── src/
│   ├── app/         # Next.js App Router pages and API routes
│   ├── components/  # UI components (shadcn/ui + custom)
│   ├── lib/         # Utility functions, cache keys, and shared logic
│   ├── stores/      # Zustand stores
│   └── ...
├── sentry.*.config.ts   # Sentry client/server configuration
├── instrumentation-client.ts
├── vercel.json          # Vercel build config + scheduled cron
└── .env.example         # Environment variable reference
```

## Navigation

- `/` — Dashboard
- `/portfolio` — Portfolio
- `/stocks` — Stocks
- `/stocks/[symbol]` — Stock details
- `/alerts/indian-market` — Indian market alerts
- `/alerts/geopolitics` — Geopolitical alerts
- `/briefs/morning` — Morning brief
- `/admin/watchlist` — Watchlist admin
- `/admin/jobs` — Job monitor
- `/admin/system` — System operations and Zerodha session exchange

## API routes

- `GET /api/health`
- `GET /api/portfolio`
- `POST /api/portfolio/zerodha/session`
- `GET|POST /api/watchlist`
- `PATCH|DELETE /api/watchlist/[id]`
- `GET /api/alerts/indian-market`
- `GET /api/alerts/geopolitics`
- `GET /api/stocks/[symbol]/news`
- `GET /api/stocks/[symbol]/filings`
- `GET /api/stocks/[symbol]/results`
- `POST /api/jobs/filings/run`
- `POST /api/jobs/geopolitics/run`
- `POST /api/jobs/indian-market/enqueue`
- `POST /api/jobs/indian-market/process`
- `POST /api/jobs/market-brief/run`
- `POST /api/jobs/portfolio/sync`

Job routes and the Zerodha session exchange are protected with `Authorization: Bearer $CRON_SECRET`. Admin mutations use `ADMIN_ACTION_TOKEN` where required.

## Scheduled jobs

Vercel Hobby only accepts cron expressions that run once per day, so this repo registers one daily morning cron in `vercel.json`.

The cron runs at `03:30 UTC`, which is `09:00 IST`, and calls:

- `GET /api/jobs/morning-news/run`

That route fetches and stores only morning-window news:

- Previous market close, `15:30 IST`
- Through current morning, `09:00 IST`

Keep `CRON_SECRET` configured in Vercel. Vercel sends it to the cron route as `Authorization: Bearer $CRON_SECRET`.

## Scripts

- `pnpm dev` — start the development server
- `pnpm build` — build for production
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint
- `pnpm typecheck` — run TypeScript type checking

## Verification

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Notes

- The dashboard falls back to seed watchlist data when Appwrite is not configured.
- Mutations and persistence require real Appwrite credentials and the collections above.
- For design decisions, see `DESIGN.md`.
- The stale `/admin/zerodha-session` README reference has been removed; the UI lives at `/admin/system`, and token exchange happens at `/api/portfolio/zerodha/session`.