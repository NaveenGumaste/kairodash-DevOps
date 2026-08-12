"use client";

import { useState } from "react";
import { X, ArrowUpRight, Clock } from "lucide-react";
import { StatusPill } from "./status-pill";
import type { ProcessedMarketEvent } from "@/features/indianMarket/indianMarket.schemas";

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function IndianMarketAlertsGrid({
  alerts,
}: {
  alerts: ProcessedMarketEvent[];
}) {
  const [selectedAlert, setSelectedAlert] =
    useState<ProcessedMarketEvent | null>(null);

  const sorted = [...alerts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  if (!alerts.length) {
    return (
      <p className="p-5 text-sm text-muted-foreground text-center py-8">
        No stored alerts yet. Run the Indian market cron route after configuring
        Appwrite.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 p-5">
        {sorted.map((alert) => (
          <article
            key={alert.$id ?? alert.urlHash}
            onClick={() => setSelectedAlert(alert)}
            className="cursor-pointer flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:bg-muted/10 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusPill
                  tone={alert.priorityLevel === "high" ? "danger" : "neutral"}
                >
                  {alert.priorityLevel} {alert.priorityScore}
                </StatusPill>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {alert.eventType.replace(/_/g, " ")}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-3">
                {alert.title}
              </h3>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {alert.impactSummary}
            </p>
            <div className="mt-4 flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary ring-1 ring-inset ring-primary/20">
              <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
              <time
                dateTime={alert.publishedAt}
                suppressHydrationWarning
                title={new Date(alert.publishedAt).toLocaleString()}
              >
                {timeAgo(alert.publishedAt)}
              </time>
            </div>
          </article>
        ))}
      </div>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedAlert(null)}
          ></div>
          <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <StatusPill
                  tone={
                    selectedAlert.priorityLevel === "high"
                      ? "danger"
                      : "neutral"
                  }
                >
                  {selectedAlert.priorityLevel} {selectedAlert.priorityScore}
                </StatusPill>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {selectedAlert.eventType.replace(/_/g, " ")}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <h2 className="text-xl font-bold text-foreground leading-snug">
                {selectedAlert.title}
              </h2>

              {selectedAlert.symbols && selectedAlert.symbols.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedAlert.symbols.map((symbol) => (
                    <span
                      key={symbol}
                      className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Impact Summary
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedAlert.impactSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 border border-border/50">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Source
                    </span>
                    <span className="mt-1 block text-xs font-medium text-foreground">
                      {selectedAlert.source}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Published At
                    </span>
                    <span className="mt-1 block text-xs font-medium text-foreground">
                      {new Date(selectedAlert.publishedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-muted/10 flex justify-end">
              <a
                href={selectedAlert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Read Source <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
