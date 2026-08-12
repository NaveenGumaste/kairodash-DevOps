import { assertCronAuth } from "@/lib/cron-auth";
import { json, jsonError } from "@/lib/api";
import {
  claimNextJob,
  completeJob,
  failJob,
} from "@/features/queue/queue.repository";
import { runIndianMarketIngestion } from "@/features/indianMarket/indianMarket.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauthorized = assertCronAuth(req);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const job = await claimNextJob("indian-market");

    if (!job) {
      return json({ processed: false, reason: "No queued job." });
    }

    try {
      const result = await runIndianMarketIngestion();
      await completeJob(job.$id);
      return json({ processed: true, jobId: job.$id, result });
    } catch (error) {
      await failJob(job, error);
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
