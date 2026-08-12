import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Database,
  Layers,
  AlertCircle,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { DashboardRefreshButton } from "@/components/dashboard-refresh-button";
import { IndianMarketAlertsGrid } from "@/components/indian-market-alerts-grid";
import { StatusPill } from "@/components/status-pill";
import { appwriteStatus } from "@/lib/env";
import { listTrackedStocks } from "@/features/watchlist/watchlist.repository";
import { listIndianMarketEvents } from "@/features/indianMarket/indianMarket.repository";
import { listQueueJobs } from "@/features/queue/queue.repository";

export const revalidate = 120;


async function safe<T>(promise: Promise<T>, fallback: T) {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function DashboardPage() {
  const [stocks, marketAlerts, jobs] = await Promise.all([
    safe(listTrackedStocks({ activeOnly: true }), []),
    safe(listIndianMarketEvents(8), []),
    safe(listQueueJobs(15), []),
  ]);

  const status = appwriteStatus();
  const failedJobs = jobs.filter((job) => job.status === "failed").length;
  const highPriority = marketAlerts.filter(
    (alert) => alert.priorityLevel === "high",
  ).length;
  const metrics = [
    {
      label: "Active stocks",
      value: stocks.length,
      helper: "Watchlist coverage",
      icon: Layers,
      color: "text-indigo-500 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
      accentBorder: "border-l-4 border-l-indigo-500",
    },
    {
      label: "High priority",
      value: highPriority,
      helper: "Indian market alerts",
      icon: AlertCircle,
      color:
        highPriority > 0
          ? "text-amber-500"
          : "text-zinc-400 dark:text-zinc-500",
      bgColor: highPriority > 0 ? "bg-amber-500/10" : "bg-zinc-500/10",
      accentBorder:
        highPriority > 0
          ? "border-l-4 border-l-amber-500"
          : "border-l-4 border-l-zinc-300 dark:border-l-zinc-800",
    },
    {
      label: "Failed jobs",
      value: failedJobs,
      helper: "Recent queue failures",
      icon: XCircle,
      color:
        failedJobs > 0 ? "text-red-500" : "text-zinc-400 dark:text-zinc-500",
      bgColor: failedJobs > 0 ? "bg-red-500/10" : "bg-zinc-500/10",
      accentBorder:
        failedJobs > 0
          ? "border-l-4 border-l-red-500"
          : "border-l-4 border-l-zinc-300 dark:border-l-zinc-800",
    },
  ];

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* ── Compact header ───────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Market Operations Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Watchlist · Alerts · Queue — live from Appwrite and
            market providers.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusPill tone={status.configured ? "good" : "warn"}>
            <Database className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {status.configured
              ? "Appwrite connected"
              : "Appwrite not configured"}
          </StatusPill>
          <Suspense
            fallback={
              <button
                disabled
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary/60 px-4 text-sm font-semibold text-primary-foreground opacity-60 cursor-not-allowed"
              >
                <span className="h-4 w-4 rounded-full animate-pulse bg-primary-foreground/40" />
                Refresh all data
              </button>
            }
          >
            <DashboardRefreshButton />
          </Suspense>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────────── */}
      <div className="shrink-0 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${card.accentBorder}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div
                  className={`rounded-lg p-1.5 ${card.bgColor} ${card.color}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {card.helper}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Appwrite warning (only when not configured) ───────────────── */}
      {!status.configured && (
        <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-300">
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <p className="leading-relaxed text-xs">
              Configure {status.missing.join(", ")} in{" "}
              <code className="font-mono">.env.local</code> to connect the UI to
              Appwrite. Until then, watchlist screens use seed data and write
              routes will reject mutations.
            </p>
          </div>
        </div>
      )}

      {/* ── Alerts feed (fills all remaining height) ──────────────────── */}
      <section className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="shrink-0 flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3">
          <h2 className="text-sm font-bold text-foreground">
            Latest Indian Market Alerts
          </h2>
          <Link
            href="/alerts/indian-market"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors"
          >
            Open feed{" "}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        {/* no-scrollbar: allows internal wheel-scroll without showing a scrollbar */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <IndianMarketAlertsGrid alerts={marketAlerts} />
        </div>
      </section>
    </div>
  );
}
