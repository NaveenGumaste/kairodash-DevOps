import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { StatusPill } from "@/components/status-pill";
import { getTrackedStockBySymbol } from "@/features/watchlist/watchlist.repository";
import { StockDetailClient } from "@/app/stocks/[symbol]/stock-detail-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const stock = await getTrackedStockBySymbol(symbol);

  if (!stock) {
    return (
      <div>
        <SectionHeading title="Stock not found" />
        <Link href="/stocks" className="text-sm font-medium text-emerald-800">
          Back to stocks
        </Link>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading
        title={stock.symbol}
        description={stock.companyName}
        action={<Link href="/admin/watchlist" className="text-sm font-medium text-emerald-800">Edit watchlist</Link>}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">Exchanges</p>
          <div className="mt-2 flex gap-2">
            {stock.exchanges.map((exchange) => (
              <StatusPill key={exchange}>{exchange}</StatusPill>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">BSE code</p>
          <p className="mt-2 text-lg font-semibold">{stock.bseCode ?? "Not set"}</p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-zinc-500">Aliases</p>
          <p className="mt-2 text-sm text-zinc-700">
            {stock.aliases?.length ? stock.aliases.join(", ") : "No aliases"}
          </p>
        </div>
      </div>
      <StockDetailClient symbol={stock.symbol} />
    </div>
  );
}
