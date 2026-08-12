import "server-only";

import { rDel } from "@/lib/redis";
import { CK } from "@/lib/cache-keys";

/**
 * Bust every cached dataset in a single DEL command (1 Redis command).
 * Called by refreshDashboardAction after all jobs complete so the next
 * page load always reads fresh data from Appwrite and re-populates Redis.
 */
export async function invalidateAllCaches(): Promise<void> {
  await rDel(...(CK.ALL_INVALIDATABLE as unknown as string[]));
  console.log("[cache] All caches invalidated.");
}
