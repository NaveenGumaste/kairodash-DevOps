import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { listMarketBriefs, type MarketBriefSegment } from "@/features/marketBrief/marketBrief.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MorningBriefPage() {
  const briefs = await listMarketBriefs(10);

  return (
    <div>
      <SectionHeading
        title="Morning Brief"
        description="Stored Marketaux segments for commodities, US markets, Indian markets, and forex context."
      />
      <section className="rounded-md border border-border bg-card">
        <div className="divide-y divide-border">
          {briefs.length ? (
            briefs.map((brief) => {
              const segments = JSON.parse(brief.segmentsJson) as MarketBriefSegment[];
              return (
                <article key={brief.$id ?? brief.briefDate} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{brief.briefDate}</h2>
                    <StatusPill>{segments.length} segments</StatusPill>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {segments.map((segment) => (
                      <a
                        key={segment.url}
                        href={segment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-border p-3 hover:bg-accent hover:text-accent-foreground"
                      >
                        <p className="text-sm font-medium">{segment.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {segment.source}
                          {typeof segment.sentiment === "number"
                            ? ` · sentiment ${segment.sentiment.toFixed(2)}`
                            : ""}
                        </p>
                      </a>
                    ))}
                  </div>
                </article>
              );
            })
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No morning briefs are stored yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
