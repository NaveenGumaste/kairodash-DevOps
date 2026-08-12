import Link from "next/link";
import { Search } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { listTrackedStocks } from "@/features/watchlist/watchlist.repository";

export const revalidate = 120;

export default async function StocksPage() {
  const stocks = await listTrackedStocks({ activeOnly: true });

  return (
    <div>
      <SectionHeading
        title="Stocks"
        description="Tracked companies with route access for news, filings, results, and related alerts."
      />
      <div className="overflow-hidden rounded-md border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
          {stocks.length} active stocks
        </div>
        <div className="divide-y divide-border">
          {stocks.map((stock) => (
            <Link
              key={stock.$id}
              href={`/stocks/${stock.symbol}`}
              className="grid gap-2 p-4 hover:bg-accent hover:text-accent-foreground md:grid-cols-[1fr_auto]"
            >
              <div>
                <h2 className="text-sm font-semibold">{stock.symbol}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{stock.companyName}</p>
              </div>
              <div className="flex items-center gap-2">
                {stock.exchanges.map((exchange) => (
                  <StatusPill key={exchange}>{exchange}</StatusPill>
                ))}
                {stock.bseCode ? <StatusPill>BSE {stock.bseCode}</StatusPill> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
