import { Clock } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { listIndianMarketEvents } from "@/features/indianMarket/indianMarket.repository";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateStr));
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IndianMarketAlertsPage() {
  const alerts = await listIndianMarketEvents(100);

  return (
    <div>
      <SectionHeading
        title="Indian Market Alerts"
        description="Deduplicated and classified provider events from RSS, NewsAPI, and SmartAPI."
      />
      <section className="rounded-md border border-border bg-card">
        <div className="divide-y divide-border">
          {alerts.length ? (
            alerts.map((alert) => (
              <article key={alert.$id ?? alert.urlHash} className="p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    tone={
                      alert.priorityLevel === "high"
                        ? "danger"
                        : alert.priorityLevel === "medium"
                          ? "warn"
                          : "neutral"
                    }
                  >
                    {alert.priorityLevel} {alert.priorityScore}
                  </StatusPill>
                  <StatusPill>{alert.eventType}</StatusPill>
                  <StatusPill>{alert.provider}</StatusPill>
                  {alert.symbols.map((symbol) => (
                    <StatusPill key={symbol}>{symbol}</StatusPill>
                  ))}
                </div>
                <h2 className="mt-3 text-sm font-semibold">{alert.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {alert.impactSummary}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {alert.source}
                  </a>
                  <div className="flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/20 shrink-0">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <time dateTime={alert.publishedAt}>
                      {formatDate(alert.publishedAt)}
                    </time>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              No Indian market alerts are stored yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
