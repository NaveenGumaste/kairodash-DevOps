import { SectionHeading } from "@/components/section-heading";
import { WatchlistClient } from "@/app/admin/watchlist/watchlist-client";
import { listTrackedStocks } from "@/features/watchlist/watchlist.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WatchlistAdminPage() {
  const stocks = await listTrackedStocks({ activeOnly: false });

  return (
    <div>
      <SectionHeading
        title="Watchlist Admin"
        description="Create, filter, and soft-delete tracked stocks with the same validation rules as the bot."
      />
      <WatchlistClient initialStocks={stocks} />
    </div>
  );
}
